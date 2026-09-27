import React from 'react';
import { X, Database, CheckCircle2, Calendar, Tag, ShieldCheck } from 'lucide-react';

export default function RecordDetailsModal({ record, onClose }) {
  if (!record) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
              <Database size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Record Details #{record.id}</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Stored database record and normalized comparison index.
              </p>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</span>
              <strong style={{ fontSize: '0.95rem', display: 'block' }}>{record.name}</strong>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
              <strong style={{ fontSize: '0.95rem', display: 'block', color: record.status === 'UNIQUE' || record.status === 'APPROVED' ? 'var(--status-unique)' : 'var(--status-review)' }}>
                {record.status}
              </strong>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
              <strong style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', display: 'block' }}>{record.email}</strong>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</span>
              <strong style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', display: 'block' }}>{record.phone}</strong>
            </div>
          </div>

          {/* Normalized Comparison Layer */}
          <div style={{ background: 'rgba(14, 22, 38, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Normalized Comparison Fields (Used for Duplicate Indexing):
            </span>
            <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <div>• normalized_name: <span style={{ color: '#fff' }}>"{record.normalized_name}"</span></div>
              <div>• normalized_email: <span style={{ color: '#fff' }}>"{record.normalized_email}"</span></div>
              <div>• normalized_phone: <span style={{ color: '#fff' }}>"{record.normalized_phone}"</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Category</span>
              <strong>{record.category || 'General'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Similarity Score</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{record.similarity_score}%</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Address</span>
              <span>{record.address || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Created At</span>
              <span>{new Date(record.created_at).toLocaleString()}</span>
            </div>
          </div>

          {record.review_reason && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Review Audit Note:</span>
              <span>{record.review_reason}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
