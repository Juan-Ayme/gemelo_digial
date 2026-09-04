import type { ConsentMap, EventoRow } from "@services/types";

/**
 * Health Connect solo existe en Android (development build). En iOS y web se
 * usa este stub, de modo que la librería nativa ni siquiera entra al bundle.
 * La implementación real está en `healthConnect.android.ts`.
 */
export async function leerHealthConnect(
  _userId: string,
  _consents: ConsentMap,
): Promise<EventoRow[]> {
  return [];
}
