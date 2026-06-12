import { signIn } from "@/../auth"

export default function LoginPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
                
                {/* Заголовок */}
                <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900">
                    Вход в аккаунт
                </h2>

                {/* Форма */}
                <form action={async () => {
                    "use server"
                    await signIn("yandex")
                }}>
                    <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#fc3f1d] py-3.5 text-base font-medium text-white transition-colors duration-150 hover:bg-[#e33516] active:bg-[#ce2f12]"
                    >
                        <span>Войти через Яндекс</span>
                    </button>
                </form>

            </div>
        </div>
    )
}