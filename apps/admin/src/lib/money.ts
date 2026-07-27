/**
 * Pulni ko'rsatish — TIYIN (string, BigInt) → so'm. ⚠️ Faqat KO'RSATISH uchun;
 * arifmetika serverda (tiyin BigInt). docs/08 §3.1.
 */
export function formatSom(tiyin: string | number | null | undefined): string {
  const som = Number(tiyin ?? 0) / 100;
  return `${som.toLocaleString('ru-RU')} so'm`;
}
