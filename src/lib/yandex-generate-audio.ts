import { createWriteStream } from "fs";
import { AUDIO_DIR, YANDEX_API_KEY, YANDEX_BASE_URL } from "@/lib/consts";
import { Writable } from "stream";
import { access, open, unlink } from "fs/promises";
import { WordCard } from "@/generated/prisma/browser";

export async function generateEnglishAudioFile(card: WordCard, langCode: string, audioDir: string = AUDIO_DIR, yandexApiKey: string = YANDEX_API_KEY) {
    if (!yandexApiKey) {
        throw new Error("Отсутствует YANDEX_API_KEY. Пожалуйста, установите его в переменных окружения.");
    }

    const audioPath = `${audioDir}/${card.word}.ogg`
    try {
        await access(audioPath);
        return;
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
            throw error;
        }
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

    const fileHandle = await open(audioPath, "w");
    const fileStream = fileHandle.createWriteStream();
    try {
        await response.body.pipeTo(Writable.toWeb(fileStream));
    } catch (error) {
        console.error("Ошибка при сохранении аудио файла:", error);
        fileStream.destroy();
        await fileHandle.close()
        await unlink(audioPath);
        throw error;
    }
}
