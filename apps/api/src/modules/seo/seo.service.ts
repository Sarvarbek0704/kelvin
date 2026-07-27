import { Injectable } from '@nestjs/common';

import { SeoRepository } from './seo.repository';

/** seo — sitemap.xml + robots.txt (docs/13 §6). ⚠️ SPA — bot preview cheklangan. */
@Injectable()
export class SeoService {
  constructor(private readonly repo: SeoRepository) {}

  async sitemap(baseUrl: string): Promise<string> {
    const [products, posts, pages] = await Promise.all([
      this.repo.activeProductSlugs(),
      this.repo.publishedBlogSlugs(),
      this.repo.publishedPageSlugs(),
    ]);

    const urls: { loc: string; lastmod: string; priority: string }[] = [
      { loc: `${baseUrl}/`, lastmod: new Date().toISOString(), priority: '1.0' },
      { loc: `${baseUrl}/search`, lastmod: new Date().toISOString(), priority: '0.8' },
      { loc: `${baseUrl}/blog`, lastmod: new Date().toISOString(), priority: '0.6' },
      ...products.map((p) => ({ loc: `${baseUrl}/product/${p.slug}`, lastmod: p.updatedAt.toISOString(), priority: '0.9' })),
      ...posts.map((p) => ({ loc: `${baseUrl}/blog/${p.slug}`, lastmod: p.updatedAt.toISOString(), priority: '0.5' })),
      ...pages.map((p) => ({ loc: `${baseUrl}/${p.slug}`, lastmod: p.updatedAt.toISOString(), priority: '0.4' })),
    ];

    const body = urls
      .map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`)
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
  }

  /** ⚠️ Faceted URL'lar (?ct=…&ip=…) — noindex (crawl byudjeti, docs/13 §6). */
  robots(baseUrl: string): string {
    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /account',
      'Disallow: /basket',
      'Disallow: /orders',
      'Disallow: /*?', // faceted/query URL'lar indekslanmaydi
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
