import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function RecordsTable({ 
  records = [], 
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
  onCategoryFilterChange
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter records locally or pass down
  const filteredRecords = records.filter((r) => {
    if (selectedStatus && selectedStatus !== 'ALL') {
      if (r.status !== selectedStatus) return false;
    }
    if (categoryFilter && categoryFilter !== 'ALL') {
      if (r.category !== categoryFilter) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = r.name?.toLowerCase().includes(q);
      const matchEmail = r.email?.toLowerCase().includes(q);
      const matchPhone = r.phone?.toLowerCase().includes(q);
      const matchCategory = r.category?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchCategory) return false;
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNIQUE':
        return <span className="badge badge-unique"><span className="badge-dot"></span> Unique</span>;
      case 'APPROVED':
        return <span className="badge badge-approved"><span className="badge-dot"></span> Approved</span>;
      case 'EXACT_DUPLICATE':
        return <span className="badge badge-exact-duplicate"><span className="badge-dot"></span> Duplicate</span>;
      case 'NEAR_DUPLICATE':
        return <span className="badge badge-near-duplicate"><span className="badge-dot"></span> Near Duplicate</span>;
      case 'REVIEW_REQUIRED':
        return <span className="badge badge-review-required"><span className="badge-dot"></span> Review Req.</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--status-duplicate)';
    if (score >= 70) return 'var(--status-review)';
    if (score >= 40) return 'var(--status-near-duplicate)';
    return 'var(--status-unique)';
  };

  const categories = ['ALL', 'Customer', 'Enterprise', 'Partner', 'Vendor', 'Healthcare', 'Finance', 'Engineering', 'Retail'];
  const statusFilters = ['ALL', 'UNIQUE', 'REVIEW_REQUIRED', 'APPROVED', 'NEAR_DUPLICATE', 'EXACT_DUPLICATE'];

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      {/* Controls Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search 
            size={16} 
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search records by name, email, phone, category..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setCurrentPage(1);
            }}
            id="input-table-search"
          />
        </div>

        {/* Filters & Sorters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Category Dropdown */}
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.6rem 1rem', fontSize: '0.8125rem' }}
            value={categoryFilter}
            onChange={(e) => {
              onCategoryFilterChange(e.target.value);
              setCurrentPage(1);
            }}
            id="select-category-filter"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Sort By Toggle */}
          <button
            className="btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.55rem 0.9rem' }}
            onClick={() => {
              if (sortBy === 'created_at') {
                onSortChange('similarity_score', sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                onSortChange('created_at', sortOrder === 'asc' ? 'desc' : 'asc');
              }
            }}
            id="btn-sort-toggle"
            title="Toggle Sort Column & Direction"
          >
            <ArrowUpDown size={14} />
            Sort: {sortBy === 'created_at' ? 'Date' : 'Similarity'} ({sortOrder.toUpperCase()})
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        {statusFilters.map((st) => (
          <button
            key={st}
            className={`btn-secondary ${selectedStatus === st ? 'active' : ''}`}
            style={{
              padding: '0.35rem 0.8rem',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-full)',
              background: selectedStatus === st ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              borderColor: selectedStatus === st ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              color: selectedStatus === st ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontWeight: selectedStatus === st ? 600 : 500
            }}
            onClick={() => {
              onStatusChange(st);
              setCurrentPage(1);
            }}
          >
            {st === 'ALL' ? 'All Records' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Category</th>
              <th>Similarity</th>
              <th>Status</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <div>No records found matching your filters.</div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => {
                const scoreColor = getScoreColor(record.similarity_score);
                const isPending = record.status === 'REVIEW_REQUIRED';

                return (
                  <tr key={record.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      #{record.id}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{record.name}</div>
                      {record.address && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {record.address}
                        </div>
                      )}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {record.email}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {record.phone}
                    </td>

                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {record.category || 'General'}
                      </span>
                    </td>

                    <td>
                      <div className="score-pill">
                        <span style={{ color: scoreColor }}>{record.similarity_score?.toFixed(1)}%</span>
                        <div className="score-bar-bg">
                          <div 
                            className="score-bar-fill" 
                            style={{ 
                              width: `${Math.min(record.similarity_score || 0, 100)}%`,
                              backgroundColor: scoreColor 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {getStatusBadge(record.status)}
                    </td>

                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {isPending && (
                          <>
                            <button
                              className="btn-success"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => onApproveRecord(record.id)}
                              title="Approve Record"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => onRejectRecord(record.id)}
                              title="Reject Record"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        )}

                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => onSelectRecord(record)}
                          title="View Details"
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', color: 'var(--status-duplicate)' }}
                          onClick={() => onDeleteRecord(record.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        <div>
          Showing {paginatedRecords.length} of {filteredRecords.length} records
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          >
            Previous
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 0.5rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
