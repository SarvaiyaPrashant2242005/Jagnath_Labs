import React, { useRef, useEffect, useState } from 'react';
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
  FaUndo,
  FaRedo,
  FaHighlighter,
  FaFont
} from 'react-icons/fa';
import { sanitizeHtml } from '../utils/quotationCalculation.utils';

const COLOR_OPTIONS = [
  { label: 'Black', value: '#000000' },
  { label: 'Dark Slate', value: '#1e293b' },
  { label: 'Primary Blue', value: '#0284c7' },
  { label: 'Navy Blue', value: '#1e3a8a' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Amber Orange', value: '#d97706' },
  { label: 'Purple', value: '#7c3aed' },
];

const HIGHLIGHT_OPTIONS = [
  { label: 'None', value: 'transparent' },
  { label: 'Light Yellow', value: '#fef08a' },
  { label: 'Light Green', value: '#bbf7d0' },
  { label: 'Light Blue', value: '#bae6fd' },
  { label: 'Light Pink', value: '#fbcfe8' },
  { label: 'Light Gray', value: '#e2e8f0' },
];

/**
 * RichTextEditor Component
 * Provides complete rich-text formatting: Bold, Italic, Underline, Strikethrough,
 * Bullet/Numbered/Nested lists, Indent/Outdent, Headings, Alignments, Text & Highlight colors.
 */
export const RichTextEditor = ({
  name = 'content',
  value = '',
  onChange,
  placeholder = 'Type here...',
  minHeight = '140px',
  maxHeight = 'auto',
  compact = false,
}) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Synchronize external value with contentEditable without resetting cursor during typing
  useEffect(() => {
    if (editorRef.current) {
      if (isInternalChange.current) {
        isInternalChange.current = false;
        return;
      }
      const currentHtml = editorRef.current.innerHTML;
      const targetHtml = formatInitialHtml(value);
      if (currentHtml !== targetHtml) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
  }, [value]);

  const formatInitialHtml = (val) => {
    if (!val) return '';
    if (typeof val !== 'string') return String(val);
    // If it already contains HTML tags, sanitize and use
    if (/<[a-z][\s\S]*>/i.test(val)) {
      return sanitizeHtml(val);
    }
    // Convert newlines to paragraphs / line breaks
    return val
      .split(/\n\n+/)
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const rawHtml = editorRef.current.innerHTML;
      const cleanHtml = sanitizeHtml(rawHtml);
      if (onChange) {
        onChange({ target: { name, value: cleanHtml } });
      }
    }
  };

  const executeCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleKeyDown = (e) => {
    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        executeCommand('outdent');
      } else {
        executeCommand('indent');
      }
    }
  };

  return (
    <div
      className="rich-text-editor-container"
      style={{
        border: '1.5px solid #cbd5e1',
        borderRadius: '8px',
        overflow: 'visible',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* RICH TEXT TOOLBAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          flexWrap: 'wrap',
          padding: compact ? '4px 6px' : '6px 8px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          borderRadius: '7px 7px 0 0',
          position: 'relative',
        }}
      >
        {/* Headings Selector */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') {
              executeCommand('formatBlock', '<p>');
            } else if (val) {
              executeCommand('formatBlock', `<${val}>`);
            }
            e.target.value = '';
          }}
          defaultValue=""
          style={{
            height: '26px',
            fontSize: '11px',
            fontWeight: 600,
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '0 4px',
            background: '#ffffff',
            color: '#334155',
            cursor: 'pointer',
          }}
          title="Format Block / Heading"
        >
          <option value="" disabled>Styles</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }} />

        {/* Basic Text Styles */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
          style={toolbarBtnStyle}
        >
          <FaBold size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
          style={toolbarBtnStyle}
        >
          <FaItalic size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          title="Underline (Ctrl+U)"
          style={toolbarBtnStyle}
        >
          <FaUnderline size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          title="Strikethrough"
          style={toolbarBtnStyle}
        >
          <FaStrikethrough size={11} />
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }} />

        {/* Text Color Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            title="Text Color"
            style={{ ...toolbarBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
          >
            <FaFont size={11} />
            <span style={{ fontSize: '8px' }}>▼</span>
          </button>
          {showColorPicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '6px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 22px)',
                gap: '4px',
                zIndex: 50,
              }}
            >
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    executeCommand('foreColor', c.value);
                    setShowColorPicker(false);
                  }}
                  title={c.label}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '4px',
                    background: c.value,
                    border: '1px solid #94a3b8',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            title="Highlight Color"
            style={{ ...toolbarBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
          >
            <FaHighlighter size={11} />
            <span style={{ fontSize: '8px' }}>▼</span>
          </button>
          {showHighlightPicker && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '6px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 24px)',
                gap: '4px',
                zIndex: 50,
              }}
            >
              {HIGHLIGHT_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    executeCommand('hiliteColor', c.value);
                    setShowHighlightPicker(false);
                  }}
                  title={c.label}
                  style={{
                    width: '24px',
                    height: '22px',
                    borderRadius: '4px',
                    background: c.value,
                    border: '1px solid #94a3b8',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }} />

        {/* Lists & Nested Indent */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
          style={toolbarBtnStyle}
        >
          <FaListUl size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          style={toolbarBtnStyle}
        >
          <FaListOl size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('indent')}
          title="Indent / Sub-bullet (Tab)"
          style={toolbarBtnStyle}
        >
          <FaIndent size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('outdent')}
          title="Outdent (Shift+Tab)"
          style={toolbarBtnStyle}
        >
          <FaOutdent size={11} />
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }} />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          title="Align Left"
          style={toolbarBtnStyle}
        >
          <FaAlignLeft size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          title="Align Center"
          style={toolbarBtnStyle}
        >
          <FaAlignCenter size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          title="Align Right"
          style={toolbarBtnStyle}
        >
          <FaAlignRight size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          title="Justify"
          style={toolbarBtnStyle}
        >
          <FaAlignJustify size={11} />
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }} />

        {/* Undo / Redo & Clear */}
        <button
          type="button"
          onClick={() => executeCommand('undo')}
          title="Undo (Ctrl+Z)"
          style={toolbarBtnStyle}
        >
          <FaUndo size={10} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          title="Redo (Ctrl+Y)"
          style={toolbarBtnStyle}
        >
          <FaRedo size={10} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
          style={{ ...toolbarBtnStyle, color: '#ef4444' }}
        >
          <FaEraser size={11} />
        </button>
      </div>

      {/* EDITABLE CONTENT CANVAS */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        style={{
          minHeight,
          maxHeight: maxHeight !== 'auto' ? maxHeight : undefined,
          padding: '10px 12px',
          fontSize: '0.88rem',
          lineHeight: '1.5',
          color: '#1e293b',
          outline: 'none',
          cursor: 'text',
          overflowY: maxHeight !== 'auto' ? 'auto' : 'visible',
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

const toolbarBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '26px',
  height: '26px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  color: '#334155',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  fontSize: '11px',
};

export default RichTextEditor;
