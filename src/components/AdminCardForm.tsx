"use client"

import { useActionState, useState } from "react";
import { wordCardFormAction } from "@/actions/actions";
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ArrayFieldInput, { ArrayFieldItem } from "@/components/ArrayFieldInput";
import { getWordTranscription, getWordTranslations } from "@/actions/actions_translate";
import { enrichWordCard } from "@/actions/actions_yagpt";

type Props = {
  mode: "create" | "edit";
  card?: WordCard & {topics: string[]};
  allTopics?: string[];
};

const AVAILABLE_PARTS_OF_SPEECH = Object.values(partOfSpeech);

export default function AdminCardForm({ card, mode, allTopics }: Props) {
    const [state, formAction, isPending] = useActionState(wordCardFormAction, null);

    const isEditMode = mode === "edit";

    const [transcription, setTranscription] = useState<string>(card?.transcription ?? "");
    const [translation, setTranslation] = useState<ArrayFieldItem[]>(() => 
                                                card?.translation && card.translation.length > 0
                                                    ? card.translation.map((val) => ({ id: crypto.randomUUID(), value: val }))
                                                    : [{ id: crypto.randomUUID(), value: "" }]
    );
    const [meanings, setMeanings] = useState<ArrayFieldItem[]>(() => 
                                            card?.meaning && card.meaning.length > 0
                                                ? card.meaning.map((val) => ({ id: crypto.randomUUID(), value: val }))
                                                : [{ id: crypto.randomUUID(), value: "" }]
    );
    const [examples, setExamples] = useState<ArrayFieldItem[]>(() => 
                                            card?.examples && card.examples.length > 0
                                                ? card.examples.map((val) => ({ id: crypto.randomUUID(), value: val }))
                                                : [{ id: crypto.randomUUID(), value: "" }]
                                        );
    const [topics, setTopics] = useState<string[]>(card?.topics ?? []);
    const [autoFillError, setAutoFillError] = useState<string | null>(null);

    const [selectedParts, setSelectedParts] = useState<partOfSpeech[]>(card?.partsOfSpeech ?? []);

    
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

            if (transcription) {
                setTranscription(transcription);
            }

            if (translations && translations.length > 0) {
                const formattedTranslations = translations.map((text) => ({
                    id: crypto.randomUUID(),
                    value: text
                }));
                setTranslation(formattedTranslations);
            }

        } catch (error) {
            console.error("Ошибка при автозаполнении:", error instanceof Error ? error.message : "");
        }
    };

    const handleAutoFillOtherFields = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setAutoFillError(null);

        const form = e.currentTarget.form;
        if (!form) return;

        const wordInput = form.elements.namedItem("word") as HTMLInputElement | null;
        const wordValue = wordInput?.value?.trim();

        if (!wordValue) {
            alert("Сначала введите слово");
            return;
        }

        try {
            const otherFields = await enrichWordCard(wordValue);
            
            if (otherFields.meanings && otherFields.meanings.length > 0) {
                const formattedMeanings = otherFields.meanings.map((text) => ({
                    id: crypto.randomUUID(),
                    value: text
                }));
                setMeanings(formattedMeanings);
            }

            if (otherFields.examples && otherFields.examples.length > 0) {
                const formattedExamples = otherFields.examples.map((text) => ({
                    id: crypto.randomUUID(),
                    value: text
                }));
                setExamples(formattedExamples);
            }

            if (otherFields.topics && otherFields.topics.length > 0) {
                setTopics(otherFields.topics);
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
                           value={transcription}
                           onChange={(e) => setTranscription(e.target.value)}
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
                <ArrayFieldInput label="Перевод"
                                 name="translation"
                                 values={translation}
                                 onChange={setTranslation}
                                 placeholder="Перевод"
                                 disabled={isPending} />                

                {/* Значение */}
                <ArrayFieldInput label="Значение"
                                 name="meaning"
                                 values={meanings}
                                 onChange={setMeanings}
                                 placeholder="Значение"
                                 disabled={isPending} />

                {/* Примеры */}
                <ArrayFieldInput label="Примеры"
                                 name="example"
                                 values={examples}
                                 onChange={setExamples}
                                 placeholder="Пример"
                                 disabled={isPending} />

                {/* Топики */}
                <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">Топики</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {allTopics?.map((topic) => (
                            <div key={topic} className="flex items-center gap-2">
                                <Checkbox
                                    id={`topic-${topic}`}
                                    name="topic"
                                    value={topic}
                                    checked={topics.includes(topic)}
                                    disabled={isPending}
                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setTopics((prev) => [...prev, topic]);
                                                        } else {
                                                            setTopics((prev) => prev.filter((t) => t !== topic));
                                                        }
                                                    }} />
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
    );
}
