import { useCallback, useEffect, useState } from 'react';

/**
 * Sevimlilar — mehmon uchun brauzerda (localStorage). Backend'da alohida jadval
 * YO'Q (docs/13 sevimlilar guest-only), shuning uchun faqat mahsulot `slug`lari
 * saqlanadi; sahifa ochilganda har biri `/products/:slug` orqali yangilanadi
 * (narx/qoldiq har doim serverdan — hech qachon localStorage'dan).
 */
const KEY = 'kelvin:favorites';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function write(slugs) {
  localStorage.setItem(KEY, JSON.stringify(slugs));
  // Bir tabdagi bir necha komponent sinxron bo'lsin (storage event faqat boshqa tabga otiladi).
  window.dispatchEvent(new Event('kelvin:favorites'));
}

export function useFavorites() {
  const [slugs, setSlugs] = useState(read);

  useEffect(() => {
    const sync = () => setSlugs(read());
    window.addEventListener('kelvin:favorites', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('kelvin:favorites', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isFavorite = useCallback((slug) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug) => {
    if (!slug) return;
    const current = read();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    write(next);
    setSlugs(next);
  }, []);

  return { slugs, isFavorite, toggle };
}
