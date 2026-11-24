/**
 * @file BlogDetailView.jsx
 * @description Premium Two-Column Editorial Blog Details Page for Jagnath Lab Technologies.
 * Inspired directly by the user reference design:
 * - Left/Main Content Column (~70%):
 *   - Clean Breadcrumb: Home → Category → Title
 *   - Category badge pill
 *   - High-impact Title & Lead summary
 *   - Author avatar, name, published date, reading time & stats
 *   - Action buttons: Bookmark, Share, More
 *   - Large prominent Featured Image
 *   - Formatted scientific article content with auto-linked H2/H3 headings
 *   - Tags section
 * - Right Sidebar Column (~30%):
 *   - Dynamic Table of Contents with active heading spy & smooth scrolling
 *   - Related Articles cards with thumbnails & reading times
 *   - Category tags cloud
 *   - Share buttons bar (WhatsApp, LinkedIn, X, Facebook, Copy Link)
 *   - Newsletter / Subscription callout
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Eye,
  Bookmark,
  Share2,
  ChevronRight,
  List,
  Mail,
  Copy,
  Check,
  BookOpen
} from 'lucide-react';
import { FaWhatsapp, FaLinkedinIn, FaFacebookF, FaTwitter } from 'react-icons/fa';
import blogService from '../../blog/services/blogService';
import {
  getBlogImageUrl,
  calculateReadingTime,
  processContentWithHeadings
} from '../../blog/services/blogUtils';
import TopBar from './TopBar';
import Navbar from './Navbar';
import Footer from './Footer';

export const BlogDetailView = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState('');

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

  const blog = data?.blog;
  const relatedBlogs = data?.relatedBlogs || [];

  // Parse headings and inject IDs into the article content
  const { processedHtml, headings } = useMemo(() => {
    if (!blog?.content) return { processedHtml: '', headings: [] };
    return processContentWithHeadings(blog.content);
  }, [blog?.content]);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveHeadingId(headings[i].id);
          return;
        }
      }
      if (headings.length > 0) setActiveHeadingId(headings[0].id);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSocialShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blog?.title || 'Jagnath Lab Technologies Article');
    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      default:
        handleCopyLink();
        return;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offsetTop = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

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

      <main className="blog-editorial-main">
        <div className="jlt-container">
          {/* Breadcrumb Navigation */}
          {blog && (
            <nav className="blog-editorial-breadcrumb" aria-label="Breadcrumb">
              <a href="#/">Home</a>
              <ChevronRight size={14} className="crumb-sep" />
              <a href="#/blog">{blog.category || 'Insights'}</a>
              <ChevronRight size={14} className="crumb-sep" />
              <span className="crumb-current">{blog.title}</span>
            </nav>
          )}

          {loading ? (
            <div className="editorial-loading-box">
              <div className="blog-editorial-spinner" />
              <p>Loading scientific article...</p>
            </div>
          ) : error || !blog ? (
            <div className="editorial-error-box">
              <BookOpen size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h2>Article Not Available</h2>
              <p>{error || 'The requested article does not exist.'}</p>
              <a href="#/blog" className="editorial-return-btn">
                Browse All Articles
              </a>
            </div>
          ) : (
            <div className="editorial-two-column-layout">
              {/* ================= LEFT COLUMN: MAIN CONTENT (~70%) ================= */}
              <div className="editorial-main-content">
                <article className="editorial-article-sheet">
                  {/* Category Pill */}
                  <div className="editorial-category-badge">
                    <span>{blog.category}</span>
                  </div>

                  {/* Title */}
                  <h1 className="editorial-article-title">{blog.title}</h1>

                  {/* Subtitle / Short Description */}
                  {blog.short_description && (
                    <p className="editorial-lead-summary">{blog.short_description}</p>
                  )}

                  {/* Meta Bar: Author, Date, Reading Time, Actions */}
                  <div className="editorial-meta-row">
                    <div className="editorial-author-meta">
                      <div className="editorial-author-avatar">
                        {blog.author_name ? blog.author_name.charAt(0).toUpperCase() : 'J'}
                      </div>
                      <div className="editorial-author-info">
                        <span className="author-name">{blog.author_name}</span>
                        <div className="meta-subline">
                          <span className="meta-date">
                            <Calendar size={13} /> {formatDate(blog.published_at || blog.created_at)}
                          </span>
                          <span className="meta-dot">•</span>
                          <span className="meta-time">
                            <Clock size={13} /> {calculateReadingTime(blog.content)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="editorial-quick-actions">
                      <button
                        type="button"
                        className={`action-icon-btn ${bookmarked ? 'active' : ''}`}
                        onClick={() => setBookmarked(!bookmarked)}
                        title={bookmarked ? 'Saved to bookmarks' : 'Bookmark this article'}
                      >
                        <Bookmark size={16} />
                      </button>
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={handleCopyLink}
                        title="Copy article link"
                      >
                        {copiedLink ? <Check size={16} color="#047857" /> : <Share2 size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Featured Image */}
                  {blog.featured_image && (
                    <div className="editorial-featured-img-box">
                      <img
                        src={getBlogImageUrl(blog.featured_image)}
                        alt={blog.title}
                        className="editorial-featured-img"
                      />
                    </div>
                  )}

                  {/* Full Rendered Rich-Text Content with Heading Anchors */}
                  <div
                    className="editorial-rendered-body"
                    dangerouslySetInnerHTML={{ __html: processedHtml || blog.content }}
                  />

                  {/* Article Tags */}
                  {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                    <div className="editorial-tags-wrap">
                      <span className="tags-label">Tags:</span>
                      <div className="tags-chips">
                        {blog.tags.map((t, idx) => (
                          <span key={idx} className="tag-chip">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              </div>

              {/* ================= RIGHT COLUMN: SIDEBAR (~30%) ================= */}
              <aside className="editorial-sidebar">
                {/* 1. Table of Contents Card (Sticky on desktop) */}
                {headings.length > 0 && (
                  <div className="sidebar-card toc-card">
                    <div className="sidebar-card-header">
                      <List size={17} className="header-icon" />
                      <h3 className="sidebar-card-title">Table of Contents</h3>
                    </div>
                    <nav className="toc-nav">
                      {headings.map((h) => {
                        const isActive = activeHeadingId === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            className={`toc-item-link level-${h.level} ${isActive ? 'active' : ''}`}
                            onClick={() => scrollToSection(h.id)}
                          >
                            <span className="toc-chevron">{isActive ? '•' : '›'}</span>
                            <span className="toc-text">{h.text}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                )}

                {/* 2. Related Articles Card */}
                {relatedBlogs.length > 0 && (
                  <div className="sidebar-card related-sidebar-card">
                    <div className="sidebar-card-header">
                      <BookOpen size={17} className="header-icon" />
                      <h3 className="sidebar-card-title">Related Articles</h3>
                    </div>
                    <div className="sidebar-related-list">
                      {relatedBlogs.map((rb) => (
                        <a
                          key={rb.id}
                          href={`#/blog/${rb.slug}`}
                          className="sidebar-related-item"
                          aria-label={`Read ${rb.title}`}
                        >
                          <div className="related-thumb-box">
                            {rb.featured_image ? (
                              <img src={getBlogImageUrl(rb.featured_image)} alt={rb.title} className="related-thumb" />
                            ) : (
                              <div className="related-thumb-placeholder">
                                <BookOpen size={16} />
                              </div>
                            )}
                          </div>
                          <div className="related-thumb-info">
                            <h4 className="related-thumb-title">{rb.title}</h4>
                            <div className="related-thumb-meta">
                              <span>{formatDate(rb.published_at)}</span>
                              <span>•</span>
                              <span>{calculateReadingTime(rb.content)}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Tags Cloud Card */}
                {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                  <div className="sidebar-card tags-sidebar-card">
                    <div className="sidebar-card-header">
                      <h3 className="sidebar-card-title">Tags</h3>
                    </div>
                    <div className="sidebar-tags-cloud">
                      {blog.tags.map((t, idx) => (
                        <span key={idx} className="sidebar-tag-pill">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Social Sharing Card */}
                <div className="sidebar-card share-sidebar-card">
                  <div className="sidebar-card-header">
                    <h3 className="sidebar-card-title">Share this Article</h3>
                  </div>
                  <div className="share-buttons-row">
                    <button
                      type="button"
                      className="share-social-btn whatsapp-btn"
                      onClick={() => handleSocialShare('whatsapp')}
                      title="Share on WhatsApp"
                    >
                      <FaWhatsapp size={16} />
                    </button>
                    <button
                      type="button"
                      className="share-social-btn linkedin-btn"
                      onClick={() => handleSocialShare('linkedin')}
                      title="Share on LinkedIn"
                    >
                      <FaLinkedinIn size={15} />
                    </button>
                    <button
                      type="button"
                      className="share-social-btn twitter-btn"
                      onClick={() => handleSocialShare('twitter')}
                      title="Share on X"
                    >
                      <FaTwitter size={15} />
                    </button>
                    <button
                      type="button"
                      className="share-social-btn facebook-btn"
                      onClick={() => handleSocialShare('facebook')}
                      title="Share on Facebook"
                    >
                      <FaFacebookF size={15} />
                    </button>
                    <button
                      type="button"
                      className="share-social-btn copy-btn"
                      onClick={handleCopyLink}
                      title="Copy Link to Clipboard"
                    >
                      {copiedLink ? <Check size={16} color="#047857" /> : <Copy size={15} />}
                    </button>
                  </div>
                </div>

                {/* 5. Newsletter / Subscription Card */}
                <div className="sidebar-card subscribe-sidebar-card">
                  <div className="subscribe-icon-box">
                    <Mail size={22} />
                  </div>
                  <h4 className="subscribe-card-title">Get Scientific Updates in Your Inbox</h4>
                  <p className="subscribe-card-text">
                    Subscribe to receive the latest analytical testing methodologies, GPCB standards, and research from Jagnath Labs.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing to Jagnath Labs updates!'); }} className="subscribe-form">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      required
                      className="subscribe-input"
                    />
                    <button type="submit" className="subscribe-submit-btn">
                      Subscribe
                    </button>
                  </form>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer onNavigateTab={(tab) => { window.location.hash = tab === 'home' ? '#/' : `#/${tab}`; }} />

      <style>{`
        .blog-editorial-main {
          padding-top: 120px;
          padding-bottom: 5rem;
          background-color: #f8fafc;
          min-height: 85vh;
        }

        /* Breadcrumbs */
        .blog-editorial-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .blog-editorial-breadcrumb a {
          color: #64748b;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .blog-editorial-breadcrumb a:hover {
          color: #047857;
        }
        .crumb-sep {
          color: #cbd5e1;
        }
        .crumb-current {
          color: #0f172a;
          font-weight: 600;
          max-width: 450px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Two-Column Editorial Grid Layout */
        .editorial-two-column-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .editorial-two-column-layout {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
        }

        /* ================= Left Column Article Sheet ================= */
        .editorial-article-sheet {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 3rem;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.04);
        }
        @media (max-width: 768px) {
          .editorial-article-sheet { padding: 1.75rem 1.25rem; border-radius: 14px; }
        }

        .editorial-category-badge {
          display: inline-block;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          padding: 0.35rem 0.9rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1.25rem;
        }

        .editorial-article-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          margin: 0 0 1.25rem 0;
          letter-spacing: -0.5px;
        }
        @media (max-width: 768px) {
          .editorial-article-title { font-size: 1.85rem; }
        }

        .editorial-lead-summary {
          font-size: 1.15rem;
          color: #475569;
          line-height: 1.65;
          margin: 0 0 2rem 0;
          font-weight: 400;
        }

        /* Meta Row */
        .editorial-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          padding: 1.15rem 0;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .editorial-author-meta {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .editorial-author-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-weight: 700;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .author-name {
          display: block;
          font-weight: 700;
          color: #0f172a;
          font-size: 0.95rem;
        }
        .meta-subline {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #64748b;
          margin-top: 2px;
        }
        .meta-date, .meta-time {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }
        .meta-dot { color: #cbd5e1; }

        .editorial-quick-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .action-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .action-icon-btn:hover {
          background: #ffffff;
          border-color: #047857;
          color: #047857;
        }
        .action-icon-btn.active {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }

        /* Featured Image Box */
        .editorial-featured-img-box {
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2.5rem;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          max-height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .editorial-featured-img {
          width: 100%;
          height: 100%;
          max-height: 480px;
          object-fit: cover;
          display: block;
        }

        /* Rendered HTML Typography */
        .editorial-rendered-body {
          font-size: 1.1rem;
          line-height: 1.85;
          color: #334155;
        }
        .editorial-rendered-body p {
          margin-bottom: 1.5rem;
        }
        .editorial-rendered-body h2 {
          font-size: 1.65rem;
          font-weight: 700;
          color: #0f172a;
          margin: 2.75rem 0 1rem 0;
          letter-spacing: -0.3px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .editorial-rendered-body h2::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 24px;
          background: #047857;
          border-radius: 2px;
        }
        .editorial-rendered-body h3 {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          margin: 2rem 0 0.85rem 0;
        }
        .editorial-rendered-body ul, .editorial-rendered-body ol {
          margin: 1.25rem 0 1.5rem 2rem;
        }
        .editorial-rendered-body li {
          margin-bottom: 0.6rem;
        }
        .editorial-rendered-body blockquote {
          border-left: 4px solid #047857;
          background: #f0fdf4;
          padding: 1.25rem 1.75rem;
          border-radius: 0 10px 10px 0;
          font-style: italic;
          color: #1e3a8a;
          margin: 2rem 0;
          font-size: 1.05rem;
        }
        .editorial-rendered-body img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.75rem 0;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }
        .editorial-rendered-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.95rem;
        }
        .editorial-rendered-body th, .editorial-rendered-body td {
          border: 1px solid #e2e8f0;
          padding: 0.65rem 1rem;
          text-align: left;
        }
        .editorial-rendered-body th {
          background: #f8fafc;
          font-weight: 700;
          color: #0f172a;
        }

        /* Tags wrap */
        .editorial-tags-wrap {
          margin-top: 3.5rem;
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
        .tags-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .tag-chip {
          background: #f1f5f9;
          color: #047857;
          padding: 0.3rem 0.85rem;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }

        /* ================= Right Column Sidebar ================= */
        .editorial-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          position: sticky;
          top: 110px;
        }

        .sidebar-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.04);
        }

        .sidebar-card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .header-icon {
          color: #047857;
        }
        .sidebar-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        /* Table of Contents Nav */
        .toc-nav {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .toc-item-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          text-align: left;
          font-family: inherit;
          font-size: 0.86rem;
          color: #475569;
          padding: 0.45rem 0.65rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
          width: 100%;
        }
        .toc-item-link:hover {
          background: #f0fdf4;
          color: #047857;
        }
        .toc-item-link.active {
          background: #ecfdf5;
          color: #047857;
          font-weight: 600;
        }
        .toc-chevron {
          font-weight: 700;
          color: #94a3b8;
        }
        .toc-item-link.active .toc-chevron {
          color: #047857;
        }
        .toc-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .toc-item-link.level-3 {
          padding-left: 1.5rem;
          font-size: 0.82rem;
        }

        /* Related Articles in Sidebar */
        .sidebar-related-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .sidebar-related-item {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          text-decoration: none;
          color: inherit;
          padding: 0.45rem;
          border-radius: 10px;
          transition: background 0.18s;
        }
        .sidebar-related-item:hover {
          background: #f8fafc;
        }
        .related-thumb-box {
          width: 64px;
          height: 52px;
          border-radius: 8px;
          overflow: hidden;
          background: #f1f5f9;
          flex-shrink: 0;
        }
        .related-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .related-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #047857;
          background: #ecfdf5;
        }
        .related-thumb-info {
          flex: 1;
          min-width: 0;
        }
        .related-thumb-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.35;
          margin: 0 0 0.25rem 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sidebar-related-item:hover .related-thumb-title {
          color: #047857;
        }
        .related-thumb-meta {
          font-size: 0.75rem;
          color: #94a3b8;
          display: flex;
          gap: 0.35rem;
        }

        /* Sidebar Tags */
        .sidebar-tags-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .sidebar-tag-pill {
          background: #f1f5f9;
          color: #047857;
          padding: 0.25rem 0.65rem;
          border-radius: 14px;
          font-size: 0.78rem;
          font-weight: 600;
        }

        /* Share Buttons Row */
        .share-buttons-row {
          display: flex;
          gap: 0.65rem;
        }
        .share-social-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          cursor: pointer;
          transition: transform 0.18s, opacity 0.18s;
        }
        .share-social-btn:hover {
          transform: translateY(-2px);
          opacity: 0.9;
        }
        .whatsapp-btn { background: #25d366; }
        .linkedin-btn { background: #0077b5; }
        .twitter-btn { background: #0f172a; }
        .facebook-btn { background: #1877f2; }
        .copy-btn { background: #64748b; }

        /* Subscribe Card */
        .subscribe-sidebar-card {
          background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
          border-color: #a7f3d0;
        }
        .subscribe-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #047857;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.85rem;
        }
        .subscribe-card-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: #065f46;
          margin: 0 0 0.4rem 0;
        }
        .subscribe-card-text {
          font-size: 0.82rem;
          color: #047857;
          line-height: 1.5;
          margin: 0 0 1rem 0;
        }
        .subscribe-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .subscribe-input {
          padding: 0.55rem 0.85rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
        }
        .subscribe-input:focus {
          border-color: #047857;
        }
        .subscribe-submit-btn {
          padding: 0.55rem;
          border-radius: 8px;
          background: #047857;
          color: #ffffff;
          border: none;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.18s;
        }
        .subscribe-submit-btn:hover {
          background: #065f46;
        }

        /* Loading / Error */
        .editorial-loading-box, .editorial-error-box {
          text-align: center;
          padding: 5rem 1rem;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          max-width: 600px;
          margin: 0 auto;
        }
        .blog-editorial-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #e2e8f0;
          border-top-color: #047857;
          border-radius: 50%;
          animation: editorialSpin 0.8s linear infinite;
          margin: 0 auto 1.25rem auto;
        }
        @keyframes editorialSpin { to { transform: rotate(360deg); } }
        .editorial-return-btn {
          display: inline-block;
          background: #047857;
          color: #ffffff;
          padding: 0.65rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default BlogDetailView;
