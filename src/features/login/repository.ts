import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

const FIVE_MINUTES_IN_MS = 1000 * 60 * 5;

export async function findVerificationToken(email: string) {
  const verificationToken = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.identifier, email),
    orderBy: (verificationToken, { desc }) => [desc(verificationToken.expires)],
  });
  if (verificationToken && verificationToken.expires > new Date()) {
    return verificationToken;
  }
  return undefined;
}

export async function hasValidVerificationToken(email: string) {
  return !!(await findVerificationToken(email));
}

export async function createVerificationToken(email: string): Promise<string> {
  // Delete any existing verification tokens for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  // Create a new verification token
  const token = crypto.randomUUID();
  await db.insert(verificationTokens).values({
    identifier: email,
    token: token,
    expires: new Date(Date.now() + FIVE_MINUTES_IN_MS),
  });
  return token;
}

export async function findUserByEmail(email: string) {
  return await db.query.users.findFirst({
    where: eq(users.email, email),
  });
}
