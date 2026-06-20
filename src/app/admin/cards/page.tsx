import { getAllEnglishCards } from '@/actions/actions';
import DeleteCardButton from '@/components/DeleteCardButton';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление карточками слов</h1>
        <Link
          href="/admin/cards/new"
          className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
        >
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Создать карточку
        </Link>
      </div>
      
      <div className="w-full max-w-none overflow-x-auto border rounded-lg shadow-sm bg-white">
        <table className="w-full table-auto divide-y divide-gray-200 text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-semibold text-gray-700 w-16">ID</th>
              <th className="p-4 font-semibold text-gray-700 ">Слово</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[100px]">Транскрипция</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[200px]">Перевод</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[300px]">Значение</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[350px]">Примеры</th>
              <th className="p-4 font-semibold text-gray-700 min-w-[130px]">Части речи</th>
              <th className="p-4 font-semibold text-gray-700 sticky right-0 bg-gray-50 border-l shadow-[-2px_0_5px_rgba(0,0,0,0.05)] text-center w-32">
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
                  {card.translation?.join('| ') || ''}
                </td>
                <td className="p-4 text-gray-600 max-w-sm whitespace-normal hover:whitespace-normal">
                  {card.meaning?.join('| ') || ''}
                </td>
                <td className="p-4 text-gray-600 max-w-md whitespace-normal hover:whitespace-normal">
                  {card.examples?.join(' | ') || ''}
                </td>
                <td className="p-4 text-gray-600 max-w-sm whitespace-normal hover:whitespace-normal">
                  {card.partsOfSpeech?.join('| ') || ''}
                </td>
                <td className="p-4 sticky right-0 bg-white group-hover:bg-gray-50 border-l shadow-[-2px_0_5px_rgba(0,0,0,0.05)] text-center transition-colors">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/admin/cards/${card.id}?mode=edit`}
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded transition"
                    >
                      Редактировать
                    </Link>
                    
                    <DeleteCardButton cardId={card.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}