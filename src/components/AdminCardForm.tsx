"use client"

import { startTransition, useActionState, useState } from "react"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { generateWordAudio, uploadFile, wordCardFormAction, WordCardFormPayload } from "@/actions/actions"
import { WordCard, partOfSpeech } from "@/generated/prisma/browser"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ArrayFieldInput from "@/components/ArrayFieldInput"
import { getWordTranscription, getWordTranslations } from "@/actions/actions_translate"
import { enrichWordCard } from "@/actions/actions_yagpt"

const AVAILABLE_PARTS_OF_SPEECH = Object.values(partOfSpeech)

const FormSchema = z.object({
    word: z.string().min(1, "Введите слово"),
    transcription: z.string().optional(),
    audio: z.any().optional(),
    image: z.any().optional(),
    partsOfSpeech: z.array(z.enum(partOfSpeech)),
    translation: z.array(z.object({ value: z.string() })),
    meaning: z.array(z.object({ value: z.string() })),
    example: z.array(z.object({ value: z.string() })),
    topics: z.array(z.string()),
})

type FormValues = z.infer<typeof FormSchema>

type Props = {
    mode: "create" | "edit"
    card?: WordCard & { topics: string[] }
    allTopics?: string[]
}

export default function AdminCardForm({ card, mode, allTopics }: Props) {
    const [state, formAction, isPending] = useActionState(wordCardFormAction, null)

    const isEditMode = mode === "edit"

    const methods = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            word: card?.word ?? "",
            transcription: card?.transcription ?? "",
            partsOfSpeech: card?.partsOfSpeech ?? [],
            translation: card?.translation?.length
                ? card.translation.map((v) => ({ value: v }))
                : [{ value: "" }],
            meaning: card?.meaning?.length
                ? card.meaning.map((v) => ({ value: v }))
                : [{ value: "" }],
            example: card?.examples?.length
                ? card.examples.map((v) => ({ value: v }))
                : [{ value: "" }],
            topics: card?.topics ?? [],
        },
    })

    const { register, control, handleSubmit, setValue, getValues, watch } = methods

    const translation = useFieldArray({ control, name: "translation" })
    const meaning = useFieldArray({ control, name: "meaning" })
    const example = useFieldArray({ control, name: "example" })

    const selectedParts = watch("partsOfSpeech")
    const selectedTopics = watch("topics")

    const [autoFillError, setAutoFillError] = useState<string | null>(null)
    const [audioAutoFillError, setAudioAutoFillError] = useState<string | null>(null)
    
    const [isUploadingAudio, setIsUploadingAudio] = useState(false);
    const [audioUploadError, setAudioUploadError] = useState<string | null>(null);

    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null)

    const handleAutoFill = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        const wordValue = getValues("word").trim()
        if (!wordValue) { alert("Сначала введите слово"); return }

        try {
            const [transcription, translations] = await Promise.all([
                getWordTranscription(wordValue),
                getWordTranslations(wordValue),
            ])
            if (transcription) setValue("transcription", transcription)
            if (translations?.length) {
                setValue("translation", translations.map((v) => ({ value: v })))
            }
        } catch (error) {
            console.error("Ошибка при автозаполнении:", error instanceof Error ? error.message : "")
        }
    }

    const handleAutoFillOtherFields = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setAutoFillError(null)
        const wordValue = getValues("word").trim()
        if (!wordValue) { alert("Сначала введите слово"); return }

        try {
            const otherFields = await enrichWordCard(wordValue)
            if (otherFields.meanings?.length) {
                setValue("meaning", otherFields.meanings.map((v) => ({ value: v })))
            }
            if (otherFields.examples?.length) {
                setValue("example", otherFields.examples.map((v) => ({ value: v })))
            }
            if (otherFields.topics?.length) {
                setValue("topics", otherFields.topics)
            }
        } catch (error) {
            setAutoFillError(error instanceof Error ? error.message : "Ошибка при автозаполнении")
            console.error("Ошибка при автозаполнении:", error instanceof Error ? error.message : "")
        }
    }

    const handleAudioAutofill = async(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setAudioAutoFillError(null);
        const wordValue = getValues("word").trim()
        if (!wordValue) { alert("Сначала введите слово"); return }

        try {
            const audioFilePath = await generateWordAudio(wordValue);
            setAudioAutoFillError("Успех!");
        } catch (error) {
            setAudioAutoFillError(error instanceof Error ? error.message : "Ошибка при автогенерации аудио")
            console.error("Ошибка при автогенерации аудио:", error instanceof Error ? error.message : "")
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, businessType: "audio" | "image") => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (businessType === "audio") {
            setIsUploadingAudio(true);
            setAudioUploadError(null);
        }

        if (businessType === "image") {
            setIsUploadingImage(true);
            setImageUploadError(null);
        }       

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                const serverFile = await uploadFile(file, businessType);
                return {
                    fileId: serverFile.id,
                    originalName: serverFile.originalName,
                    businessType: businessType
                };
            });

            const newUploadedFiles = await Promise.all(uploadPromises);
            const currentFiles = getValues(businessType) || [];
            const uploadedFiles = [...currentFiles, ...newUploadedFiles];

            setValue(businessType, uploadedFiles);
        } catch (error) {
            console.error("Ошибка при загрузке файла", error instanceof Error ? error.message : error);

            if (businessType === "audio") {
                setAudioUploadError(error instanceof Error ? error.message : "Ошибка при загрузке аудио");
            }
            if (businessType === "image") {
                setImageUploadError(error instanceof Error ? error.message : "Ошибка при загрузке изображения");
            }
        } finally {
            if (businessType === "audio") {
                setIsUploadingAudio(false);
            }
            if (businessType === "image") {
                setIsUploadingImage(false);
            }
        }
    }

    const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await handleFileChange(e, "audio");
    }

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await handleFileChange(e, "image");
    }

    const onSubmit = handleSubmit((data) => {
        const payload: WordCardFormPayload = {
            id: isEditMode ? String(card?.id) : undefined,
            word: data.word,
            transcription: data.transcription ?? "",
            translation: data.translation.map(i => i.value).filter(Boolean),
            meaning: data.meaning.map(i => i.value).filter(Boolean),
            example: data.example.map(i => i.value).filter(Boolean),
            partsOfSpeech: data.partsOfSpeech,
            topics: data.topics,
            audio: (data.audio as FileList | undefined),
            image: (data.image as FileList | undefined),
        }
        startTransition(() => formAction(payload))
    })

    return (
        <FormProvider {...methods}>
            <Card className="max-w-[600px] shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {isEditMode ? "Редактирование карточки" : "Создание новой карточки"}
                    </CardTitle>
                </CardHeader>

                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-6">

                        {/* Слово */}
                        <div className="space-y-1.5">
                            <label htmlFor="word" className="text-sm font-medium text-foreground">Слово</label>
                            <div className="flex items-start gap-2">
                                <Input id="word" {...register("word")}
                                    placeholder="например, ephemeral"
                                    required disabled={isPending} />
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button type="button"
                                        disabled={isPending}
                                        className="px-2 py-1 text-xs font-medium border rounded bg-background hover:bg-accent text-accent-foreground disabled:opacity-50"
                                        onClick={handleAutoFill}>
                                        Заполнить транскрипцию и перевод
                                    </button>
                                    <button type="button"
                                        disabled={isPending}
                                        className="px-2 py-1 text-xs font-medium border rounded bg-background hover:bg-accent text-accent-foreground disabled:opacity-50"
                                        onClick={handleAutoFillOtherFields}>
                                        Заполнить остальные поля
                                    </button>
                                    {autoFillError && (
                                        <p className="text-sm text-destructive">{autoFillError}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Транскрипция */}
                        <div className="space-y-1.5">
                            <label htmlFor="transcription" className="text-sm font-medium text-foreground">Транскрипция</label>
                            <Input id="transcription"
                                {...register("transcription")}
                                placeholder="/ɪˈfemərəl/"
                                disabled={isPending} />
                        </div>

                        {/* Аудиофайл */}
                        <div className="space-y-1.5">
                            <label htmlFor="audio" className="text-sm font-medium text-foreground">Аудиофайл</label>

                            <div className="flex items-start gap-2">
                                <Input id="audio" {...register("audio")}
                                    type="file"
                                    accept="audio/*"
                                    disabled={isPending || isUploadingAudio}
                                    onChange={handleAudioChange}
                                    multiple />

                                {isEditMode && (
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button type="button"
                                                disabled={isPending}
                                                className="px-2 py-1 text-xs font-medium border rounded bg-background hover:bg-accent text-accent-foreground disabled:opacity-50 transition-colors"
                                                onClick={handleAudioAutofill}>
                                            Сгенерировать аудио
                                        </button>
                                    </div> )}
                            </div>

                            {audioUploadError && (
                                <p className="text-sm text-destructive">
                                    {audioUploadError}
                                </p>
                            )}

                            {isEditMode && audioAutoFillError && (
                                <p className="text-sm text-destructive">
                                    {audioAutoFillError}
                                </p>
                            )}
                        </div>

                        {/* Изображение */}
                        <div className="space-y-1.5">
                            <label htmlFor="image" className="text-sm font-medium text-foreground">Изображение</label>
                            <Input id="image" {...register("image")}
                                type="file"
                                accept="image/*"
                                disabled={isPending || isUploadingImage}
                                onChange={handleImageChange}
                                multiple />

                            {imageUploadError && (
                                <p className="text-sm text-destructive">
                                    {imageUploadError}
                                </p>
                            )}
                        </div>

                        {/* Части речи */}
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-foreground">Части речи</div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {AVAILABLE_PARTS_OF_SPEECH.map((pos) => (
                                    <div key={pos} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`pos-${pos}`}
                                            checked={selectedParts.includes(pos)}
                                            disabled={isPending}
                                            onCheckedChange={(checked) =>
                                                setValue("partsOfSpeech", checked
                                                    ? [...selectedParts, pos]
                                                    : selectedParts.filter((p) => p !== pos)
                                                )
                                            }
                                        />
                                        <label htmlFor={`pos-${pos}`}
                                            className="text-sm font-normal text-foreground/90 cursor-pointer select-none">
                                            {pos}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Перевод */}
                        <ArrayFieldInput label="Перевод" name="translation"
                            fields={translation.fields}
                            onAdd={() => translation.append({ value: "" })}
                            onRemove={translation.remove}
                            placeholder="Перевод" disabled={isPending} />

                        {/* Значение */}
                        <ArrayFieldInput label="Значение" name="meaning"
                            fields={meaning.fields}
                            onAdd={() => meaning.append({ value: "" })}
                            onRemove={meaning.remove}
                            placeholder="Значение" disabled={isPending} />

                        {/* Примеры */}
                        <ArrayFieldInput label="Примеры" name="example"
                            fields={example.fields}
                            onAdd={() => example.append({ value: "" })}
                            onRemove={example.remove}
                            placeholder="Пример" disabled={isPending} />

                        {/* Топики */}
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-foreground">Топики</div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {allTopics?.map((topic) => (
                                    <div key={topic} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`topic-${topic}`}
                                            checked={selectedTopics.includes(topic)}
                                            disabled={isPending}
                                            onCheckedChange={(checked) =>
                                                setValue("topics", checked
                                                    ? [...selectedTopics, topic]
                                                    : selectedTopics.filter((t) => t !== topic)
                                                )
                                            }
                                        />
                                        <label htmlFor={`topic-${topic}`}
                                            className="text-sm font-normal text-foreground/90 cursor-pointer select-none">
                                            {topic}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {state?.error && (
                            <p className="text-sm text-destructive">{state.error}</p>
                        )}

                    </CardContent>

                    <CardFooter className="border-t bg-muted/30 pt-4 flex gap-3 justify-end">
                        <Button type="submit" className="gap-2" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Сохранение...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEditMode ? "Сохранить изменения" : "Создать слово"}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </FormProvider>
    )
}
