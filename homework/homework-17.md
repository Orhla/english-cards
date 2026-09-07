# Домашнее задание 17

Продолжение ДЗ15. Сейчас файлы хранятся на диске — это не работает на Vercel и неудобно в проде. Подключаем Supabase Storage как **конфигурируемую альтернативу**: диск остаётся для локальной разработки, Supabase включается через env.

Параллельно: в ДЗ15 route handler `/api/files/[id]` читал весь файл в `Buffer` и отдавал его разом. Сегодня на уроке обсудили стриминг — сделаем правильно.

Блоки идут в порядке выполнения.

---

## Блок А — Разбить `file-storage.ts` на провайдеры

Сейчас один файл знает про `fs`. Нужна структура:

```
src/services/storage/
  provider.ts      — интерфейс + тип
  disk.ts          — текущая fs-реализация
  supabase.ts      — новая supabase реализация
  index.ts         — выбирает провайдер по env, реэкспортирует функции
```

### А1 — Интерфейс провайдера (`provider.ts`)

```ts
export interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>
  read(key: string): Promise<Buffer>
  readStream(key: string): Promise<ReadableStream<Uint8Array>>
  delete(key: string): Promise<void>
}
```

Почему `readStream` отдельным методом рядом с `read`:
- `read` возвращает `Buffer` — удобно там, где нужны байты целиком (тесты, генерация аудио).
- `readStream` возвращает `ReadableStream` — нужен route handler'у, чтобы не грузить файл в память (блок Б).
- Для диска оба метода тривиальны. Для Supabase `readStream` можно реализовать эффективнее, чем `Buffer → Stream`.

### А2 — `disk.ts`

Перенести содержимое текущего `file-storage.ts` сюда. Реализовать `readStream` через `fs.createReadStream`:

```ts
import { createReadStream } from "fs"
import { Readable } from "stream"

async function readStream(key: string): Promise<ReadableStream<Uint8Array>> {
  const filePath = path.join(STORAGE_DIR, key)
  const nodeStream = createReadStream(filePath)
  return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
}
```

> `Readable.toWeb` — Node.js 17+. Конвертирует Node.js `Readable` в Web API `ReadableStream`. Это тот мост между двумя мирами стримов, про который говорили на уроке.

### А3 — `supabase.ts`

Установить `@supabase/supabase-js` если ещё нет. Завести в env:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — **не** anon key, service role не ограничен RLS

```ts
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.SUPABASE_BUCKET ?? "files"
```

Реализовать `save`, `read`, `readStream`, `delete` через `supabase.storage.from(BUCKET)`.

Для `readStream` в Supabase нет прямого стримингового API — придётся `download()` → `Blob` → `.stream()`:

```ts
async function readStream(key: string): Promise<ReadableStream<Uint8Array>> {
  const { data, error } = await supabase.storage.from(BUCKET).download(key)
  if (error || !data) throw new Error(error?.message ?? "Not found")
  return data.stream() as ReadableStream<Uint8Array>
}
```

> `Blob.stream()` — Web API, работает в Node.js 18+. Supabase SDK возвращает именно `Blob`.

Для `save` используй `upload` с `upsert: true` — тогда повторная загрузка не падает с «уже существует».

### А4 — `index.ts` — фабрика

```ts
import { diskProvider } from "./disk"
import { supabaseProvider } from "./supabase"
import type { StorageProvider } from "./provider"

function getProvider(): StorageProvider {
  const p = process.env.STORAGE_PROVIDER
  if (p === "supabase") return supabaseProvider
  return diskProvider
}

const provider = getProvider()

export const saveToStorage    = (key: string, data: Buffer) => provider.save(key, data)
export const readFromStorage  = (key: string)               => provider.read(key)
export const readStreamFromStorage = (key: string)          => provider.readStream(key)
export const deleteFromStorage = (key: string)              => provider.delete(key)
```

Снаружи (`files.ts`, route handler) импортируют из `@/services/storage` — ничего не меняется кроме добавления `readStreamFromStorage`.

---

## Блок Б — Route handler: стриминг

Сейчас `/api/files/[id]`:
```ts
const fileBytes = await readFromStorage(...)
return new Response(new Uint8Array(fileBytes), { headers: ... })
```

Проблема: весь файл живёт в памяти одновременно. Для аудио по 5 МБ — терпимо. Для видео или при нескольких одновременных запросах — плохо.

### Б1 — Переключить на стрим

```ts
const stream = await readStreamFromStorage(key)

return new Response(stream, {
  headers: {
    "Content-Type": fileMeta.mimeType,
    "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileMeta.originalName)}`,
  },
})
```

`Response` умеет принимать `ReadableStream` напрямую — Next.js и браузер разберутся со стримингом автоматически. Данные идут по кускам (chunks), не ждут полной загрузки.

### Б2 — Заодно починить `Content-Disposition`

Из ДЗ15 в route handler была ошибка с кавычкой (закрывалась не там). Исправить:

```ts
const asciiFallback = fileMeta.originalName.replace(/[^\x20-\x7E]/g, "_")
const encoded = encodeURIComponent(fileMeta.originalName)
  .replace(/[!'()*]/g, (c) => encodeURIComponent(c)) // RFC 5987 — encodeURIComponent не кодирует эти символы

headers.set(
  "Content-Disposition",
  `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
)
```

Объясни в PR: почему `encodeURIComponent` недостаточно и что делает `.replace` после него.

---

## Блок В — Route handler: альтернатива через signed URL

Вместо проксирования байт — редирект на временную ссылку, которую Supabase выдаёт сам.

### В1 — Реализация

Добавить в `StorageProvider` опциональный метод:

```ts
getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>
```

В `supabase.ts`:

```ts
async function getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(key, expiresInSeconds)
  if (error || !data) throw new Error(error?.message ?? "Failed to sign URL")
  return data.signedUrl
}
```

В `disk.ts` этот метод не реализован — `undefined`.

В route handler:

```ts
const provider = getProvider()

if (provider.getSignedUrl) {
  const url = await provider.getSignedUrl(fileMeta.path)
  return Response.redirect(url, 302)
}

// fallback: стрим
const stream = await readStreamFromStorage(fileMeta.path)
return new Response(stream, { headers: ... })
```

### В2 — CORS-засада

Когда клиент кликает `<a href="/api/files/id">` — браузер делает **навигацию**, редирект прозрачен, CORS не применяется. Всё работает.

Когда клиент делает `fetch("/api/files/id")` — браузер следует редиректу на `*.supabase.co`. Это cross-origin запрос. Supabase Storage добавляет CORS-заголовки, но только если бакет настроен правильно.

Что настроить в Supabase Dashboard → Storage → Bucket → CORS:
```json
[
  {
    "allowed_origins": ["http://localhost:3000", "https://<твой-домен>"],
    "allowed_methods": ["GET"],
    "allowed_headers": ["*"],
    "max_age_seconds": 3600
  }
]
```

Без этого браузер заблокирует ответ при `fetch`. При обычной навигации или `<a download>` — CORS не при делах.

> Вывод: signed URL подходит для `<a href>` скачивания. Если понадобится `fetch` на клиенте (например, для предпросмотра аудио через JS API) — либо настраивать CORS в Supabase, либо оставить прокси-стриминг.

### В3 — Что выбрать?

Оба варианта рабочие. Реализовать оба (что и сделано), переключение — `provider.getSignedUrl` есть или нет.

В PR объясни своими словами:
- В чём выигрыш signed URL по сравнению с проксированием (нагрузка на сервер, latency).
- Почему `302` а не `301` для signed URL.
- Когда CORS не мешает, а когда мешает.

---

## Блок Г — Конфигурация и .env.example

Добавить в `.env.example`:

```
# Storage provider: "disk" (default) or "supabase"
STORAGE_PROVIDER=disk

# Required when STORAGE_PROVIDER=supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=files
```

Создать бакет в Supabase вручную (или через `supabase.storage.createBucket` в скрипте-сетапе — по желанию).

Бакет должен быть **приватным** (Public = off). Публичные URL не нужны — раздаём через свой route handler или signed URL.

---

## Что должно получиться

- `src/services/storage/` с четырьмя файлами; снаружи ничего не сломано.
- `STORAGE_PROVIDER=disk` (или не задан) — работает как раньше, файлы на диске.
- `STORAGE_PROVIDER=supabase` — файлы уходят в Supabase Storage, скачивание работает через стрим или signed URL redirect.
- Route handler `/api/files/[id]` раздаёт стримом; `Content-Disposition` с двумя параметрами (`filename=` и `filename*=`) работает корректно.
- `readStream` для диска через `fs.createReadStream` + `Readable.toWeb`; для Supabase через `Blob.stream()`.
- В PR объяснены: CORS при signed URL, зачем `302` а не `301`, разница стрим vs буфер.

## Осознанные упрощения

- Один бакет на все типы файлов — структура внутри через ключи (`audio/uuid.ext`, `images/uuid.ext`).
- Нет retry при ошибке Supabase — упадёт с 500, что для учебного проекта нормально.
- Бакет создаётся руками, не в коде.
