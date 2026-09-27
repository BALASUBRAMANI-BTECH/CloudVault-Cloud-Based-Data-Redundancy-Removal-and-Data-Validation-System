import React from 'react';
import RecordsTable from '../components/RecordsTable';
import { Zap, Plus } from 'lucide-react';

export default function DashboardPage({
  records,
  onSelectRecord,
  onDeleteRecord,
  onApproveRecord,
  onRejectRecord,
  selectedStatus,
  onStatusChange,
  searchTerm,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  categoryFilter,
  onCategoryFilterChange,
  onOpenSimulator,
  onOpenCreate
}) {
  return (
    <>
      {/* Quick Demonstration Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.5rem', 
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(14, 22, 38, 0.9), rgba(26, 40, 68, 0.6))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
            <Zap size={18} />
            <strong style={{ fontSize: '1rem' }}>Instant Redundancy Testing Sandbox</strong>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
            Test exact duplicates (Rahul Kumar), formatting/casing variations, and false-positive edge cases (Arun Kumar) with one click to see how the cloud pipeline validates and prevents redundancy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onOpenSimulator}>
            <Zap size={14} /> Open Simulator
          </button>
          <button className="btn-primary" onClick={onOpenCreate}>
            <Plus size={14} /> Test Submission
          </button>
        </div>
      </div>

      {/* Active Records */}
      <RecordsTable
        records={records}
        onSelectRecord={onSelectRecord}
        onDeleteRecord={onDeleteRecord}
        onApproveRecord={onApproveRecord}
        onRejectRecord={onRejectRecord}
        selectedStatus={selectedStatus}
        onStatusChange={onStatusChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={onCategoryFilterChange}
      />
    </>
  );
}
