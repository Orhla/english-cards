# Домашнее задание 10

Три независимые задачи. Можно делать в любом порядке.

---

## Часть 1 — Перемешать карточки в `getCardsForPractice`

Посмотри на то, что получилось в прошлой домашке. Функция `getCardsForPractice` возвращает карточки в строгом порядке: сначала все карточки с ошибками, потом все новые. Пользователь каждый раз будет видеть одно и то же в одном и том же порядке — это плохо для обучения.

**Задача:** перемешать итоговый массив `result` перед возвратом.

Используй:

```ts
result.sort(() => Math.random() - 0.5)
```

Это не идеальный shuffle (у него есть статистическая погрешность), но для нашего случая достаточно. Одна строчка — но подумай: где именно её поставить, чтобы она уже учитывала добор из второго пула?

---

## Часть 2 — Лайк не виден при возврате к карточке: решение через контекст

### Проблема

Когда пользователь лайкает карточку, переходит на следующую и возвращается назад — лайк пропадает. Технически: `WordCardView` получает `interaction` из пропсов один раз при загрузке страницы. Когда компонент перемонтируется (смена карточки), он снова читает те же самые пропсы из родителя — а они уже устарели, потому что родитель не знает что стейт изменился.

### Три варианта решения

**Вариант 1 — поднять стейт в `CardViewer`** (React-подход): хранить Map взаимодействий в `CardViewer`, при лайке обновлять её, пробрасывать вниз через пропсы. Это "правильная" архитектура, но требует пробрасывать стейт и коллбэки через несколько уровней.

**Вариант 2 — роут `/practice/[id]`**: каждая карточка — отдельная страница, навигация через URL. Стейт живёт на сервере, при возврате данные загружаются свежие. Хорошо масштабируется, но меняет всю структуру навигации.

**Вариант 3 — React Context**: создать контекст который хранит состояние взаимодействий для всего набора карточек. Инициализируется данными с сервера, обновляется при лайке/игноре. `WordCardView` читает из контекста, а не из пропсов — состояние не теряется при переключении карточек.

Контекст не самое элегантное решение именно здесь, но это важный паттерн который ты ещё не трогала — реализуем его.

---

### Что нужно сделать

**1. Создай файл `src/context/InteractionsContext.tsx`**

В нём:

```ts
type InteractionState = {
  liked: boolean
  ignored: boolean
}

type InteractionsContextValue = {
  getInteraction: (cardId: number) => InteractionState
  setInteraction: (cardId: number, state: Partial<InteractionState>) => void
}
```

Создай контекст через `createContext`, провайдер через `useState` — внутри `Map<number, InteractionState>`. Провайдер принимает `initialInteractions: { cardId: number, liked: boolean, ignored: boolean }[]` как пропс и инициализирует Map из них.

**2. Оберни `CardViewer` в провайдер**

В `src/app/practice/page.tsx` или в самом `CardViewer` — оберни дерево в `<InteractionsProvider initialInteractions={...}>`. Начальные данные возьми из карточек которые уже пришли с сервера (`card.interactions[0]`).

**3. Обнови `WordCardView`**

Вместо чтения `interaction` из пропсов — читай из контекста через `useContext`. При вызове `likeCard` / `ignoreCard` — обновляй контекст через `setInteraction`. Пропс `interaction` можно убрать совсем.

**4. Проверь**

Лайкни карточку → перейди на следующую → вернись назад. Лайк должен остаться.

---

### Подсказка по структуре провайдера

```tsx
export function InteractionsProvider({ children, initialInteractions }: Props) {
  const [interactions, setInteractions] = useState<Map<number, InteractionState>>(
    () => new Map(initialInteractions.map(i => [i.cardId, { liked: i.liked, ignored: i.ignored }]))
  )

  const getInteraction = (cardId: number): InteractionState =>
    interactions.get(cardId) ?? { liked: false, ignored: false }

  const setInteraction = (cardId: number, state: Partial<InteractionState>) =>
    setInteractions(prev => new Map(prev).set(cardId, { ...getInteraction(cardId), ...state }))

  return (
    <InteractionsContext.Provider value={{ getInteraction, setInteraction }}>
      {children}
    </InteractionsContext.Provider>
  )
}
```

Обрати внимание: `new Map(prev).set(...)` — это создание новой Map, а не мутация старой. Почему это важно?

---

## Часть 3 — Яндекс Translate в админке (копипаста из домашки 9)

Сейчас при добавлении новой карточки нужно вводить транскрипцию и переводы руками. Это долго и можно ошибиться. Подключим Яндекс Переводчик — он даст транскрипцию (если слово есть в словаре) и переводы с синонимами.

**Это задача без готового кода — только описание что нужно сделать. Реализация на тебе.**

---

### Что нужно сделать

**1. Получи API-ключ**

Зарегистрируйся в Яндекс Облаке и создай сервисный аккаунт с ролью `ai.translate.user`. Получи IAM-токен или статический API-ключ. Положи его в `.env` как `YANDEX_TRANSLATE_API_KEY`.

Не коммить ключ в git. Добавь переменную в `.env.example` с пустым значением — чтобы другие разработчики знали что она нужна.

**2. Создай Server Action `translateWord`**

В `src/actions/actions.ts` (или отдельном файле для экшенов переводчика) добавь новый action:

```ts
export async function translateWord(word: string): Promise<{
  transcription?: string
  translations: string[]
}>
```

Яндекс Translate API принимает POST-запрос на `https://translate.api.cloud.yandex.net/translate/v2/translate`. Тело запроса — JSON с полями `texts`, `sourceLanguageCode`, `targetLanguageCode`. Ответ содержит массив `translations`.

Для транскрипции — это отдельный Dictionary API (`https://dictionary.yandex.net/api/v1/dicservice.json/lookup`), он возвращает транскрипцию и синонимы. Разберись с документацией сама — она на русском.

Правильно обработай ошибки.

**3. Добавь кнопку "Заполнить автоматически" в форму карточки**

В компоненте `CardForm` (форма создания/редактирования карточки) рядом с полем `word` добавь кнопку. По нажатию:

1. Вызывается `translateWord(word)`
2. Полученные `transcription` и `translations` подставляются в соответствующие поля формы

Форма сейчас неуправляемая (`defaultValue`). Чтобы программно менять значения полей, тебе понадобится `useRef` или нужно будет частично перевести эти поля на управляемый стейт. Подумай что проще.

**4. Отдели секретный ключ от клиентского кода**

Server Actions выполняются на сервере — ключ не попадёт в браузер. Но убедись что файл с `translateWord` помечен `"use server"` и что нигде не импортируешь переменную `YANDEX_TRANSLATE_API_KEY` в клиентский компонент напрямую.

---

### Что должно получиться

- Администратор вводит английское слово, нажимает кнопку — транскрипция и переводы заполняются сами
- Если слово не найдено или API недоступен — кнопка просто не заполняет поля, без краша
- Ключ живёт только на сервере

---

## Часть 4 — Значения и примеры от Яндекс GPT (копипаста из домашки 9)

Переводы мы получили автоматически. Теперь научим приложение генерировать смысловые определения и примеры использования — и заодно добавим метаданные к карточке.

**Это самая сложная часть. Читай внимательно.**

---

### Новые поля в базе

Сначала расширь модель `WordCard` в `prisma/schema.prisma`. Добавь поля:

```prisma
model WordCard {
  // ... существующие поля
  level  String?  // уровень English: A1, A2, B1, B2, C1, C2
  topics String[] // темы: ["family", "work", "travel", ...]
}
```

Применяй миграцию:

```bash
npx prisma migrate dev --name add_level_and_topics
```

---

### JSON-режим Яндекс GPT

Яндекс GPT умеет возвращать структурированный JSON если попросить правильно. Нам нужен именно он — чтобы не парсить текст руками.

Создай Server Action `enrichWordCard`:

```ts
export async function enrichWordCard(word: string, translation: string, transcription?: string): Promise<{
  meanings: string[]
  examples: string[]
  level: string
  topics: string[]
} | null>
```

Action делает запрос к Яндекс GPT API (`https://llm.api.cloud.yandex.net/foundationModels/v1/completion`).

**Промпт должен явно потребовать JSON.** Пример системного промпта:

```
Ты помощник для создания обучающих карточек английского языка.
Отвечай ТОЛЬКО валидным JSON без лишнего текста, объяснений и markdown.
```

Пример пользовательского промпта:

```
Слово: "${word}"
Перевод: "${translation}"
${transcription ? `Транскрипция: [${transcription}]` : ''}

Верни JSON в точно таком формате:
{
  "meanings": ["определение 1 на русском", "определение 2 на русском"],
  "examples": ["Example sentence 1.", "Example sentence 2.", "Example sentence 3."],
  "level": "B1",
  "topics": ["work", "communication"]
}

Правила:
- meanings: 1-3 коротких определения на русском
- examples: 2-4 примера предложений на английском с использованием слова
- level: один из вариантов: A1, A2, B1, B2, C1, C2
- topics: 1-3 темы из списка: family, work, education, travel, health, food, technology, sport, nature, communication, emotions, money
```

Разбери ответ через `JSON.parse()`. Оберни в try/catch — если GPT вернул невалидный JSON (бывает), возвращай `null`.

---

### Подключи в форму

В `CardForm` добавь вторую кнопку — "Заполнить смыслы и примеры". По нажатию:

1. Читает текущие значения полей `word`, `translation` (первый перевод), `transcription`
2. Вызывает `enrichWordCard`
3. Подставляет `meanings`, `examples` в поля формы
4. Подставляет `level` и `topics` — для них нужно добавить новые поля в форму (инпут для level, чекбоксы или мультиселект для topics)

Идеально если обе кнопки работают последовательно: сначала "Заполнить перевод" (Translate API), потом "Заполнить смыслы" (GPT). Или — одна кнопка "Заполнить всё" которая вызывает оба action подряд через `Promise.all` или последовательно (подумай: здесь `Promise.all` подходит или нет?).

---

### Сохрани новые поля

В `wordCardFormAction` (или `saveCardAction` — как у тебя называется) добавь чтение новых полей из `FormData`:

```ts
const level = formData.get("level")?.toString() || null
const topics = formData.getAll("topic").map(String).filter(Boolean)
```

И передай их в `prisma.wordCard.create/update`.

---

### Что должно получиться

- Карточка хранит `level` и `topics`
- Администратор вводит слово → нажимает кнопки → все поля заполняются автоматически
- Если GPT вернул что-то кривое — форма не ломается
- Промпт требует конкретный JSON-формат, ответ парсится через `JSON.parse`
