import "dotenv/config";
import { generateEnglishAudioFile, getAllEnglishCards } from "@/actions/actions";
import { mkdir } from "fs/promises";
import { asyncPool, withRetry } from "@/lib/utils";
import { AUDIO_DIR, YANDEX_API_KEY } from "@/lib/consts";

const POOL_LIMIT = 5;

if (!YANDEX_API_KEY) {
    throw Error("YANDEX_API_KEY пустой или не найден");
}

async function getEnglishAudioFiles() {
    const allCards = await getAllEnglishCards();
    if (!allCards.success) {
        return allCards.message;
    }

    await mkdir(AUDIO_DIR, { recursive: true });
    await asyncPool(allCards.data, POOL_LIMIT, generateEnglishAudioFile);
}


try {
    await withRetry(getEnglishAudioFiles, 5);
} catch (error) {
    console.error(error instanceof Error ? error.message : "Не удалось сгенерировать аудиофайлы");
}