import { expect, it } from "vitest";
import { avatarColor, initials } from "./avatar";

it.each([
  ["Kalle Krause", "KK"],
  ["  moni  von  meier ", "MM"],
  ["Cher", "C"],
])("Initialen von %s → %s", (name, result) => {
  expect(initials(name)).toBe(result);
});

it("vergibt pro Mitglied immer dieselbe Farbe", () => {
  expect(avatarColor("abc")).toBe(avatarColor("abc"));
});
