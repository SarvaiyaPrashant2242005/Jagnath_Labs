/**
 * @file GTRichTextEditor.jsx
 * @description Dedicated Rich Text Editor for General Testing / Consulting Quotations.
 * Features:
 * - ContentEditable with stable caret during re-renders.
 * - Toolbar actions with onMouseDown preventDefault (preserves text selection).
 * - Debounced onChange (~150ms) to ensure smooth live preview rendering.
 * - Clean paste handler (strips Microsoft Word and Google Docs junk markup).
 * - Tab and Shift+Tab key support for indent / outdent.
 * - Scoped styling to protect list bullet indentation and container boundaries.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaIndent,
  FaOutdent,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaEraser,
  FaHighlighter,
  FaFont
} from 'react-icons/fa';
import { sanitizeHtml } from '../utils/gtCalculation.utils';

const COLOR_OPTIONS = [
  { label: 'Black', value: '#000000' },
  { label: 'Dark Slate', value: '#1e293b' },
  { label: 'Primary Blue', value: '#0284c7' },
  { label: 'Navy Blue', value: '#1e3a8a' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Amber Orange', value: '#d97706' },
];

const HIGHLIGHT_OPTIONS = [
  { label: 'None', value: 'transparent' },
  { label: 'Light Yellow', value: '#fef08a' },
  { label: 'Light Green', value: '#bbf7d0' },
  { label: 'Light Blue', value: '#bae6fd' },
  { label: 'Light Pink', value: '#fbcfe8' },
  { label: 'Light Gray', value: '#e2e8f0' },
];

export const GTRichTextEditor = ({
  name = 'content',
  value = '',
  onChange,
  placeholder = 'Type section content here...',
  minHeight = '110px',
}) => {
  const editorRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isComposingRef = useRef(false);
  const isInternalInputRef = useRef(false);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Synchronize incoming external value without resetting caret when active/focused
  useEffect(() => {
    if (!editorRef.current) return;
    if (isInternalInputRef.current) {
      isInternalInputRef.current = false;
      return;
    }

    const currentHtml = editorRef.current.innerHTML;
    const targetHtml = formatInitialHtml(value);
    if (currentHtml !== targetHtml && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = targetHtml;
    }
  }, [value]);

  // Clean initial HTML input
  const formatInitialHtml = (val) => {
    if (!val) return '';
    if (typeof val !== 'string') return String(val);
    if (/<[a-z][\s\S]*>/i.test(val)) {
      return sanitizeHtml(val);
    }
    return val
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  // Debounced notification to parent
  const triggerDebouncedChange = useCallback((cleanContent) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (onChange) {
        onChange({ target: { name, value: cleanContent } });
      }
    }, 150);
  }, [onChange, name]);

  const handleInput = () => {
    if (!editorRef.current || isComposingRef.current) return;
    isInternalInputRef.current = true;
    const raw = editorRef.current.innerHTML;
    const clean = sanitizeHtml(raw);
    triggerDebouncedChange(clean);
  };

  // Execute rich text command with onMouseDown={e => e.preventDefault()} so selection remains intact
  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Keyboard navigation: Tab for indent, Shift+Tab for outdent
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        executeCommand('outdent');
      } else {
        executeCommand('indent');
      }
    }
  };

  // Clean Paste Handling: Strips Microsoft Word, Excel, and Google Docs junk
  const handlePaste = (e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData || window.clipboardData;
    const text = clipboardData.getData('text/plain');
    const html = clipboardData.getData('text/html');

    if (html && /<[a-z][\s\S]*>/i.test(html)) {
      // Strip Word-specific XML and mso-* tags
      const cleanedHtml = html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/class=["'][^"']*["']/gi, '')
        .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
        .replace(/<v:[^>]*>[\s\S]*?<\/v:[^>]*>/gi, '');

      const sanitized = sanitizeHtml(cleanedHtml);
      document.execCommand('insertHTML', false, sanitized);
    } else if (text) {
      document.execCommand('insertText', false, text);
    }

    handleInput();
  };

  return (
    <div
      className="rich-text-editor-container"
      style={{
        border: '1.5px solid #cbd5e1',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        transition: 'border-color 0.15s ease',
      }}
    >
      <style>{`
        .rich-text-editor-container .rich-text-editor-content ul {
          list-style-type: disc !important;
          padding-left: 28px !important;
          margin: 6px 0 !important;
        }
        .rich-text-editor-container .rich-text-editor-content ol {
          list-style-type: decimal !important;
          padding-left: 28px !important;
          margin: 6px 0 !important;
        }
        .rich-text-editor-container .rich-text-editor-content ul ul {
          list-style-type: circle !important;
          padding-left: 22px !important;
          margin: 3px 0 !important;
        }
        .rich-text-editor-container .rich-text-editor-content ol ol {
          list-style-type: lower-alpha !important;
          padding-left: 22px !important;
          margin: 3px 0 !important;
        }
        .rich-text-editor-container .rich-text-editor-content li {
          margin-bottom: 4px !important;
          line-height: 1.5 !important;
        }
        .rich-text-editor-container .rich-text-editor-content p {
          margin: 0 0 6px 0 !important;
          line-height: 1.5 !important;
        }
        .gt-editor-btn {
          border: 1px solid transparent;
          background: transparent;
          border-radius: 4px;
          padding: 4px 6px;
          color: #334155;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .gt-editor-btn:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }
      `}</style>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '4px 6px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          flexWrap: 'wrap',
          userSelect: 'none',
        }}
      >
        {/* Basic Text Formatting */}
        <button
          type="button"
          aria-label="Bold"
          className="gt-editor-btn"
          title="Bold (Ctrl+B)"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
        >
          <FaBold size={11} />
        </button>

        <button
          type="button"
          aria-label="Italic"
          className="gt-editor-btn"
          title="Italic (Ctrl+I)"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
        >
          <FaItalic size={11} />
        </button>

        <button
          type="button"
          aria-label="Underline"
          className="gt-editor-btn"
          title="Underline (Ctrl+U)"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('underline'); }}
        >
          <FaUnderline size={11} />
        </button>

        <button
          type="button"
          aria-label="Strikethrough"
          className="gt-editor-btn"
          title="Strikethrough"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('strikeThrough'); }}
        >
          <FaStrikethrough size={11} />
        </button>

        <span style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }} />

        {/* Lists & Indentation */}
        <button
          type="button"
          aria-label="Bullet List"
          className="gt-editor-btn"
          title="Bullet List"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
        >
          <FaListUl size={11} />
        </button>

        <button
          type="button"
          aria-label="Numbered List"
          className="gt-editor-btn"
          title="Numbered List"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('insertOrderedList'); }}
        >
          <FaListOl size={11} />
        </button>

        <button
          type="button"
          aria-label="Indent"
          className="gt-editor-btn"
          title="Indent (Tab)"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('indent'); }}
        >
          <FaIndent size={11} />
        </button>

        <button
          type="button"
          aria-label="Outdent"
          className="gt-editor-btn"
          title="Outdent (Shift+Tab)"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('outdent'); }}
        >
          <FaOutdent size={11} />
        </button>

        <span style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }} />

        {/* Text Alignments */}
        <button
          type="button"
          aria-label="Align Left"
          className="gt-editor-btn"
          title="Align Left"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyLeft'); }}
        >
          <FaAlignLeft size={11} />
        </button>

        <button
          type="button"
          aria-label="Align Center"
          className="gt-editor-btn"
          title="Align Center"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyCenter'); }}
        >
          <FaAlignCenter size={11} />
        </button>

        <button
          type="button"
          aria-label="Align Right"
          className="gt-editor-btn"
          title="Align Right"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyRight'); }}
        >
          <FaAlignRight size={11} />
        </button>

        <button
          type="button"
          aria-label="Justify"
          className="gt-editor-btn"
          title="Justify"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('justifyFull'); }}
        >
          <FaAlignJustify size={11} />
        </button>

        <span style={{ width: '1px', height: '16px', background: '#cbd5e1', margin: '0 4px' }} />

        {/* Text Color Picker */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Text Color"
            className="gt-editor-btn"
            title="Text Color"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
          >
            <FaFont size={11} />
          </button>

          {showColorPicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 100,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 20px)',
                gap: '4px',
              }}
            >
              {COLOR_OPTIONS.map((c) => (
                <div
                  key={c.value}
                  title={c.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand('foreColor', c.value);
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    background: c.value,
                    cursor: 'pointer',
                    border: '1px solid #94a3b8',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Highlight Color"
            className="gt-editor-btn"
            title="Highlight Color"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
          >
            <FaHighlighter size={11} />
          </button>

          {showHighlightPicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 100,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 22px)',
                gap: '4px',
              }}
            >
              {HIGHLIGHT_OPTIONS.map((h) => (
                <div
                  key={h.value}
                  title={h.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    executeCommand('hiliteColor', h.value);
                    setShowHighlightPicker(false);
                  }}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '3px',
                    background: h.value === 'transparent' ? '#ffffff' : h.value,
                    cursor: 'pointer',
                    border: '1px solid #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#64748b',
                  }}
                >
                  {h.value === 'transparent' ? '✕' : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear Formatting */}
        <button
          type="button"
          aria-label="Clear Formatting"
          className="gt-editor-btn"
          title="Clear Formatting"
          onMouseDown={(e) => { e.preventDefault(); executeCommand('removeFormat'); }}
        >
          <FaEraser size={11} />
        </button>
      </div>

      {/* Content Area */}
      <div
        ref={editorRef}
        contentEditable
        className="rich-text-editor-content"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => { isComposingRef.current = false; handleInput(); }}
        placeholder={placeholder}
        style={{
          minHeight,
          padding: '8px 12px',
          outline: 'none',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          color: '#0f172a',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      />
    </div>
  );
};

export default GTRichTextEditor;
