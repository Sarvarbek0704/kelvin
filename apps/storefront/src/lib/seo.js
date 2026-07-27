import { useEffect } from 'react';

/**
 * SPA SEO (docs/13 §6) — dependency-siz. document.head'ni yangilaydi: title, meta
 * description, Open Graph, JSON-LD. ⚠️ SPA: Google JS render qiladi, lekin ba'zi
 * botlar (Telegram preview) cheklangan — to'liq SSR emas (loyiha egasi qarori).
 */
function setMeta(key, value, attr = 'name') {
  if (!value) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export function useSeo({ title, description, image, jsonLd } = {}) {
  // ⚠️ Obyekt deps'ni buzadi — serializatsiya qilib string dep sifatida beramiz.
  const jsonLdStr = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = `${title} — Kelvin`;
    setMeta('description', description);
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    if (image) setMeta('og:image', image, 'property');

    let script;
    if (jsonLdStr) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdStr;
      document.head.appendChild(script);
    }
    return () => {
      document.title = prevTitle;
      if (script) script.remove();
    };
  }, [title, description, image, jsonLdStr]);
}
