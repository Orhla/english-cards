import CardViewer from "@/components/CardViewer";
import { getAllEnglishCards, getCardsForPractice } from "@/actions/actions";
import ErrorMessage from "@/components/ErrorMessage";
import { Mode } from "@/lib/types";
import { auth } from "@/auth";

export default async function EnglishCards() {
  const session = await auth()
  
  const allCards = session?.user?.id
    ? await getCardsForPractice(session.user.id)
    : await getAllEnglishCards()
  if (!allCards.success) {
    return (
      <ErrorMessage message={allCards.message} />
    )
  }

  return (
    <div className="w-full min-h-0 flex-1 flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <CardViewer cards={allCards.data}
                  mode={Mode.pronunciation} />
    </div>);
}
