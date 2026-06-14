import CardViewer from "@/components/CardViewer";
import { getAllEnglishCards } from "@/actions/actions";
import ErrorMessage from "@/components/ErrorMessage";
import { Mode } from "@/lib/types";

export default async function EnglishCards() {
  const allCards = await getAllEnglishCards();
  if (!allCards.success) {
    return (
      <ErrorMessage message={allCards.message} />
    )
  }

  return (
    <div className="w-full min-h-0 flex-1 flex items-center justify-center bg-gray-50 p-4 overflow-hidden">
      <CardViewer cards={allCards.data}
                  mode={Mode.translation} />
    </div>);
}
