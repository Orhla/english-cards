"use server"

import { FOLDER_ID, YANDEX_LLM_API_KEY, YANDEX_LLM_BASE_URL } from "@/lib/consts";
import { generateYandexLLMPrompt, generateYandexLLMRole } from "@/lib/prompts";
import { YandexGPTResponse, YandexGPTRequest } from "@/lib/types";
import { getAllTopics } from "@/actions/actions";

export async function enrichWordCard(word: string): Promise<YandexGPTResponse> {
    console.log("2. СЕРВЕР: Функция enrichment запустилась для слова:", word);
    if (!YANDEX_LLM_API_KEY) {
            throw Error("YANDEX_LLM_API_KEY пустой или не найден");
    }
    
    if (!FOLDER_ID) {
        throw Error("FOLDER_ID пустой или не найден");
    }

    const allTopics = await getAllTopics();
    console.log('allTopics', allTopics);

    type YandexSyncResponse = {
        alternatives: {
            message: {
                role: string;
                text: string;
            };
            status: string;
        }[];
    }

    const yandexCardSchema = {
        type: "object",
        properties: {
            meanings: {
                type: "array",
                items: { type: "string" },
                minItems: 1,
                maxItems: 3,
                description: "Short definitions of the word in English"
            },
            examples: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 4,
                description: "Example sentences using the word in English"
            },
            level: {
                type: "string",
                enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
                description: "CEFR language level"
            },
            topics: {
                type: "array",
                items: {
                    type: "string",
                    enum: allTopics
                },
                minItems: 1,
                maxItems: 3,
                description: "1-3 topic categories related to the word"
            }
        },
        required: ["meanings", "examples", "level", "topics"],
        additionalProperties: false
    };

    const requestBody: YandexGPTRequest = {
        modelUri: `gpt://${FOLDER_ID}/yandexgpt-5.1`,
        completionOptions: {
            stream: false,
            temperature: 0.3,
        },
        messages: [
            { role: "system", text: generateYandexLLMRole },
            { role: "user", text: generateYandexLLMPrompt(word) }
        ],
        jsonSchema: {
            schema: yandexCardSchema
        }
    }

    const response = await fetch(YANDEX_LLM_BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Api-Key ${YANDEX_LLM_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        cache: "no-store"
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Yandex LLM API Error (${response.status}): ${errText}`);
    }

    const apiData = await response.json();
    console.log('response', response);
    console.log('apiData', apiData);
    const jsonTextString = apiData.result.alternatives?.[0]?.message?.text;

    if (!jsonTextString) {
        console.error("=== КРИТИЧЕСКАЯ ОШИБКА YANDEX GPT ===");
        console.error("Полный ответ от API:", JSON.stringify(apiData, null, 2));
        const alternative = apiData.alternatives?.[0];
        const jsonTextString = alternative?.message?.text;
        
        if (alternative) {
            console.error(`Статус генерации alternatives: ${alternative.status}`);
            } else {
            console.error("Массив 'alternatives' пуст или отсутствует в ответе.");
            }
        console.error("=====================================");
        throw new Error("API вернул статус OK, но текстовые данные отсутствуют в ответе");
    }

    return JSON.parse(jsonTextString) as YandexGPTResponse;
}