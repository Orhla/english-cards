"use server"

import { FOLDER_ID, TRANSLATE_LANGUAGES, YANDEX_DICTIONARY_API_KEY, YANDEX_DICTIONARY_BASE_URL, YANDEX_TRANSLATE_API_KEY, YANDEX_TRANSLATE_BASE_URL } from "@/lib/consts";

export async function getWordTranslations(word: string): Promise<string[]> {
    if (!YANDEX_TRANSLATE_API_KEY) {
        throw Error("YANDEX_TRANSLATE_API_KEY пустой или не найден");
    }

    if (!FOLDER_ID) {
        throw Error("FOLDER_ID пустой или не найден");
    }

    const response = await fetch(YANDEX_TRANSLATE_BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Api-Key ${YANDEX_TRANSLATE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"sourceLanguageCode": TRANSLATE_LANGUAGES.ENGLISH_US_LANG_CODE,
                              "targetLanguageCode": TRANSLATE_LANGUAGES.RUSSIAN_RU_LANG_CODE,
                              "folderId": FOLDER_ID,
                              "texts": [word]})
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Yandex Translate API Error (${response.status}): ${errText}`);
    }

    const translations = await response.json();
    if (!translations || !translations.translations || !Array.isArray(translations.translations) || translations.translations.length === 0 || !translations.translations[0].text) {
        throw new Error("Неверный формат ответа от сервера Яндекса");
    }

    return translations.translations.map((t: { text: string }) => t.text?.trim())
                                    .filter((text: string) => text);
}


export async function getWordTranscription(word: string): Promise<string> {
    if (!YANDEX_DICTIONARY_API_KEY) {
        throw Error("YANDEX_DICTIONARY_API_KEY пустой или не найден");
    }

    const params = new URLSearchParams({
                        key: YANDEX_DICTIONARY_API_KEY,
                        lang: `${TRANSLATE_LANGUAGES.ENGLISH_US_LANG_CODE}-${TRANSLATE_LANGUAGES.RUSSIAN_RU_LANG_CODE}`,
                        text: word,
                        ui: TRANSLATE_LANGUAGES.ENGLISH_US_LANG_CODE
                    });

    const response = await fetch(YANDEX_DICTIONARY_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Yandex Dictionary API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const transcription = data?.def?.[0]?.ts ? `/${data.def[0].ts}/` : '';
    return transcription;
}