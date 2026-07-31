import { createContext, ReactNode, useState } from "react"

type InteractionState = {
  liked: boolean
  ignored: boolean
}

type InteractionsContextValue = {
  getInteraction: (cardId: number) => InteractionState
  setInteraction: (cardId: number, state: Partial<InteractionState>) => void
}

type Props = {
    children: ReactNode,
    initialInteractions: { cardId: number, liked: boolean, ignored: boolean }[]
}

export const InteractionsContext = createContext<InteractionsContextValue | null>(null)

export function InteractionsProvider({ children, initialInteractions }: Props) {
  const [interactions, setInteractions] = useState<Map<number, InteractionState>>(
    () => new Map(initialInteractions.map(i => [i.cardId, { liked: i.liked, ignored: i.ignored }]))
  )

  const getInteraction = (cardId: number): InteractionState =>
    interactions.get(cardId) ?? { liked: false, ignored: false }

  const setInteraction = (cardId: number, state: Partial<InteractionState>) =>
    setInteractions(prev => {
      const nextMap = new Map(prev)
      const current = nextMap.get(cardId) ?? { liked: false, ignored: false }
      nextMap.set(cardId, { ...current, ...state })
      return nextMap
    })

  return (
    <InteractionsContext.Provider value={{ getInteraction, setInteraction }}>
      {children}
    </InteractionsContext.Provider>
  )
}