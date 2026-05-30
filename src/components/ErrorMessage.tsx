"use client"

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({title="Произошла ошибка", message, onRetry}: Props) {
  return (
    <div className="w-full max-w-[450px] h-[320px] bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-sm">
      {/* Иконка и Текст */}
      <div className="my-auto space-y-2.5">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-bold text-red-900 tracking-tight">
          {title}
        </h3>
        
        <p className="text-sm text-red-600 max-w-[300px] leading-relaxed mx-auto">
          {message}
        </p>
      </div>

      {/* Кнопка повтора (рендерится только если передан проп onRetry) */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full py-2.5 px-4 bg-white border border-red-200 text-red-700 font-semibold text-sm rounded-xl shadow-sm hover:bg-red-100 active:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
}