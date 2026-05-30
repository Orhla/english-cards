import "dotenv/config";
import { createWriteStream, existsSync } from "fs";
import { getAllEnglishCards } from "@/actions/actions";
import { Writable } from "stream";
import { mkdir } from "fs/promises";

const YANDEX_API_KEY = process.env.YANDEX_API_KEY; 
const AUDIO_DIR = "./public/audio";

async function getEnglishAudioFiles() {
    const allCards = await getAllEnglishCards();
    if (!allCards.success) {
        return allCards.message;
    }

    await mkdir(AUDIO_DIR, { recursive: true });

    for (const card of allCards.data) {
        const audioPath = `${AUDIO_DIR}/${card.word}.ogg`

        if (!existsSync(audioPath)) {
            const params = new URLSearchParams({
                                text: card.word,
                                lang: "en-US",
                                format: "oggopus",
                                voice: "john"
                            });
            
            try {
                const response = await fetch("https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize", {
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
                await response.body.pipeTo(Writable.toWeb(fileStream));

                await new Promise((resolve) => setTimeout(resolve, 500));

            } catch (error) {
                console.error(error);
                throw new Error("Ошибка записи звука");
            }
        }
    }
}

await getEnglishAudioFiles();