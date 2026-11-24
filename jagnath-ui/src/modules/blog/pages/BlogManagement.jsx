/**
 * @file BlogManagement.jsx
 * @description Dedicated Blog Management page for logged-in users.
 * Displays all blogs created by the currently logged-in user with:
 * - Blog Title
 * - Featured Image / Thumbnail
 * - Short Description
 * - Category
 * - Created Date
 * - Last Updated Date
 * - Publication Status
 * - Actions (View, Edit, Delete)
 * - Prominent "+ Add New Blog" button
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaGlobe,
  FaFileAlt,
  FaCalendarAlt,
  FaFolder
} from 'react-icons/fa';
import blogService from '../services/blogService';
import { getBlogImageUrl } from '../services/blogUtils';
import BlogFormModal from '../components/BlogFormModal';

export const BlogManagement = () => {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBlogToEdit, setSelectedBlogToEdit] = useState(null);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await blogService.getMyBlogs(params);
      setBlogs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch user blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBlogs();
  };

  const handleAddNew = () => {
    setSelectedBlogToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (blog) => {
    setSelectedBlogToEdit(blog);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;
    try {
      setIsDeleting(true);
      await blogService.deleteBlog(blogToDelete.id);
      setBlogToDelete(null);
      fetchBlogs();
    } catch (err) {
      alert('Failed to delete blog: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="blog-management-container">
      {/* Top Header */}
      <div className="page-header">
        <div className="header-left">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate('/profile')}
            title="Back to Profile"
          >
            <FaArrowLeft />
            <span>Profile</span>
          </button>
          <div>
            <h2 className="title">Blog Management</h2>
            <p className="subtitle">Manage, edit, publish and review your scientific articles</p>
          </div>
        </div>

        <button
          type="button"
          className="add-blog-btn"
          onClick={handleAddNew}
        >
          <FaPlus />
          <span>Add New Blog</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        <div className="status-tabs">
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({blogs.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'Published' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Published')}
          >
            Published
          </button>
          <button
            type="button"
            className={`tab-btn ${statusFilter === 'Draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Draft')}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Blogs Content / Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your blogs...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="empty-card">
          <FaFileAlt size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
          <h3>No blogs found</h3>
          <p>You haven't written any articles under this filter yet.</p>
          <button type="button" className="add-blog-btn" onClick={handleAddNew} style={{ marginTop: '1rem' }}>
            <FaPlus /> Create Your First Blog
          </button>
        </div>
      ) : (
        <div className="blogs-table-card">
          <table className="blogs-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Thumbnail</th>
                <th>Blog Details</th>
                <th>Category</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Updated</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.featured_image ? (
                      <img src={getBlogImageUrl(b.featured_image)} alt={b.title} className="table-thumb" />
                    ) : (
                      <div className="thumb-placeholder">
                        <FaFileAlt />
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="blog-title-cell">
                      <span className="blog-title-text">{b.title}</span>
                      {b.short_description && (
                        <p className="blog-desc-text">{b.short_description}</p>
                      )}
                      <span className="blog-slug-text">slug: {b.slug}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">
                      <FaFolder size={11} /> {b.category}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${b.status.toLowerCase()}`}>
                      {b.status === 'Published' ? <FaGlobe size={11} /> : <FaFileAlt size={11} />}
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <span className="date-text">
                      <FaCalendarAlt size={11} /> {formatDate(b.created_at)}
                    </span>
                  </td>
                  <td>
                    <span className="date-text">{formatDate(b.updated_at)}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {b.status === 'Published' && (
                        <a
                          href={`#/blog/${b.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="action-icon-btn view"
                          title="View Live Blog"
                        >
                          <FaEye />
                        </a>
                      )}
                      <button
                        type="button"
                        className="action-icon-btn edit"
                        onClick={() => handleEdit(b)}
                        title="Edit Blog"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        onClick={() => setBlogToDelete(b)}
                        title="Delete Blog"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blog Creation & Edit Modal */}
      <BlogFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blogToEdit={selectedBlogToEdit}
        onSaveSuccess={fetchBlogs}
      />

      {/* Delete Confirmation Popup */}
      {blogToDelete && (
        <div className="modal-backdrop">
          <div className="delete-confirm-box">
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Delete Blog</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 1.5rem 0' }}>
              Are you sure you want to permanently delete <strong>"{blogToDelete.title}"</strong>?
              This will also remove it from the public landing page.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setBlogToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .blog-management-container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.5rem 0.85rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover { background-color: #e2e8f0; color: #0f172a; }
        .title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }
        .subtitle {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
        }
        .add-blog-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #047857;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 0.65rem 1.25rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(4, 120, 87, 0.2);
          transition: all 0.2s;
        }
        .add-blog-btn:hover { background: #065f46; transform: translateY(-1px); }
        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          background: #ffffff;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 260px;
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          color: #94a3b8;
          font-size: 0.85rem;
        }
        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
          outline: none;
        }
        .search-input:focus { border-color: #047857; }
        .search-btn {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 0.5rem 0.85rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          color: #334155;
          cursor: pointer;
        }
        .search-btn:hover { background: #e2e8f0; }
        .status-tabs {
          display: flex;
          gap: 0.25rem;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 8px;
        }
        .tab-btn {
          border: none;
          background: transparent;
          padding: 0.45rem 0.85rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
        }
        .tab-btn.active {
          background: #ffffff;
          color: #047857;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .blogs-table-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .blogs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          text-align: left;
        }
        .blogs-table th {
          background: #f8fafc;
          padding: 0.85rem 1rem;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .blogs-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .blogs-table tr:hover td {
          background: #f8fafc;
        }
        .table-thumb {
          width: 60px;
          height: 44px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .thumb-placeholder {
          width: 60px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
        }
        .blog-title-cell {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .blog-title-text {
          font-weight: 600;
          color: #0f172a;
          font-size: 0.95rem;
        }
        .blog-desc-text {
          margin: 0;
          font-size: 0.8rem;
          color: #64748b;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-slug-text {
          font-size: 0.75rem;
          color: #94a3b8;
          font-family: monospace;
        }
        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #ecfdf5;
          color: #047857;
          padding: 0.25rem 0.65rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.65rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .status-pill.published {
          background: #dcfce7;
          color: #15803d;
        }
        .status-pill.draft {
          background: #f1f5f9;
          color: #475569;
        }
        .date-text {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #64748b;
          font-size: 0.85rem;
        }
        .actions-cell {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          transition: all 0.2s;
        }
        .action-icon-btn.view { color: #0284c7; }
        .action-icon-btn.view:hover { background: #e0f2fe; border-color: #0284c7; }
        .action-icon-btn.edit { color: #047857; }
        .action-icon-btn.edit:hover { background: #dcfce7; border-color: #047857; }
        .action-icon-btn.delete { color: #dc2626; }
        .action-icon-btn.delete:hover { background: #fee2e2; border-color: #dc2626; }
        .loading-state, .empty-card {
          padding: 3rem;
          text-align: center;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e2e8f0;
          border-top-color: #047857;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1rem auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .delete-confirm-box {
          background: #ffffff;
          padding: 1.75rem;
          border-radius: 14px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .btn-delete-confirm {
          background: #dc2626;
          color: #ffffff;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-delete-confirm:hover { background: #b91c1c; }
      `}</style>
    </div>
  );
};

export default BlogManagement;

