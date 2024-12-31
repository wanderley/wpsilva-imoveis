"use server";

import {
  createVerificationToken,
  hasValidVerificationToken,
} from "@/features/login/repository";
import { findUserByEmail } from "@/features/login/repository";
import { Resend } from "resend";

export async function requestVerificationToken(email: string) {
  if (!(await findUserByEmail(email))) {
    throw new Error(`Invalid email ${email}`);
  }
  if (await hasValidVerificationToken(email)) {
    return;
  }
  const token = await createVerificationToken(email);
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
