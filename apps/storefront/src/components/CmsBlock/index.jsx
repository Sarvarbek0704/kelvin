import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { api, label } from '../../lib/api';

/**
 * CMS sahifa bloki (docs/13) — /pages/:slug'dan boshqariladigan kontent. Admin
 * tahrirlaydi, storefront ko'rsatadi. Sahifa yo'q bo'lsa hech narsa (fallback:
 * mavjud statik dizayn qoladi). ⚠️ Matn oddiy tekst abzatslarga — HTML EMAS (XSS).
 */
function CmsBlock({ slug }) {
  const { data: page } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => api.get(`/pages/${slug}`).catch(() => null),
    enabled: Boolean(slug),
  });

  if (!page) return null;
  const body = label(page.body);

  return (
    <section style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 8px' }}>
      <h1 style={{ marginBottom: 16, fontSize: 40 }}>{label(page.title)}</h1>
      <div style={{ lineHeight: 1.8, color: '#454036', fontSize: 17 }}>
        {body.split('\n').map((para, i) => (
          <p key={i} style={{ marginBottom: 14 }}>{para}</p>
        ))}
      </div>
    </section>
  );
}

export default CmsBlock;
