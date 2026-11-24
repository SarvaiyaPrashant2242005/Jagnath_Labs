/**
 * @file BlogView.jsx
 * @description Public Blog Listing view integrated seamlessly into the Jagnath Lab Landing Page.
 * Displays published blogs in attractive cards with search, category filtering, and pagination.
 */

import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, Tag, ArrowRight, BookOpen } from 'lucide-react';
import blogService from '../../blog/services/blogService';
import { getBlogImageUrl } from '../../blog/services/blogUtils';

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
        limit: 9,
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

  return (
    <div className="jlt-blog-page-root">
      {/* Hero Banner */}
      <section className="jlt-blog-hero">
        <div className="jlt-container">
          <span className="jlt-blog-badge">Laboratory Insights & Research</span>
          <h1 className="jlt-blog-hero-title">
            Scientific Articles, Technical Guides & Industry Updates
          </h1>
          <p className="jlt-blog-hero-subtitle">
            Explore expert perspectives on environmental testing, water quality assurance,
            regulatory compliance, and analytical laboratory innovations from Jagnath Lab Technologies.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="jlt-blog-search-bar">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search articles by title, chemical parameters, or keywords..."
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

      {/* Main Content & Categories */}
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

          {/* Blogs Grid */}
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
            <div className="jlt-blog-grid">
              {blogs.map((blog) => (
                <article key={blog.id} className="jlt-blog-card">
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
                      <a href={`#/blog/${blog.slug}`}>{blog.title}</a>
                    </h3>

                    <p className="card-summary">
                      {blog.short_description || 'Click read more to explore the full findings, analytical methodologies, and recommendations in this article.'}
                    </p>

                    <div className="card-footer">
                      <a
                        href={`#/blog/${blog.slug}`}
                        className="read-more-btn"
                      >
                        <span>Read More</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
          background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0284c7 100%);
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
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .jlt-blog-hero-title {
          font-size: 2.5rem;
          font-weight: 800;
          max-width: 850px;
          margin: 0 auto 1rem auto;
          line-height: 1.25;
          letter-spacing: -0.5px;
        }
        .jlt-blog-hero-subtitle {
          font-size: 1.05rem;
          max-width: 700px;
          margin: 0 auto 2rem auto;
          opacity: 0.9;
          line-height: 1.6;
        }
        .jlt-blog-search-bar {
          max-width: 650px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          background: #ffffff;
          border-radius: 50px;
          padding: 6px 8px 6px 18px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          position: relative;
        }
        .search-icon {
          color: #94a3b8;
          margin-right: 10px;
          flex-shrink: 0;
        }
        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1rem;
          color: #0f172a;
          background: transparent;
        }
        .search-submit-btn {
          background: #047857;
          color: #ffffff;
          border: none;
          padding: 0.7rem 1.5rem;
          border-radius: 40px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
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
          padding: 0.5rem 1.25rem;
          border-radius: 25px;
          font-size: 0.9rem;
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
        .jlt-blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 2rem;
        }
        .jlt-blog-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .jlt-blog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }
        .card-image-wrap {
          position: relative;
          height: 200px;
          width: 100%;
          background: #f1f5f9;
          overflow: hidden;
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .jlt-blog-card:hover .card-image {
          transform: scale(1.05);
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
          top: 12px;
          left: 12px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.7rem;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-title a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }
        .card-title a:hover {
          color: #047857;
        }
        .card-summary {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.55;
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
          justify-content: flex-end;
        }
        .read-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #047857;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: gap 0.2s ease, color 0.2s ease;
        }
        .read-more-btn:hover {
          color: #0284c7;
          gap: 0.65rem;
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
          .jlt-blog-hero-title { font-size: 1.85rem; }
          .jlt-blog-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default BlogView;

