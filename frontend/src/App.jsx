import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatCard from './components/StatCard';
import RecordsTable from './components/RecordsTable';
import ManualReviewSection from './components/ManualReviewSection';
import DashboardPage from './pages/DashboardPage';
import ReviewPage from './pages/ReviewPage';
import RecordFormModal from './components/RecordFormModal';
import SimulatorModal from './components/SimulatorModal';
import RecordDetailsModal from './components/RecordDetailsModal';
import ArchitectureModal from './components/ArchitectureModal';
import { api } from './services/api';
import { 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  CopyCheck, 
  Clock, 
  Plus, 
  Zap, 
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_records: 0,
    unique_records: 0,
    duplicates_rejected: 0,
    near_duplicates: 0,
    records_requiring_review: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [health, setHealth] = useState('healthy');

  // Filter & Search State
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal Visibility
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [archModalOpen, setArchModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null);

  // Fetch stats and records from API
  const fetchData = useCallback(async () => {
    try {
      const [statsData, recordsData, healthData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getRecords({ limit: 200, sort_by: sortBy, sort_order: sortOrder }).catch(() => []),
        api.getHealth().catch(() => ({ status: 'degraded' })),
      ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(recordsData)) setRecords(recordsData);
      if (healthData?.status) setHealth(healthData.status);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Actions
  const handleApproveRecord = async (id, notes = '') => {
    try {
      await api.approveRecord(id, notes);
      fetchData();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleRejectRecord = async (id, notes = '') => {
    try {
      await api.rejectRecord(id, notes);
      fetchData();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete record #${id}?`)) return;
    try {
      await api.deleteRecord(id);
      fetchData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const pendingRecords = records.filter((r) => r.status === 'REVIEW_REQUIRED');

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={stats.records_requiring_review || pendingRecords.length}
        healthStatus={health}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        onOpenSimulatorModal={() => setSimulatorModalOpen(true)}
        onOpenArchModal={() => setArchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Top Header & Quick Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-unique">
                <span className="badge-dot"></span> Cloud-Based Data Cleansing Active
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                • CodeAlpha Cloud Computing Project
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {activeTab === 'dashboard' && 'Data Redundancy Intelligence Dashboard'}
              {activeTab === 'records' && 'Cloud Repository Records Explorer'}
              {activeTab === 'review' && 'Manual Redundancy Review Workspace'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
              id="btn-refresh-data"
              title="Refresh database metrics and records"
            >
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
              {refreshing ? 'Syncing...' : 'Sync Cloud DB'}
            </button>

            <button
              className="btn-primary"
              onClick={() => setCreateModalOpen(true)}
              id="btn-quick-new-record"
            >
              <Plus size={16} />
              Submit Record
            </button>
          </div>
        </div>

        {/* 5 Core Metric Cards (Requirement 11) */}
        <div className="stats-grid">
          <StatCard
            title="Total Records"
            value={stats.total_records}
            subtext="Persisted in Cloud DB"
            icon={Database}
            accentColor="var(--accent-cyan)"
            bgGlow="rgba(56, 189, 248, 0.12)"
            onClick={() => { setActiveTab('records'); setSelectedStatus('ALL'); }}
          />

          <StatCard
            title="Unique Records"
            value={stats.unique_records}
            subtext="Verified authentic data"
            icon={ShieldCheck}
            accentColor="var(--status-unique)"
            bgGlow="rgba(16, 185, 129, 0.12)"
            onClick={() => { setActiveTab('records'); setSelectedStatus('UNIQUE'); }}
          />

          <StatCard
            title="Duplicates Prevented"
            value={stats.duplicates_rejected}
            subtext="Exact copies rejected"
            icon={CopyCheck}
            accentColor="var(--status-duplicate)"
            bgGlow="rgba(244, 63, 94, 0.12)"
          />

          <StatCard
            title="Near Duplicates"
            value={stats.near_duplicates}
            subtext="Similar records blocked"
            icon={ShieldAlert}
            accentColor="var(--status-near-duplicate)"
            bgGlow="rgba(245, 158, 11, 0.12)"
          />

          <StatCard
            title="Pending Reviews"
            value={stats.records_requiring_review || pendingRecords.length}
            subtext="Requires human decision"
            icon={Clock}
            accentColor="var(--status-review)"
            bgGlow="rgba(168, 85, 247, 0.12)"
            onClick={() => setActiveTab('review')}
          />
        </div>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
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
                <button
                  className="btn-secondary"
                  onClick={() => setSimulatorModalOpen(true)}
                  id="btn-open-simulator-dash"
                >
                  <Zap size={14} /> Open Simulator
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setCreateModalOpen(true)}
                  id="btn-submit-record-dash"
                >
                  <Plus size={14} /> Test Submission
                </button>
              </div>
            </div>

            {/* Records Table Preview */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Active Database Records</h3>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}
                  onClick={() => setActiveTab('records')}
                >
                  View All ({records.length}) →
                </button>
              </div>

              <RecordsTable
                records={records}
                onSelectRecord={setSelectedRecordForDetails}
                onDeleteRecord={handleDeleteRecord}
                onApproveRecord={handleApproveRecord}
                onRejectRecord={handleRejectRecord}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(col, ord) => { setSortBy(col); setSortOrder(ord); }}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
              />
            </div>
          </>
        )}

        {/* Tab 2: Records Explorer */}
        {activeTab === 'records' && (
          <div>
            <RecordsTable
              records={records}
              onSelectRecord={setSelectedRecordForDetails}
              onDeleteRecord={handleDeleteRecord}
              onApproveRecord={handleApproveRecord}
              onRejectRecord={handleRejectRecord}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(col, ord) => { setSortBy(col); setSortOrder(ord); }}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </div>
        )}

        {/* Tab 3: Manual Review Workspace */}
        {activeTab === 'review' && (
          <ManualReviewSection
            pendingRecords={pendingRecords}
            allRecords={records}
            onApprove={handleApproveRecord}
            onReject={handleRejectRecord}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.5rem 2rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <div>
          <strong>CloudVault</strong> – Cloud-Based Data Redundancy Removal and Data Validation System
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          CodeAlpha Cloud Computing Internship Project • FastAPI + PostgreSQL + React + RapidFuzz + Docker
        </div>
      </footer>

      {/* Modals */}
      <RecordFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      <SimulatorModal
        isOpen={simulatorModalOpen}
        onClose={() => setSimulatorModalOpen(false)}
        onRefreshRecords={fetchData}
      />

      <RecordDetailsModal
        record={selectedRecordForDetails}
        onClose={() => setSelectedRecordForDetails(null)}
      />

      <ArchitectureModal
        isOpen={archModalOpen}
        onClose={() => setArchModalOpen(false)}
      />
    </div>
  );
}
