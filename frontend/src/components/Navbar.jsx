import React from 'react';
import { 
  Cloud, 
  ShieldCheck, 
  LayoutDashboard, 
  Database, 
  UserCheck, 
  Zap, 
  Plus, 
  Server,
  Cpu
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  pendingCount = 0, 
  healthStatus = 'healthy',
  onOpenCreateModal,
  onOpenSimulatorModal,
  onOpenArchModal
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo & Name */}
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Cloud size={24} />
          </div>
          <div className="brand-info">
            <h1>CloudVault</h1>
            <span>Data Redundancy Removal System</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            id="tab-dashboard"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
            id="tab-records"
          >
            <Database size={16} />
            All Records
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
            id="tab-review"
          >
            <UserCheck size={16} />
            Manual Review
            {pendingCount > 0 && (
              <span className="badge-counter">{pendingCount}</span>
            )}
          </button>

          <button
            className="nav-tab-btn"
            onClick={onOpenSimulatorModal}
            id="btn-open-simulator"
          >
            <Zap size={16} />
            Test Simulator
          </button>

          <button
            className="nav-tab-btn"
            onClick={onOpenArchModal}
            id="btn-open-architecture"
          >
            <Cpu size={16} />
            Architecture
          </button>
        </nav>

        {/* Right Actions: Health Status & New Record Button */}
        <div className="nav-actions">
          <div className="health-pill" title="Backend & Database Health Status">
            <span className="health-dot"></span>
            <span>API Online</span>
          </div>

          <button 
            className="btn-primary" 
            onClick={onOpenCreateModal}
            id="btn-add-record"
          >
            <Plus size={16} />
            Submit Record
          </button>
        </div>
      </div>
    </header>
  );
}
