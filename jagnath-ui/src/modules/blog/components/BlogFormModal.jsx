/**
 * @file BlogFormModal.jsx
 * @description Modal form to create or edit a blog article.
 * Fields:
 * - Blog Title
 * - Short Description / Summary
 * - Blog Featured Image (file upload + preview)
 * - Blog Content (BlogRichEditor)
 * - Blog Category
 * - Tags / Keywords
 * - Author Name (auto-populated with user name)
 * - Publication Status (Draft / Published)
 */

import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUpload, FaTrash, FaGlobe } from 'react-icons/fa';
import BlogRichEditor from './BlogRichEditor';
import blogService from '../services/blogService';
import { getBlogImageUrl } from '../services/blogUtils';
import { getStoredUser } from '../../auth/services/authService';

const DEFAULT_CATEGORIES = [
  'Environmental Testing',
  'Water Quality',
  'Air Quality Monitoring',
  'Soil & Agricultural Testing',
  'Laboratory Quality & Safety',
  'Regulatory & GPCB Compliance',
  'General Research'
];

export const BlogFormModal = ({
  isOpen,
  onClose,
  blogToEdit = null,
  onSaveSuccess
}) => {
  const user = getStoredUser() || {};

  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    featured_image: '',
    content: '',
    category: DEFAULT_CATEGORIES[0],
    tags: '',
    author_name: user.name || 'Jagnath Lab Team',
    status: 'Draft'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (blogToEdit) {
      setFormData({
        title: blogToEdit.title || '',
        short_description: blogToEdit.short_description || '',
        featured_image: blogToEdit.featured_image || '',
        content: blogToEdit.content || '',
        category: blogToEdit.category || DEFAULT_CATEGORIES[0],
        tags: Array.isArray(blogToEdit.tags) ? blogToEdit.tags.join(', ') : (blogToEdit.tags || ''),
        author_name: blogToEdit.author_name || user.name || 'Jagnath Lab Team',
        status: blogToEdit.status || 'Draft'
      });
      setImagePreview(blogToEdit.featured_image || '');
    } else {
      setFormData({
        title: '',
        short_description: '',
        featured_image: '',
        content: '',
        category: DEFAULT_CATEGORIES[0],
        tags: '',
        author_name: user.name || 'Jagnath Lab Team',
        status: 'Draft'
      });
      setImageFile(null);
      setImagePreview('');
    }
    setErrorMsg('');
  }, [blogToEdit, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Image size exceeds 10MB limit.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, featured_image: '' }));
  };

  const handleEditorImageUpload = async (file) => {
    const res = await blogService.uploadImage(file);
    if (res?.data?.url) {
      return res.data.url;
    }
    throw new Error('Image upload failed');
  };

  const handleSubmit = async (targetStatus) => {
    setErrorMsg('');
    if (!formData.title.trim()) {
      setErrorMsg('Please enter a blog title.');
      return;
    }
    if (!formData.category.trim()) {
      setErrorMsg('Please select or specify a category.');
      return;
    }
    if (!formData.content.trim()) {
      setErrorMsg('Please provide blog content.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalFeaturedImageUrl = formData.featured_image;

      // If user uploaded a new local file, upload it to server first
      if (imageFile) {
        const uploadRes = await blogService.uploadImage(imageFile);
        if (uploadRes?.data?.url) {
          finalFeaturedImageUrl = uploadRes.data.url;
        }
      }

      const tagsArray = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title.trim(),
        short_description: formData.short_description.trim(),
        featured_image: finalFeaturedImageUrl,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        author_name: formData.author_name || user.name || 'Jagnath Lab Team',
        status: targetStatus || formData.status
      };

      if (blogToEdit && blogToEdit.id) {
        await blogService.updateBlog(blogToEdit.id, payload);
      } else {
        await blogService.createBlog(payload);
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save blog:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {blogToEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h3>
            <p className="modal-subtitle">
              Compose scientific articles, laboratory updates, and insights.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>

        {/* Form Body */}
        <div className="modal-body">
          {errorMsg && (
            <div className="alert-error">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              Blog Title <span className="req">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g. Modern Methodologies for Potable Water Chemical Analysis"
            />
          </div>

          {/* Short Description */}
          <div className="form-group">
            <label className="form-label">
              Short Description / Summary
            </label>
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              rows={2}
              className="form-input"
              placeholder="Brief summary displayed on cards and search results..."
            />
          </div>

          {/* Category & Author row */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                Category <span className="req">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input"
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">
                Author Name
              </label>
              <input
                type="text"
                name="author_name"
                value={formData.author_name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Author Name"
              />
            </div>
          </div>

          {/* Featured Image Upload */}
          <div className="form-group">
            <label className="form-label">Featured Image / Thumbnail</label>
            <div className="image-upload-box">
              {imagePreview ? (
                <div className="image-preview-wrapper">
                  <img src={getBlogImageUrl(imagePreview)} alt="Featured Preview" className="preview-img" />
                  <button
                    type="button"
                    className="remove-img-btn"
                    onClick={handleRemoveImage}
                    title="Remove Image"
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              ) : (
                <label className="upload-trigger">
                  <FaUpload size={24} style={{ color: '#047857' }} />
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Click to upload featured image</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>PNG, JPG, WEBP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">
              Tags / Keywords (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g. water testing, GPCB, compliance, pH balance"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="form-group">
            <label className="form-label">
              Blog Content <span className="req">*</span>
            </label>
            <BlogRichEditor
              value={formData.content}
              onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
              onUploadImage={handleEditorImageUpload}
              placeholder="Write the full article content with rich typography, bullet points, headers..."
              minHeight="340px"
            />
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          <div className="action-buttons-group">
            <button
              type="button"
              className="btn-draft"
              onClick={() => handleSubmit('Draft')}
              disabled={isSubmitting}
            >
              <FaSave />
              <span>{isSubmitting ? 'Saving...' : 'Save as Draft'}</span>
            </button>
            <button
              type="button"
              className="btn-publish"
              onClick={() => handleSubmit('Published')}
              disabled={isSubmitting}
            >
              <FaGlobe />
              <span>{isSubmitting ? 'Publishing...' : 'Publish Blog'}</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .modal-container {
          background: #ffffff;
          border-radius: 16px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid #e2e8f0;
          background-color: #f8fafc;
        }
        .modal-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }
        .modal-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 1.2rem;
          cursor: pointer;
          border-radius: 6px;
          padding: 6px;
          display: flex;
        }
        .close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .modal-body {
          padding: 1.5rem 1.75rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .alert-error {
          padding: 0.75rem 1rem;
          background-color: #fee2e2;
          color: #dc2626;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-row {
          display: flex;
          gap: 1rem;
        }
        @media (max-width: 640px) {
          .form-row { flex-direction: column; }
        }
        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }
        .req { color: #dc2626; }
        .form-input {
          padding: 0.65rem 0.85rem;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #0f172a;
          outline: none;
          background-color: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: #047857;
          box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.12);
        }
        .image-upload-box {
          border: 2px dashed #cbd5e1;
          border-radius: 10px;
          padding: 1rem;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-trigger {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          padding: 1rem;
        }
        .image-preview-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }
        .preview-img {
          max-height: 200px;
          width: auto;
          border-radius: 8px;
          object-fit: cover;
        }
        .remove-img-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #fee2e2;
          color: #dc2626;
          border: none;
          border-radius: 6px;
          padding: 0.35rem 0.75rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .remove-img-btn:hover { background: #fecaca; }
        .modal-footer {
          padding: 1rem 1.75rem;
          border-top: 1px solid #e2e8f0;
          background-color: #f8fafc;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .btn-cancel {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-weight: 600;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
        }
        .btn-cancel:hover { background: #f1f5f9; }
        .action-buttons-group {
          display: flex;
          gap: 0.75rem;
        }
        .btn-draft {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-weight: 600;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-draft:hover { background: #e2e8f0; }
        .btn-publish {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #047857;
          border: none;
          color: #ffffff;
          font-weight: 600;
          padding: 0.6rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(4, 120, 87, 0.2);
          transition: all 0.2s;
        }
        .btn-publish:hover { background: #065f46; }
      `}</style>
    </div>
  );
};

export default BlogFormModal;

