import { FOLDER_ID, YANDEX_LLM_API_KEY, YANDEX_LLM_BASE_URL } from "@/lib/consts";
import { withRetry } from "@/lib/utils";

export class YandexApiError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message)
        this.name = "YandexApiError"
    }
}

export class YandexApiNonRetryableError extends YandexApiError {
    constructor(status: number, message: string) {
        super(status, message);
        this.name = "YandexApiNonRetryableError";
    }
}

export async function callYandexLLM(params: {
            modelUri: string
            messages: { role: "system" | "user"; text: string }[]
            jsonSchema?: object
            completionOptions?: object}): Promise<string> {
    if (!YANDEX_LLM_API_KEY) {
        throw new Error("YANDEX_LLM_API_KEY пустой или не найден");
    }

    if (!FOLDER_ID) {
        throw new Error("FOLDER_ID пустой или не найден");
    }

    const response = await withRetry(async () => {
        const responseTry = await fetch(YANDEX_LLM_BASE_URL, {
            method: "POST",
            headers: {
                "Authorization": `Api-Key ${YANDEX_LLM_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(params),
            cache: "no-store"
        });

        if (!responseTry.ok) {
            const errText = await responseTry.text();

            if ([400, 401, 403].includes(responseTry.status)) {
                throw new YandexApiNonRetryableError(responseTry.status, `Yandex LLM API Error: ${errText}`);
            }

            throw new YandexApiError(responseTry.status, `Yandex LLM API Error: ${errText}`);
        }

        return responseTry;
    }, 3, 1000, [YandexApiNonRetryableError]);

    const apiData = await response.json();
    const jsonTextString = apiData.result.alternatives?.[0]?.message?.text;
    
    return jsonTextString;
}
