import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{ 
      padding: '1rem 1.25rem', 
      borderTop: '1px solid #e2e8f0', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      backgroundColor: '#f8fafc',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
        Showing <strong style={{ color: '#1e293b' }}>{startItem}</strong> to <strong style={{ color: '#1e293b' }}>{endItem}</strong> of <strong style={{ color: '#1e293b' }}>{totalItems}</strong> entries
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#475569' }}>Rows per page:</span>
          <select 
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ 
              padding: '0.25rem 0.5rem', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              fontSize: '0.875rem', 
              outline: 'none', 
              cursor: 'pointer',
              backgroundColor: '#ffffff'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ 
              padding: '0.5rem', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: currentPage <= 1 ? '#f1f5f9' : '#ffffff', 
              color: currentPage <= 1 ? '#94a3b8' : '#475569', 
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaChevronLeft size={12} />
          </button>
          
          <span style={{ fontSize: '0.875rem', color: '#1e293b', padding: '0 0.5rem', fontWeight: 500 }}>
            Page {currentPage} of {totalPages || 1}
          </span>
          
          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{ 
              padding: '0.5rem', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1', 
              backgroundColor: currentPage >= totalPages ? '#f1f5f9' : '#ffffff', 
              color: currentPage >= totalPages ? '#94a3b8' : '#475569', 
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
