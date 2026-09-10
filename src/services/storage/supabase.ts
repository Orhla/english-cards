import { createClient } from "@supabase/supabase-js"
import { StorageProvider } from "@/services/storage/provider";
import { BUCKET } from "@/lib/consts";
import { logger } from "@/lib/logger";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseStorageLogger = logger.child({component: "supabase.ts"})

export const supabaseProvider: StorageProvider = {

    async save(key: string, fileBody: Buffer): Promise<void> {
        const { data, error } = await supabase.storage.from(BUCKET).upload(key, fileBody, { upsert: true });
        if (error) {
            supabaseStorageLogger.error("Ошибка при сохранении файла в хранилище", {function: "save", error: `${error instanceof Error ? error.message : error}`});
            throw error;
        }
    },


    async read(key: string): Promise<Buffer> {
        const { data, error } = await supabase.storage.from(BUCKET).download(key);
        if (error) {
            supabaseStorageLogger.error("Ошибка при чтении файла из хранилища", {function: "read", error: `${error instanceof Error ? error.message : error}`});
            throw error;
        }
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
    },


    readStream(key: string): ReadableStream<Uint8Array> {
        const url = `${process.env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`
        return new ReadableStream({
            async start(controller) {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
                })
                if (!response.ok) {
                    controller.error(new Error(`Storage fetch failed: ${response.status}`))
                    return
                }
                const reader = response.body!.getReader()
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) { controller.close(); break }
                        controller.enqueue(value)
                    }
                } catch (err) {
                    controller.error(err)
                }
            },
        })
    },


    async deleteFile(key: string): Promise<void> {
        const { data, error } = await supabase.storage.from(BUCKET).remove([key])

        if (error) {
            supabaseStorageLogger.error("Ошибка при удалении файла из хранилища", {function: "deleteFile", error: `${error instanceof Error ? error.message : error}`});
            throw error;
        }
    },

    // async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    //     const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, expiresInSeconds)
    //     if (error || !data) {
    //         supabaseStorageLogger.error("Ошибка при получении ссылки на файл", {function: "getSignedUrl", error: `${error instanceof Error ? error.message : error}`});
    //         throw new Error(error?.message ?? "Failed to sign URL")
    //     }
    //     return data.signedUrl
    // }

}
