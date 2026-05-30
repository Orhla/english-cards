import CardViewer from "@/components/CardViewer";
import { getAllEnglishCards } from "@/actions/actions";
import ErrorMessage from "@/components/ErrorMessage";

export default async function EnglishCards() {
  const allCards = await getAllEnglishCards();
  if (!allCards.success) {
    return (
      <ErrorMessage message={allCards.message} />
    )
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <CardViewer cards={allCards.data} />
    </main>);
}
