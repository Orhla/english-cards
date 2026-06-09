# Домашнее задание 5

Три независимых направления. Первые два — доделка хвостов, третье — новая фича.

---

## Часть 1: Тесты — хвосты по homework-04

Открой `src/lib/yandex-generate-audio.test.ts`.

### 1.1 Тест: ошибка при записи — битый файл удаляется

Это тест 5 из homework-04, который не был написан.

Замокай `fetch` чтобы возвращал `ok: true`, но `body.pipeTo` — падал с ошибкой:

```ts
vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    body: { pipeTo: vi.fn().mockRejectedValue(new Error("disk full")) },
} as unknown as Response);
```

Проверь два условия:
1. Функция бросила ошибку
2. Файл `hello.ogg` **не существует** в `tmpDir` — то есть функция его почистила

Для проверки отсутствия файла — поймай ошибку от `access` и убедись что `error.code === 'ENOENT'`:

```ts
const err = await access(...).then(() => null).catch(e => e);
expect(err?.code).toBe('ENOENT');
```

### 1.2 Тест: проверка параметров fetch

Сейчас happy-path тест проверяет только что файл записался. Но никто не проверяет что мы вообще правильно сформировали запрос к Яндексу.

Добавь тест: замокай `fetch` на успешный ответ, вызови функцию с конкретным `yandexApiKey = "test-key-123"` и `langCode = ENGLISH_US_LANG_CODE`. После вызова проверь аргументы которые получил `fetch`:

```ts
const [url, options] = fetchSpy.mock.calls[0];
```

Проверь:
- `url` — содержит `YANDEX_BASE_URL`
- `options.headers.Authorization` === `"Api-Key test-key-123"`
- Тело запроса содержит `text=hello`, `lang=en-US`, `format=oggopus`, `voice=john`

Тело — это `URLSearchParams`, его можно привести к строке: `options.body.toString()`.

### 1.3 Покрытие кода (coverage)

Если ещё не сделано из homework-04:

```bash
npm install -D @vitest/coverage-v8
```

В `vitest.config.ts` добавь в секцию `test`:

```ts
coverage: {
    provider: 'v8',
    include: ['src/lib/yandex-generate-audio.ts'],
    reporter: ['text', 'html'],
}
```

Запусти:

```bash
npx vitest run --coverage
```

Посмотри колонку `branches`. В коде есть ветка `!response.body` (строка 44) — есть ли тест который туда попадает? Если нет — coverage это покажет красным. Добавь тест: замокай `fetch` чтобы возвращал `{ ok: true, body: null }`, проверь что функция бросает ошибку `"Пустой ответ от сервера Яндекса"`.

---

## Часть 2: Рефакторинг CardViewer

### 2.1 Убрать дублирование JSX для режимов

Открой `src/components/CardViewer.tsx`. Строки 122–180 — два блока `mode === Mode.translation` и `mode === Mode.pronunciation`. Структура у них идентична, отличаются только строки текста.

Вынеси конфигурацию в объект:

```ts
const modeConfig = {
    [Mode.translation]: {
        listening: "Слушаю вас... Говорите перевод",
        idle: "Нажмите на микрофон, чтобы проверить свой перевод на русский",
    },
    [Mode.pronunciation]: {
        listening: "Слушаю вас... Говорите слово на английском",
        idle: "Нажмите на микрофон, чтобы проверить своё произношение на английском",
    },
};
```

И рендери один блок вместо двух:

```tsx
<div ...>
    {listening && <div ...>{modeConfig[mode].listening}</div>}
    {checkStatus === CardStatus.idle && <div ...>{modeConfig[mode].idle}</div>}
    {/* success/error — одинаковые для обоих режимов, оставь как есть */}
</div>
```

### 2.2 Разбить на два компонента

Сейчас `CardViewer` делает слишком много: управляет навигацией, держит состояние карточки, рендерит весь UI. Разбей на два компонента.

**`CardViewer`** — остаётся, но становится тонким: только навигация.
- Состояние: `currentCardIndex`
- Методы: `handlePrev`, `handleNext`
- Рендер: две стрелки + `<WordCard ... />`
- Пропсы: `cards`, `mode` — без изменений снаружи

**`WordCard`** — новый компонент в отдельном файле `src/components/WordCard.tsx`.
- Забирает всё остальное: `isFlipped`, `checkStatus`, `recognizedText`, `audioRef`, `useSpeechRecognition`, `useEffect`, `toggleMic`
- Пропсы: `card: WordCard`, `mode: Mode`

**Важный момент про сброс состояния.** Сейчас `changeCard` вручную сбрасывает 5 штук: `setIsFlipped`, `setCheckStatus`, `setRecognizedText`, `resetTranscript`, `stopListening`. После разбивки этого не нужно — передай `key={card.id}` на `<WordCard>`. React при смене `key` размонтирует компонент и смонтирует заново, все `useState` сбросятся автоматически.

**Жизненный цикл компонента.** Когда React размонтирует компонент, он запускает cleanup-функции всех `useEffect`. Это правильное место чтобы «прибраться»: остановить таймеры, закрыть соединения, остановить аудио. Передай `audioRef` в `WordCard` — и останови воспроизведение в cleanup:

```ts
useEffect(() => {
    return () => {
        audioRef.current?.pause();
    };
}, []);
```

> Примечание: я говорил на уроке что после рефакторинга `audioRef` нам не понадобится — это была ошибка. Он нужен. Просто теперь он живёт внутри `WordCard`, и мы не останавливаем аудио руками при смене карточки — это делает cleanup автоматически при размонтировании.

**Состояние которое живёт вне React.** `key` сбрасывает только то, что хранится в `useState` и `useRef` — то есть внутри компонента. Но `transcript` из `react-speech-recognition` — это глобальное состояние библиотеки, оно живёт снаружи React-дерева. Новый `WordCard` при маунте получит `transcript` от предыдущей карточки — если его не сбросить. То же самое с `listening`. Поэтому `stopListening()` и `resetTranscript()` тоже нужны в cleanup:

```ts
useEffect(() => {
    return () => {
        audioRef.current?.pause();
        SpeechRecognition.stopListening();
        resetTranscript();
    };
}, []);
```

**Ещё один баг** который попутно исправь: `useEffect` на строке 67 стоит после раннего `return` на строке 59 — это нарушение Rules of Hooks. После разбивки этой проблемы не будет: ранний `return` остаётся в `CardViewer`, а `useEffect` переедет в `WordCard` где никакого раннего `return` нет.

---

## Часть 3: Аутентификация через Яндекс OAuth

Это новая фича — вход через Яндекс аккаунт.

Используем **Auth.js v5** (он же NextAuth v5) — актуальная версия для App Router.

Документация: https://authjs.dev/getting-started
https://authjs.dev/getting-started/providers/yandex

### 3.1 Установка

```bash
npm install next-auth@beta
```

Сгенерируй секрет для подписи сессий:

```bash
npx auth secret
```

Команда сама добавит `AUTH_SECRET=...` в `.env.local`.

### 3.2 Получение ключей

Яндекс OAuth живёт отдельно от Яндекс.Облака. Идёшь сюда:
**https://oauth.yandex.ru/**

Шаги:
1. Войди под своим аккаунтом → **Зарегистрировать новое приложение**
2. Название — любое, например `english-cards-dev`
3. В разделе **Платформы** выбери **Веб-сервисы**
4. **Callback URI** — добавь: `http://localhost:3000/api/auth/callback/yandex`
5. В разделе **Доступы** включи минимум: `Яндекс ID → Доступ к адресу электронной почты` и `Доступ к логину, имени и фамилии`
6. Сохрани — получишь **ClientID** и **Client secret**

Добавь в `.env.local`:
```
AUTH_YANDEX_ID=твой_client_id
AUTH_YANDEX_SECRET=твой_client_secret
```

### 3.3 Конфигурация Auth.js

Создай файл `auth.ts` в корне проекта (рядом с `package.json`):

```ts
import NextAuth from "next-auth"
import Yandex from "next-auth/providers/yandex"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Yandex({
            clientId: process.env.AUTH_YANDEX_ID,
            clientSecret: process.env.AUTH_YANDEX_SECRET,
        }),
    ],
})
```

### 3.4 Route handler

Создай `app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

Это единственный файл — Auth.js сам обрабатывает все `/api/auth/*` маршруты.

### 3.5 Схема базы данных

Auth.js требует определённые таблицы для хранения сессий. Добавь в `prisma/schema.prisma`:

```prisma
model User {
    id       String    @id @default(cuid())
    email    String    @unique
    name     String?
    image    String?
    accounts Account[]
    sessions Session[]
}

model Account {
    id                String  @id @default(cuid())
    userId            String
    type              String
    provider          String
    providerAccountId String
    refresh_token     String?
    access_token      String?
    expires_at        Int?
    token_type        String?
    scope             String?
    id_token          String?
    user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
    @@unique([provider, providerAccountId])
}

model Session {
    id           String   @id @default(cuid())
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

После изменений:
```bash
npx prisma migrate dev --name add-auth
```

Адаптер для Prisma: https://authjs.dev/getting-started/adapters/prisma

### 3.6 Защита маршрутов

Создай `middleware.ts` в корне проекта:

```ts
export { auth as middleware } from "@/auth"

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

Документация по middleware: https://authjs.dev/getting-started/session-management/protecting

### 3.7 UI — страница входа

Создай `app/login/page.tsx`:

```tsx
import { signIn } from "@/auth"

export default function LoginPage() {
    return (
        <form action={async () => {
            "use server"
            await signIn("yandex")
        }}>
            <button type="submit">Войти через Яндекс</button>
        </form>
    )
}
```

Документация по sign in: https://authjs.dev/getting-started/session-management/login

---

## Что должно получиться

**Часть 1:**
- 7 тестов, все зелёные (старые 4 + новые 3)
- Coverage показывает 100% branches для `yandex-generate-audio.ts`

**Часть 2:**
- Два компонента: `CardViewer.tsx` (навигация) и `WordCard.tsx` (карточка + логика)
- Один блок статусной панели вместо двух одинаковых
- `changeCard` без ручного сброса состояния

**Часть 3 (разберём вместе на уроке):**
- OAuth через Яндекс работает локально
- Незалогиненные пользователи редиректятся на `/login`
