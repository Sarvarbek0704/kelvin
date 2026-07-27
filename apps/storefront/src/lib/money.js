/**
 * Pulni ko'rsatish — tiyin (string) → so'm. ⚠️ Backend TIYINDA (BigInt string)
 * yuboradi; bu yerda faqat KO'RSATISH uchun Number'ga o'tkaziladi (arifmetika
 * qilinmaydi — u serverda).
 */
export function formatSom(tiyin) {
  const som = Number(tiyin ?? 0) / 100;
  return `${som.toLocaleString('ru-RU')} so'm`;
}
