import NextAuth from "next-auth"
import Yandex from "next-auth/providers/yandex"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Yandex({
            clientId: process.env.AUTH_YANDEX_ID,
            clientSecret: process.env.AUTH_YANDEX_SECRET,
        }),
    ],
})