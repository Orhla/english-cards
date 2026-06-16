import { getAllEnglishCards } from '@/actions/actions';
import ErrorMessage from '@/components/ErrorMessage';
import Link from 'next/link';

export default async function WordCardsPage() {
  const allCards = await getAllEnglishCards();
  if (!allCards.success) {
      return (
        <ErrorMessage message={allCards.message} />
      )
  }

  const cards = allCards.data;

  if (cards.length === 0) {
    return <p className="p-6 text-gray-500">Карточки слов не найдены.</p>;
  }

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-4">Управление карточками слов</h1>
      
      <div className="w-full max-w-none overflow-x-auto border rounded-lg shadow-sm bg-white">
        <table className="w-full table-auto divide-y divide-gray-200 text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-semibold text-gray-700 w-16">ID</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[1400px: w-[120px]">Слово</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[100px]">Транскрипция</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[200px]">Перевод</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[300px]">Значение</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[350px]">Примеры</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[130px]">Части речи</th>
              <th className="p-4 font-semibold text-gray-700 sticky right-0 bg-gray-50 border-l shadow-[ -2px_0_5px_rgba(0,0,0,0.05) ] text-center w-32">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {cards.map((card) => (
              <tr key={card.id} className="hover:bg-gray-50">
                <td className="p-3 text-gray-500">{card.id}</td>
                <td className="p-3 font-bold text-gray-900">{card.word}</td>
                <td className="p-3 text-gray-600 font-mono">{card.transcription}</td>
                <td className="p-4 text-gray-700 max-w-xs whitespace-normal hover:whitespace-normal">
                  {card.translation.join(', ')}
                </td>
                <td className="p-4 text-gray-600 max-w-sm whitespace-normal hover:whitespace-normal">
                  {card.meaning.join('; ')}
                </td>
                <td className="p-4 text-gray-600 max-w-md whitespace-normal hover:whitespace-normal">
                  {card.examples.join(' | ')}
                </td>
                <td className="p-4 text-gray-600 max-w-sm whitespace-normal hover:whitespace-normal">
                  {card.partsOfSpeech.join(', ')}
                </td>
                <td className="p-4 sticky right-0 bg-white border-l shadow-[ -2px_0_5px_rgba(0,0,0,0.05) ] text-center">
                  <Link
                    href={`/admin/cards/${card.id}`}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded transition"
                  >
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}