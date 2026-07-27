/**
 * RFM segmentatsiya — SOF (docs/10 §9.3). Standart metodika: Recency (oxirgi
 * xariddan o'tgan kun — kam yaxshi), Frequency (buyurtma soni — ko'p yaxshi),
 * Monetary (jami sarf — ko'p yaxshi). Har o'lcham 1-5 (kvintil).
 *
 * ⚠️ core/ — NestJS/Prisma bilmaydi.
 */

export interface CustomerRfmInput {
  readonly customerId: string;
  readonly recencyDays: number; // oxirgi xariddan o'tgan kun
  readonly frequency: number; // buyurtma soni
  readonly monetary: bigint; // jami sarf (tiyin)
}

export interface CustomerRfmScore {
  readonly customerId: string;
  readonly r: number;
  readonly f: number;
  readonly m: number;
  /** "R-F-M" (masalan "5-4-3"). */
  readonly score: string;
}

/** Kvintil skori (1-5): qiymatning tartibdagi o'rniga qarab. higherBetter=false → teskari. */
function quintileScores(values: readonly number[], higherBetter: boolean): number[] {
  const n = values.length;
  if (n === 0) {
    return [];
  }
  // Indekslarni qiymat bo'yicha tartiblaymiz (o'sish).
  const order = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const scoreByIndex = new Array<number>(n);
  order.forEach((item, rank) => {
    // rank 0..n-1 → 1..5 kvintil.
    const q = Math.min(5, Math.floor((rank / n) * 5) + 1);
    scoreByIndex[item.i] = higherBetter ? q : 6 - q;
  });
  return scoreByIndex;
}

export function computeRfm(customers: readonly CustomerRfmInput[]): CustomerRfmScore[] {
  if (customers.length === 0) {
    return [];
  }
  const rScores = quintileScores(customers.map((c) => c.recencyDays), false); // kam kun = yaxshi
  const fScores = quintileScores(customers.map((c) => c.frequency), true);
  // Monetary bigint → Number (taqqoslash uchun; aniqlik yo'qolishi skorga ta'sir qilmaydi).
  const mScores = quintileScores(customers.map((c) => Number(c.monetary)), true);
  return customers.map((c, i) => {
    const r = rScores[i] ?? 1;
    const f = fScores[i] ?? 1;
    const m = mScores[i] ?? 1;
    return { customerId: c.customerId, r, f, m, score: `${String(r)}-${String(f)}-${String(m)}` };
  });
}
