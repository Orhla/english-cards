# Домашнее задание 13

Четыре блока. Блок А — доделки агента. Блок Б — логирование (кратко). Блок В — поля для файлов в модели. Блок Г — загрузка файлов в форме.

---

## Блок А — Агент обогащения карточек

### А1 — Починить передачу JSON Schema в Яндекс

Сейчас в агенте:

```ts
jsonSchema: {
    schema: WordCardEnrichmentSchema  // ← Zod-объект, сериализуется в {}
}
```

Это не работает по двум причинам:

**Причина 1.** Zod-схема — это TypeScript-объект, не JSON Schema. `JSON.stringify(WordCardEnrichmentSchema)` даёт `{}`. Яндекс получает пустую схему и игнорирует её.

**Причина 2.** Провайдер пишет в тело запроса поле `jsonSchema` (camelCase), а Яндекс ожидает `json_schema` (snake_case). Посмотри в `src/lib/yandex/provider.ts` как формируется тело запроса.

**Что нужно сделать:**

**Шаг 1.** Установи библиотеку для конвертации:

```bash
npm install zod-to-json-schema
```

**Шаг 2.** Исправь `provider.ts` — при формировании тела запроса поле должно называться `json_schema`:

Сейчас: `body: JSON.stringify(params)` — пишет `jsonSchema` как есть.
Надо явно строить тело, переименовывая поле:

```ts
const body: Record<string, unknown> = {
    modelUri: params.modelUri,
    messages: params.messages,
}
if (params.completionOptions) body.completionOptions = params.completionOptions
if (params.jsonSchema) body.json_schema = params.jsonSchema

body: JSON.stringify(body)
```

**Шаг 3.** В агенте — преобразуй схему в JSON Schema и передай:

```ts
import { zodToJsonSchema } from 'zod-to-json-schema'

// в вызове callYandexLLM:
jsonSchema: zodToJsonSchema(WordCardEnrichmentSchema)
```

`refine` на топиках в JSON Schema не сериализуется — `zodToJsonSchema` молча его игнорирует, поле `topics` уйдёт просто как `array of string`. Это нормально: Яндекс ограничивает структуру, а точную проверку топиков делает Zod уже после получения ответа.

Подумай: в промпте сейчас написано "верни JSON в точно таком формате" с примером. Если мы передаём JSON Schema через API — нужен ли этот пример в промпте? Что из двух надёжнее?

---

## Блок Б — Логирование

Сделай как договорились на созвоне:
- `logger.child()` для добавления `component` вместо ручного поля в каждом вызове
- Уровень логирования зависит от `NODE_ENV`: `debug` на деве, `info` на проде
- Семантика уровней: `debug` для пользовательских действий, `warn` для валидационных ошибок, `error` для неожиданных сбоев
- Исправь copy-paste ошибки в компоненте логов

---

## Блок В — Пути файлов в базе данных

### В1 — Добавить `audioPath` и `imagePath` в модель

Сейчас аудио-файлы сохраняются на диск с именем `${word}${расширение}`. Приложение находит файл по соглашению об именовании, а не по данным из БД. Это хрупко:

- Переименовал слово — файл осиротел, путь сломан
- Нельзя понять из БД есть ли у карточки аудио — придётся проверять файловую систему
- Если в будущем переедем на S3 — некуда сохранить URL

Добавь в `prisma/schema.prisma` два поля:

```prisma
model WordCard {
  // ... существующие поля
  audioPath  String?
  imagePath  String?
}
```

Примени миграцию:

```bash
npx prisma migrate dev --name add-file-paths
```

Обнови `wordCardFormAction` — при сохранении аудио записывай путь в `audioPath`. По аналогии для картинки в Блоке Г.

---

## Блок Г — Загрузка файлов

Все три задачи делай в форме на `react-hook-form` (как сейчас сделана основная форма).

---

### Г1 — Починить сохранение аудио

В `saveAudioFile` есть баг: файл сохраняется с оригинальным расширением:

```ts
const fileExt = path.extname(file.name)             // .mp3 или .wav
const audioPath = path.join(AUDIO_DIR, `${word}${fileExt}`)  // ← не нормализовано
```

Функция `generateEnglishAudioFile` сохраняет файлы как `.ogg`. Если загрузить `.mp3` руками, а потом попытаться найти файл как `.ogg` — он не найдётся.

Исправь: всегда сохраняй как `${word}.ogg` независимо от расширения загруженного файла.

После сохранения файла — возвращай путь из `saveAudioFile` и записывай его в `audioPath` карточки в `wordCardFormAction`.

---

### Г2 — Загрузка картинки

По образцу аудио-поля добавь загрузку картинки.

**В форме** (`AdminCardForm`): поле `imageFile` — `<input type="file" accept="image/*" />`. Зарегистрируй через `register("image")`.

**В `WordCardFormPayload`**: добавь `image?: File`.

**В `actions.ts`**: добавь `saveImageFile(word: string, file: File): Promise<string>`:
- Допустимые типы: `image/jpeg`, `image/png`, `image/webp`
- Максимальный размер: 2 МБ
- Сохраняй в `IMAGE_DIR` (добавь константу в `src/lib/consts.ts`, путь: `public/images/cards`)
- Имя файла: `${word}.webp` — нормализуй как в аудио
- Возвращай путь

В `wordCardFormAction` — если картинка передана, вызывай `saveImageFile`, результат сохраняй в `imagePath` карточки.

---

### Г3 — Кнопка "Сгенерировать аудио"

В `src/lib/yandex-generate-audio.ts` уже есть `generateEnglishAudioFile`. Подключи её к форме.

**Server Action** `generateWordAudio(word: string): Promise<{ audioPath: string }>` в `actions.ts`:
1. Найди карточку по `word` в базе
2. Вызови `generateEnglishAudioFile(card, ...)`
3. Верни путь к файлу

**В форме**: кнопка "Сгенерировать аудио" рядом с полем аудио. Доступна только если поле "Слово" не пустое. После генерации — покажи статус под кнопкой (успех или ошибка), как уже сделано для `autoFillError`.

Подсказка: `getValues("word")` читает текущее значение поля без лишнего ре-рендера.

---

## Что должно получиться

- Яндекс получает настоящую JSON Schema в поле `json_schema`
- Логи — `child()`, env-aware уровень, правильная семантика
- В БД есть `audioPath` и `imagePath` — путь к файлу хранится рядом с карточкой
- Аудио всегда сохраняется как `.ogg`
- Картинку можно загрузить через форму
- Кнопка генерации аудио работает и показывает результат
