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

export type YandexGPTRole = 'system' | 'user' | 'assistant';

export type YandexGPTMessage = {
  role: YandexGPTRole;
  text: string;
};

export type YandexGPTRequest = {
  modelUri: string,
  completionOptions: {
    stream: boolean,
    temperature: number
  },
  messages: YandexGPTMessage[],
  jsonSchema: {
    schema: object
  }
}


export type YandexGPTResponse = {
  meanings: string[]
  examples: string[]
  level: string
  topics: string[]
}