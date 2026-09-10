import { diskProvider } from "@/services/storage/disk"
import { supabaseProvider } from "@/services/storage/supabase"
import type { StorageProvider } from "@/services/storage/provider"

export function getProvider(): StorageProvider {
  const p = process.env.STORAGE_PROVIDER
  if (p === "supabase") return supabaseProvider
  return diskProvider
}

const provider = getProvider()

export const saveToStorage    = (key: string, data: Buffer) => provider.save(key, data)
export const readFromStorage  = (key: string)               => provider.read(key)
export const readStreamFromStorage = (key: string)          => provider.readStream(key)
export const deleteFromStorage = (key: string)              => provider.deleteFile(key)

// export const getSignedUrlFromStorage = async (key: string, expiresInSeconds = 3600): Promise<string> => {
//   if (!provider.getSignedUrl) {
//     throw new Error(`Метод getSignedUrlFromStorage не поддерживается текущим провайдером (${process.env.STORAGE_PROVIDER || "disk"})`);
//   }
  
//   return provider.getSignedUrl(key, expiresInSeconds);
// };