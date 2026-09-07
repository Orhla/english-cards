import { AUDIO_DIR, YANDEX_API_KEY, YANDEX_BASE_URL } from "@/lib/consts";
import { WordCard } from "@/generated/prisma/browser";
import { logger } from "@/lib/logger";
import { uploadFileService } from "@/services/files";

export async function generateEnglishAudioFile(card: WordCard, langCode: string, audioDir: string = AUDIO_DIR, yandexApiKey: string = YANDEX_API_KEY) {
    if (!yandexApiKey) {
        throw new Error("Отсутствует YANDEX_API_KEY. Пожалуйста, установите его в переменных окружения.");
    }

    const params = new URLSearchParams({
                        text: card.word,
                        lang: langCode,
                        format: "oggopus",
                        voice: "john"
                    });

    const response = await fetch(YANDEX_BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Api-Key ${yandexApiKey}`,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Yandex API Error (${response.status}): ${errText}`);
    }

    if (!response.body) {
        throw new Error("Пустой ответ от сервера Яндекса");
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
        throw new Error("Пустой ответ от сервера Яндекса");
    }

    const audioFile = new File([arrayBuffer], `${card.word}.ogg`, { type: "audio/ogg" });

    try {
        const savedFile = await uploadFileService(audioFile, "audio");
        return savedFile;
    } catch (error) {
        logger.error("Ошибка при сохранении аудио файла", {"component": "generateEnglishAudioFile", "error": `${error instanceof Error ? error.message : error}`});
        throw error;
    }
}
