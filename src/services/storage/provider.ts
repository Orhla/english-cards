export interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>
  read(key: string): Promise<Buffer>
  readStream(key: string): ReadableStream<Uint8Array>
  deleteFile(key: string): Promise<void>
  // getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>
}
