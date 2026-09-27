import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import { api } from '../services/api';

const PRESETS = [
  {
    label: "Exact Duplicate (Rahul Kumar)",
    type: "duplicate",
    data: {
      name: "Rahul Kumar",
      email: "rahul@gmail.com",
      phone: "9876543210",
      address: "45 MG Road, Indiranagar, Bangalore",
      category: "Customer",
      description: "Existing verified record duplicate attempt"
    }
  },
  {
    label: "Near Duplicate (Spaces & +91 Phone)",
    type: "near-duplicate",
    data: {
      name: "  Rahul   Kumar  ",
      email: "RAHUL@GMAIL.COM",
      phone: "+91 98765 43210",
      address: "45 MG Road, Bangalore",
      category: "Customer",
      description: "Testing normalization with whitespace and phone format"
    }
  },
  {
    label: "False Positive (Arun Kumar - Distinct Email)",
    type: "review",
    data: {
      name: "Arun Kumar",
      email: "arun.distinct99@gmail.com",
      phone: "9123456780",
      address: "42 Race Course Road, Coimbatore",
      category: "Customer",
      description: "Identical name but different person & email"
    }
  },
  {
    label: "New Unique Record",
    type: "unique",
    data: {
      name: "Marcus Vance",
      email: "marcus.v@novatech.cloud",
      phone: "+1 415 555 7890",
      address: "201 Mission St, San Francisco, CA",
      category: "Enterprise",
      description: "Cloud infrastructure architect"
    }
  }
];

export default function RecordFormModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: 'Customer',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (result) setResult(null);
  };

  const loadPreset = (presetData) => {
    setFormData(presetData);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.createRecord(formData);
      setResult(response);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.details?.detail?.errors?.join(', ') || err.message || 'Validation or submission failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      category: 'Customer',
      description: ''
    });
    setResult(null);
    setError(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNIQUE':
        return <span className="badge badge-unique"><span className="badge-dot"></span> Unique Verified</span>;
      case 'EXACT_DUPLICATE':
        return <span className="badge badge-exact-duplicate"><span className="badge-dot"></span> Exact Duplicate</span>;
      case 'NEAR_DUPLICATE':
        return <span className="badge badge-near-duplicate"><span className="badge-dot"></span> Near Duplicate</span>;
      case 'REVIEW_REQUIRED':
        return <span className="badge badge-review-required"><span className="badge-dot"></span> Review Required</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Submit Record for Redundancy Check</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Data will be validated, normalized, and checked against the database.
            </p>
          </div>
          <button 
            className="btn-secondary" 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ padding: '1rem 2rem 0', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              Quick Test Presets (1-Click Fill):
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                onClick={() => loadPreset(preset.data)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div 
                style={{
                  background: 'var(--status-invalid-bg)',
                  border: '1px solid var(--status-invalid-border)',
                  color: 'var(--status-invalid)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <XCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Results Feedback Banner */}
            {result && (
              <div 
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1px solid ${
                    result.status === 'UNIQUE' ? 'var(--status-unique-border)' :
                    result.status === 'EXACT_DUPLICATE' ? 'var(--status-duplicate-border)' :
                    result.status === 'NEAR_DUPLICATE' ? 'var(--status-near-duplicate-border)' :
                    'var(--status-review-border)'
                  }`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {result.status === 'UNIQUE' && <CheckCircle2 color="var(--status-unique)" size={20} />}
                    {result.status === 'EXACT_DUPLICATE' && <XCircle color="var(--status-duplicate)" size={20} />}
                    {result.status === 'NEAR_DUPLICATE' && <AlertTriangle color="var(--status-near-duplicate)" size={20} />}
                    {result.status === 'REVIEW_REQUIRED' && <HelpCircle color="var(--status-review)" size={20} />}
                    <h3 style={{ fontSize: '1rem' }}>{result.message}</h3>
                  </div>
                  {getStatusBadge(result.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>ACTION</span>
                    <strong style={{ 
                      color: result.action === 'stored' ? 'var(--status-unique)' :
                             result.action === 'rejected' ? 'var(--status-duplicate)' : 'var(--status-review)',
                      textTransform: 'uppercase'
                    }}>
                      {result.action}
                    </strong>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>SIMILARITY SCORE</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{result.similarity_score}%</strong>
                  </div>

                  {result.matched_record_id && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>MATCHED RECORD</span>
                      <strong>#{result.matched_record_id}</strong>
                    </div>
                  )}
                </div>

                {result.reason && (
                  <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <strong>Reason:</strong> {result.reason}
                  </p>
                )}

                {/* Field Comparison Chips */}
                {(result.matching_fields?.length > 0 || result.differing_fields?.length > 0) && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fields:</span>
                    {result.matching_fields?.map((f) => (
                      <span key={f} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--status-unique)' }}>
                        ✓ {f} match
                      </span>
                    ))}
                    {result.differing_fields?.map((f) => (
                      <span key={f} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--status-near-duplicate)' }}>
                        ≠ {f} differ
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Rahul Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  id="input-name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="e.g. rahul@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  id="input-email"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210 or 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  id="input-phone"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Category
                </label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                  id="input-category"
                >
                  <option value="Customer">Customer</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Partner">Partner</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                name="address"
                className="form-input"
                placeholder="Physical address or region"
                value={formData.address}
                onChange={handleChange}
                id="input-address"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <textarea
                name="description"
                className="form-textarea"
                rows="2"
                placeholder="Additional notes about this contact or record"
                value={formData.description}
                onChange={handleChange}
                id="input-description"
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              <RefreshCw size={14} />
              Reset Form
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              id="btn-submit-record"
            >
              {loading ? (
                <>Evaluating...</>
              ) : (
                <>
                  <Send size={15} />
                  Validate & Submit Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
