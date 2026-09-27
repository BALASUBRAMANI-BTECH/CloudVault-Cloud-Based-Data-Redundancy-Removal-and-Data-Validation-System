import React from 'react';
import { X, Cloud, Layers, Database, Shield, Server, Box, Globe } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
              <Cloud size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Cloud Architecture & System Design</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                CodeAlpha Cloud Computing Internship Project Specification
              </p>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Cloud Topology Diagram */}
          <div style={{ background: 'rgba(10, 16, 28, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multi-Tier Cloud Deployment Topology
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Frontend Card */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                  <Globe size={18} />
                  <strong style={{ fontSize: '0.875rem' }}>Client Tier</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div>• React 18 + Vite SPA</div>
                  <div>• AWS S3 / CloudFront CDN</div>
                  <div>• Docker (Nginx Alpine)</div>
                </div>
              </div>

              {/* Backend Card */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-review)', marginBottom: '0.5rem' }}>
                  <Server size={18} />
                  <strong style={{ fontSize: '0.875rem' }}>API Backend Tier</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div>• FastAPI (Python 3.10)</div>
                  <div>• RapidFuzz & Pydantic v2</div>
                  <div>• AWS ECS Fargate / App Runner</div>
                </div>
              </div>

              {/* Database Card */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-unique)', marginBottom: '0.5rem' }}>
                  <Database size={18} />
                  <strong style={{ fontSize: '0.875rem' }}>Data Storage Tier</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <div>• PostgreSQL (cloudvault_db)</div>
                  <div>• AWS RDS Multi-AZ</div>
                  <div>• SQLAlchemy ORM + SQLite Dev</div>
                </div>
              </div>
            </div>
          </div>

          {/* Pipeline Workflow */}
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>7-Stage Data Redundancy Elimination Pipeline:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', alignItems: 'center' }}>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>1. Ingestion</span>
              <span>→</span>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>2. Input Validation</span>
              <span>→</span>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>3. Normalization</span>
              <span>→</span>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>4. Exact Check</span>
              <span>→</span>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>5. RapidFuzz Scoring</span>
              <span>→</span>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>6. False Positive Check</span>
              <span>→</span>
              <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', color: 'var(--accent-cyan)' }}>7. Persistence / Review / Reject</span>
            </div>
          </div>

          {/* Scoring Thresholds */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
            <div style={{ background: 'var(--status-duplicate-bg)', border: '1px solid var(--status-duplicate-border)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--status-duplicate)', display: 'block' }}>Score ≥ 90%: NEAR DUPLICATE</strong>
              <span style={{ color: 'var(--text-secondary)' }}>Automatically blocked and logged to prevent database bloat.</span>
            </div>

            <div style={{ background: 'var(--status-review-bg)', border: '1px solid var(--status-review-border)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--status-review)', display: 'block' }}>Score 70% – 89%: REVIEW REQUIRED</strong>
              <span style={{ color: 'var(--text-secondary)' }}>Queued in manual review or flagged as potential false positive.</span>
            </div>

            <div style={{ background: 'var(--status-unique-bg)', border: '1px solid var(--status-unique-border)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ color: 'var(--status-unique)', display: 'block' }}>Score &lt; 70%: UNIQUE</strong>
              <span style={{ color: 'var(--text-secondary)' }}>Verified as clean unique data and persisted directly to database.</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
