import { requireAdmin } from "@/lib/dal";

export default async function AdminLayout({children,}: Readonly<{children: React.ReactNode;}>) {
    await requireAdmin();
    return (
        <div className="flex-1 w-full max-w-none px-4 py-6 flex flex-col min-h-screen overflow-y-auto">
            {children}
        </div>
    );
}
