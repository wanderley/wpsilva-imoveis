"use server";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const FIVE_MINUTES_IN_MS = 1000 * 60 * 5;

export async function requestVerificationCode(email: string) {
  if (!(await db.query.users.findFirst({ where: eq(users.email, email) }))) {
    throw new Error(`Invalid email ${email}`);
  }

  const verificationToken = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, email),
    orderBy: (verificationToken, { desc }) => [desc(verificationToken.expires)],
  });
  if (verificationToken && verificationToken.expires > new Date()) {
    return;
  }
  const token = crypto.randomUUID();

  await db.insert(verificationTokens).values({
    identifier: email,
    token: token,
    expires: new Date(Date.now() + FIVE_MINUTES_IN_MS),
  });

  const resend = new Resend(process.env.AUTH_RESEND_KEY);
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "W&P Silva Imóveis - Código de verificação",
    text: `Seu código de verificação é \n\n${token}`,
  });

  if (error) {
    return console.error({ error });
  }
}
