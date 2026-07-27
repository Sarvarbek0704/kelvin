import React from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '../../lib/content';
import { label } from '../../lib/api';
import { Container, SectionHead, TextLink } from '../ui';
import { BlogSection, BlogGrid, BlogCard } from './Blog.styled';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '');

// Bo'sh DB'da bosh sahifa buzilmasin — dizayn nusxasidagi namuna kartalar.
const FALLBACK_POSTS = [
  {
    id: 'fallback-1',
    slug: null,
    meta: 'Гид · 5 мин',
    title: 'Цветовая температура для спальни',
    excerpt: 'Почему 2700–3000K расслабляют, а 4000K бодрит.',
    warm: true,
  },
  {
    id: 'fallback-2',
    slug: null,
    meta: 'Разбор · 7 мин',
    title: 'IP-защита: свет для ванной и улицы',
    excerpt: 'Где нужен IP44, а где не обойтись без IP65.',
  },
  {
    id: 'fallback-3',
    slug: null,
    meta: 'Калькулятор · 4 мин',
    title: 'Сколько люмен нужно комнате',
    excerpt: 'Считаем яркость по площади и назначению.',
  },
];

/** Jurnal teaseri — nashr etilgan maqolalar (/blog), bo'lmasa namuna kartalar. */
function Blog() {
  const { data: apiPosts } = useBlogPosts(3);

  const posts =
    Array.isArray(apiPosts) && apiPosts.length > 0
      ? apiPosts.map((p) => ({
          id: p.id,
          slug: p.slug,
          cover: p.coverUrl,
          meta: formatDate(p.publishedAt),
          title: label(p.title),
          excerpt: '',
        }))
      : FALLBACK_POSTS;

  return (
    <BlogSection>
      <Container>
        <SectionHead
          kicker="Журнал"
          title="Как выбирать свет"
          action={
            <TextLink as={Link} to="/blog">
              В журнал →
            </TextLink>
          }
        />
        <BlogGrid>
          {posts.map((post) => {
            const card = (
              <BlogCard>
                <div className="thumb">
                  {post.cover && <img src={post.cover} alt="" loading="lazy" />}
                  {post.warm && <div className="glow" />}
                </div>
                <div className="body">
                  {post.meta && <div className="meta">{post.meta}</div>}
                  <div className="title">{post.title}</div>
                  {post.excerpt && <div className="excerpt">{post.excerpt}</div>}
                </div>
              </BlogCard>
            );
            return post.slug ? (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                {card}
              </Link>
            ) : (
              <React.Fragment key={post.id}>{card}</React.Fragment>
            );
          })}
        </BlogGrid>
      </Container>
    </BlogSection>
  );
}

export default Blog;
