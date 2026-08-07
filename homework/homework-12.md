# Домашнее задание 12

Три блока задач. Блок А — доделка прошлой домашки (исправления из ревью). Блок Б — структурные логи. Блок В — аудио и картинки в форме.

Блок А делай первым — он меняет код, который затронут в Б и В.

---

## Блок А — Доделка домашки 11

Шесть правок. Некоторые маленькие, одна требует думать.

---

### А1 — Статический тип топиков в агенте

Посмотри на `src/lib/yandex/agents/wordCardEnrichmentAgent.ts`.

Сейчас `WordCardEnrichmentSchema` создаётся внутри функции — потому что `topics` должны валидироваться против живого списка из БД. Это правильно для **валидации**. Но `WordCardEnrichment` как TypeScript-тип — другое дело.

Проблема: `WordCardEnrichmentSchema` объявлен через `const` **внутри функции**, а `export type WordCardEnrichment = z.infer<typeof WordCardEnrichmentSchema>` стоит снаружи на уровне модуля — и схема там просто не видна. TypeScript ругается: `Cannot find name 'WordCardEnrichmentSchema'`.

Корень проблемы в том, что тип зависит от схемы, а схема зависит от данных из БД — поэтому и оказалась внутри функции. Это неправильная зависимость: **TypeScript-тип не должен зависеть от данных времени выполнения**.

Что нужно сделать:
1. Вынеси статическую схему отдельно — без `refine` на топиках, только структура полей
2. Выведи `WordCardEnrichment` из неё
3. Динамическую проверку топиков оставь внутри функции — но уже как отдельный `refine` или просто проверку после парсинга

Подумай: зачем вообще нужна статическая схема и динамическая проверка? 

---

### А2 — `withRetry` не должен ретраить 4xx

Сейчас `withRetry` в `src/lib/utils.ts` ретраит **любую** ошибку. Это неправильно.

Если Яндекс вернул `401 Unauthorized` или `403 Forbidden` — повтор бесполезен: ключ неверный, количество попыток не поможет. Ретраить стоит только временные ошибки: `429`, `5xx`, сетевые сбои.

**Шаг 1.** В `src/lib/yandex/provider.ts` создай кастомный класс ошибки:

```ts
export class YandexApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = "YandexApiError"
  }
}
```

Бросай его вместо `new Error(...)` когда `!responseTry.ok`.

**Шаг 2.** Расширь `withRetry` — добавь необязательный параметр: массив классов ошибок которые **не надо** ретраить:

```ts
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delay: number,
  skipOn?: Array<new (...args: unknown[]) => Error>
): Promise<T>
```

Логика: если пойманная ошибка является экземпляром одного из классов в `skipOn` — сразу перебрасывай, не ретраить.

**Шаг 3.** В провайдере передай `[YandexApiError]` как `skipOn` — тогда любой HTTP-ответ с ошибкой не будет ретраиться. Но подожди: нам нужно ретраить `429` и `5xx`, а не ретраить только `4xx`. Подумай: как это сделать с массивом классов? Может нужно два разных класса?

---

### А3 — Обдуманные `console.log` и `console.debug`

В `src/lib/yandex/provider.ts` строки 37–38 — дебаг-мусор. В `src/components/AdminCardForm.tsx` строки 89, 91 — тоже. Удали.

---

### А4 — Транскрипция через `useState`

В `AdminCardForm` транскрипция живёт через `useRef` + прямую мутацию DOM:

```ts
if (transcriptionRef.current) {
    transcriptionRef.current.value = transcription;
}
```

Остальные три поля (перевод, значения, примеры) уже переведены на `useState`. Переведи транскрипцию туда же: убери `transcriptionRef`, добавь `const [transcription, setTranscription] = useState<string>(card?.transcription ?? "")`. В `handleAutoFill` — просто `setTranscription(transcription)`.

---

### А5 — Сбрасывать ошибку перед повторной генерацией

В `handleAutoFillOtherFields` нет `setAutoFillError(null)` в начале. Если пользователь получил ошибку, исправил слово и нажал снова — старое сообщение висит пока не придёт новый ответ. Добавь сброс.

---

### А6 — Вынести повторяющийся блок в компонент

Посмотри на JSX в `AdminCardForm`. Блоки "Перевод", "Значение", "Примеры" — почти одинаковые: лейбл, кнопка добавить, список инпутов с кнопкой удалить.

Создай компонент `ArrayFieldInput` (или придумай своё имя):

```tsx
type Props = {
  label: string
  name: string         // имя для FormData
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
}
```

Замени все три блока на `<ArrayFieldInput ... />`. Результат — три одинаковых раздела заменяются тремя строчками.

Обрати внимание: проблема с `key={index}` в этих списках всё ещё есть. Исправь её внутри нового компонента: вместо `string[]` используй `{ id: string; value: string }[]` и `id` как `key`. Функция `crypto.randomUUID()` подойдёт для генерации `id`.

---

### А7 — Удалить `src/lib/prompts.ts`

Файл `src/lib/prompts.ts` существует, но не используется — промпты переобъявлены в агенте. Удали файл.

Заодно убери `jsonSchema` из вызова `callYandexLLM` в агенте — Яндекс принимает JSON Schema для форматирования ответа, но мы уже валидируем через Zod. Оставь только промпт, пусть модель отвечает JSON по инструкции в тексте.

Подумай: зачем мы убираем JSON Schema из запроса? Разве лишняя проверка не лучше?

---

### А8 — Доделать отображение топиков в  `src/componentts/AdminCardForm.tsx`
Я что-то закомитил как "лайвкодинг", надо это доделать.


## Блок Б — Структурные логи

Сейчас в коде разбросаны `console.log`, `console.error`, `console.debug` — без структуры, без уровней, без контекста. В продакшне это неудобно: невозможно фильтровать по компоненту, невозможно автоматически парсить.

Нужна библиотека которая пишет **структурные логи** — каждый лог это JSON-объект с полями.

---

### Б1 — Выбрать и подключить библиотеку

Популярные варианты для Node.js: **pino**, **winston**. Посмотри на обе и выбери одну. В PR напиши одно предложение — почему именно она.

Установи библиотеку. Создай файл `src/lib/logger.ts` который экспортирует настроенный логгер.

Логгер должен:
- Писать JSON в stdout
- Поддерживать уровни: `debug`, `info`, `warn`, `error`
- Принимать произвольный payload-объект вторым аргументом

Примерно так должно выглядеть использование:

```ts
import { logger } from "@/lib/logger"

logger.info("Запрос к Яндекс API", { word: "ephemeral", attempt: 1 })
logger.error("Ошибка при генерации", { error: err.message, word })
```

---

### Б2 — Заменить `console.*` на логгер

Найди все `console.log`, `console.error`, `console.warn`, `console.debug` в серверном коде (не в клиентских компонентах — в `actions/`, `lib/`) и замени на вызовы логгера с подходящим уровнем и payload.

Для каждого лога добавь поле `component` — строка с именем файла или функции откуда пишется лог. 

```ts
logger.error("Ошибка при сохранении карточки", {
  component: "updateWordCard",
  error: err.message,
})
```

Подумай где логи оправданы и какого уровня, что лучше логировать. ЧТобы приложение было легко дебажить на деве и пониторитьт на проде.

---

### Б3 — userId в логах (необязательно, но интересно)

Если есть желание — добавь в логи `userId` там где он доступен (в экшнах после `requireLogin`/`requireAdmin`). Это делает логи полезными для отладки: "что делал этот пользователь".

Пример:
```ts
const session = await requireAdmin()
logger.info("Карточка обновлена", {
  component: "updateWordCard",
  userId: session.user.id,
  cardId: card.id,
})
```

---

## Блок В — Аудио и картинки в форме карточки

Три задачи. Делай по порядку — они слегка связаны.

---

### В1 — Починить загрузку аудио-файла

Сейчас в форме есть поле для загрузки аудио, и в `wordCardFormAction` есть код который его читает:

```ts
const audioFile = formData.get("audio") as File | null;
if (audioFile && audioFile.size > 0) {
    console.log("audio file:", audioFile.name, ...)
}
```

Но файл никуда не сохраняется — только логируется.

Добавь Server Action `saveAudioFile(word: string, file: File): Promise<void>` в `src/actions/actions.ts`.

Внутри:
1. Проверь что `file` — это аудио-файл. Допустимые типы: `audio/ogg`, `audio/mpeg`, `audio/wav`. Если тип другой — бросай ошибку.
2. Проверь что размер файла разумный — не больше 5 МБ.
3. Сохрани файл в `AUDIO_DIR` (константа уже есть в `src/lib/consts.ts`). Имя файла — `${word}.ogg` (как делает `generateEnglishAudioFile`).

Вызови `saveAudioFile` из `wordCardFormAction` если файл передан.

Подсказка: `File` это `Blob` с именем. Читать содержимое можно через `file.arrayBuffer()`.

---

### В2 — Добавить загрузку картинки

По образцу аудио-поля добавь поле для загрузки картинки карточки.

Что нужно сделать:

1. Добавь поле `imageFile` в форму — `<input type="file" accept="image/*" />`
2. Добавь поле `imagePath String?` в `prisma/schema.prisma` и примени миграцию
3. Добавь Server Action `saveImageFile(word: string, file: File): Promise<string>` — сохраняет в `public/images/cards/` и возвращает путь. Допустимые типы: `image/jpeg`, `image/png`, `image/webp`. Максимальный размер: 2 МБ.
4. В `wordCardFormAction` — если картинка передана, вызови `saveImageFile`, сохрани путь в `imagePath` карточки.

Константу для папки картинок (`public/images/cards`) добавь в `src/lib/consts.ts`.

---

### В3 — Кнопка "Сгенерировать аудио"

В `src/lib/yandex-generate-audio.ts` уже есть `generateEnglishAudioFile` — функция которая генерирует `.ogg` файл через Яндекс TTS API. Её нужно подключить к форме.

Добавь Server Action `generateWordAudio(word: string): Promise<void>` в `src/actions/actions.ts`:
1. Найди карточку по `word` в базе
2. Вызови `generateEnglishAudioFile(card, ...)`
3. Если файл уже есть — функция тихо вернётся (это уже реализовано внутри)

В форме добавь кнопку "Сгенерировать аудио" рядом с полем аудио. По клику вызывает `generateWordAudio(wordValue)`. Кнопка доступна только если поле "Слово" не пустое.

Покажи пользователю результат: успех или ошибку — строкой под кнопкой (как уже сделано для `autoFillError`).

---

## Что должно получиться

- `WordCardEnrichment` — статический тип, не зависит от данных из БД
- `withRetry` не ретраит 4xx ошибки
- `console.*` в серверном коде заменены на структурный логгер с `component` и payload
- `transcription` в форме — через `useState`
- Повторяющиеся блоки полей — один компонент `ArrayFieldInput` с правильным `key`
- Аудио-файл из формы сохраняется на диск
- Картинку можно загрузить, она сохраняется и привязывается к карточке
- Кнопка "Сгенерировать аудио" работает и показывает результат
