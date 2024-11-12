import {
  findUserByEmail,
  findVerificationToken,
} from "@/features/login/repository";
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
        const user = await findUserByEmail(credentials.email as string);
        if (!user) {
          throw new InvalidLoginError();
        }
        const verificationToken = await findVerificationToken(
          credentials.email as string,
        );
        if (
          verificationToken === undefined ||
          verificationToken.token !== (credentials.password as string)
        ) {
          throw new InvalidLoginError();
        }
        if (verificationToken.expires < new Date()) {
          throw new ExpiredVerificationCodeError();
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
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
