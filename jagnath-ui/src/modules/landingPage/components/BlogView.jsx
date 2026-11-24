/**
 * @file BlogView.jsx
 * @description Premium Scientific & Laboratory Knowledge Platform view for Jagnath Lab Technologies.
 * Displays:
 * - Clean editorial header: "Knowledge & Insights"
 * - Prominent Hero Featured Blog
 * - Category filter pills & Live Search
 * - Responsive 3-column editorial grid
 * - Entire clickable card surface
 */

import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, ArrowRight, BookOpen, Clock, Tag, Share2 } from 'lucide-react';
import blogService from '../../blog/services/blogService';
import { getBlogImageUrl, calculateReadingTime } from '../../blog/services/blogUtils';

export const BlogView = ({ onReadBlog, onAppointmentClick }) => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await blogService.getPublicCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch published blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
      };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await blogService.getPublicBlogs(params);
      if (res.data) {
        setBlogs(res.data.blogs || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load public blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Hero Featured Blog only when there are multiple articles (>= 3)
  // If there are only 1 or 2 articles, display all articles in the grid so the hero does not look weird or empty
  const hasFeaturedHero = page === 1 && !searchQuery.trim() && selectedCategory === 'all' && blogs.length >= 3;
  const featuredBlog = hasFeaturedHero ? blogs[0] : null;
  const gridBlogs = hasFeaturedHero ? blogs.slice(1) : blogs;

  return (
    <div className="jlt-blog-page-root">
      {/* 1. Header & Navigation Intro Banner */}
      <section className="jlt-blog-hero">
        <div className="jlt-container">
          <div className="jlt-blog-badge">
            <span>Knowledge Hub</span>
          </div>
          <h1 className="jlt-blog-hero-title">
            Knowledge & Insights
          </h1>
          <p className="jlt-blog-hero-subtitle">
            Explore scientific knowledge, laboratory expertise, research, testing insights, and the latest developments from Jagnath Lab Technologies.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="jlt-blog-search-bar">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search scientific articles, parameters, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-submit-btn">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 2. Main Blog Content Container */}
      <section className="jlt-blog-content-section">
        <div className="jlt-container">
          {/* Category Filter Pills */}
          <div className="jlt-category-pills">
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => { setSelectedCategory('all'); setPage(1); }}
            >
              All Articles
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="jlt-blog-loading">
              <div className="blog-spinner" />
              <p>Fetching scientific articles...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="jlt-blog-empty">
              <BookOpen size={48} className="empty-icon" />
              <h3>No articles found</h3>
              <p>There are no published articles matching your criteria right now. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Featured Blog Banner (Top Hero on Page 1) */}
              {featuredBlog && (
                <div className="jlt-featured-hero-wrap">
                  <a
                    href={`#/blog/${featuredBlog.slug}`}
                    className="jlt-featured-hero-card"
                    aria-label={`Read featured article: ${featuredBlog.title}`}
                  >
                    <div className="featured-hero-image-box">
                      {featuredBlog.featured_image ? (
                        <img
                          src={getBlogImageUrl(featuredBlog.featured_image)}
                          alt={featuredBlog.title}
                          className="featured-hero-image"
                        />
                      ) : (
                        <div className="featured-hero-placeholder">
                          <BookOpen size={56} />
                        </div>
                      )}
                      <span className="featured-badge-pill">Featured Article</span>
                    </div>

                    <div className="featured-hero-content">
                      <div className="featured-category-tag">{featuredBlog.category}</div>
                      <h2 className="featured-hero-title">{featuredBlog.title}</h2>
                      <p className="featured-hero-summary">
                        {featuredBlog.short_description || 'Explore the technical methodologies, environmental considerations, and analytical laboratory findings.'}
                      </p>

                      <div className="featured-hero-meta-row">
                        <div className="meta-author-group">
                          <div className="meta-avatar">{featuredBlog.author_name ? featuredBlog.author_name.charAt(0).toUpperCase() : 'J'}</div>
                          <div>
                            <span className="meta-author-name">{featuredBlog.author_name}</span>
                            <span className="meta-date">{formatDate(featuredBlog.published_at || featuredBlog.created_at)}</span>
                          </div>
                        </div>

                        <div className="featured-read-action">
                          <span className="read-time">{calculateReadingTime(featuredBlog.content)}</span>
                          <span className="read-more-link">
                            <span>Read Article</span>
                            <ArrowRight size={15} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              )}

              {/* Grid of Articles */}
              <div className="jlt-blog-grid">
                {gridBlogs.map((blog) => (
                  <a
                    key={blog.id}
                    href={`#/blog/${blog.slug}`}
                    className="jlt-blog-card"
                    aria-label={`Read article: ${blog.title}`}
                  >
                    <div className="card-image-wrap">
                      {blog.featured_image ? (
                        <img
                          src={getBlogImageUrl(blog.featured_image)}
                          alt={blog.title}
                          className="card-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="card-image-placeholder">
                          <BookOpen size={36} />
                        </div>
                      )}
                      <span className="card-category-badge">{blog.category}</span>
                    </div>

                    <div className="card-body">
                      <div className="card-meta">
                        <span className="meta-item">
                          <User size={13} /> {blog.author_name}
                        </span>
                        <span className="meta-item">
                          <Calendar size={13} /> {formatDate(blog.published_at || blog.created_at)}
                        </span>
                      </div>

                      <h3 className="card-title" title={blog.title}>
                        <span>{blog.title}</span>
                      </h3>

                      <p className="card-summary">
                        {blog.short_description || 'Click read more to explore the full findings, analytical methodologies, and recommendations in this article.'}
                      </p>

                      <div className="card-footer">
                        <span className="card-read-time">{calculateReadingTime(blog.content)}</span>
                        <div className="read-more-btn">
                          <span>Read More</span>
                          <ArrowRight size={14} className="read-more-arrow" />
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="jlt-blog-pagination">
              <button
                type="button"
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .jlt-blog-page-root {
          width: 100%;
          min-height: 80vh;
          background-color: #f8fafc;
        }
        .jlt-blog-hero {
          background: linear-gradient(135deg, #064e3b 0%, #047857 55%, #0284c7 100%);
          color: #ffffff;
          padding: 5rem 1rem 4rem 1rem;
          text-align: center;
        }
        .jlt-blog-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 0.35rem 1rem;
          border-radius: 30px;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
          text-transform: uppercase;
        }
        .jlt-blog-hero-title {
          font-size: 2.75rem;
          font-weight: 800;
          max-width: 850px;
          margin: 0 auto 1rem auto;
          line-height: 1.25;
          letter-spacing: -0.5px;
        }
        .jlt-blog-hero-subtitle {
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.9);
          max-width: 680px;
          margin: 0 auto 2rem auto;
          line-height: 1.6;
        }
        .jlt-blog-search-bar {
          display: flex;
          align-items: center;
          max-width: 540px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 40px;
          padding: 0.35rem 0.5rem 0.35rem 1.25rem;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
        }
        .search-icon { color: #94a3b8; margin-right: 0.5rem; flex-shrink: 0; }
        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 0.95rem;
          color: #1e293b;
          font-family: inherit;
        }
        .search-submit-btn {
          background: #047857;
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 0.65rem 1.5rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .search-submit-btn:hover { background: #065f46; }
        .jlt-blog-content-section {
          padding: 3rem 1rem 5rem 1rem;
        }
        .jlt-category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin-bottom: 2.5rem;
          justify-content: center;
        }
        .cat-pill {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 0.45rem 1.15rem;
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cat-pill:hover {
          border-color: #047857;
          color: #047857;
        }
        .cat-pill.active {
          background: #047857;
          color: #ffffff;
          border-color: #047857;
          box-shadow: 0 2px 8px rgba(4, 120, 87, 0.25);
        }

        /* Featured Hero Article */
        .jlt-featured-hero-wrap {
          margin-bottom: 3rem;
        }
        .jlt-featured-hero-card {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);
          text-decoration: none;
          color: inherit;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .jlt-featured-hero-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 35px -10px rgba(15, 23, 42, 0.1);
          border-color: #a7f3d0;
        }
        .featured-hero-image-box {
          position: relative;
          min-height: 340px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .featured-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .jlt-featured-hero-card:hover .featured-hero-image {
          transform: scale(1.04);
        }
        .featured-hero-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%);
          color: #047857;
        }
        .featured-badge-pill {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #047857;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.85rem;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .featured-hero-content {
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .featured-category-tag {
          font-size: 0.8rem;
          font-weight: 700;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 0.65rem;
        }
        .featured-hero-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.3;
          margin: 0 0 1rem 0;
          transition: color 0.2s ease;
        }
        .jlt-featured-hero-card:hover .featured-hero-title {
          color: #047857;
        }
        .featured-hero-summary {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.65;
          margin: 0 0 1.75rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .featured-hero-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          padding-top: 1.25rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .meta-author-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .meta-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #047857;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #a7f3d0;
        }
        .meta-author-name {
          display: block;
          font-weight: 700;
          font-size: 0.9rem;
          color: #0f172a;
        }
        .meta-date {
          display: block;
          font-size: 0.78rem;
          color: #64748b;
        }
        .featured-read-action {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .read-time {
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .read-more-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #047857;
          font-weight: 700;
          font-size: 0.9rem;
          transition: gap 0.2s ease, color 0.2s ease;
        }
        .jlt-featured-hero-card:hover .read-more-link {
          color: #0284c7;
          gap: 0.65rem;
        }

        /* 3-Column Articles Grid */
        .jlt-blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 380px));
          gap: 2rem;
          justify-content: flex-start;
        }
        @media (max-width: 1100px) {
          .jlt-featured-hero-card { grid-template-columns: 1fr; }
          .jlt-blog-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        }
        @media (max-width: 680px) {
          .jlt-blog-grid { grid-template-columns: 1fr; gap: 1.5rem; }
        }
        .jlt-blog-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
          max-width: 420px;
          width: 100%;
        }
        .jlt-blog-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
          border-color: #a7f3d0;
        }
        .jlt-blog-card:focus-visible {
          outline: 2px solid #047857;
          outline-offset: 2px;
        }
        .card-image-wrap {
          position: relative;
          height: 220px;
          width: 100%;
          background: #f1f5f9;
          overflow: hidden;
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
          transition: transform 0.4s ease;
        }
        .jlt-blog-card:hover .card-image {
          transform: scale(1.04);
        }
        .card-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #ecfdf5 0%, #e0f2fe 100%);
          color: #047857;
        }
        .card-category-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(6px);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.25rem 0.7rem;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.75rem;
        }
        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.2s ease;
        }
        .jlt-blog-card:hover .card-title {
          color: #047857;
        }
        .card-summary {
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 1.25rem 0;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-footer {
          border-top: 1px solid #f1f5f9;
          padding-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-read-time {
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .read-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #047857;
          font-weight: 700;
          font-size: 0.88rem;
          transition: gap 0.2s ease, color 0.2s ease;
        }
        .jlt-blog-card:hover .read-more-btn {
          color: #0284c7;
          gap: 0.65rem;
        }
        .read-more-arrow {
          transition: transform 0.2s ease;
        }
        .jlt-blog-card:hover .read-more-arrow {
          transform: translateX(3px);
        }
        .jlt-blog-loading, .jlt-blog-empty {
          text-align: center;
          padding: 4rem 1rem;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }
        .blog-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #047857;
          border-radius: 50%;
          animation: blogSpin 0.8s linear infinite;
          margin: 0 auto 1rem auto;
        }
        @keyframes blogSpin { to { transform: rotate(360deg); } }
        .empty-icon {
          color: #94a3b8;
          margin-bottom: 1rem;
        }
        .jlt-blog-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 3.5rem;
        }
        .page-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled) {
          border-color: #047857;
          color: #047857;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-indicator {
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
        }
        @media (max-width: 768px) {
          .jlt-blog-hero-title { font-size: 2rem; }
          .featured-hero-content { padding: 1.5rem; }
          .featured-hero-title { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
};

export default BlogView;
