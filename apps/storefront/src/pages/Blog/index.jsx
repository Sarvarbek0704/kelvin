import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import blog1 from '../../assets/blog1.png';
import blog2 from '../../assets/blog2.png';
import blog3 from '../../assets/blog3.png';
import { useBlogPosts } from '../../lib/content';
import { label } from '../../lib/api';
import { Container, Kicker } from '../../components/ui';
import { JournalHead, Featured, ArticlesGrid, ArticleCard } from './Blog.styled';

const FALLBACK = [blog1, blog2, blog3];
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '');

/** Jurnal indeksi — featured split maqola + 3 ustunli to'r (jonli /blog). */
function Blog() {
  const { t } = useTranslation();
  const { data: apiPosts } = useBlogPosts(24);

  // Serverdan nashr etilgan maqolalar; yo'q bo'lsa — namuna (dizayn buzilmasin).
  const posts =
    Array.isArray(apiPosts) && apiPosts.length > 0
      ? apiPosts.map((p, i) => ({
          id: p.id,
          slug: p.slug,
          image: p.coverUrl || FALLBACK[i % FALLBACK.length],
          title: label(p.title),
          excerpt: label(p.excerpt),
          meta: formatDate(p.publishedAt),
        }))
      : FALLBACK.map((image, i) => ({
          id: `fallback-${i}`,
          slug: null,
          image,
          title: 'Как правильно освещать дом снаружи?',
          excerpt: 'Гид по уличному свету: IP-защита, температуры и сценарии.',
          meta: 'Гид',
        }));

  const [featured, ...rest] = posts;

  const wrapLink = (post, node) =>
    post.slug ? (
      <Link key={post.id} to={`/blog/${post.slug}`}>
        {node}
      </Link>
    ) : (
      <React.Fragment key={post.id}>{node}</React.Fragment>
    );

  return (
    <Container>
      <JournalHead>
        <Kicker as="div">{t('home.journal_kicker')}</Kicker>
        <h1>{t('home.journal_title')}</h1>
        <div className="lead">{t('blog.lead')}</div>
        <div className="bar" />
      </JournalHead>

      {featured &&
        wrapLink(
          featured,
          <Featured>
            <div className="visual">
              {featured.image && <img src={featured.image} alt="" loading="lazy" />}
              <div className="glow" />
            </div>
            <div className="content">
              <div className="meta">{featured.meta || t('blog.featured')}</div>
              <h2>{featured.title}</h2>
              {featured.excerpt && <p className="excerpt">{featured.excerpt}</p>}
              <span className="read">{t('common.read_article')}</span>
            </div>
          </Featured>,
        )}

      <ArticlesGrid>
        {rest.map((post) =>
          wrapLink(
            post,
            <ArticleCard>
              <div className="thumb">
                {post.image && <img src={post.image} alt="" loading="lazy" />}
              </div>
              <div className="body">
                {post.meta && <div className="meta">{post.meta}</div>}
                <h3>{post.title}</h3>
                {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
              </div>
            </ArticleCard>,
          ),
        )}
      </ArticlesGrid>
    </Container>
  );
}

export default Blog;
