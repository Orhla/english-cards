"use client"

import { useState } from 'react';
import { createWordCard } from '@/actions/actions';
import Link from 'next/link';
import { partOfSpeech } from '@/generated/prisma/enums';

export default function CardCreator() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const textToArray = (text: string, delimiter: string): string[] => { 
      if (!text) return [];
      return text.split(delimiter).map(item => item.trim()).filter(Boolean);
    }

    const cardData = {
      word: formData.get('word')?.toString().trim() || '',
      transcription: formData.get('transcription')?.toString().trim() || '',
      translation: textToArray(formData.get('translation')?.toString() || '', '|'),
      meaning: textToArray(formData.get('meaning')?.toString() || '', '|'),
      examples: textToArray(formData.get('examples')?.toString() || '', '|'),
      partsOfSpeech: textToArray(formData.get('partsOfSpeech')?.toString() || '', '|') as partOfSpeech[],
    };

    if (!cardData.word || !cardData.transcription || cardData.translation.length === 0) {
      setError('Поля "Слово", "Транскрипция" и "Перевод" обязательны.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await createWordCard(cardData);
      if (result && !result.success) {
        setError(result.error);
      }
    } catch (error) {
      setError(`Произошла ошибка при отправке данных: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl bg-white p-6 border rounded-lg shadow-sm space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Слово *</label>
          <input type="text" name="word" required placeholder="e.g. ephemeral" className="w-full rounded border p-2 text-sm focus:outline-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Транскрипция *</label>
          <input type="text" name="transcription" required placeholder="e.g. /ɪˈfemərəl/" className="w-full rounded border p-2 text-sm font-mono focus:outline-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Перевод (через |) *</label>
        <input type="text" name="translation" required placeholder="эфемерный| мимолетный" className="w-full rounded border p-2 text-sm focus:outline-blue-500" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Значение (через |)</label>
        <textarea name="meaning" rows={2} placeholder="Lasting for a very short time" className="w-full rounded border p-2 text-sm focus:outline-blue-500" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Примеры предложений (через |)</label>
        <textarea name="examples" rows={2} placeholder="Fashions are ephemeral | youth is ephemeral" className="w-full rounded border p-2 text-sm focus:outline-blue-500" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Части речи (через |)</label>
        <input type="text" name="partsOfSpeech" placeholder="adjective| noun" className="w-full rounded border p-2 text-sm focus:outline-blue-500" />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t">
        <Link href="/admin/cards" className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">
          Отмена
        </Link>
        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50">
          {isLoading ? 'Сохранение...' : 'Создать'}
        </button>
      </div>
    </form>
  );
}