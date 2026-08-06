import React from 'react';
import { FaPlus } from 'react-icons/fa';

/**
 * Standard + Add New ... link button matching the existing project theme.
 */
const AddMasterButton = ({ label, onClick, disabled }) => {
  if (disabled) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: '#22c55e',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: 0
      }}
    >
      <FaPlus size={10} /> {label}
    </button>
  );
};

export default AddMasterButton;
