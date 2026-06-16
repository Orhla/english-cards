import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({children,}: Readonly<{children: React.ReactNode;}>) {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
        redirect('/login')
    }
    return (
        <div className="flex-1 w-full max-w-[650px] mx-auto px-4 py-6 flex flex-col min-h-0">
            {children}
        </div>
    );
}
