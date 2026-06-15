import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
// export { auth as middleware } from "@/auth"

const { auth } = NextAuth(authConfig)
export const proxy = auth

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
