"use server";

import { auth } from "@/auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export async function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session && session.user) {
    session.user = {
      email: session.user.email,
    };
  }

  return (
    <>
      <NextAuthSessionProvider session={session}>
        {children}
      </NextAuthSessionProvider>
    </>
  );
}
