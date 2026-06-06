import { createWriteStream, existsSync } from "fs";
import { AUDIO_DIR, YANDEX_API_KEY, YANDEX_BASE_URL } from "@/lib/consts";
import { Writable } from "stream";
import { unlink } from "fs/promises";
import { WordCard } from "@/generated/prisma/browser";

export async function generateEnglishAudioFile(card: WordCard, audioDir: string = AUDIO_DIR, yandexApiKey: string = "") {
    if (!yandexApiKey) {
        throw Error("YANDEX_API_KEY пустой или не найден");
    }
    const audioPath = `${audioDir}/${card.word}.ogg`
    if (existsSync(audioPath)) {
        return;
    }

    const params = new URLSearchParams({
        text: card.word,
        lang: "en-US",
        format: "oggopus",
        voice: "john"
    });

    const response = await fetch(YANDEX_BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Api-Key ${YANDEX_API_KEY}`,
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

    const fileStream = createWriteStream(audioPath);
    try {
        await response.body.pipeTo(Writable.toWeb(fileStream));
    } catch (error) {
        fileStream.destroy();
        await unlink(audioPath);
        throw new Error(`Ошибка генерации аудиофайла ${audioPath}\nОшибка: ${error}`)
    }
}
