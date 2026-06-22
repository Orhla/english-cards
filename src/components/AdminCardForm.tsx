"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createWordCard, updateWordCard } from "@/actions/actions";
import { WordCard, partOfSpeech } from "@/generated/prisma/browser";
import { Loader2, Save, X } from "lucide-react";

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

export default function AdminCardForm({ mode, card }: Props) {

    const router = useRouter();
    const isEditMode = mode === "edit";

    const [isPending, setIsPending] = useState<boolean>(false);

    // 1. Плоские стейты для одиночных полей
    const [word, setWord] = useState<string>(card?.word || "");
    const [transcription, setTranscription] = useState<string>(card?.transcription || "");

    // 2. Стейты-массивы для динамических полей (если данных нет, создаем один пустой инпут)
    const [translations, setTranslations] = useState<string[]>(
        card?.translation && card.translation.length > 0 ? card.translation : [""]
    );
    const [meanings, setMeanings] = useState<string[]>(
        card?.meaning && card.meaning.length > 0 ? card.meaning : [""]
    );
    const [examples, setExamples] = useState<string[]>(
        card?.examples && card.examples.length > 0 ? card.examples : [""]
    );
    
    const [partsOfSpeech, setPartsOfSpeech] = useState<partOfSpeech[]>(card?.partsOfSpeech || []);

    const handleCheckboxChange = (pos: partOfSpeech, checked: boolean) => {
        setPartsOfSpeech((prev) =>
            checked ? [...prev, pos] : prev.filter((item) => item !== pos)
        );
    };

    // --- Функции управления динамическими массивами ---
    const handleArrayChange = (
        index: number,
        value: string,
        setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        setter((prev) => prev.map((item, i) => (i === index ? value : item)));
    };

    const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter((prev) => [...prev, ""]);
    };

    const removeField = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter((prev) => {
        if (prev.length <= 1) return [""];
        return prev.filter((_, i) => i !== index);
    })};
        
    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsPending(true);

        const cleanTranslation = translations.map((t) => t.trim()).filter(Boolean);
        const cleanMeaning = meanings.map((m) => m.trim()).filter(Boolean);
        const cleanExamples = examples.map((ex) => ex.trim()).filter(Boolean);

        try {
            let result: { success: boolean; error?: string } | undefined;

            if (isEditMode) {
                if (!card?.id) throw new Error("ID карточки отсутствует при редактировании");

                result = await updateWordCard({
                    id: card.id,
                    word: word.trim(),
                    transcription: transcription.trim() || "",
                    translation: cleanTranslation,
                    meaning: cleanMeaning,
                    examples: cleanExamples,
                    partsOfSpeech,
                });
            } else {
                result = await createWordCard({
                    word: word.trim(),
                    transcription: transcription.trim() || "",
                    translation: cleanTranslation,
                    meaning: cleanMeaning,
                    examples: cleanExamples,
                    partsOfSpeech,
                });
            }

            if (result?.success) {
                if (isEditMode) {
                    router.push(`?mode=view`);
                } else {
                    router.push("/cards");
                }
                router.refresh();
            } else {
                console.error(result?.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Card className="max-w-[600px] shadow-sm">
        <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
                {isEditMode ? "Редактирование карточки" : "Создание новой карточки"}
            </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
            
            {/* Поле: Слово */}
            <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground">Слово</div>
                <Input value={word} 
                       onChange={(e) => setWord(e.target.value)} 
                       placeholder="например, ephemeral" 
                       required
                       disabled={isPending}/>
            </div>

            {/* Поле: Транскрипция */}
            <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground">Транскрипция</div>
                <Input value={transcription} 
                       onChange={(e) => setTranscription(e.target.value)} 
                       placeholder="/ɪˈfemərəl/" 
                       required
                       disabled={isPending}/>
            </div>

            <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Части речи</div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {AVAILABLE_PARTS_OF_SPEECH.map((pos) => {
                        const isChecked = partsOfSpeech.includes(pos);
                        
                        return (
                            <div key={pos} className="flex items-center gap-2">
                                <Checkbox id={`pos-${pos}`}
                                          checked={isChecked}
                                          disabled={isPending}
                                          onCheckedChange={(checked) => handleCheckboxChange(pos, !!checked)}/>
                                <div className="text-sm font-normal text-foreground/90 cursor-pointer select-none"
                                     onClick={() => !isPending && handleCheckboxChange(pos, !isChecked)}>
                                    {pos}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Динамический блок: Перевод */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-foreground">Перевод</div>
                        <AddArrayFieldButton onClick={() => addField(setTranslations)}
                                            disabled={isPending} />
                    </div>
                <div className="flex flex-col gap-2">
                    {translations.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input value={item} 
                                   onChange={(e) => handleArrayChange(index, e.target.value, setTranslations)} 
                                   placeholder={`Вариант перевода #${index + 1}`} 
                                   disabled={isPending}/>
                            <DeleteArrayFieldButton onClick={() => removeField(index, setTranslations)}
                                                    disabled={isPending} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Динамический блок: Значения */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-foreground">Значение</div>
                    <AddArrayFieldButton onClick={() => addField(setMeanings)}
                                        disabled={isPending} />
                </div>
                <div className="flex flex-col gap-2">
                    {meanings.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input 
                                value={item} 
                                onChange={(e) => handleArrayChange(index, e.target.value, setMeanings)} 
                                placeholder={`Значение #${index + 1}`} 
                                disabled={isPending}/>
                            <DeleteArrayFieldButton onClick={() => removeField(index, setMeanings)}
                                                    disabled={isPending} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Динамический блок: Примеры */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-foreground">Примеры</div>
                    <AddArrayFieldButton onClick={() => addField(setExamples)}
                                        disabled={isPending} />
                </div>
                <div className="flex flex-col gap-2">
                    {examples.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <Input 
                                value={item} 
                                onChange={(e) => handleArrayChange(index, e.target.value, setExamples)} 
                                placeholder={`Пример применения #${index + 1}`} 
                                disabled={isPending}/>
                            <DeleteArrayFieldButton onClick={() => removeField(index, setExamples)}
                                                    disabled={isPending}/>
                        </div>
                    ))}
                </div>
            </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/30 pt-4 flex gap-3 justify-end">
            <Button variant="ghost" className="gap-2" asChild disabled={isPending}>
                <Link href={isEditMode ? "?mode=view" : "/cards"}>
                    <X className="h-4 w-4" /> Отмена
                </Link>
            </Button>
            
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