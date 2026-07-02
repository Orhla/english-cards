export const YANDEX_API_KEY = process.env.YANDEX_API_KEY ?? "";
export const YANDEX_BASE_URL = "https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize";
export const AUDIO_DIR = "./public/audio";

export enum LANGUAGES {
    ENGLISH_US_LANG_CODE = "en-US",
    RUSSIAN_RU_LANG_CODE = "ru-RU",
}

export const MIN_CARDS_NUMBER = 1;
export const MAX_CARDS_NUMBER = 20;

export const ERROR_CARDS_NUMBER = 2;
export const NEW_CARDS_NUMBER = 1;