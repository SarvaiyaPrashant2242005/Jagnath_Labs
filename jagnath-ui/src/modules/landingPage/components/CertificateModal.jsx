import React, { useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

export default function CertificateModal({ isOpen, onClose, certificate }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !certificate) return null;

  return (
    <div className="jlt-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="jlt-modal-box" 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
              {certificate.title}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {certificate.subtitle || 'Official Accreditation Certificate'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="jlt-modal-close-btn"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="jlt-modal-img-wrap" style={{ textAlign: 'center', maxHeight: '72vh', overflowY: 'auto', background: '#f8fafc', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <img 
            src={certificate.image} 
            alt={certificate.title} 
            style={{ maxWidth: '100%', height: 'auto', display: 'inline-block', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
          />
        </div>

        <div className="jlt-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <a
            href={certificate.image}
            target="_blank"
            rel="noopener noreferrer"
            className="jlt-btn-quote"
            style={{ background: '#66b834', padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <ExternalLink size={16} /> Open Full Size
          </a>
          <a
            href={certificate.pdfUrl || certificate.image}
            download={certificate.downloadName || 'certificate.pdf'}
            className="jlt-btn-quote"
            style={{ background: '#1e293b', padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={16} /> Download Certificate
          </a>
        </div>
      </div>
    </div>
  );
}
