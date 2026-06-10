"use client"

import { useState, useRef, useEffect } from "react";
import { WordCard } from "@/generated/prisma/browser";
import { Mode, modeConfig } from "@/lib/types";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { LANGUAGES } from "@/lib/consts";

type Props = {
    card: WordCard,
    mode: Mode
}

enum CardStatus {
  idle = 'idle',
  success = 'success',
  error = 'error'
}

export default function WordCardView({card, mode}: Props) {

    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [checkStatus, setCheckStatus] = useState<CardStatus>(CardStatus.idle);
    const [recognizedText, setRecognizedText] = useState<string>("");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const {
        transcript,
        resetTranscript,
        listening,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
    } = useSpeechRecognition()

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
            SpeechRecognition.stopListening();
            resetTranscript();
        };
    }, []);


    useEffect(() => {
        if (!listening && transcript) {
            setRecognizedText(transcript.toLowerCase().trim());
            setIsFlipped(true);

            if (mode === Mode.translation) {
                const isInTranslation = card.translation.some(
                (word) => word.toLowerCase().trim() === transcript.toLowerCase().trim()
                );
                setCheckStatus(isInTranslation ? CardStatus.success : CardStatus.error);
            }

            if (mode === Mode.pronunciation) {
                const isSameWord = (card.word.toLowerCase().trim() === transcript.toLowerCase().trim())
                setCheckStatus(isSameWord ? CardStatus.success : CardStatus.error);
            }
            }
        }, [listening]);


    const toggleMic = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (audioRef.current) {
          audioRef.current.pause();
      }

      if (!browserSupportsSpeechRecognition) {
        alert("Ваш браузер не поддерживает распознавание речи.");
        return;
      }

      if (!isMicrophoneAvailable) {
        alert("Доступ к микрофону заблокирован.");
        return;
      }

      if (listening) {
        SpeechRecognition.stopListening();
      } else {
        resetTranscript();
        setRecognizedText("");
        setCheckStatus(CardStatus.idle);
        if (mode === Mode.translation) {
          SpeechRecognition.startListening({ language: LANGUAGES.RUSSIAN_RU_LANG_CODE });
        }
        if (mode === Mode.pronunciation) {
          SpeechRecognition.startListening({ language: LANGUAGES.ENGLISH_US_LANG_CODE });
        }
      }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-[650px]">

            <div className="h-14 w-full max-w-[450px] flex items-center justify-center transition-all duration-300">
                    {listening && (
                    <div className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 animate-pulse">
                        {modeConfig[mode].listening}
                    </div>
                    )}
                    
                    {checkStatus === CardStatus.success && (
                    <div className="text-sm flex flex-col items-center bg-green-50 border border-green-200 px-4 py-1.5 rounded-xl text-center">
                        <span className="font-bold text-green-700">Правильно! 🎉</span>
                        <span className="text-xs text-green-600 italic">Вы сказали: «{recognizedText}»</span>
                    </div>
                    )}
        
                    {checkStatus === CardStatus.error && (
                    <div className="text-sm flex flex-col items-center bg-red-50 border border-red-200 px-4 py-1.5 rounded-xl text-center">
                        <span className="font-bold text-red-700">Неправильно ❌</span>
                        <span className="text-xs text-red-600 italic">Вы сказали: «{recognizedText || "не удалось распознать"}»</span>
                    </div>
                    )}
                    
                    {checkStatus === CardStatus.idle && (
                    <div className="text-xs text-gray-400 font-medium italic">
                        {modeConfig[mode].idle}
                    </div>
                    )}
                </div>

        <div
            className="w-full max-w-[450px] h-[320px] [perspective:1000px] cursor-pointer"
            onClick={() => {
              setIsFlipped(!isFlipped)
              setCheckStatus(CardStatus.idle)}}>
            <div key={card.id}
                className={`relative w-full h-full transform-3d transition-transform duration-700 
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
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-row items-center gap-3">
                    <button 
                        onClick={(e) => {
                        e.stopPropagation();
                        if (audioRef.current) {
                            audioRef.current.pause();
                        }
                        audioRef.current = new Audio(`/audio/${card.word}.ogg`);
                        audioRef.current.play();
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Прослушать произношение"
                    >
                        <svg 
                        xmlns="http://w3.org" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2} 
                        stroke="currentColor" 
                        className="w-5 h-5"
                        >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                        </svg>
                    </button>

                    <button 
                        onClick={toggleMic}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        title="Записать свой перевод"
                        >
                        <svg 
                            xmlns="http://w3.org" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-5 h-5"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                        </svg>
                    </button>
                    </div>
                    
                    <p className="text-center text-xs text-gray-400 font-medium">Нажмите, чтобы перевернуть</p>
                </div>
                </div>

                {/* ОБРАТНАЯ СТОРОНА */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-indigo-600 text-white rounded-2xl shadow-md flex flex-col justify-between p-6 transform-3d transition-transform transform-[rotateY(180deg)] duration-700 overflow-y-auto">
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
                        {card.meaning.map((m) => <li key={m}>{m}</li>)}
                        </ul>
                    </div>
                    )}

                    {/* Примеры предложений (если есть) */}
                    {card.examples.length > 0 && (
                    <div className="mt-4 space-y-1">
                        <p className="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">Примеры:</p>
                        <ul className="text-xs italic text-white/90 space-y-1 pl-1 border-l-2 border-indigo-400">
                        {/*  индекс-ключ */}
                        {card.examples.map((ex) => <li key={ex}>“{ex}”</li>)}
                        </ul>
                    </div>
                    )}
                </div>

                {/* Низ: Иконка или текст возврата */}
                <p className="text-center text-[10px] text-indigo-300 font-medium mt-4">Кликните для возврата</p>
                </div>
            </div>
        </div>
        </div>
    )
}