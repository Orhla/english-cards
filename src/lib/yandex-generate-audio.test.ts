import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import { generateEnglishAudioFile } from "./yandex-generate-audio";
import {mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {WordCard} from "@/generated/prisma/client";
import {ENGLISH_US_LANG_CODE} from "@/lib/consts";


// @ts-expect-error: mocked variable
const mockCard: WordCard = {
    word: "hello", translation: [""], transcription: ""
};
describe("generateEnglishAudioFile", () => {
    let tempDir: string;

    beforeEach(async () => {
        tempDir =  await mkdtemp("yan-tts-tests")
        vi.resetAllMocks();
    });
    afterEach(async () => {
        await rm(tempDir, {recursive: true});
    })

    it("shouldThrowWhenNoYandexApiKeyProvided", async () => {
        expect(async ()=>{
            await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "");
        }).rejects.toThrow(/YANDEX_API_KEY/);
    });


    it("пропускает генерацию, если файл уже существует", async () => {
        await writeFile(`${tempDir}/${mockCard.word}.ogg`, "dummy audio content"); // создаем фейковый файл
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "123");

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("shouldThrowOnYandexApiError", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        } as Response);

        await expect(async ()=>{
            await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "123")
        }).rejects.toThrow("Yandex API Error (500)");
    });

    it('shouldLWriteYandexResponseToFile', async ()=>{
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode("fake audio data"));
                    controller.close();
                }
            })
        } as unknown as Response);
        await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "123")
        const fileData = await readFile(tempDir + "/" + mockCard.word + ".ogg", "utf-8");
        expect(fileData).toBe("fake audio data");
    })
});
