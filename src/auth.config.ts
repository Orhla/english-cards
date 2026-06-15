import type { NextAuthConfig } from "next-auth"
import Yandex from "next-auth/providers/yandex"

export const authConfig = {
  providers: [
    Yandex({
      clientId: process.env.AUTH_YANDEX_ID,
      clientSecret: process.env.AUTH_YANDEX_SECRET,
      authorization: {
                url: "https://oauth.yandex.ru/authorize", 
                params: { 
                    scope: "login:email login:info" 
                }
            },
    }),
  ],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
