import { randomUUID } from 'node:crypto';

import { createHarness, type TestHarness } from './helpers/harness';
import { ContentService } from '../../src/modules/content/content.service';
import { NotFoundError } from '../../src/core/errors/domain.error';

/**
 * content — blog/sahifa (docs/13). Nashr publishedAt'ni BIR MARTA belgilaydi;
 * ommaviy o'qish faqat nashr etilganlarni ko'radi.
 */
describe('Content (integration)', () => {
  let h: TestHarness;
  let content: ContentService;

  beforeAll(async () => {
    h = await createHarness();
    content = h.app.get(ContentService);
  }, 180_000);

  afterAll(async () => {
    await h.teardown();
  });

  const mkPost = (): Promise<{ id: string; slug: string }> =>
    content
      .createPost({
        slug: `post-${randomUUID().slice(0, 8)}`,
        title: { ru: 'Заголовок', 'uz-Latn': 'Sarlavha' },
        body: { ru: 'Текст', 'uz-Latn': 'Matn' },
      })
      .then((p) => ({ id: p.id, slug: p.slug }));

  it('createPost → DRAFT (nashr emas), ommaviy ro‘yxatda yo‘q', async () => {
    const { id, slug } = await mkPost();
    const post = await content.getPostForAdmin(id);
    expect(post?.isPublished).toBe(false);
    expect(post?.publishedAt).toBeNull();

    const published = await content.listPublished();
    expect(published.map((p) => p.slug)).not.toContain(slug);
    await expect(content.getPublishedBySlug(slug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('⚠️ publish → isPublished + publishedAt; ommaviy ko‘rinadi', async () => {
    const { id, slug } = await mkPost();
    const pub = await content.publish(id);
    expect(pub.isPublished).toBe(true);
    expect(pub.publishedAt).not.toBeNull();

    const bySlug = await content.getPublishedBySlug(slug);
    expect(bySlug.id).toBe(id);
    expect((await content.listPublished()).map((p) => p.slug)).toContain(slug);
  });

  it('⚠️ publish IDEMPOTENT — qayta nashr publishedAt sanasini surmaydi', async () => {
    const { id } = await mkPost();
    const first = await content.publish(id);
    const second = await content.publish(id);
    expect(second.publishedAt?.getTime()).toBe(first.publishedAt?.getTime());
  });

  it('unpublish → ommaviy ro‘yxatdan chiqadi', async () => {
    const { id, slug } = await mkPost();
    await content.publish(id);
    await content.unpublish(id);
    expect((await content.listPublished()).map((p) => p.slug)).not.toContain(slug);
    await expect(content.getPublishedBySlug(slug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('upsertPage — yaratish + yangilash (slug bo‘yicha), ommaviy o‘qish', async () => {
    const slug = `page-${randomUUID().slice(0, 8)}`;
    await content.upsertPage({ slug, title: { ru: 'О нас' }, body: { ru: 'v1' } });
    await content.upsertPage({ slug, title: { ru: 'О нас' }, body: { ru: 'v2' } });
    const page = await content.getPublishedPage(slug);
    expect((page.body as { ru: string }).ru).toBe('v2'); // upsert yangiladi
  });
});
