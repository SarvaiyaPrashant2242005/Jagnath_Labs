import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaChevronDown, FaTimes, FaPlus } from 'react-icons/fa';

/**
 * SearchableSelect Component
 * Clean native-like searchable dropdown without badges or section headers.
 * Parameter names are shown in full length on a single line, expanding width to the left if needed.
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select Option',
  searchPlaceholder = 'Search parameter name...',
  hasError = false,
  customOptionLabel = '+ Enter Custom Parameter Name (Manual)...',
  onCustomOptionSelect,
  disabled = false
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

  // Find currently selected option object
  const selectedOption = options.find(opt => String(opt.id) === String(value));

  // Filter options by search query
  const filteredOptions = options.filter(opt => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = (opt.parameterName || opt.name || opt.label || '').toLowerCase().includes(query);
    const methodMatch = (opt.testMethod || opt.testingStandard || '').toLowerCase().includes(query);
    return nameMatch || methodMatch;
  });

  const handleSelect = (optId) => {
    onChange(optId);
    setIsOpen(false);
  };

  const handleCustomSelect = () => {
    if (onCustomOptionSelect) {
      onCustomOptionSelect();
    }
    setIsOpen(false);
  };

  const selectedName = selectedOption ? (selectedOption.parameterName || selectedOption.name || selectedOption.label) : '';

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
          minHeight: '38px'
        }}
      >
        <span style={{
          color: selectedOption ? '#0f172a' : '#94a3b8',
          fontWeight: selectedOption ? 500 : 400,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1
        }}>
          {selectedName || placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', flexShrink: 0 }}>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
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

      {/* Floating Dropdown Menu (Anchored right so it expands to the LEFT for full text length) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 12px 28px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '100%',
            width: 'max-content',
            maxWidth: 'min(650px, 90vw)'
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
                No parameters found matching "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.id) === String(value);
                const name = opt.parameterName || opt.name || opt.label || '';

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    title={name}
                    style={{
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      backgroundColor: isSelected ? '#2563eb' : 'transparent',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      fontWeight: isSelected ? 600 : 400,
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {name}
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
