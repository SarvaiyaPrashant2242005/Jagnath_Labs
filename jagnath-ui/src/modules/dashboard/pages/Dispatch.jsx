import React, { useState, useEffect, useMemo } from 'react';
import { FaTruck, FaCheck, FaClock } from 'react-icons/fa';
import testRequestService from '../../../shared/services/testRequestService';

const Dispatch = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await testRequestService.getTestRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load dispatch tracking registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format dispatch list mapping local storage states
  const dispatchList = useMemo(() => {
    return requests.map(r => {
      const shortId = r.id.substring(0, 8).toUpperCase();
      const trNo = `TR-${shortId}`;
      
      // Load dispatch status from local cache or fallback to active status
      const cachedStatus = localStorage.getItem(`dispatch_status_${r.id}`);
      let dispatchStatus = 'Pending Intake';
      if (r.status === 'Completed' || r.status === 'Inactive') {
        dispatchStatus = cachedStatus || 'Ready for Dispatch';
      } else {
        dispatchStatus = cachedStatus || 'Under Analysis';
      }

      return {
        id: r.id,
        trNo,
        company: r.company,
        client: r.client,
        category: r.category,
        date: r.date || '2026-07-10',
        status: dispatchStatus
      };
    });
  }, [requests]);

  const handleMarkDispatched = (id) => {
    localStorage.setItem(`dispatch_status_${id}`, 'Dispatched');
    loadData();
  };

  const handleResetStatus = (id) => {
    localStorage.removeItem(`dispatch_status_${id}`);
    loadData();
  };

  return (
    <div className="dispatch-container" style={{ padding: '0.25rem' }}>
      {error && (
        <div className="form-alert form-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Dispatch card block */}
      <div className="comp-card">
        <div className="comp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 600 }}>
            {isLoading ? 'Loading...' : `${dispatchList.length} dispatch logs found`}
          </span>
        </div>

        <div className="comp-table-wrapper">
          <table className="comp-table">
            <thead>
              <tr>
                <th>TR Number</th>
                <th>Company</th>
                <th>Client</th>
                <th>Category</th>
                <th>Analysis Date</th>
                <th>Dispatch Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    <span className="spinner" style={{ display: 'inline-block', marginRight: '0.5rem' }}></span>
                    Loading dispatch registry...
                  </td>
                </tr>
              ) : dispatchList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                    No dispatch logs found.
                  </td>
                </tr>
              ) : (
                dispatchList.map(row => (
                  <tr key={row.id}>
                    <td className="comp-text-medium" style={{ fontWeight: 700 }}>{row.trNo}</td>
                    <td className="comp-text-medium">{row.company}</td>
                    <td className="comp-text-medium">{row.client}</td>
                    <td className="comp-text-light">{row.category}</td>
                    <td className="comp-text-muted">{row.date}</td>
                    <td>
                      <span 
                        className={`comp-type-badge`} 
                        style={{ 
                          backgroundColor: row.status === 'Dispatched' ? 'rgba(80, 200, 120, 0.15)' : 
                                           row.status === 'Ready for Dispatch' ? 'rgba(14, 165, 233, 0.15)' : 
                                           'rgba(245, 158, 11, 0.15)',
                          color: row.status === 'Dispatched' ? 'var(--secondary-dark)' : 
                                 row.status === 'Ready for Dispatch' ? '#0EA5E9' : 
                                 '#F59E0B'
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>
                      {row.status === 'Ready for Dispatch' ? (
                        <button 
                          onClick={() => handleMarkDispatched(row.id)}
                          className="tr-submit-btn"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto', background: 'var(--secondary-dark)' }}
                        >
                          <FaTruck />
                          <span>Dispatch Report</span>
                        </button>
                      ) : row.status === 'Dispatched' ? (
                        <button 
                          onClick={() => handleResetStatus(row.id)}
                          className="tr-cancel-btn"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto' }}
                        >
                          <FaClock />
                          <span>Revert Status</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          Awaiting Completion
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dispatch;
