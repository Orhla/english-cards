"use client"

import { useActionState, useRef, useState } from "react";
import { wordCardFormAction } from "@/actions/actions";
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AddArrayFieldButton from "@/components/AddArrayFieldButton";
import DeleteArrayFieldButton from "@/components/DeleteArrayFieldButton";
import { getWordTranscription, getWordTranslations } from "@/actions/actions_translate";
import { enrichWordCard } from "@/actions/actions_yagpt";

type Props = {
  mode: "create" | "edit";
  card?: WordCard;
  allTopics?: string[];
};

const AVAILABLE_PARTS_OF_SPEECH = Object.values(partOfSpeech);

export default function AdminCardForm({ card, mode, allTopics }: Props) {
    const [state, formAction, isPending] = useActionState(wordCardFormAction, null);

    const isEditMode = mode === "edit";

    const [translation, setTranslation] = useState<string[]>(card?.translation ?? [""]);
    const [meanings, setMeanings] = useState<string[]>(card?.meaning ?? [""]);
    const [examples, setExamples] = useState<string[]>(card?.examples ?? [""]);
    const [autoFillError, setAutoFillError] = useState<string | null>(null);

    const [selectedParts, setSelectedParts] = useState<partOfSpeech[]>(card?.partsOfSpeech ?? []);
    
    const transcriptionRef = useRef<HTMLInputElement>(null);
    

    const handleAutoFill = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        const form = e.currentTarget.form;
        if (!form) return;

        const wordInput = form.elements.namedItem("word") as HTMLInputElement | null;
        const wordValue = wordInput?.value?.trim();

        if (!wordValue) {
            alert("Сначала введите слово");
            return;
        }

        try {
            const [transcription, translations] = await Promise.all([
                getWordTranscription(wordValue),
                getWordTranslations(wordValue)
            ]);

            if (transcriptionRef.current) {
                transcriptionRef.current.value = transcription;
            }
            
            if (translations && translations.length > 0) {
                setTranslation(translations);
            }

        } catch (error) {
            console.error("Ошибка при автозаполнении:", error instanceof Error ? error.message : "");
        }
    };

    const handleAutoFillOtherFields = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        const form = e.currentTarget.form;
        if (!form) return;

        const wordInput = form.elements.namedItem("word") as HTMLInputElement | null;
        const wordValue = wordInput?.value?.trim();

        if (!wordValue) {
            alert("Сначала введите слово");
            return;
        }

        try {
            console.log("1. Клиент: Отправляем слово в Server Action:", wordValue);
            const otherFields = await enrichWordCard(wordValue);
            console.log("3. Клиент: Получили ответ от Server Action:", otherFields);
            
            if (otherFields.meanings && otherFields.meanings.length > 0) {
                setMeanings(otherFields.meanings);
            }

            if (otherFields.examples && otherFields.examples.length > 0) {
                setExamples(otherFields.examples);
            }

        } catch (error) {
            setAutoFillError(error instanceof Error ? error.message : "Ошибка при автозаполнении");
            console.error("Ошибка при автозаполнении:", error instanceof Error ? error.message : "");
        }
    };

    return (
        <Card className="max-w-[600px] shadow-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">
                    {isEditMode ? "Редактирование карточки" : "Создание новой карточки"}
                </CardTitle>
            </CardHeader>

            <form action={formAction}>
                {isEditMode && <input type="hidden" name="id" value={card?.id} />}

                <CardContent className="space-y-6">

                {/* Слово */}
                <div className="space-y-1.5">
                    <label htmlFor="word" className="text-sm font-medium text-foreground">Слово</label>
                    <div className="flex items-start gap-2">
                        <Input id="word" name="word"
                            defaultValue={card?.word ?? ""}
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
                           name="transcription"
                           ref={transcriptionRef}
                           defaultValue={card?.transcription ?? ""}
                           placeholder="/ɪˈfemərəl/"
                           disabled={isPending} />
                </div>

                {/* Аудиофайл */}
                <div className="space-y-1.5">
                    <label htmlFor="audio" className="text-sm font-medium text-foreground">Аудиофайл</label>
                    <Input id="audio" name="audio"
                           type="file"
                           accept="audio/*"
                           disabled={isPending} />
                </div>

                {/* Части речи */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">Части речи</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {AVAILABLE_PARTS_OF_SPEECH.map((pos) => (
                            <div key={pos} className="flex items-center gap-2">
                                <Checkbox
                                    id={`pos-${pos}`}
                                    name="partsOfSpeech"
                                    value={pos}
                                    checked={selectedParts.includes(pos)}
                                    disabled={isPending}
                                    onCheckedChange={(checked) =>
                                        setSelectedParts((prev) =>
                                            checked ? [...prev, pos] : prev.filter((p) => p !== pos)
                                        )
                                    } />
                                <label htmlFor={`pos-${pos}`}
                                       className="text-sm font-normal text-foreground/90 cursor-pointer select-none">
                                    {pos}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Перевод */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-foreground">Перевод</div>
                        <AddArrayFieldButton onClick={() => setTranslation((prev) => [...prev, ""])} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {translation.map((trans, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input 
                                    name="translation"
                                    value={trans}
                                    onChange={(e) => {
                                        const updated = [...translation];
                                        updated[index] = e.target.value;
                                        setTranslation(updated);
                                    }}
                                    placeholder={`Значение #${index + 1}`}
                                    disabled={isPending} />
                                <DeleteArrayFieldButton disabled={isPending || translation.length <= 1}
                                                        onClick={() => {
                                                            if (translation.length > 1) {
                                                                setTranslation((prev) => prev.filter((_, i) => i !== index));
                                                            }
                                                        }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Значение */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-foreground">Значение</div>
                        <AddArrayFieldButton onClick={() => setMeanings((prev) => [...prev, ""])} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {meanings.map((meaning, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input 
                                    name="meaning"
                                    value={meaning}
                                    onChange={(e) => {
                                        const updated = [...meanings];
                                        updated[index] = e.target.value;
                                        setMeanings(updated);
                                    }}
                                    placeholder={`Значение #${index + 1}`}
                                    disabled={isPending} />
                                <DeleteArrayFieldButton disabled={isPending || meanings.length <= 1}
                                                        onClick={() => {
                                                            if (meanings.length > 1) {
                                                                setMeanings((prev) => prev.filter((_, i) => i !== index));
                                                            }
                                                        }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Примеры */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-foreground">Примеры</div>
                        <AddArrayFieldButton onClick={() => setExamples((prev) => [...prev, ""])} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {examples.map((example, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input 
                                    name="example"
                                    value={example}
                                    onChange={(e) => {
                                        const updated = [...examples];
                                        updated[index] = e.target.value;
                                        setExamples(updated);
                                    }}
                                    placeholder={`Значение #${index + 1}`}
                                    disabled={isPending} />
                                <DeleteArrayFieldButton disabled={isPending || examples.length <= 1}
                                                        onClick={() => {
                                                            if (examples.length > 1) {
                                                                setExamples((prev) => prev.filter((_, i) => i !== index));
                                                            }
                                                        }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Топики */}
                {/* <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">Части речи</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {allTopics?.map((topic) => (
                            <div key={topic} className="flex items-center gap-2">
                                <Checkbox
                                    id={`topic-${topic}`}
                                    name="topics"
                                    value={topic}
                                    checked={selectedParts.includes(topic)}
                                    disabled={isPending}
                                    onCheckedChange={(checked) =>
                                        setSelectedParts((prev) =>
                                            checked ? [...prev, topic] : prev.filter((p) => p !== topic)
                                        )
                                    } />
                                <label htmlFor={`topic-${topic}`}
                                       className="text-sm font-normal text-foreground/90 cursor-pointer select-none">
                                    {topic}
                                </label>
                            </div>
                        ))}
                    </div>
                </div> */}

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
    );
}
