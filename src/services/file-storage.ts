import { STORAGE_DIR } from "@/lib/consts";
import { logger } from "@/lib/logger";
import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const fileStorageLogger = logger.child({component: "file-storage.ts"})

export async function saveToStorage(key: string, data: Buffer): Promise<void> {
    try {
        const filePath = path.join(STORAGE_DIR, key);
        await writeFile(filePath, data);            
    } catch (error) {
        fileStorageLogger.error("Ошибка при сохранении файла в хранилище", {function: "saveToStorage", error: `${error instanceof Error ? error.message : error}`});
        throw new Error(`Ошибка при сохранении файла: ${error instanceof Error ? error.message : error}`);
    }
}


export async function readFromStorage(key: string): Promise<Buffer> {
    try {
        const filePath = path.join(STORAGE_DIR, key);
        const buffer = await readFile(filePath);
        return buffer;
    } catch (error) {
        fileStorageLogger.error("Ошибка при чтении файла", {function: "readFromStorage", error: `${error instanceof Error ? error.message : error}`});
        throw new Error(`Ошибка при чтении файла: ${error instanceof Error ? error.message : error}`);
    }
}


export async function deleteFromStorage(key: string): Promise<void> {
    try {
        const filePath = path.join(STORAGE_DIR, key);
        await unlink(filePath);
    } catch (error) {
        fileStorageLogger.error("Ошибка при удалении файла", {function: "deleteFromStorage", error: `${error instanceof Error ? error.message : error}`});
        throw new Error(`Ошибка при удалении файла: ${error instanceof Error ? error.message : error}`);
    }
}