/**
 * @file BlogRichEditor.jsx
 * @description Rich text editor for Blog content creation with comprehensive toolbar.
 * Supports Headings, Bold, Italic, Underline, Bullet/Numbered lists, Links, Images,
 * Alignment, Blockquotes, and code/text formatting without writing raw HTML.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaHeading,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaLink,
  FaUnlink,
  FaImage,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaUndo,
  FaRedo,
  FaEraser,
  FaCode
} from 'react-icons/fa';

export const BlogRichEditor = ({
  value = '',
  onChange,
  placeholder = 'Write your inspiring article content here...',
  minHeight = '320px',
  onUploadImage
}) => {
  const editorRef = useRef(null);
  const isInternalChangeRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  // Sync external value when not focused or when changed externally
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }
    if (editorRef.current.innerHTML !== value && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const triggerChange = useCallback((html) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (onChange) {
        onChange(html);
      }
    }, 150);
  }, [onChange]);

  const handleInput = () => {
    if (!editorRef.current) return;
    isInternalChangeRef.current = true;
    const html = editorRef.current.innerHTML;
    triggerChange(html);
  };

  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL (e.g. https://example.com):');
    if (url) {
      exec('createLink', url);
    }
  };

  const handleInsertImage = async () => {
    if (onUploadImage) {
      // Create temporary input to select image
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          try {
            const url = await onUploadImage(file);
            if (url) {
              exec('insertImage', url);
            }
          } catch (err) {
            alert('Failed to upload image: ' + err.message);
          }
        }
      };
      input.click();
    } else {
      const url = prompt('Enter image URL:');
      if (url) {
        exec('insertImage', url);
      }
    }
  };

  return (
    <div className="blog-rich-editor-wrapper">
      {/* Toolbar */}
      <div className="blog-editor-toolbar">
        {/* Undo / Redo */}
        <div className="btn-group">
          <button type="button" className="t-btn" title="Undo" onMouseDown={(e) => { e.preventDefault(); exec('undo'); }}>
            <FaUndo size={13} />
          </button>
          <button type="button" className="t-btn" title="Redo" onMouseDown={(e) => { e.preventDefault(); exec('redo'); }}>
            <FaRedo size={13} />
          </button>
        </div>

        <span className="t-divider" />

        {/* Headings Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="t-btn"
            title="Headings"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowHeadingMenu(!showHeadingMenu);
            }}
          >
            <FaHeading size={13} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>Format</span>
          </button>
          {showHeadingMenu && (
            <div className="heading-dropdown">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<p>'); setShowHeadingMenu(false); }}
              >
                Normal Paragraph
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h2>'); setShowHeadingMenu(false); }}
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Heading 2 (Major)
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h3>'); setShowHeadingMenu(false); }}
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                Heading 3 (Sub-section)
              </button>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h4>'); setShowHeadingMenu(false); }}
                style={{ fontSize: '13px', fontWeight: 600 }}
              >
                Heading 4 (Minor)
              </button>
            </div>
          )}
        </div>

        <span className="t-divider" />

        {/* Inline styles */}
        <div className="btn-group">
          <button type="button" className="t-btn" title="Bold (Ctrl+B)" onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}>
            <FaBold size={13} />
          </button>
          <button type="button" className="t-btn" title="Italic (Ctrl+I)" onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}>
            <FaItalic size={13} />
          </button>
          <button type="button" className="t-btn" title="Underline (Ctrl+U)" onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}>
            <FaUnderline size={13} />
          </button>
        </div>

        <span className="t-divider" />

        {/* Lists & Quotes */}
        <div className="btn-group">
          <button type="button" className="t-btn" title="Bullet List" onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}>
            <FaListUl size={13} />
          </button>
          <button type="button" className="t-btn" title="Numbered List" onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}>
            <FaListOl size={13} />
          </button>
          <button type="button" className="t-btn" title="Blockquote" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<blockquote>'); }}>
            <FaQuoteRight size={13} />
          </button>
          <button type="button" className="t-btn" title="Preformatted Code" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<pre>'); }}>
            <FaCode size={13} />
          </button>
        </div>

        <span className="t-divider" />

        {/* Alignment */}
        <div className="btn-group">
          <button type="button" className="t-btn" title="Align Left" onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}>
            <FaAlignLeft size={13} />
          </button>
          <button type="button" className="t-btn" title="Align Center" onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}>
            <FaAlignCenter size={13} />
          </button>
          <button type="button" className="t-btn" title="Align Right" onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}>
            <FaAlignRight size={13} />
          </button>
          <button type="button" className="t-btn" title="Justify" onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}>
            <FaAlignJustify size={13} />
          </button>
        </div>

        <span className="t-divider" />

        {/* Links & Media */}
        <div className="btn-group">
          <button type="button" className="t-btn" title="Insert Link" onMouseDown={(e) => { e.preventDefault(); handleInsertLink(); }}>
            <FaLink size={13} />
          </button>
          <button type="button" className="t-btn" title="Remove Link" onMouseDown={(e) => { e.preventDefault(); exec('unlink'); }}>
            <FaUnlink size={13} />
          </button>
          <button type="button" className="t-btn" title="Insert Image" onMouseDown={(e) => { e.preventDefault(); handleInsertImage(); }}>
            <FaImage size={13} />
          </button>
        </div>

        <span className="t-divider" />

        {/* Clear formatting */}
        <button type="button" className="t-btn" title="Clear Formatting" onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}>
          <FaEraser size={13} />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        className="blog-editor-content"
        onInput={handleInput}
        placeholder={placeholder}
        style={{ minHeight }}
      />

      <style>{`
        .blog-rich-editor-wrapper {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .blog-rich-editor-wrapper:focus-within {
          border-color: #047857;
          box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.12);
        }
        .blog-editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          padding: 8px 10px;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .btn-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .t-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 32px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: #475569;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .t-btn:hover {
          background-color: #e2e8f0;
          color: #0f172a;
        }
        .t-divider {
          width: 1px;
          height: 20px;
          background-color: #cbd5e1;
          margin: 0 4px;
        }
        .heading-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 50;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 170px;
        }
        .heading-dropdown button {
          text-align: left;
          background: none;
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          color: #1e293b;
        }
        .heading-dropdown button:hover {
          background-color: #f1f5f9;
          color: #047857;
        }
        .blog-editor-content {
          padding: 16px 20px;
          outline: none;
          color: #1e293b;
          font-size: 1rem;
          line-height: 1.7;
          word-break: break-word;
        }
        .blog-editor-content:empty:before {
          content: attr(placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .blog-editor-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 1.2rem 0 0.6rem 0;
        }
        .blog-editor-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #0f172a;
          margin: 1rem 0 0.5rem 0;
        }
        .blog-editor-content p {
          margin-bottom: 0.9rem;
        }
        .blog-editor-content ul, .blog-editor-content ol {
          margin: 0.75rem 0 0.75rem 1.5rem;
        }
        .blog-editor-content li {
          margin-bottom: 0.35rem;
        }
        .blog-editor-content blockquote {
          border-left: 4px solid #047857;
          padding-left: 14px;
          margin: 1rem 0;
          color: #475569;
          font-style: italic;
          background: #f8fafc;
          padding: 10px 14px;
          border-radius: 0 8px 8px 0;
        }
        .blog-editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .blog-editor-content a {
          color: #0284c7;
          text-decoration: underline;
        }
        .blog-editor-content pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: monospace;
          overflow-x: auto;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default BlogRichEditor;

