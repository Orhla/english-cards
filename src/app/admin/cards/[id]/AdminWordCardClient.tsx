"use client";

import { updateWordCard } from "@/actions/actions";
import { WordCard } from "@/generated/prisma/client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState} from "react";

type Props = {
  card: WordCard;
}

export default function WordCardClient({ card }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, setIsPending] = useState<boolean>(false);
  const [formData, setFormData] = useState<WordCard>(card);
  
  const mode = searchParams.get("mode") === "edit" ? "edit" : "view";

  const changeMode = (newMode: "view" | "edit") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", newMode);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
        const result = await updateWordCard(formData);       
        if (result.success) {
            changeMode("view");
        }
    } catch (error) {
        console.error(`Произошла ошибка: ${error instanceof Error ? error.message : error}`);
    } finally {
        setIsPending(false);
    }
    };

  if (mode === "view") {
    return (
        <div className="p-5 max-w-[600px]">
        <h1 className="text-3xl font-bold mb-2.5">
            {card.word} 
            {card.transcription && <span className="text-slate-500 font-normal ml-2.5">[{card.transcription}]</span>}
        </h1>
        
        <p className="mb-2"><strong>Часть речи:</strong> {card.partsOfSpeech?.join("| ")}</p>
        <p className="mb-4"><strong>Перевод:</strong> {card.translation?.join("| ")}</p>
        
        <h3 className="text-xl font-semibold mt-4 mb-2">Значения:</h3>
        <ul className="list-disc pl-5 space-y-1">
            {card.meaning.map((m) => <li key={m}>{m}</li>)}
        </ul>

        <h3 className="text-xl font-semibold mt-4 mb-2">Примеры:</h3>
        <ul className="list-disc pl-5 space-y-1">
            {card.examples.map((ex) => <li key={ex}>{ex}</li>)}
        </ul>

        <button 
            onClick={() => changeMode("edit")}
            className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
            Редактировать
        </button>
        </div>
    );
  }

  return (
    <div className="p-5 max-w-[600px]">
        <h1 className="text-2xl font-bold mb-5">Редактирование карточки</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <label className="flex flex-col gap-1.5">
            <span className="font-medium">Слово:</span>
            <input 
                type="text" 
                value={formData.word} 
                onChange={(e) => setFormData({ ...formData, word: e.target.value })} 
                className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
        </label>

        <label className="flex flex-col gap-1.5">
            <span className="font-medium">Транскрипция:</span>
            <input 
                type="text" 
                value={formData.transcription} 
                onChange={(e) => setFormData({ ...formData, transcription: e.target.value })} 
                className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
        </label>

        <label className="flex flex-col gap-1.5">
            <span className="font-medium">Переводы:</span>
            <input 
                type="text" 
                value={formData.translation.join("| ")} 
                onChange={(e) => setFormData({ ...formData, translation: e.target.value.split("|").map(t => t.trim()) })} 
                className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
        </label>

        <label className="flex flex-col gap-1.5">
            <span className="font-medium">Значения:</span>
            <input 
                type="text" 
                value={formData.meaning.join("| ")} 
                onChange={(e) => setFormData({ ...formData, meaning: e.target.value.split("|").map(m => m.trim()) })} 
                className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
        </label>

        <label className="flex flex-col gap-1.5">
            <span className="font-medium">Примеры:</span>
            <input 
                type="text" 
                value={formData.examples.join("| ")} 
                onChange={(e) => setFormData({ ...formData, examples: e.target.value.split("|").map(ex => ex.trim()) })} 
                className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
        </label>

        <div className="flex gap-2.5 mt-2.5">
            <button 
                type="submit" 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
                Сохранить
            </button>
            <button 
                type="button" 
                onClick={() => { setFormData(card); changeMode("view"); }}
                disabled={isPending}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
            >
                Отмена  
            </button>
        </div>
        </form>
    </div>
  );
}