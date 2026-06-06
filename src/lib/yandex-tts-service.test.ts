import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync } from "fs";
import { generateEnglishAudioFile } from "./yandex-tts-service";
import {unlink, writeFile} from "fs/promises"; // путь к своему файлу

// vi.mock("fs", ()=>{
//     existsSync: existsSync
// });
vi.mock("fs/promises");

const mockCard = { word: "hello" };
describe("generateEnglishAudioFile", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("пропускает генерацию, если файл уже существует", async () => {
        await writeFile(`./${mockCard.word}.ogg`, "dummy audio content"); // создаем фейковый файл
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        await generateEnglishAudioFile(mockCard, './', "123");

        expect(fetchSpy).not.toHaveBeenCalled();
        await unlink(`./${mockCard.word}.ogg`); // удаляем фейковый файл
    });

    it("бросает ошибку, если Yandex API вернул не-ok статус", async () => {
        // vi.mocked(existsSync).mockReturnValue(false);

        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        } as Response);

        await expect(generateEnglishAudioFile(mockCard, './', "123")).rejects.toThrow("Yandex API Error (500)");
    });

    // бонус: ошибка при записи файла
    it("удаляет частичный файл и пробрасывает ошибку при сбое потока", async () => {
        vi.mocked(existsSync).mockReturnValue(false);

        const fakeBody = {
            pipeTo: vi.fn().mockRejectedValue(new Error("disk full")),
        };

        vi.spyOn(globalThis, "fetch").mockResolvedValue({
            ok: true,
            body: fakeBody,
        } as unknown as Response);

        const { unlink } = await import("fs/promises");
        const unlinkMock = vi.mocked(unlink).mockResolvedValue(undefined);

        await expect(generateEnglishAudioFile(mockCard)).rejects.toThrow(
            "Ошибка генерации аудиофайла"
        );
        expect(unlinkMock).toHaveBeenCalledWith(
            expect.stringContaining("hello.ogg")
        );
    });
});
