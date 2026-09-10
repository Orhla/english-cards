"use client"

import { uploadFile } from "@/actions/actions";
import { AllowedFileType } from "@/lib/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type UploadedFile = { id: string; originalName: string }

type FilePickerProps = {
  label: string
  businessType: AllowedFileType
  accept: string
  multiple?: boolean
  value: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
}

export function FilePicker({ label, businessType, accept, multiple, value, onChange }: FilePickerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [filePickerError, setFilePickerError] = useState<string | null>(null)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFilePickerError(null);

    try {
      const uploaded = await Promise.all(
        Array.from(files).map((f) => uploadFile(f, businessType))
      )

      const errors = uploaded.filter((res): res is { error: string } => 'error' in res);
      if (errors.length > 0) {
        console.log("Ошибки errors:", errors)
        setFilePickerError(errors[0].error);
        return;
      }

      const successFiles = uploaded.filter((res): res is { id: string; originalName: string } => !('error' in res));
      const next = multiple ? [...value, ...successFiles] : successFiles.slice(0, 1)
      onChange(next)
    } catch (error) {
      console.error(`Ошибка загрузки файлов: ${error}`)
      setFilePickerError("Ошибка загрузки файлов")
    } finally {
      setIsUploading(false)
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
        <label htmlFor={businessType} className="text-sm font-medium text-foreground">{label}</label>
        <Input id={businessType}
               type="file"
               accept={businessType === "image" ? "image/*" : "audio/*"}
               disabled={isUploading}
               onChange={handleChange}
               multiple={multiple} />
        <div className="flex flex-col gap-2">
            {value.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 border rounded-md">
                    {/* Имя файла со ссылкой */}
                    <a href={`/api/files/${file.id}`}
                        className="text-blue-600 hover:underline truncate max-w-[200px]">
                        {file.originalName}
                    </a>

                    {/* Блок с кнопками */}
                    <div className="flex items-center gap-2">
                        {/* Кнопка скачивания */}
                        <a href={`/api/files/${file.id}`}
                            download={file.originalName}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                            Скачать
                        </a>

                        {/* Кнопка удаления */}
                        <button type="button"
                                onClick={() => {
                                            const currentFiles = value.filter((f) => f.id !== file.id);
                                            onChange(currentFiles);
                                                }}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">
                            Удалить
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {filePickerError && (
            <p className="text-sm text-destructive">
                {filePickerError}
            </p>
        )}
    </div>
  )
}
