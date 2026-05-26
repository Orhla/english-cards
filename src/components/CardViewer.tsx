"use client"

import { WordCard } from "@/generated/prisma/browser";
// вот тут есть плюсы и минусы. Плюсы - мы переиспользуем "призма модель" не надо делать промежуточные типы. Минусы - мы привязаны к призма модели. Любое изменение в модели дойдет до компонента.
import { useState } from "react";
import ArrowButton from "@/components/ArrowButton";

type Props = {
    cards: WordCard[]
}

export default function CardViewer({cards}: Props) {
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
    // похоже на какой-то костыль. надо его избегать. Давай попробуем вместе.
    // const [skipAnimation, setSkipAnimation] = useState<boolean>(false);

    const changeCard = (nextIndex: number) => {
        // setSkipAnimation(true);
        setIsFlipped(false);
        setCurrentCardIndex(nextIndex);

        // setTimeout(() => {
        //     первое правило реакта - если мы ставим странный таймаут - значит что-то идет на так.
            // setSkipAnimation(false);
        // }, 50);
    }

    const handlePrev = () => {
        changeCard((currentCardIndex - 1 + cards.length) % cards.length);
    };

    const handleNext = () => {
        changeCard((currentCardIndex + 1) % cards.length);
    };

    if (!cards || cards.length === 0) {
        return <div className="text-gray-500">Список карточек пуст</div>;
    }

    const card = cards[currentCardIndex];

    return (
      //   тут не должно быть мейн больше. Мейн где-то в пейдж или лучше в лейаут.
      <main className="flex items-center justify-center gap-6 w-full max-w-[550px]">
        <ArrowButton direction="left"
                     onClick={handlePrev} />
        <div
          className="w-full max-w-[360px] h-[260px] [perspective:1000px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div key={card.id}
               className={`relative w-full h-full transform-3d transition-transform duration-500'
              ${isFlipped ? 'transform-[rotateY(180deg)]' : ''}`}>

            {/* ЛИЦЕВАЯ СТОРОНА */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col justify-between p-6">
              {/* Верхняя панель: Части речи */}
              <div className="flex flex-wrap gap-1.5">
                {card.partsOfSpeech.map((pos) => (
                  <span key={pos} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                    {pos}
                  </span>
                ))}
              </div>

              {/* Центр: Слово и Транскрипция */}
              <div className="text-center my-auto">
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.word}</h3>
                <p className="text-sm font-mono text-indigo-500 mt-1">[{card.transcription}]</p>
              </div>

              {/* Низ: Подсказка */}
              <p className="text-center text-xs text-gray-400 font-medium">Нажмите, чтобы перевернуть</p>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-indigo-600 text-white rounded-2xl shadow-md flex flex-col justify-between p-6 transform-3d transition-transform transform-[rotateY(180deg)] duration-500 overflow-y-auto">
              <div>
                {/* Переводы (выводим через запятую) */}
                <h4 className="text-xl font-bold tracking-wide border-b border-indigo-500/50 pb-2">
                  {card.translation.join(', ')}
                </h4>

                {/* Толкование / Значения (если есть) */}
                {card.meaning.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">Значение:</p>
                    <ul className="list-disc list-inside text-xs text-indigo-100 space-y-0.5">
                      {/*  индекс как ключ - не самая лучшая привычка, мы обсуждали уже.*/}
                      {card.meaning.map((m, idx) => <li key={idx}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {/* Примеры предложений (если есть) */}
                {card.examples.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">Примеры:</p>
                    <ul className="text-xs italic text-white/90 space-y-1 pl-1 border-l-2 border-indigo-400">
                      {/*  индекс-ключ */}
                      {card.examples.map((ex, idx) => <li key={idx}>“{ex}”</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Низ: Иконка или текст возврата */}
              <p className="text-center text-[10px] text-indigo-300 font-medium mt-4">Кликните для возврата</p>
            </div>

          </div>
        </div>

        <ArrowButton direction="right"
                     onClick={handleNext} />
      </main>
  );
}
