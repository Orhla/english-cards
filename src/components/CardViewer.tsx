"use client"

import { WordCard } from "@/generated/prisma/browser";
// вот тут есть плюсы и минусы. Плюсы - мы переиспользуем "призма модель" не надо делать промежуточные типы. Минусы - мы привязаны к призма модели. Любое изменение в модели дойдет до компонента.
import { useState } from "react";
import ArrowButton from "@/components/ArrowButton";
import ErrorMessage from "@/components/ErrorMessage";
import { Mode } from "@/lib/types";
import WordCardView from "./WordCardView";

type Props = {
    cards: WordCard[],
    mode: Mode
}

export default function CardViewer({cards, mode}: Props) {
    const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);


    const handlePrev = () => {
        setCurrentCardIndex((currentCardIndex - 1 + cards.length) % cards.length);
    };

    const handleNext = () => {
        setCurrentCardIndex((currentCardIndex + 1) % cards.length);
    };

    if (!cards || cards.length === 0) {
      return (
        <ErrorMessage message="Список карточек пуст" />
      )
    }

    const card = cards[currentCardIndex];

    return (
        <div className="flex flex-row items-center justify-center gap-6 w-full">
          <ArrowButton direction="left"
                      onClick={handlePrev} />
          <WordCardView card={card}
                        mode={mode}
                        key={card.id} />
          <ArrowButton direction="right"
                      onClick={handleNext} />
        </div>      
  );
}
