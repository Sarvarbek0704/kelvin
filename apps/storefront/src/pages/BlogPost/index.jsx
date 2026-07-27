import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useBlogPost } from '../../lib/content';
import { label } from '../../lib/api';
import { useSeo } from '../../lib/seo';
import { Container, Skeleton } from '../../components/ui';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ru-RU') : '');

const ArticleWrap = styled.article`
  padding-bottom: 64px;

  .head {
    max-width: 760px;
    margin: 0 auto;
    padding: 56px 0 0;
    text-align: center;
  }

  .meta {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 18px;

    a {
      color: ${(p) => p.theme.color.brassDark};
    }
  }

  h1 {
    font-size: 60px;
    line-height: 1.05;
    margin: 0;
  }

  .bar {
    height: 5px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    margin: 28px auto 0;
    max-width: 200px;
  }

  .cover {
    max-width: 980px;
    margin: 40px auto 0;

    .frame {
      aspect-ratio: 16 / 8;
      border-radius: ${(p) => p.theme.radius.image};
      overflow: hidden;
      position: relative;
      background: repeating-linear-gradient(
        135deg,
        #efe8dc,
        #efe8dc 16px,
        #e9e0d2 16px,
        #e9e0d2 32px
      );

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(45% 55% at 40% 40%, rgba(255, 180, 107, 0.28), transparent 72%);
      }
    }
  }

  /* O'qiladigan o'lchov ~680px */
  .body {
    max-width: 680px;
    margin: 0 auto;
    padding-top: 44px;

    p {
      font-size: 17px;
      line-height: 1.8;
      color: ${(p) => p.theme.color.bodyTextAlt};
      margin: 0 0 22px;
    }

    p:first-child {
      font-family: ${(p) => p.theme.font.serif};
      font-size: 24px;
      line-height: 1.5;
      color: #3a342b;
      margin-bottom: 28px;
    }
  }

  .author {
    max-width: 680px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 44px;
    padding-top: 28px;
    border-top: 1px solid rgba(138, 106, 59, 0.16);

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 999px;
      background: ${(p) => p.theme.color.deep};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ${(p) => p.theme.font.serif};
      font-size: 20px;
      color: ${(p) => p.theme.color.brassDark};
    }

    .name {
      font-weight: 600;
      font-size: 15px;
      color: ${(p) => p.theme.color.ink};
    }

    .sub {
      font-size: 13px;
      color: ${(p) => p.theme.color.inkMuted};
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    .head {
      padding-top: 24px;
    }

    h1 {
      font-size: 34px;
    }

    .cover {
      margin-top: 24px;
    }

    .body {
      padding-top: 28px;
    }
  }
`;

// Nashr etilgan maqola sahifasi (/blog/:slug) — content moduli (docs/13).
function BlogPost() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const { data: post, isLoading, isError } = useBlogPost(slug);

  useSeo(
    post
      ? {
          title: label(post.title),
          description: label(post.excerpt) || label(post.body).slice(0, 160),
          image: post.coverUrl,
          jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: label(post.title), datePublished: post.publishedAt },
        }
      : {},
  );

  if (isLoading) {
    return (
      <Container>
        <div style={{ maxWidth: 760, margin: '56px auto' }}>
          <Skeleton $w="60%" $h="44px" style={{ margin: '0 auto 24px' }} />
          <Skeleton $h="300px" $r="14px" />
        </div>
      </Container>
    );
  }
  if (isError || !post) {
    return (
      <Container>
        <div style={{ maxWidth: 680, margin: '56px auto', textAlign: 'center' }}>
          <p style={{ color: '#8A8175', marginBottom: 16 }}>{t('blog.not_found')}</p>
          <Link to="/blog" style={{ fontWeight: 600 }}>
            {t('blog.all_articles')}
          </Link>
        </div>
      </Container>
    );
  }

  const body = label(post.body);

  return (
    <Container>
      <ArticleWrap>
        <div className="head">
          <div className="meta">
            <Link to="/blog">{t('home.journal_kicker')}</Link> · {formatDate(post.publishedAt)}
          </div>
          <h1>{label(post.title)}</h1>
          <div className="bar" />
        </div>

        <div className="cover">
          <div className="frame">
            {post.coverUrl ? (
              <img src={post.coverUrl} alt={label(post.title)} />
            ) : (
              <div className="glow" />
            )}
          </div>
        </div>

        {/* ⚠️ Matn oddiy tekst (CMS) — abzatslarga bo'linadi. HTML EMAS (XSS'dan xoli). */}
        <div className="body">
          {body
            .split('\n')
            .filter((para) => para.trim())
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </div>

        <div className="author">
          <div className="avatar">K</div>
          <div>
            <div className="name">{t('blog.editorial')}</div>
            <div className="sub">{t('blog.editorial_sub')}</div>
          </div>
        </div>
      </ArticleWrap>
    </Container>
  );
}

export default BlogPost;
