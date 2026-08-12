"use server"

import { logger } from "@/lib/logger";
import { WordCardEnrichment, wordCardEnrichmentAgent } from "@/lib/yandex/agents/wordCardEnrichmentAgent";

export async function enrichWordCard(word: string): Promise<WordCardEnrichment> {
    
    const enrichedWordStatus = await wordCardEnrichmentAgent(word);
    if (!enrichedWordStatus.success) {
        throw new Error(enrichedWordStatus.message);
    }
    logger.debug("Результат выполнения enrichedWordStatus", {"component": "enrichWordCard", "data": enrichedWordStatus })
    
    return enrichedWordStatus.data;
}