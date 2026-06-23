"use client"

import { useActionState, useState } from "react";
import { wordCardFormAction } from "@/actions/actions";
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AddArrayFieldButton from "@/components/AddArrayFieldButton";
import DeleteArrayFieldButton from "@/components/DeleteArrayFieldButton";

type Props = {
  mode: "create" | "edit";
  card?: WordCard;
};

const AVAILABLE_PARTS_OF_SPEECH = Object.values(partOfSpeech);

export default function AdminCardForm({ card, mode }: Props) {
    const [state, formAction, isPending] = useActionState(wordCardFormAction, null);

    const isEditMode = mode === "edit";

    const [translationCount, setTranslationCount] = useState(() => card?.translation?.length || 1);
    const [meaningCount, setMeaningCount] = useState(() => card?.meaning?.length || 1);
    const [exampleCount, setExampleCount] = useState(() => card?.examples?.length || 1);

    const [selectedParts, setSelectedParts] = useState<partOfSpeech[]>(card?.partsOfSpeech ?? []);

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
                    <Input id="word" name="word"
                           defaultValue={card?.word ?? ""}
                           placeholder="например, ephemeral"
                           required disabled={isPending} />
                </div>

                {/* Транскрипция */}
                <div className="space-y-1.5">
                    <label htmlFor="transcription" className="text-sm font-medium text-foreground">Транскрипция</label>
                    <Input id="transcription" name="transcription"
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
                        <AddArrayFieldButton onClick={() => setTranslationCount((n) => n + 1)} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: translationCount }, (_, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input name="translation"
                                       defaultValue={card?.translation?.[index] ?? ""}
                                       placeholder={`Вариант перевода #${index + 1}`}
                                       disabled={isPending} />
                                <DeleteArrayFieldButton onClick={() => setTranslationCount((n) => Math.max(1, n - 1))} disabled={isPending} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Значение */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-foreground">Значение</div>
                        <AddArrayFieldButton onClick={() => setMeaningCount((n) => n + 1)} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: meaningCount }, (_, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input name="meaning"
                                       defaultValue={card?.meaning?.[index] ?? ""}
                                       placeholder={`Значение #${index + 1}`}
                                       disabled={isPending} />
                                <DeleteArrayFieldButton onClick={() => setMeaningCount((n) => Math.max(1, n - 1))} disabled={isPending} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Примеры */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-foreground">Примеры</div>
                        <AddArrayFieldButton onClick={() => setExampleCount((n) => n + 1)} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: exampleCount }, (_, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <Input name="example"
                                       defaultValue={card?.examples?.[index] ?? ""}
                                       placeholder={`Пример применения #${index + 1}`}
                                       disabled={isPending} />
                                <DeleteArrayFieldButton onClick={() => setExampleCount((n) => Math.max(1, n - 1))} disabled={isPending} />
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
