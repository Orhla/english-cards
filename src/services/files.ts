import { ALLOWED_AUDIO_TYPES, ALLOWED_IMAGE_TYPES, AUDIO_DIR, audioMimeToExt, IMAGE_DIR, imageMimeToExt, MAX_AUDIO_FILE_SIZE_IN_BYTES, MAX_IMAGE_FILE_SIZE_IN_BYTES } from "@/lib/consts";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { AllowedFileType } from "@/lib/types";
import { deleteFromStorage, readFromStorage, saveToStorage } from "@/services/file-storage";
import path from "path";

const filesLogger = logger.child({component: "files.ts"});

type ValidateFileStatus =
    | { success: true }
    | { success: false, message: string }

export function validateFile(file: File, businessType: AllowedFileType): ValidateFileStatus {
    const allowedFileTypes = businessType === "audio" ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES;
    const maxFileSize = businessType === "audio" ? MAX_AUDIO_FILE_SIZE_IN_BYTES : MAX_IMAGE_FILE_SIZE_IN_BYTES;

    if (!allowedFileTypes.includes(file.type)) {
        filesLogger.warn("Файл имеет неверный формат", {function: "validateFile", type: file.type});
        return { success: false, message: "Файл имеет неверный формат" };
    }

    if (file.size > maxFileSize) {
        filesLogger.warn("Размер файла превышает допустимый", {function: "validateFile", size: file.size});
        return { success: false, message: "Размер файла превышает допустимый" };
    }

    return { success: true };
}


export async function uploadFileService(file: File, businessType: AllowedFileType): Promise<{ id: string, originalName: string }> {
    const validateFileStatus = validateFile(file, businessType);
    if (!validateFileStatus.success) {
        throw new Error(validateFileStatus.message);
    }

    const targetFolder = businessType === "audio" ? AUDIO_DIR : IMAGE_DIR;
    const fileExtension = businessType === "audio" ? audioMimeToExt[file.type] : imageMimeToExt[file.type];  
    const fileId = crypto.randomUUID();
    const uniqueFileName = `${fileId}.${fileExtension}`;
    const filePath = path.join(targetFolder, uniqueFileName);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await saveToStorage(filePath, buffer);
        const savedFile = await prisma.file.create({
        data: {
            id: fileId,
            path: uniqueFileName,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
        },
        select: {
            id: true,
            originalName: true
        }
        });
        return savedFile;
    } catch (error) {
        filesLogger.error("Ошибка при сохранении файла", {function: "uploadFile", error: `${error instanceof Error ? error.message : error}`});
        throw new Error(`Ошибка при сохранении файла: ${error instanceof Error ? error.message : error}`);
    }
}


export async function getFileById(id: string): Promise<File | null> {
    try {
        const selectedFilePath = await prisma.file.findUnique({
            where: {
                id: id
            },
            select: {
                path: true
            }
        });

        if (!selectedFilePath) {
            return null;
        }

        const selectedFileBuffer = await readFromStorage(selectedFilePath.path);
        const fileData = new Uint8Array(selectedFileBuffer);
        const selectedFile = new File([fileData], selectedFilePath.path);
        
        return selectedFile;
    } catch (error) {
        filesLogger.error("Ошибка при обращении к файлу", {function: "getFileById", error: `${error instanceof Error ? error.message : error}`});
        throw new Error(`Ошибка при обращении к файлу: ${error instanceof Error ? error.message : error}`);
    }
}


export async function deleteFile(id: string): Promise<void> {
    try {
        const deletedFile = await prisma.file.delete({
                 where: { id: id },
              });

        await deleteFromStorage(deletedFile.path);
    } catch (error) {
        filesLogger.error("Ошибка при удалении файла", {function: "deleteFile", error: `${error instanceof Error ? error.message : error}`});
        throw new Error(`Ошибка при удалении файла: ${error instanceof Error ? error.message : error}`);
    }
}