"use server"

import { WordCardEnrichment, wordCardEnrichmentAgent } from "@/lib/yandex/agents/wordCardEnrichmentAgent";

export async function enrichWordCard(word: string): Promise<WordCardEnrichment> {
    console.log("2. СЕРВЕР: Функция enrichment запустилась для слова:", word);
    
    const enrichedWordStatus = await wordCardEnrichmentAgent(word);
    if (!enrichedWordStatus.success) {
        throw new Error(enrichedWordStatus.message);
    }
    console.log(enrichedWordStatus);

    return enrichedWordStatus.data;
}