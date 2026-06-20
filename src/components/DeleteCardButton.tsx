"use client"

import { deleteWordCard } from '@/actions/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  cardId: number;
}

export default function DeleteCardButton({ cardId }: Props) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту карточку?')) return;

    setIsLoading(true);

    try {
      const result = await deleteWordCard(cardId);
      
      if (result && !result.success) {
        alert(result.error || 'Не удалось удалить карточку');
      } else {
        router.refresh();
      }
    } catch (error) {
      alert('Произошла непредвиденная ошибка при удалении.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 px-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px]"
    >
      {isLoading ? '...' : 'Удалить'}
    </button>
  );
}