import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import NextAuth, { CredentialsSignin, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";

class InvalidLoginError extends CredentialsSignin {
  code = "Dados inválidos";
}

class ExpiredVerificationCodeError extends CredentialsSignin {
  code = "Código de verificação expirado";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "E-mail",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        const verificationToken = await db.query.verificationTokens.findFirst({
          with: {
            user: true,
          },
          where: and(
            eq(verificationTokens.token, credentials.password as string),
            eq(verificationTokens.identifier, credentials.email as string),
          ),
          orderBy: (verificationToken, { desc }) => [
            desc(verificationToken.expires),
          ],
        });
        if (!verificationToken) {
          throw new InvalidLoginError();
        }
        if (verificationToken.expires < new Date()) {
          throw new ExpiredVerificationCodeError();
        }
        return verificationToken.user
          ? {
              id: verificationToken.user.id,
              name: verificationToken.user.name,
              email: verificationToken.user.email,
            }
          : null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
});
