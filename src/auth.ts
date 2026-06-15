import NextAuth from "next-auth"
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
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id ?? "",
                    role: token.role ?? "user",
                },
            }
        }
    }
})
