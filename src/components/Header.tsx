import Link from "next/link";


export default function Header() {
    return (
        <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
                <nav className="flex w-full items-center justify-between">
                    <Link href="/" 
                        className="text-sm font-medium text-gray-600 transition-colors hover:text-amber-600">
                        Главная
                    </Link>
                    
                    <Link href="/practice" 
                        className="text-sm font-medium text-gray-600 transition-colors hover:text-amber-600">
                        Практика
                    </Link>
                </nav>
            </div>
        </header>
    )
}