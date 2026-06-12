import "dotenv/config";
import { getAllEnglishCards } from "@/actions/actions";
import { mkdir } from "fs/promises";
import { asyncPool, withRetry } from "@/lib/utils";
import { AUDIO_DIR, LANGUAGES, YANDEX_API_KEY } from "@/lib/consts";
import { generateEnglishAudioFile } from "@/lib/yandex-generate-audio";

const POOL_LIMIT = 5;

async function getEnglishAudioFiles() {

    if (!YANDEX_API_KEY) {
        throw Error("YANDEX_API_KEY пустой или не найден");
    }

    const allCards = await getAllEnglishCards();
    if (!allCards.success) {
        return allCards.message;
    }

    await mkdir(AUDIO_DIR, { recursive: true });
    await asyncPool(allCards.data, POOL_LIMIT, (item) => withRetry(() => generateEnglishAudioFile(item, LANGUAGES.ENGLISH_US_LANG_CODE)));
}

try {
    await getEnglishAudioFiles();
} catch (error) {
    console.error(error instanceof Error ? error.message : "Не удалось сгенерировать аудиофайлы");
}