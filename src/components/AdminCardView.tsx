"use client"

import { WordCard } from "@/generated/prisma/client";
import { Edit2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Props = {
  card: WordCard;
}

export default function AdminCardView({ card }: Props) {

    return (
        <Card className="max-w-[600px] shadow-sm">
        {/* Заголовок карточки со словом и транскрипцией */}
        <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">
                {card.word}
                {card.transcription && (
                    <span className="text-muted-foreground font-normal text-xl ml-3">
                        {card.transcription}
                    </span>
                )}
            </CardTitle>
            {card.partsOfSpeech && card.partsOfSpeech.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {card.partsOfSpeech.map((pos, idx) => (
                    <Badge key={idx} variant="secondary" className="font-normal">
                        {pos}
                    </Badge>
                ))}
            </div>)}
        </CardHeader>

        {/* Основной контент */}
        <CardContent className="space-y-6">
            {/* Перевод */}
            <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Перевод</h4>
                <p className="text-lg font-medium text-foreground">
                    {card.translation?.join(", ")}
                </p>
            </div>

            {/* Значения */}
            {card.meaning && card.meaning.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Значения
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
                {card.meaning.map((m, idx) => (
                    <li key={idx} className="leading-relaxed">{m}</li>
                ))}
                </ul>
            </div>
            )}

            {/* Примеры */}
            {card.examples && card.examples.length > 0 && (
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Примеры
                </h4>
                <ul className="list-inside list-none space-y-2 text-sm text-muted-foreground italic">
                {card.examples.map((ex, idx) => (
                    <li key={idx} className="border-l-2 border-muted pl-3 text-foreground/80">
                    «{ex}»
                    </li>
                ))}
                </ul>
            </div>
            )}
        </CardContent>

        {/* Нижняя панель с кнопкой управления */}
        <CardFooter className="border-t bg-muted/30 pt-4">
            <Button variant="outline"
                    className="gap-2 w-full sm:w-auto" asChild>
                <Link href="?mode=edit">
                    <Edit2 className="h-4 w-4" />
                    Редактировать
                </Link>
            </Button>
        </CardFooter>
        </Card>
    );
    }