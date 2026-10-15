/**
 * @file QuotationClientPlantStep.jsx
 * @description Step 2: Client & Plant / Unit configuration using real Client Master records.
 * Supports quotation-level editing of Plant Address without modifying master records.
 */

import React, { useState } from 'react';
import { FaBuilding, FaMapMarkerAlt, FaIndustry, FaInfoCircle, FaEdit } from 'react-icons/fa';

const QuotationClientPlantStep = ({ formData, setFormData, clients = [] }) => {
  const [isEditingAddressOverride, setIsEditingAddressOverride] = useState(false);

  const handleClientSelect = (e) => {
    const selectedId = e.target.value;
    const selectedClient = clients.find(c => c.id === selectedId);

    if (selectedClient) {
      const regAddress = selectedClient.office_address || selectedClient.officeAddress || selectedClient.address || '';
      const plantAddr = selectedClient.plant_address || selectedClient.plantAddress || regAddress;

      setFormData(prev => ({
        ...prev,
        clientId: selectedClient.id,
        clientName: selectedClient.clientName || selectedClient.name || '',
        registeredAddress: regAddress,
        clientCity: selectedClient.city || '',
        clientState: selectedClient.state || '',
        clientEmail: selectedClient.email || '',
        clientPhone: selectedClient.contactNumber || selectedClient.contact_number || '',
        plantName: selectedClient.clientName ? `${selectedClient.clientName} - Plant Unit` : '',
        plantAddress: plantAddr,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        clientId: '',
        clientName: '',
        registeredAddress: '',
        clientCity: '',
        clientState: '',
        clientEmail: '',
        clientPhone: '',
        plantName: '',
        plantAddress: '',
      }));
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="quotation-step-container">
      <div className="step-header">
        <h3 className="step-title">
          <FaBuilding className="step-icon text-primary" /> Step 2: Client & Plant / Unit Details
        </h3>
        <p className="step-subtitle">
          Select client from registered Client Master. Configure and edit plant-specific address for this quotation.
        </p>
      </div>

      <div className="form-grid-2">
        {/* Client Selection (Real Client API) */}
        <div className="form-group full-width">
          <label className="form-label required">Select Client (From Client Master)</label>
          <select
            name="clientId"
            value={formData.clientId || ''}
            onChange={handleClientSelect}
            className="form-control form-control-lg font-semibold"
            required
          >
            <option value="">-- Choose Client from Master Database ({clients.length} available) --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.clientName || c.name} {c.city ? `(${c.city})` : ''} - {c.contactNumber || c.contact_number || 'No Phone'}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <small className="text-warning mt-1 d-block">
              <FaInfoCircle /> No clients loaded yet from API. If no clients exist, create one in Client Master.
            </small>
          )}
        </div>

        {/* Selected Client Card */}
        <div className="card-sub-section">
          <h4 className="sub-section-title">
            <FaBuilding /> Registered Client Information
          </h4>
          <div className="form-group">
            <label className="form-label">Client / Organization Name</label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName || ''}
              onChange={handleFieldChange}
              placeholder="Client Name"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Registered Office Address</label>
            <textarea
              name="registeredAddress"
              rows={3}
              value={formData.registeredAddress || ''}
              onChange={handleFieldChange}
              placeholder="Registered Office Address"
              className="form-control"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="clientCity"
                value={formData.clientCity || ''}
                onChange={handleFieldChange}
                placeholder="City"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="clientState"
                value={formData.clientState || ''}
                onChange={handleFieldChange}
                placeholder="State"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Plant / Unit Card */}
        <div className="card-sub-section border-accent">
          <div className="d-flex justify-between align-center mb-2">
            <h4 className="sub-section-title mb-0">
              <FaIndustry /> Plant / Unit Location (For This Quotation)
            </h4>
            <span className="badge badge-info text-xs">
              Quotation-Specific Override
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Plant / Unit Name</label>
            <input
              type="text"
              name="plantName"
              value={formData.plantName || ''}
              onChange={handleFieldChange}
              placeholder="e.g. Gandhidham Unit / Factory Unit-1"
              className="form-control font-medium"
            />
          </div>

          <div className="form-group">
            <div className="d-flex justify-between align-center mb-1">
              <label className="form-label mb-0 required">Plant / Factory Site Address</label>
              <button
                type="button"
                className="btn-link text-xs"
                onClick={() => setIsEditingAddressOverride(!isEditingAddressOverride)}
              >
                <FaEdit /> {isEditingAddressOverride ? 'Lock Address' : 'Edit for Quote'}
              </button>
            </div>
            <textarea
              name="plantAddress"
              rows={4}
              value={formData.plantAddress || ''}
              onChange={handleFieldChange}
              placeholder="Enter exact plant/unit address (Plot No, GIDC, Village, Dist...)"
              className={`form-control ${isEditingAddressOverride ? 'border-primary bg-white' : ''}`}
              required
            />
            <small className="text-muted d-block mt-1">
              Note: Changes made here apply only to this quotation and will <strong>not</strong> alter the Client Master database record.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationClientPlantStep;
