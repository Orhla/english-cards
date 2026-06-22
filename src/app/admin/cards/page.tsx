import { getAllEnglishCards } from '@/actions/actions';
import DeleteCardButton from '@/components/DeleteCardButton';
import ErrorMessage from '@/components/ErrorMessage';
import Link from 'next/link';
import { Plus, Edit2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    <div className="w-full p-6 space-y-6">
      {/* Шапка страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Управление карточками слов
          </h1>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/admin/cards/new">
            <Plus className="h-4 w-4" />
            Создать карточку
          </Link>
        </Button>
      </div>
      
      {/* Область таблицы shadcn/ui */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Слово</TableHead>
              <TableHead className="min-w-[100px]">Транскрипция</TableHead>
              <TableHead className="min-w-[200px]">Перевод</TableHead>
              <TableHead className="min-w-[300px]">Значение</TableHead>
              <TableHead className="min-w-[350px]">Примеры</TableHead>
              <TableHead className="min-w-[130px]">Часть речи</TableHead>
              <TableHead className="sticky right-0 bg-background border-l text-center w-32 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {cards.map((card) => (
              <TableRow key={card.id}>
                <TableCell className="text-muted-foreground">{card.id}</TableCell>
                <TableCell className="font-bold text-foreground text-base">
                  {card.word}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {card.transcription}
                </TableCell>
                <TableCell className="max-w-xs whitespace-normal leading-relaxed">
                  {card.translation?.join(', ') || ''}
                </TableCell>
                <TableCell className="max-w-sm whitespace-normal text-muted-foreground leading-relaxed">
                  {card.meaning?.map((m, i) => (
                    <div key={i} className="mb-1 last:mb-0">• {m}</div>
                  )) || ''}
                </TableCell>
                <TableCell className="max-w-md whitespace-normal text-muted-foreground/90 italic leading-relaxed">
                  {card.examples?.map((ex, i) => (
                    <div key={i} className="mb-1 last:mb-0">«{ex}»</div>
                  )) || ''}
                </TableCell>
                <TableCell className="max-w-sm whitespace-normal">
                  <div className="flex flex-wrap gap-1.5">
                    {card.partsOfSpeech?.map((pos) => (
                      <Badge key={pos} variant="secondary" className="capitalize font-normal text-xs">
                        {pos}
                      </Badge>
                    )) || ''}
                  </div>
                </TableCell>
                <TableCell className="sticky right-0 bg-background border-l text-center shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link href={`/admin/cards/${card.id}?mode=edit`}>
                        <Edit2 className="h-3.5 w-3.5" />
                        Редактировать
                      </Link>
                    </Button>                    
                    <DeleteCardButton cardId={card.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}