import { getAllTopics } from "@/actions/actions";
import { z } from "zod"
import { callYandexLLM } from "@/lib/yandex/provider";
import { FOLDER_ID } from "@/lib/consts";
import { logger } from "@/lib/logger";

const generateYandexLLMRole = `Ты помощник для создания обучающих карточек английского языка.`

const generateYandexLLMPrompt = (word: string, availableTopics: string[]) => `Проанализируй английское слово: "${word}"

Верни JSON в точно таком формате:
{
  "meanings": ["определение 1 на английском", "определение 2 на английском"],
  "examples": ["Example sentence 1.", "Example sentence 2.", "Example sentence 3."],
  "level": "B1",
  "topics": ["work", "communication"]
}

Правила:
- meanings: Напиши от 1 до 3 коротких, понятных определений слова "${word}" на английском языке.
- examples: Придумай от 2 до 4 естественных примеров предложений на английском языке, демонстрирующих контекст использования слова "${word}".
- level: Определи уровень владения языком (CEFR) для слова "${word}".
- topics: Выбери для слова ${word} от 1 до 3 категорий СТРОГО из этого списка: [${availableTopics.join(", ")}]. Использование тем не из списка запрещено.`


export type WordCardEnrichment = {
    meanings: string[];
    examples: string[];
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    topics: string[];
}

export type WordEnrichmentStatus =
    | { success: true, data: WordCardEnrichment }
    | { success: false, message: string }

export async function wordCardEnrichmentAgent(word: string): Promise<WordEnrichmentStatus> {

    const allTopics = await getAllTopics();

    const WordCardEnrichmentSchema = z.object({
        meanings: z.array(z.string()).min(1).max(3),
        examples: z.array(z.string()).min(2).max(4),
        level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
        topics: z.array(z.string().refine((topic) => allTopics.includes(topic),
            { message: "Данный топик отсутствует в разрешенном списке базы данных" })).min(1).max(3)
    })

    const jsonTextResult = await callYandexLLM({
                modelUri: `gpt://${FOLDER_ID}/yandexgpt-5.1`,
                completionOptions: {
                    stream: false,
                    temperature: 0.3,
                },
                messages: [
                    { role: "system", text: generateYandexLLMRole },
                    { role: "user", text: generateYandexLLMPrompt(word, allTopics) }
                ],
                jsonSchema: {
                    schema: WordCardEnrichmentSchema
                }
            })

    try {
        const jsonResult = JSON.parse(jsonTextResult);
        const result = WordCardEnrichmentSchema.parse(jsonResult);

        return { success: true, data: result };
    } catch (error) {
        return {success: false, message: error instanceof z.ZodError || error instanceof Error ? error.message : "Ошибка при парсинге ответа от LLM."};
    }
}
