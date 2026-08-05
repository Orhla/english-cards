import { FOLDER_ID, YANDEX_LLM_API_KEY, YANDEX_LLM_BASE_URL } from "@/lib/consts";
import { withRetry } from "@/lib/utils";

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
            throw new Error(`Yandex LLM API Error (${responseTry.status}): ${errText}`); 
        }

        return responseTry;
    }, 3, 1000);

    const apiData = await response.json();
    console.log('apiData: ', apiData);
    const jsonTextString = apiData.result.alternatives?.[0]?.message?.text;
    console.log('jsonTextString: ', jsonTextString);

    return jsonTextString;
}