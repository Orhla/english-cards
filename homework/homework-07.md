# Домашнее задание 7

Продолжаем полировать то что сделали в 6-й домашке. Каждый пункт — отдельная тема, делай по порядку.

---

## Часть 1 — UI библиотека

Сейчас всё на голом Tailwind. Это нормально, но в реальных проектах используют UI библиотеки — готовые компоненты (кнопки, диалоги, таблицы, инпуты) которые уже стилизованы и доступны.

Самая известная — **Material UI (MUI)**. Но есть альтернативы, у каждой свой подход:

- **Shadcn/ui** — не библиотека в классическом смысле, а коллекция компонентов которые ты копируешь к себе в проект и владеешь ими полностью. Построена на Radix UI + Tailwind. Сейчас очень популярна.
- **Mantine** — полноценная библиотека с богатым набором компонентов и хуков. Хорошая документация, приятный DX, работает с Tailwind.
- **Material UI (MUI)** — самая зрелая, огромная экосистема, но тяжелее и со своей дизайн-системой (Google Material Design).

Выбери одну и установи в проект. Рекомендую MUI, но только потому что я с ней работал 2 года назад (не самая свежая рекомендация).

Перепиши хотя бы страницу `/admin/cards` используя компоненты из библиотеки: таблица, кнопки, лейблы. В идеале - ни одного дива в приложении быть не должно. 

---

## Часть 2 — Диалог подтверждения удаления

Сейчас `DeleteCardButton` использует браузерный `confirm()` — это блокирующий диалог который нельзя стилизовать и который выглядит как привет из 2005 года.

Замени на диалог из UI библиотеки которую выбрал в части 1. В MUI это `<Dialog>`, в Mantine — `<Modal>`, в Shadcn — `<AlertDialog>`.

Логика простая: нажал "Удалить" → появляется диалог с текстом и двумя кнопками → подтвердил → удаление.

---

## Часть 3 — Управляемые и неуправляемые формы

Посмотри сначала видео, которое я скинул. Может какие-то другие, это небольшой (но важный) концепт.

Суть: форма бывает двух видов.

**Управляемая (controlled)** — каждый инпут привязан к `useState`. React знает значение поля в каждый момент времени. Нужна когда: валидация на лету, зависимые поля, real-time preview.

**Неуправляемая (uncontrolled)** — инпуты живут сами по себе, значения читаются через `FormData` в момент сабмита. В React это `defaultValue` вместо `value`. Нужна когда: просто форма без сложной логики.

**Красный флаг:** `useState` для каждого поля формы + `value={state}` + `onChange={setState}` — это почти всегда признак того что форма управляемая без причины. Если ты не делаешь валидацию на лету — дублируешь стейт зря.

Посмотри на `AdminWordCardClient` — там `formData` в стейте дублирует весь `WordCard`. Это лишнее.

**Задача:** переведи форму на `defaultValue`. Никакого `useState` для полей формы.

---

## Часть 4 — `useActionState` и `action` вместо `onSubmit`

Прочитай: [useActionState](https://react.dev/reference/react/useActionState#use-with-a-form)

Сейчас формы работают так:
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  const result = await createWordCard(data)
  // ...
}
<form onSubmit={handleSubmit}>
```

Это ручная работа которую React умеет делать сам. Правильный подход:

```tsx
const [state, action, isPending] = useActionState(createWordCard, initialState)

<form action={action}>
  <input name="word" />
  <SubmitButton />  {/* внутри — useFormStatus */}
</form>
```

`useActionState` даёт:
- `isPending` — форма отправляется прямо сейчас
- `state` — результат последнего вызова action (ошибки, сообщения)
- Форма работает даже без JavaScript (progressive enhancement) - очередной привет из 2003 года, но зато "гвоздями прибито"

`useFormStatus` — отдельный хук который читает статус ближайшей родительской формы. Именно поэтому кнопку выносят в отдельный компонент:

```tsx
'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Сохранение...' : 'Сохранить'}
    </button>
  )
}
```

**Задача:** перепиши `CardCreator` и форму редактирования используя `useActionState` + `action` проп. Server Action при этом должен принимать `FormData` напрямую, а не типизированный объект.
От Владимира - сначала пункт 5 сделай. 

---

## Часть 5 — Единая форма для создания и редактирования

Сейчас `CardCreator` (создание) и форма в `AdminWordCardClient` (редактирование) — это два разных компонента с одинаковыми полями. Это дублирование.

Сделай один компонент `CardForm` который умеет и то и другое:

```tsx
type Props = {
  card?: WordCard  // нет card — режим создания, есть — редактирование
}

export function CardForm({ card }: Props) {
  return (
    <form action={saveCardAction}>
      {card && <input type="hidden" name="id" value={card.id} />}
      <input name="word" defaultValue={card?.word} />
      {/* остальные поля */}
      <SubmitButton />
    </form>
  )
}
```

В `saveCardAction` смотришь: есть `id` в `FormData` — делаешь update, нет — create.

Страница `/admin/cards/new` и страница `/admin/cards/[id]` используют один и тот же `CardForm`.

---

## Часть 6 — Разделить AdminWordCardClient на CardView и CardForm

Сейчас один компонент делает две вещи: показывает карточку и редактирует её. Внутри `if (mode === "view")` — это признак что компонент стоит разбить.

Перенеси логику переключения режимов на уровень страницы — `page.tsx` читает `searchParams` напрямую (серверный компонент может это делать без `useSearchParams`) и рендерит нужный компонент:

```tsx
// page.tsx
const mode = (await searchParams).mode === 'edit' ? 'edit' : 'view'

return mode === 'edit'
  ? <CardForm card={card} />
  : <CardView card={card} />
```

`CardView` — просто отображение данных + кнопка "Редактировать".  
`CardForm` — из части 5.

---

## Часть 7 — Авторизация в Server Actions

Server Actions доступны как обычные HTTP POST эндпоинты — любой может вызвать `deleteWordCard(1)` напрямую из curl, минуя весь UI.

Защити все мутирующие actions: `updateWordCard`, `deleteWordCard`, `createWordCard`.

Сделай хелпер `requireAdmin()` в `lib/dal.ts` и вызывай его первой строкой в каждом action:

```ts
// lib/dal.ts
import 'server-only'
import { auth } from '@/auth'

export async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return session
}
```

```ts
export async function deleteWordCard(id: number) {
  await requireAdmin()
  // ...
}
```

---

## Часть 8 — Пагинация на `/admin/cards`

Сейчас `findMany()` грузит все карточки сразу. Добавь пагинацию через `searchParams`:

URL выглядит так: `/admin/cards?page=2`

В Prisma это `skip` и `take`:
```ts
const page = Number(searchParams.page) || 1
const perPage = 20
const cards = await prisma.wordCard.findMany({
  skip: (page - 1) * perPage,
  take: perPage,
})
```

Добавь кнопки "Следующая" / "Предыдущая" и общее количество карточек.

---

## Часть 9 — Знакомство с Feature Slice Design

Посмотри доклад про архитектуру: [Feature Sliced Design](https://www.youtube.com/watch?v=SnzPAr_FJ7w)

FSD — это способ структурировать файлы фронтенд-проекта не по типу (`components/`, `hooks/`, `utils/`) а по фиче и слою (`features/auth/`, `entities/card/`, `shared/ui/`).

Сейчас у нас всё в `components/` и `app/`. Посмотри на проект и подумай: как бы ты разбил его по FSD? Не нужно переписывать — просто набросай структуру папок в комментарии к PR.

---

## Что должно получиться

- Проект использует UI библиотеку, нет голых HTML-кнопок в admin
- Удаление карточки — через диалог из UI библиотеки, не через `confirm()`
- Формы — неуправляемые (`defaultValue`), без дублирования стейта
- Одна `CardForm` для создания и редактирования
- `AdminWordCardClient` разбит на `CardView` и `CardForm`
- Server Actions защищены проверкой роли
- На `/admin/cards` есть пагинация
- В PR — набросок структуры FSD для проекта
