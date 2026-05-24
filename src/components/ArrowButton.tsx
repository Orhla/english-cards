"use client"

type Props = {
    onClick: () => void;
    direction: 'left' | 'right';
}

export default function ArrowButton({ onClick, direction }: Props) {
    
    return (
        <button 
          onClick={onClick}
          className="p-3 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 shadow-sm transition-all"
          aria-label={direction === 'left' ? "Предыдущая карточка" : "Следующая карточка"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            {direction === 'left' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            )}
          </svg>
        </button>
    )
}