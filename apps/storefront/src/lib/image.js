/**
 * Rasm yordamchilari — responsive `srcset`.
 *
 * `derivatives` shakli: { "webp_400": "https://…/400.webp", "webp_800": "…" }.
 * Kalit oxiridagi son piksel kengligi sifatida ishlatiladi.
 */
export function srcSetFrom(derivatives) {
  if (!derivatives) return undefined;
  const parts = Object.entries(derivatives)
    .map(([key, url]) => {
      const width = Number(key.split('_').pop());
      return Number.isFinite(width) ? `${url} ${width}w` : null;
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
}
