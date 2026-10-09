import { z } from "zod";
import { lget, lset } from "@services/localDb";

export type AspectoGemelo = "neutral" | "mujer" | "varon" | "mascota";
export type Preferencias = { aspecto: AspectoGemelo; piel: "clara" | "media" | "oscura"; color: "menta" | "violeta" | "azul"; proposito: "conocer" | "organizar" | "moverme" };
const schema = z.object({ aspecto: z.enum(["neutral", "mujer", "varon", "mascota"]), piel: z.enum(["clara", "media", "oscura"]), color: z.enum(["menta", "violeta", "azul"]), proposito: z.enum(["conocer", "organizar", "moverme"]) });
export const PREFERENCIAS_DEFAULT: Preferencias = { aspecto: "neutral", piel: "media", color: "menta", proposito: "conocer" };
export async function fetchPreferencias(id: string): Promise<Preferencias> {
  const saved = await lget<Partial<Preferencias>>(`preferencias:${id}`, {});
  const next = { ...PREFERENCIAS_DEFAULT, ...saved };
  if (!["neutral", "mujer", "varon", "mascota"].includes(next.aspecto)) next.aspecto = "neutral";
  if (!["clara", "media", "oscura"].includes(next.piel)) next.piel = "media";
  if (!["menta", "violeta", "azul"].includes(next.color)) next.color = "menta";
  if (!["conocer", "organizar", "moverme"].includes(next.proposito)) next.proposito = "conocer";
  return next;
}
export async function savePreferencias(id: string, update: Partial<Preferencias>) {
  const current = await fetchPreferencias(id);
  const next = schema.parse({ ...current, ...update });
  await lset(`preferencias:${id}`, next);
  return next;
}
