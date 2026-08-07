import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaChevronDown, FaTimes, FaStar, FaPlus } from 'react-icons/fa';

/**
 * SearchableSelect Component
 * Custom searchable dropdown with match prioritization, grouping, and live filtering.
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select Option',
  searchPlaceholder = 'Search...',
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
    const methodMatch = (opt.testMethod || '').toLowerCase().includes(query);
    const unitMatch = (opt.unit || '').toLowerCase().includes(query);
    return nameMatch || methodMatch || unitMatch;
  });

  // Separate into matching (recommended) and other options
  const matchingOptions = filteredOptions.filter(opt => opt.isMatching);
  const otherOptions = filteredOptions.filter(opt => !opt.isMatching);

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

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Main Select Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
          textOverflow: 'ellipsis'
        }}>
          {selectedOption ? (
            <>
              {selectedOption.parameterName || selectedOption.name || selectedOption.label}
              {selectedOption.testMethod ? ` (${selectedOption.testMethod})` : ''}
            </>
          ) : (
            placeholder
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b' }}>
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

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Box Header */}
          <div style={{
            padding: '0.6rem 0.75rem',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
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
                fontSize: '0.85rem',
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

          {/* Options List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.35rem' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No parameters found matching "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Recommended / Matching Parameters Section */}
                {matchingOptions.length > 0 && (
                  <div>
                    <div style={{
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: '#166534',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '4px',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      <FaStar size={10} color="#22c55e" />
                      Matching Selected Dropdowns ({matchingOptions.length})
                    </div>
                    {matchingOptions.map(opt => (
                      <OptionRow
                        key={opt.id}
                        opt={opt}
                        isSelected={String(opt.id) === String(value)}
                        onSelect={() => handleSelect(opt.id)}
                        isMatching={true}
                      />
                    ))}
                  </div>
                )}

                {/* Other Parameters Section */}
                {otherOptions.length > 0 && (
                  <div>
                    {matchingOptions.length > 0 && (
                      <div style={{
                        padding: '0.35rem 0.6rem',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        color: '#64748b',
                        backgroundColor: '#f8fafc',
                        borderRadius: '4px',
                        marginTop: '0.4rem',
                        marginBottom: '0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        All Other Parameters ({otherOptions.length})
                      </div>
                    )}
                    {otherOptions.map(opt => (
                      <OptionRow
                        key={opt.id}
                        opt={opt}
                        isSelected={String(opt.id) === String(value)}
                        onSelect={() => handleSelect(opt.id)}
                        isMatching={false}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Custom Manual Option at Bottom */}
            {customOptionLabel && (
              <div
                onClick={handleCustomSelect}
                style={{
                  padding: '0.6rem 0.75rem',
                  marginTop: '0.35rem',
                  borderTop: '1px solid #f1f5f9',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#16a34a',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#f0fdf4',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
              >
                <FaPlus size={11} />
                {customOptionLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual option row
const OptionRow = ({ opt, isSelected, onSelect, isMatching }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '0.5rem 0.65rem',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        backgroundColor: isSelected ? '#dcfce7' : isMatching ? '#f8fafc' : 'transparent',
        color: isSelected ? '#14532d' : '#1e293b',
        fontWeight: isSelected ? 600 : 400,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '2px',
        transition: 'all 0.12s ease'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = isMatching ? '#f1f5f9' : '#f8fafc';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = isMatching ? '#f8fafc' : 'transparent';
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {opt.parameterName || opt.name || opt.label}
        </span>
        {(opt.testMethod || opt.unit) && (
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {opt.testMethod ? opt.testMethod : ''} {opt.unit ? `[${opt.unit}]` : ''}
          </span>
        )}
      </div>

      {isMatching && opt.matchBadges && opt.matchBadges.length > 0 && (
        <span style={{
          fontSize: '0.7rem',
          padding: '0.15rem 0.45rem',
          backgroundColor: '#22c55e',
          color: '#ffffff',
          borderRadius: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {opt.matchBadges.join(' + ')}
        </span>
      )}
    </div>
  );
};

export default SearchableSelect;
