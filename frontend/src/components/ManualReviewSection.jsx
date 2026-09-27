import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck, 
  HelpCircle,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function ManualReviewSection({ 
  pendingRecords = [], 
  allRecords = [], 
  onApprove, 
  onReject 
}) {
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Set initial selected record
  useEffect(() => {
    if (pendingRecords.length > 0 && !selectedRecordId) {
      setSelectedRecordId(pendingRecords[0].id);
    } else if (pendingRecords.length === 0) {
      setSelectedRecordId(null);
    }
  }, [pendingRecords, selectedRecordId]);

  const activeRecord = pendingRecords.find((r) => r.id === selectedRecordId) || pendingRecords[0];
  const matchedRecord = activeRecord?.matched_record_id 
    ? allRecords.find((r) => r.id === activeRecord.matched_record_id)
    : null;

  const handleApprove = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      await onApprove(activeRecord.id, reviewerNotes);
      setReviewerNotes('');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      await onReject(activeRecord.id, reviewerNotes);
      setReviewerNotes('');
    } finally {
      setActionLoading(false);
    }
  };

  if (pendingRecords.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div 
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--status-unique-bg)',
            border: '1px solid var(--status-unique-border)',
            color: 'var(--status-unique)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}
        >
          <CheckCircle size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Review Queue is Clear</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
          No records currently require manual review. All submitted data has been either verified as unique or filtered out as redundant.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>
      {/* Sidebar: Pending Review Items Queue */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            <Clock size={16} color="var(--status-review)" />
            <span>Pending Review</span>
          </div>
          <span className="badge-counter">{pendingRecords.length}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {pendingRecords.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecordId(item.id)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: selectedRecordId === item.id ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${selectedRecordId === item.id ? 'var(--status-review-border)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--status-review)' }}>
                  {item.similarity_score}%
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.email}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Review Comparison Workspace */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {activeRecord && (
          <>
            {/* Header with Title and Similarity Score */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <span className="badge badge-review-required" style={{ marginBottom: '0.5rem' }}>
                  <span className="badge-dot"></span> Review Case #{activeRecord.id}
                </span>
                <h2 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>Manual Redundancy Review</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Overall Similarity</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-review)' }}>
                    {activeRecord.similarity_score}%
                  </span>
                </div>
              </div>
            </div>

            {/* Reason Alert Banner */}
            <div 
              style={{
                background: 'var(--status-review-bg)',
                border: '1px solid var(--status-review-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                marginBottom: '1.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <ShieldAlert size={20} color="var(--status-review)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#fff', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Review Reason & Flag Summary:
                </strong>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {activeRecord.review_reason || "Similarity detected between incoming submission and existing database records. Review fields carefully before approval."}
                </p>
              </div>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="comparison-container">
              {/* Existing Record Column */}
              <div className="comparison-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Existing Record in Database
                  </span>
                  {matchedRecord && (
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      #{matchedRecord.id}
                    </span>
                  )}
                </div>

                {matchedRecord ? (
                  <>
                    <div className="field-diff-row">
                      <span className="field-diff-label">Full Name</span>
                      <span className="field-diff-val match">{matchedRecord.name}</span>
                    </div>

                    <div className="field-diff-row">
                      <span className="field-diff-label">Email Address</span>
                      <span className="field-diff-val">{matchedRecord.email}</span>
                    </div>

                    <div className="field-diff-row">
                      <span className="field-diff-label">Phone Number</span>
                      <span className="field-diff-val">{matchedRecord.phone}</span>
                    </div>

                    <div className="field-diff-row">
                      <span className="field-diff-label">Category</span>
                      <span className="field-diff-val">{matchedRecord.category}</span>
                    </div>

                    <div className="field-diff-row">
                      <span className="field-diff-label">Address</span>
                      <span className="field-diff-val">{matchedRecord.address || '—'}</span>
                    </div>

                    <div className="field-diff-row" style={{ borderBottom: 'none' }}>
                      <span className="field-diff-label">Normalized Name</span>
                      <span className="field-diff-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {matchedRecord.normalized_name}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Matched record details unavailable or record #{activeRecord.matched_record_id} was removed.
                  </div>
                )}
              </div>

              {/* Incoming Record Column */}
              <div className="comparison-card" style={{ borderColor: 'var(--status-review-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--status-review)' }}>
                    Incoming Record (Pending Review)
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--status-review)' }}>
                    #{activeRecord.id}
                  </span>
                </div>

                <div className="field-diff-row">
                  <span className="field-diff-label">Full Name</span>
                  <span className="field-diff-val match">{activeRecord.name}</span>
                </div>

                <div className="field-diff-row">
                  <span className="field-diff-label">Email Address</span>
                  <span className={`field-diff-val ${matchedRecord && matchedRecord.email !== activeRecord.email ? 'diff' : 'match'}`}>
                    {activeRecord.email}
                  </span>
                </div>

                <div className="field-diff-row">
                  <span className="field-diff-label">Phone Number</span>
                  <span className={`field-diff-val ${matchedRecord && matchedRecord.phone !== activeRecord.phone ? 'diff' : 'match'}`}>
                    {activeRecord.phone}
                  </span>
                </div>

                <div className="field-diff-row">
                  <span className="field-diff-label">Category</span>
                  <span className="field-diff-val">{activeRecord.category}</span>
                </div>

                <div className="field-diff-row">
                  <span className="field-diff-label">Address</span>
                  <span className="field-diff-val">{activeRecord.address || '—'}</span>
                </div>

                <div className="field-diff-row" style={{ borderBottom: 'none' }}>
                  <span className="field-diff-label">Normalized Name</span>
                  <span className="field-diff-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {activeRecord.normalized_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Decision Notes & Actions */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="form-group">
                <label className="form-label">Reviewer Notes / Justification</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Verified distinct individual via department roster, approved."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  id="input-reviewer-notes"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-danger"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
                  onClick={handleReject}
                  disabled={actionLoading}
                  id="btn-reject-review"
                >
                  <XCircle size={16} />
                  Reject & Discard Record
                </button>

                <button
                  type="button"
                  className="btn-success"
                  style={{ padding: '0.65rem 1.5rem', fontSize: '0.875rem' }}
                  onClick={handleApprove}
                  disabled={actionLoading}
                  id="btn-approve-review"
                >
                  <CheckCircle size={16} />
                  Approve & Store as Verified
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
