# Домашнее задание 8

Добавляем персонализацию. Пользователь сможет лайкать и игнорировать карточки, а ещё мы будем записывать правильные и неправильные ответы — и показывать карточки в умном порядке.

---

## Часть 1 — Новая таблица в базе

Нам нужно хранить взаимодействие каждого пользователя с каждой карточкой. Добавь в `prisma/schema.prisma` новую модель:

```prisma
model UserCardInteraction {
  id             Int      @id @default(autoincrement())
  userId         String
  cardId         Int
  liked          Boolean  @default(false)
  ignored        Boolean  @default(false)
  correctCount   Int      @default(0)
  incorrectCount Int      @default(0)
  lastSeenAt     DateTime @default(now())

  user User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  card WordCard @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([userId, cardId])
}
```

Не забудь добавить обратные связи в `User` и `WordCard`:

```prisma
model User {
  // ... существующие поля
  interactions UserCardInteraction[]
}

model WordCard {
  // ... существующие поля
  interactions UserCardInteraction[]
}
```

После этого примени миграцию:

```bash
npx prisma migrate dev --name add_user_card_interaction
```

Проверь через `npx prisma studio` что таблица появилась.

---

## Часть 2 — Server Actions для взаимодействий

Добавь в `src/actions/actions.ts` три новых action:

**`likeCard(cardId: number)`** — ставит `liked = true`, `ignored = false` для текущего пользователя. Если записи нет — создаёт её (подсказка: в Prisma есть `upsert`).

**`ignoreCard(cardId: number)`** — ставит `ignored = true`, `liked = false`.

**`recordAnswer(cardId: number, isCorrect: boolean)`** — увеличивает `correctCount` или `incorrectCount` на 1, обновляет `lastSeenAt`. Если записи нет — создаёт.

Во всех трёх нужно получить текущего пользователя через `auth()`. Если пользователь не залогинен — бросай ошибку (или просто возвращай `null`, на твоё усмотрение).

Подсказка по `upsert`:
```ts
await prisma.userCardInteraction.upsert({
  where: { userId_cardId: { userId, cardId } },
  create: { userId, cardId, liked: true },
  update: { liked: true, ignored: false },
})
```

---

## Часть 3 — Кнопки на карточке

Открой `src/components/WordCardView.tsx`. На лицевой стороне карточки добавь две кнопки рядом с существующими иконками:

- 👍 **Лайк** — вызывает `likeCard`
- 🚫 **Игнор** — вызывает `ignoreCard`

Кнопки должны отражать текущее состояние — если карточка уже лайкнута, кнопка выглядит активной. Для этого `WordCardView` нужно принять новый проп:

```tsx
type Props = {
  card: WordCard
  mode: Mode
  interaction?: { liked: boolean; ignored: boolean } | null
}
```

`interaction` приходит с сервера — `null` значит пользователь не залогинен или ни разу не взаимодействовал с карточкой.

Важно: кнопки — это клиентский компонент, но `likeCard` — Server Action. Посмотри как в домашке 7 работает `useActionState`, там та же механика. Только здесь тебе не нужна форма — можно вызвать action напрямую через `startTransition`:

```tsx
import { useTransition } from 'react'

const [isPending, startTransition] = useTransition()

const handleLike = () => {
  startTransition(async () => {
    await likeCard(card.id)
  })
}
```

---

## Часть 4 — Запись ответов

Сейчас `WordCardView` показывает `CardStatus.success` / `CardStatus.error` когда пользователь отвечает через микрофон — но никуда это не сохраняет.

Добавь вызов `recordAnswer(card.id, isCorrect)` в момент когда `checkStatus` меняется на `success` или `error`. Делай это в `useEffect`:

```tsx
useEffect(() => {
  if (checkStatus === CardStatus.success) {
    startTransition(() => recordAnswer(card.id, true))
  }
  if (checkStatus === CardStatus.error) {
    startTransition(() => recordAnswer(card.id, false))
  }
}, [checkStatus])
```

Тот же `isPending` + `startTransition` из части 3 — переиспользуй.

---

## Часть 5 — Умная выдача карточек

Вот где всё складывается. Сейчас `getAllEnglishCards` возвращает просто все карточки. Нам нужна новая функция которая возвращает карточки в умном порядке.

**Алгоритм — два пула:**

**Пул A** — карточки с ошибками (`incorrectCount > 0`, `ignored = false`):
сортировка по `incorrectCount DESC`, при равенстве — `lastSeenAt ASC` (давно не видел — первым). `liked = true` повышает приоритет.

**Пул B** — карточки которые пользователь ни разу не видел (нет записи в `UserCardInteraction`, `ignored = false`):
в порядке добавления (`id ASC`).

Итоговая очередь — чередуем 2:1: две из пула A, одна из пула B. Когда пул A пуст — только B. Когда B пуст — только A.

Константу пропорции вынеси в `src/lib/consts.ts`:
```ts
export const ERRORS_PER_NEW = 2
```

Создай функцию `getCardsForPractice(userId: string)` в `src/actions/actions.ts`. Она делает два запроса к базе и собирает очередь.

Подсказка по запросу пула A:
```ts
const errorCards = await prisma.userCardInteraction.findMany({
  where: { userId, incorrectCount: { gt: 0 }, ignored: false },
  orderBy: [{ liked: 'desc' }, { incorrectCount: 'desc' }, { lastSeenAt: 'asc' }],
  include: { card: true },
})
```

Подсказка по запросу пула B:
```ts
const seenCardIds = await prisma.userCardInteraction.findMany({
  where: { userId },
  select: { cardId: true },
})

const newCards = await prisma.wordCard.findMany({
  where: { id: { notIn: seenCardIds.map(r => r.cardId) } },
  orderBy: { id: 'asc' },
})
```

Функция перемешивания пулов — напиши сама, это не сложно. Подумай: как обойти оба массива одновременно соблюдая пропорцию?

---

## Часть 6 — Подключить умную выдачу

Открой `src/app/practice/page.tsx`. Сейчас там `getAllEnglishCards()`.

Замени на `getCardsForPractice` — но только если пользователь залогинен. Если нет — показывай карточки как раньше (все подряд).

```tsx
const session = await auth()

const result = session?.user?.id
  ? await getCardsForPractice(session.user.id)
  : await getAllEnglishCards()
```

Передай `interactions` в `CardViewer` — чтобы каждая карточка знала своё текущее состояние (лайк/игнор). `CardViewer` пробрасывает их в `WordCardView` по `card.id`.

---

## Что должно получиться

- В базе есть таблица `UserCardInteraction`
- На карточке есть кнопки лайка и игнора, они работают и отражают текущее состояние
- Ответы через микрофон записываются в базу
- Залогиненный пользователь видит карточки в умном порядке: сначала те где ошибался, новые — вперемешку в пропорции 2:1
- Незалогиненный пользователь видит все карточки как раньше
