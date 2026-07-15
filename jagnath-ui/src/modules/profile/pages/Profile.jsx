import React, { useState } from 'react';
import { getStoredUser } from '../../auth/services/authService';
import { FaUserCircle, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(getStoredUser() || {});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      location: user.location || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="page-subtitle">View and manage your account details</p>
        </div>
        {!isEditing ? (
          <button className="action-btn edit-btn" onClick={() => setIsEditing(true)}>
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <div className="action-group">
            <button className="action-btn cancel-btn" onClick={handleCancel}>
              <FaTimes /> Cancel
            </button>
            <button className="action-btn save-btn" onClick={handleSave}>
              <FaSave /> Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="avatar-circle">
            <FaUserCircle className="avatar-icon" />
          </div>
          <div className="avatar-info">
            {isEditing ? (
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="edit-input name-input"
                placeholder="Your Name"
              />
            ) : (
              <h3>{user.name || 'User Name'}</h3>
            )}
            <span className="role-badge">{user.role || 'Member'}</span>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="detail-item">
            <div className="detail-icon-box">
              <FaEnvelope />
            </div>
            <div className="detail-content">
              <span className="detail-label">Email Address</span>
              {isEditing ? (
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className="edit-input"
                  placeholder="Enter email"
                />
              ) : (
                <span className="detail-value">{user.email || 'N/A'}</span>
              )}
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon-box">
              <FaPhoneAlt />
            </div>
            <div className="detail-content">
              <span className="detail-label">Phone Number</span>
              {isEditing ? (
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className="edit-input"
                  placeholder="Enter phone number"
                />
              ) : (
                <span className="detail-value">{user.phone || 'Not provided'}</span>
              )}
            </div>
          </div>

          <div className="detail-item">
            <div className="detail-icon-box">
              <FaMapMarkerAlt />
            </div>
            <div className="detail-content">
              <span className="detail-label">Location</span>
              {isEditing ? (
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange} 
                  className="edit-input"
                  placeholder="Enter location"
                />
              ) : (
                <span className="detail-value">{user.location || 'Not provided'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-page-container {
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }
        
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        
        .page-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }

        .action-group {
          display: flex;
          gap: 1rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .edit-btn {
          background-color: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .edit-btn:hover { background-color: #e2e8f0; }

        .cancel-btn {
          background-color: #fee2e2;
          color: #ef4444;
        }
        .cancel-btn:hover { background-color: #fecaca; }

        .save-btn {
          background-color: #3b82f6;
          color: white;
        }
        .save-btn:hover { background-color: #2563eb; }

        .profile-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .profile-avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2.5rem 2rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
        }

        .avatar-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        .avatar-icon {
          font-size: 5rem;
        }

        .avatar-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background-color: #dbeafe;
          color: #1d4ed8;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 20px;
          text-transform: capitalize;
          margin-top: 0.5rem;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          padding: 2rem;
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .detail-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .detail-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #eff6ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          width: 100%;
        }

        .detail-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 1rem;
          color: #0f172a;
          font-weight: 500;
          word-break: break-all;
        }

        .edit-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #0f172a;
          background-color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }

        .edit-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .name-input {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default Profile;
