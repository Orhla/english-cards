import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import { generateEnglishAudioFile } from "./yandex-generate-audio";
import {access, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {WordCard} from "@/generated/prisma/client";
import {ENGLISH_US_LANG_CODE, YANDEX_BASE_URL} from "@/lib/consts";
import path from "node:path";


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
        vi.restoreAllMocks();
        await rm(tempDir, {recursive: true});
    })


    it("shouldThrowWhenNoYandexApiKeyProvided", async () => {
        expect(async ()=>{
            await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "");
        }).rejects.toThrow(/YANDEX_API_KEY/);
    });


    it("shouldSkipGenerationIfFileExists", async () => {
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

    it('shouldDeleteCorruptedFile', async () => {

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            body: { 
                pipeTo: vi.fn().mockImplementation(async () => {
                    await sleep(20); 
                    throw new Error("disk full");
                })
            }   
        } as unknown as Response);
        await expect(
            generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "123")
        ).rejects.toThrow()
        const err = await access(tempDir + "/" + mockCard.word + ".ogg").then(() => null).catch(e => e);
        expect(err?.code).toBe('ENOENT');
    })

    it('shouldCheckIfFetchUrlIsCorrect', async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            body: { 
                pipeTo: vi.fn().mockResolvedValue("")                
            }   
        } as unknown as Response);

        const testApiKey = "test-key-123";
        await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, testApiKey);

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe(YANDEX_BASE_URL);
        expect(options?.method).toBe("POST");

        const headers = options?.headers as Record<string, string>;
        expect(headers["Authorization"]).toBe(`Api-Key ${testApiKey}`);
        expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");

        const bodyParams = options?.body as URLSearchParams;
        expect(bodyParams.get("text")).toBe(mockCard.word);
        expect(bodyParams.get("lang")).toBe(ENGLISH_US_LANG_CODE);
        expect(bodyParams.get("format")).toBe("oggopus");
        expect(bodyParams.get("voice")).toBe("john");
    })

    it('shouldThrowIfResponseBodyIsEmpty', async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            status: 200,
            body: null
        } as unknown as Response);

        await expect(async ()=>{
            await generateEnglishAudioFile(mockCard, ENGLISH_US_LANG_CODE, tempDir, "123")
        }).rejects.toThrow("Пустой ответ от сервера Яндекса");
    })
    
});
