import NextAuth from "next-auth"
import Yandex from "next-auth/providers/yandex"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    ...authConfig,
    callbacks: {
        async jwt({ token, user }) {
            if (!user) {
                return token;
            }
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { role: true }
            })           
            if (dbUser) {
                token.role = dbUser.role
                token.id = user.id
            }
            return token
        },

        async session({ session, token }) {
            if (session.user && token) {
                if (typeof token === "object" && token !== null && 
                    "id" in token && typeof token.id === "string" &&
                     "role" in token && typeof token.role === "string") {
                    session.user = {
                        ...session.user,
                        id: token.id,
                        role: token.role
                    } as typeof session.user & { id: string; role: string }
                }
            }
            return session
        }
    }
})