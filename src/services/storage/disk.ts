import { STORAGE_DIR } from "@/lib/consts";
import { logger } from "@/lib/logger";
import { createReadStream } from "fs";
import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { StorageProvider } from "@/services/storage/provider";

const fileStorageLogger = logger.child({component: "disk.ts"})

export const diskProvider: StorageProvider = {

    async save(key: string, data: Buffer): Promise<void> {
        try {
            const filePath = path.join(STORAGE_DIR, key);
            await writeFile(filePath, data);            
        } catch (error) {
            fileStorageLogger.error("Ошибка при сохранении файла в хранилище", {function: "save", error: `${error instanceof Error ? error.message : error}`});
            throw new Error(`Ошибка при сохранении файла`);
        }
    },


    async read(key: string): Promise<Buffer> {
        try {
            const filePath = path.join(STORAGE_DIR, key);
            const buffer = await readFile(filePath);
            return buffer;
        } catch (error) {
            fileStorageLogger.error("Ошибка при чтении файла", {function: "read", error: `${error instanceof Error ? error.message : error}`});
            throw new Error(`Ошибка при чтении файла`);
        }
    },


    async readStream(key: string): Promise<ReadableStream<Uint8Array>> {
        try {
            const filePath = path.join(STORAGE_DIR, key)
            const nodeStream = createReadStream(filePath)
            return Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>
        } catch (error) {
            fileStorageLogger.error("Ошибка при чтении потока", {function: "readStream", error: `${error instanceof Error ? error.message : error}`});
            throw new Error(`Ошибка при чтении потока`);
        }
    },


    async deleteFile(key: string): Promise<void> {
        try {
            const filePath = path.join(STORAGE_DIR, key);
            await unlink(filePath);
        } catch (error) {
            fileStorageLogger.error("Ошибка при удалении файла", {function: "deleteFile", error: `${error instanceof Error ? error.message : error}`});
            throw new Error(`Ошибка при удалении файла`);
        }
    },

}