import ErrorMessage from "@/components/ErrorMessage";
import { prisma } from "@/lib/prisma";
import AdminCardForm from "@/components/AdminCardForm";
import AdminCardView from "@/components/AdminCardView";
import { getAllTopics } from "@/actions/actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WordCardsPage({ params, searchParams }: Props) {
    const { id: cardIdStr } = await params;
    const searchParamsResolved = await searchParams;
    const mode = searchParamsResolved.mode === "edit"
        ? "edit"
        : "view";

    if (!cardIdStr || isNaN(Number(cardIdStr))) {
        return <ErrorMessage message="ID карточки может быть только целым числом" />;
    }
    const cardId = Number(cardIdStr);

    const cardData = await prisma.wordCard.findUnique({
        where: { id: cardId },
        include: {
            topics: {
                select: { name: true }
            },
            files: {
                select: { fileId: true, businessType: true, file: { select: { path: true, originalName: true, mimeType: true, size: true, createdAt: true } } },
            }
        }
    });

    const card = cardData ? {
        ...cardData,
        topics: cardData.topics.map(t => t.name)
    } : undefined;

    if (!card) {
        return <ErrorMessage message="Карточка не найдена" />;
    }

    const allTopics = await getAllTopics();

    if (mode === "view") {
        return <AdminCardView card={card} />;
    }
    return <AdminCardForm card={card}
                          mode={mode}
                          allTopics={allTopics} />;
}
