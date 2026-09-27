import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Play, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

const SCENARIOS = [
  {
    id: "exact",
    title: "Scenario 1: Exact Duplicate Detection",
    description: "Submits identical credentials for an existing user (Rahul Kumar). Expected: Rejected with 100% score.",
    payload: {
      name: "Rahul Kumar",
      email: "rahul@gmail.com",
      phone: "9876543210",
      category: "Customer"
    }
  },
  {
    id: "near",
    title: "Scenario 2: Near Duplicate Normalization",
    description: "Submits with excess whitespace, uppercase email, and '+91 98765 43210'. Expected: Normalized and rejected.",
    payload: {
      name: "   Rahul    Kumar   ",
      email: "RAHUL@GMAIL.COM",
      phone: "+91 98765 43210",
      category: "Customer"
    }
  },
  {
    id: "false_pos",
    title: "Scenario 3: False Positive Discrimination",
    description: "Identical name (Arun Kumar) but distinct email and phone number. Expected: Flagged for Manual Review.",
    payload: {
      name: "Arun Kumar",
      email: "arun.distinct2026@gmail.com",
      phone: "9123456780",
      category: "Customer"
    }
  },
  {
    id: "unique",
    title: "Scenario 4: Verified Unique Record",
    description: "Completely novel individual across all identity fields. Expected: Stored successfully with UNIQUE status.",
    payload: {
      name: "Zara Chen",
      email: `zara.chen.${Date.now().toString().slice(-4)}@fintech.io`,
      phone: `9944${Math.floor(100000 + Math.random() * 900000)}`,
      category: "Engineering"
    }
  }
];

export default function SimulatorModal({ isOpen, onClose, onRefreshRecords }) {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  if (!isOpen) return null;

  const runSimulation = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.createRecord(selectedScenario.payload);
      setSimResult(res);
      if (onRefreshRecords) onRefreshRecords();
    } catch (err) {
      setSimResult({
        status: "ERROR",
        message: err.message || "Simulation error",
        similarity_score: 0,
        action: "failed"
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
              <Zap size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Redundancy Removal Simulator</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Test the CloudVault detection algorithm across core redundancy benchmarks.
              </p>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Scenario Selection Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenario(sc);
                    setSimResult(null);
                  }}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <strong style={{ fontSize: '0.875rem', display: 'block', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {sc.title}
                  </strong>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Test Payload Preview */}
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
              Incoming Simulation Payload:
            </span>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--accent-cyan)' }}>
              {JSON.stringify(selectedScenario.payload, null, 2)}
            </pre>
          </div>

          {/* Live Run Button */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button
              className="btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
              onClick={runSimulation}
              disabled={simulating}
              id="btn-run-simulation"
            >
              {simulating ? (
                <>Simulating Pipeline...</>
              ) : (
                <>
                  <Play size={16} /> Execute Scenario Simulation
                </>
              )}
            </button>
          </div>

          {/* Simulation Output Card */}
          {simResult && (
            <div 
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                animation: 'fadeIn 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {simResult.status === 'UNIQUE' && <CheckCircle size={22} color="var(--status-unique)" />}
                  {simResult.status === 'EXACT_DUPLICATE' && <XCircle size={22} color="var(--status-duplicate)" />}
                  {simResult.status === 'NEAR_DUPLICATE' && <AlertTriangle size={22} color="var(--status-near-duplicate)" />}
                  {simResult.status === 'REVIEW_REQUIRED' && <HelpCircle size={22} color="var(--status-review)" />}
                  <h3 style={{ fontSize: '1.1rem' }}>{simResult.message}</h3>
                </div>
                <span className="badge" style={{ fontFamily: 'var(--font-mono)' }}>
                  Score: {simResult.similarity_score}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>DECISION</span>
                  <strong style={{ textTransform: 'uppercase', color: simResult.action === 'stored' ? 'var(--status-unique)' : simResult.action === 'rejected' ? 'var(--status-duplicate)' : 'var(--status-review)' }}>
                    {simResult.action}
                  </strong>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>MATCHED CANDIDATE</span>
                  <strong>{simResult.matched_record_id ? `#${simResult.matched_record_id}` : 'None'}</strong>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CLASSIFICATION</span>
                  <strong>{simResult.status}</strong>
                </div>
              </div>

              {simResult.reason && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <strong>System Analysis:</strong> {simResult.reason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
