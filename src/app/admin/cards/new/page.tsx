import { getAllTopics } from "@/actions/actions";
import AdminCardForm from "@/components/AdminCardForm";

export default async function NewWordCard() {
    const allTopics = await getAllTopics();

    return <AdminCardForm mode="create"
                          allTopics={allTopics} />
}