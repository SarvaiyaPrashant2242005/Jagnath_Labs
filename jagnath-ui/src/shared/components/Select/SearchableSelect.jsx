import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaChevronDown, FaTimes } from 'react-icons/fa';

/**
 * SearchableSelect Component
 * Clean native-like searchable dropdown without badges or section headers.
 * Supports generic options (objects with id, or strings).
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select Option',
  searchPlaceholder = 'Search...',
  hasError = false,
  customOptionLabel = '',
  onCustomOptionSelect,
  disabled = false,
  isMulti = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Helper to extract option label
  const getOptionLabel = (opt) => {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'object') {
      return opt.parameterName || opt.clientName || opt.title || opt.name || opt.label || opt.companyName || opt.company_name || '';
    }
    return String(opt);
  };

  // Helper to extract option ID
  const getOptionId = (opt) => {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'object') {
      return opt.id !== undefined ? opt.id : (opt.value !== undefined ? opt.value : getOptionLabel(opt));
    }
    return opt;
  };

  // Find currently selected option object
  const selectedOption = !isMulti ? options.find(opt => String(getOptionId(opt)) === String(value)) : null;

  // Find selected options for multi-select
  const selectedOptions = isMulti
    ? options.filter(opt => {
        const optId = getOptionId(opt);
        const valArray = Array.isArray(value) ? value : (value ? [value] : []);
        return valArray.map(String).includes(String(optId));
      })
    : [];

  // Filter options by search query
  const filteredOptions = options.filter(opt => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    if (typeof opt === 'string') {
      return opt.toLowerCase().includes(query);
    }
    const labelText = getOptionLabel(opt).toLowerCase();
    const testMethodText = (opt.testMethod || opt.testingStandard || '').toLowerCase();
    return labelText.includes(query) || testMethodText.includes(query);
  });

  const handleSelect = (optId) => {
    if (isMulti) {
      const valArray = Array.isArray(value) ? value : (value ? [value] : []);
      const isSelected = valArray.map(String).includes(String(optId));
      let nextValue;
      if (isSelected) {
        nextValue = valArray.filter(v => String(v) !== String(optId));
      } else {
        nextValue = [...valArray, optId];
      }
      onChange(nextValue);
    } else {
      onChange(optId);
      setIsOpen(false);
    }
  };

  const handleCustomSelect = () => {
    if (onCustomOptionSelect) {
      onCustomOptionSelect();
    }
    setIsOpen(false);
  };

  const selectedName = isMulti
    ? (selectedOptions.map(opt => getOptionLabel(opt)).join(', ') || '')
    : (selectedOption ? getOptionLabel(selectedOption) : '');

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Main Select Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        title={selectedName || placeholder}
        style={{
          padding: '0.55rem 0.75rem',
          border: `1px solid ${hasError ? '#ef4444' : isOpen ? '#22c55e' : '#cbd5e1'}`,
          borderRadius: '8px',
          fontSize: '0.9rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: isOpen ? '0 0 0 3px rgba(34, 197, 94, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          minHeight: '38px',
          boxSizing: 'border-box'
        }}
      >
        <span style={{
          color: (isMulti ? selectedOptions.length > 0 : selectedOption) ? '#0f172a' : '#94a3b8',
          fontWeight: (isMulti ? selectedOptions.length > 0 : selectedOption) ? 500 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1
        }}>
          {selectedName || placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', flexShrink: 0 }}>
          {(isMulti ? selectedOptions.length > 0 : value) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(isMulti ? [] : '');
              }}
              style={{
                border: 'none',
                background: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Clear selection"
            >
              <FaTimes size={12} />
            </button>
          )}
          <FaChevronDown
            size={12}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Inline Search Header */}
          <div style={{
            padding: '0.5rem 0.65rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}>
            <FaSearch size={13} color="#94a3b8" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.875rem',
                color: '#1e293b'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>

          {/* Options Scroll Container */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                No options found matching "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map(opt => {
                const optId = getOptionId(opt);
                const isSelected = isMulti
                  ? (Array.isArray(value) ? value.map(String).includes(String(optId)) : false)
                  : (String(optId) === String(value));
                const name = getOptionLabel(opt);

                return (
                  <div
                    key={optId}
                    onClick={() => handleSelect(optId)}
                    title={name}
                    style={{
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      backgroundColor: isSelected && !isMulti ? '#2563eb' : 'transparent',
                      color: isSelected && !isMulti ? '#ffffff' : '#1e293b',
                      fontWeight: isSelected ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'background-color 0.1s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected || isMulti) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected || isMulti) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {isMulti && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by click container
                        style={{ cursor: 'pointer', marginRight: '0.25rem' }}
                      />
                    )}
                    <span>{name}</span>
                  </div>
                );
              })
            )}

            {/* Custom Manual Entry Option */}
            {customOptionLabel && (
              <div
                onClick={handleCustomSelect}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderTop: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#22c55e',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  transition: 'background-color 0.1s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                {customOptionLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
