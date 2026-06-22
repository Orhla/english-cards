import ErrorMessage from "@/components/ErrorMessage";
import { prisma } from "@/lib/prisma";
import AdminCardForm from "@/components/AdminCardForm";

type Props = {
  params: Promise<{ id: string }>;
}

export default async function WordCardsPage({ params }: Props) {
    const { id: cardIdStr } = await params;

    if (!cardIdStr || isNaN(Number(cardIdStr))) {
        return <ErrorMessage message="ID карточки может быть только целым числом" />;
    }
    const cardId = Number(cardIdStr);

    const card = await prisma.wordCard.findUnique({
        where: { id: cardId },
    });

    if (!card) {
        return <ErrorMessage message="Карточка не найдена" />;
    }

    return <AdminCardForm card={card}
                          mode="edit" />;
}