import React, { useRef, useEffect } from 'react';
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaEraser,
  FaUndo,
  FaRedo
} from 'react-icons/fa';

/**
 * RichTextEditor Component
 * Provides Bold, Italic, Underline, Lists, Headings, and Alignments for quotation paragraphs.
 */
const RichTextEditor = ({ name = 'introText', value, onChange, placeholder, minHeight = '320px' }) => {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

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
    // If it already contains HTML tags, use as is
    if (/<[a-z][\s\S]*>/i.test(val)) {
      return val;
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
      const html = editorRef.current.innerHTML;
      if (onChange) {
        onChange({ target: { name, value: html } });
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

  return (
    <div style={{
      border: '1.5px solid #86efac',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#ffffff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* RICH TEXT TOOLBAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'wrap',
        padding: '6px 8px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {/* Text Style Label */}
        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', padding: '0 4px' }}>
          Format:
        </span>

        {/* Basic Text Styles */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold (Ctrl+B)"
          style={toolbarBtnStyle}
        >
          <FaBold size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic (Ctrl+I)"
          style={toolbarBtnStyle}
        >
          <FaItalic size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          title="Underline (Ctrl+U)"
          style={toolbarBtnStyle}
        >
          <FaUnderline size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          title="Strikethrough"
          style={toolbarBtnStyle}
        >
          <FaStrikethrough size={12} />
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }}></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          title="Align Left"
          style={toolbarBtnStyle}
        >
          <FaAlignLeft size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          title="Align Center"
          style={toolbarBtnStyle}
        >
          <FaAlignCenter size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          title="Align Right"
          style={toolbarBtnStyle}
        >
          <FaAlignRight size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          title="Justify"
          style={toolbarBtnStyle}
        >
          <FaAlignJustify size={12} />
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }}></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
          style={toolbarBtnStyle}
        >
          <FaListUl size={12} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          style={toolbarBtnStyle}
        >
          <FaListOl size={12} />
        </button>

        <div style={{ width: '1px', height: '18px', background: '#cbd5e1', margin: '0 2px' }}></div>

        {/* Undo / Redo & Clear */}
        <button
          type="button"
          onClick={() => executeCommand('undo')}
          title="Undo (Ctrl+Z)"
          style={toolbarBtnStyle}
        >
          <FaUndo size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          title="Redo (Ctrl+Y)"
          style={toolbarBtnStyle}
        >
          <FaRedo size={11} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Formatting"
          style={{ ...toolbarBtnStyle, color: '#ef4444' }}
        >
          <FaEraser size={12} />
        </button>
      </div>

      {/* EDITABLE CONTENT CANVAS */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          minHeight: minHeight,
          padding: '12px 14px',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          color: '#1e293b',
          outline: 'none',
          cursor: 'text',
          overflowY: 'visible',
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
  width: '28px',
  height: '28px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  color: '#334155',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  fontSize: '12px',
};

export default RichTextEditor;
