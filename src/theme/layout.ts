/** La barra flotante y el contenido reservan el mismo espacio en cada teléfono. */
export const TAB_BAR_HEIGHT = 66;

export function tabBarBottom(platform: string, safeBottom: number) {
  return Math.max(platform === "ios" ? 28 : 18, safeBottom + 8);
}

export function screenBottomSpace(platform: string, safeBottom: number) {
  return TAB_BAR_HEIGHT + tabBarBottom(platform, safeBottom) + 20;
}
