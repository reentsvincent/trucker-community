import { cookies } from "next/headers";
import { connection } from "next/server";
import { createUser, findUser, type Author } from "@/community/repository";
import { getDb } from "./db";

/**
 * PLATZHALTER-ANMELDUNG bis zur Anbindung an den cargovibe-Login.
 *
 * Das Cookie enthält nur die (zufällige) Mitglieds-ID. Wer das Cookie hat,
 * gilt als dieses Mitglied. Für einen Prototyp ausreichend, nicht für den
 * echten Betrieb. Später ersetzt `getCurrentMember()` das cargovibe-Konto,
 * verknüpft über `users.external_id`.
 */
const COOKIE = "tc_member";

export async function getCurrentMember(): Promise<Author | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  return findUser(await getDb(), id);
}

/**
 * Für Seiten und Komponenten: erst zur Anfragezeit nachschauen, nie beim
 * Vorab-Rendern (sonst würde die Datenbankabfrage dort mitlaufen).
 */
export async function getCurrentMemberForPage(): Promise<Author | null> {
  await connection();
  return getCurrentMember();
}

export async function signIn(displayName: string): Promise<Author> {
  const member = await createUser(await getDb(), displayName);
  (await cookies()).set(COOKIE, member.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return member;
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
