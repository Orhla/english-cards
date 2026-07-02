import { Prisma } from "@/generated/prisma/browser";

export enum Mode {
  translation = 'translation',
  pronunciation = 'pronunciation'
}

export const modeConfig = {
    [Mode.translation]: {
        listening: "Слушаю вас... Говорите перевод",
        idle: "Нажмите на микрофон, чтобы проверить свой перевод на русский",
    },
    [Mode.pronunciation]: {
        listening: "Слушаю вас... Говорите слово на английском",
        idle: "Нажмите на микрофон, чтобы проверить своё произношение на английском",
    },
};


export type WordCardWithInteractions = Prisma.WordCardGetPayload<{
  include: { interactions: true }
}>;