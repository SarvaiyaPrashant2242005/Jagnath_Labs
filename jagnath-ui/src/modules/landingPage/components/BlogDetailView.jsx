/**
 * @file BlogDetailView.jsx
 * @description Dedicated individual Blog Details page for readers.
 * Shows:
 * - Large featured image
 * - Blog title
 * - Author name, published date, category & tags
 * - Complete rich formatted blog content
 * - Clean reading layout and related blogs section
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Folder, Tag, Share2, BookOpen } from 'lucide-react';
import blogService from '../../blog/services/blogService';
import { getBlogImageUrl } from '../../blog/services/blogUtils';
import TopBar from './TopBar';
import Navbar from './Navbar';
import Footer from './Footer';

export const BlogDetailView = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await blogService.getPublicBlogBySlug(slug);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load blog:', err);
        setError('This article could not be found or has not been published yet.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchDetail();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.blog?.title,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  const blog = data?.blog;
  const relatedBlogs = data?.relatedBlogs || [];

  return (
    <div className="jlt-root">
      {/* Fixed Header */}
      <div className="jlt-fixed-header">
        <TopBar />
        <Navbar
          activeTab="blog"
          setActiveTab={(tab) => { window.location.hash = tab === 'home' ? '#/' : `#/${tab}`; }}
          onAppointmentClick={() => { window.location.hash = '#/login'; }}
          isScrolled={true}
        />
      </div>

      <main className="blog-detail-main">
        <div className="jlt-container">
          {/* Back link */}
          <div className="detail-top-nav">
            <a href="#/blog" className="back-to-blogs-link">
              <ArrowLeft size={16} />
              <span>Back to all articles</span>
            </a>
          </div>

          {loading ? (
            <div className="detail-loading-box">
              <div className="blog-detail-spinner" />
              <p>Loading article content...</p>
            </div>
          ) : error || !blog ? (
            <div className="detail-error-box">
              <BookOpen size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h2>Article Not Available</h2>
              <p>{error || 'The requested article does not exist.'}</p>
              <a href="#/blog" className="return-btn">
                Browse Other Articles
              </a>
            </div>
          ) : (
            <article className="blog-article-card">
              {/* Category & Date */}
              <div className="article-header">
                <span className="article-category">{blog.category}</span>
                <h1 className="article-title">{blog.title}</h1>

                <div className="article-meta-bar">
                  <div className="meta-author-box">
                    <div className="author-avatar">
                      <User size={20} />
                    </div>
                    <div>
                      <span className="author-name">{blog.author_name}</span>
                      <span className="published-date">
                        Published on {formatDate(blog.published_at || blog.created_at)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="share-btn"
                    onClick={handleShare}
                    title="Share this article"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Featured Image */}
              {blog.featured_image && (
                <div className="featured-image-wrapper">
                  <img
                    src={getBlogImageUrl(blog.featured_image)}
                    alt={blog.title}
                    className="featured-image"
                  />
                </div>
              )}

              {/* Short summary callout */}
              {blog.short_description && (
                <div className="article-summary-lead">
                  <p>{blog.short_description}</p>
                </div>
              )}

              {/* Full Blog Content */}
              <div
                className="article-rendered-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* Tags Section */}
              {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                <div className="article-tags-section">
                  <span className="tags-label">Tags:</span>
                  <div className="tags-list">
                    {blog.tags.map((t, idx) => (
                      <span key={idx} className="tag-item">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}

          {/* Related Articles Section */}
          {relatedBlogs.length > 0 && (
            <section className="related-articles-section">
              <h2 className="related-heading">Related Laboratory Insights</h2>
              <div className="related-grid">
                {relatedBlogs.map((rb) => (
                  <div key={rb.id} className="related-card">
                    {rb.featured_image ? (
                      <img src={getBlogImageUrl(rb.featured_image)} alt={rb.title} className="related-img" />
                    ) : (
                      <div className="related-img-placeholder">
                        <BookOpen size={24} />
                      </div>
                    )}
                    <div className="related-card-content">
                      <span className="related-cat">{rb.category}</span>
                      <h4 className="related-title">
                        <a href={`#/blog/${rb.slug}`}>{rb.title}</a>
                      </h4>
                      <span className="related-date">{formatDate(rb.published_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer onNavigateTab={(tab) => { window.location.hash = tab === 'home' ? '#/' : `#/${tab}`; }} />

      <style>{`
        .blog-detail-main {
          padding-top: 130px;
          padding-bottom: 5rem;
          background-color: #f8fafc;
          min-height: 80vh;
        }
        .detail-top-nav {
          margin-bottom: 2rem;
        }
        .back-to-blogs-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #047857;
          font-weight: 600;
          font-size: 0.95rem;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .back-to-blogs-link:hover {
          transform: translateX(-4px);
        }
        .blog-article-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 3rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          max-width: 900px;
          margin: 0 auto;
        }
        .article-category {
          display: inline-block;
          background: #ecfdf5;
          color: #047857;
          padding: 0.35rem 0.9rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1.25rem;
        }
        .article-title {
          font-size: 2.35rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          margin: 0 0 1.75rem 0;
          letter-spacing: -0.5px;
        }
        .article-meta-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          padding: 1.25rem 0;
          margin-bottom: 2.5rem;
        }
        .meta-author-box {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .author-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #e0f2fe;
          color: #0284c7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .author-name {
          display: block;
          font-weight: 700;
          color: #0f172a;
          font-size: 1rem;
        }
        .published-date {
          display: block;
          font-size: 0.85rem;
          color: #64748b;
        }
        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }
        .share-btn:hover { background: #e2e8f0; }
        .featured-image-wrapper {
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 2.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .featured-image {
          width: 100%;
          max-height: 600px;
          object-fit: contain;
          display: block;
        }
        .article-summary-lead {
          background: #f8fafc;
          border-left: 4px solid #047857;
          padding: 1.25rem 1.5rem;
          border-radius: 0 12px 12px 0;
          margin-bottom: 2.5rem;
          font-size: 1.15rem;
          line-height: 1.6;
          color: #334155;
          font-weight: 500;
        }
        .article-rendered-content {
          font-size: 1.1rem;
          line-height: 1.85;
          color: #1e293b;
        }
        .article-rendered-content p {
          margin-bottom: 1.4rem;
        }
        .article-rendered-content h2 {
          font-size: 1.7rem;
          font-weight: 700;
          color: #0f172a;
          margin: 2.5rem 0 1rem 0;
          letter-spacing: -0.3px;
        }
        .article-rendered-content h3 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #0f172a;
          margin: 2rem 0 0.85rem 0;
        }
        .article-rendered-content ul, .article-rendered-content ol {
          margin: 1.25rem 0 1.5rem 2rem;
        }
        .article-rendered-content li {
          margin-bottom: 0.5rem;
        }
        .article-rendered-content blockquote {
          border-left: 4px solid #047857;
          background: #f8fafc;
          padding: 1rem 1.5rem;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #475569;
          margin: 1.75rem 0;
        }
        .article-rendered-content img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5rem 0;
        }
        .article-tags-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .tags-label {
          font-weight: 700;
          font-size: 0.9rem;
          color: #475569;
        }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tag-item {
          background: #f1f5f9;
          color: #047857;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .related-articles-section {
          max-width: 900px;
          margin: 4rem auto 0 auto;
        }
        .related-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.75rem;
        }
        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .related-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .related-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.08);
        }
        .related-img {
          width: 100%;
          height: 140px;
          object-fit: cover;
        }
        .related-img-placeholder {
          width: 100%;
          height: 140px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        .related-card-content {
          padding: 1.25rem;
        }
        .related-cat {
          font-size: 0.75rem;
          font-weight: 700;
          color: #047857;
          text-transform: uppercase;
        }
        .related-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0.35rem 0 0.5rem 0;
          line-height: 1.4;
        }
        .related-title a {
          color: inherit;
          text-decoration: none;
        }
        .related-title a:hover { color: #047857; }
        .related-date {
          font-size: 0.8rem;
          color: #94a3b8;
        }
        .detail-loading-box, .detail-error-box {
          text-align: center;
          padding: 5rem 1rem;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          max-width: 600px;
          margin: 0 auto;
        }
        .blog-detail-spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #e2e8f0;
          border-top-color: #047857;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1.25rem auto;
        }
        .return-btn {
          display: inline-block;
          margin-top: 1.5rem;
          background: #047857;
          color: #ffffff;
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
        }
        @media (max-width: 768px) {
          .blog-article-card { padding: 1.5rem; }
          .article-title { font-size: 1.75rem; }
          .article-meta-bar { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default BlogDetailView;

