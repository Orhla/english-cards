export const YANDEX_API_KEY = process.env.YANDEX_API_KEY ?? "";
export const YANDEX_TRANSLATE_API_KEY = process.env.YANDEX_TRANSLATE_API_KEY ?? "";
export const YANDEX_DICTIONARY_API_KEY = process.env.YANDEX_DICTIONARY_API_KEY ?? "";
export const FOLDER_ID = process.env.FOLDER_ID ?? "";

export const AUDIO_DIR = "./public/audio";

export const YANDEX_BASE_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize";
export const YANDEX_TRANSLATE_BASE_URL = "https://translate.api.cloud.yandex.net/translate/v2/translate";
export const YANDEX_DICTIONARY_BASE_URL = "https://dictionary.yandex.net/api/v1/dicservice.json/lookup";

export enum LANGUAGES {
    ENGLISH_US_LANG_CODE = "en-US",
    RUSSIAN_RU_LANG_CODE = "ru-RU",
}

export enum TRANSLATE_LANGUAGES {
    ENGLISH_US_LANG_CODE = "en",
    RUSSIAN_RU_LANG_CODE = "ru",
}

export const MIN_CARDS_NUMBER = 1;
export const MAX_CARDS_NUMBER = 20;

export const ERROR_CARDS_NUMBER = 2;
export const NEW_CARDS_NUMBER = 1;