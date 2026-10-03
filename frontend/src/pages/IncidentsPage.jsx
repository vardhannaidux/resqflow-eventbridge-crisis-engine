import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle2, 
  Eye, 
  Copy, 
  Check, 
  RotateCcw,
  Download
} from 'lucide-react';

export default function IncidentsPage({
  incidents = [],
  onResolveIncident,
  onOpenReportModal
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredIncidents = useMemo(() => {
    let result = [...incidents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i => 
        (i.incidentId && i.incidentId.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.type && i.type.toLowerCase().includes(q)) ||
        (i.assignedTeam && i.assignedTeam.toLowerCase().includes(q)) ||
        (i.reportedBy && i.reportedBy.toLowerCase().includes(q))
      );
    }

    if (severityFilter !== 'ALL') {
      result = result.filter(i => i.severity === severityFilter);
    }

    if (statusFilter === 'ACTIVE') {
      result = result.filter(i => i.status !== 'RESOLVED');
    } else if (statusFilter !== 'ALL') {
      result = result.filter(i => i.status === statusFilter);
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter(i => (i.type === categoryFilter || i.category === categoryFilter));
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'casualties') return (Number(b.peopleAffected) || 0) - (Number(a.peopleAffected) || 0);
      if (sortBy === 'severity') {
        const order = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'UNKNOWN': 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      return 0;
    });

    return result;
  }, [incidents, searchQuery, severityFilter, statusFilter, categoryFilter, sortBy]);

  const totalPages = Math.ceil(filteredIncidents.length / pageSize) || 1;
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIncidents.slice(start, start + pageSize);
  }, [filteredIncidents, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="page-container">
      {/* Page Title Row */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Incidents Directory</h1>
          <p className="page-subtitle">Search, filter, and inspect verified emergency records across AWS DynamoDB</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn-atlas-secondary"
            onClick={() => {
              const exportPayload = {
                exportMetadata: {
                  s3TargetBucket: "resqflow-incident-archives-hyd",
                  s3KeyPrefix: "exports/daily-incident-archive",
                  timestamp: new Date().toISOString(),
                  totalRecords: filteredIncidents.length,
                  environment: "AWS ap-south-2",
                  exportedBy: "DISP-HYD-01"
                },
                incidents: filteredIncidents
              };
              const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ResQFlow-Incident-Archive-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Export filtered records as formatted Amazon S3 archive artifact"
          >
            <Download size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            <span>Export S3 Archive</span>
          </button>

          <button className="btn-atlas-primary" onClick={onOpenReportModal}>
            <PlusCircle size={15} />
            <span>New Incident Report</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="atlas-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div className="header-search-wrap" style={{ width: '360px' }}>
            <Search size={15} color="#64748B" />
            <input
              type="text"
              className="header-search-input"
              placeholder="Search by ID, keyword, team, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Severity Filter Tabs */}
          <div className="table-filter-group">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Severity:
            </span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
              <button
                key={sev}
                className={`filter-btn-pill ${severityFilter === sev ? 'active' : ''}`}
                onClick={() => setSeverityFilter(sev)}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="table-filter-group">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              Status:
            </span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'DISPATCHED', label: 'Dispatched' },
              { id: 'RESOLVED', label: 'Resolved' }
            ].map(st => (
              <button
                key={st.id}
                className={`filter-btn-pill ${statusFilter === st.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={13} color="#64748B" />
            <select
              className="atlas-select"
              style={{ padding: '5px 10px', fontSize: '12px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="severity">Highest Severity</option>
              <option value="casualties">Most Casualties</option>
            </select>
          </div>

          {(searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button className="btn-atlas-secondary" onClick={resetFilters} style={{ padding: '5px 10px', fontSize: '12px' }}>
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="atlas-card atlas-table-card">
        <table className="atlas-data-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Incident ID</th>
              <th>Category</th>
              <th>Description</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Casualties</th>
              <th>Assigned Unit & Hospital</th>
              <th>Reported Time</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIncidents.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: '#64748B' }}>
                  No emergency records match your filter criteria.
                </td>
              </tr>
            ) : (
              paginatedIncidents.map(inc => (
                <tr 
                  key={inc.incidentId}
                  className="atlas-table-row"
                  onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                >
                  <td className="mono" style={{ fontWeight: 700, color: '#2563EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{inc.incidentId}</span>
                      <button 
                        className="btn-copy-id" 
                        onClick={(e) => handleCopyId(e, inc.incidentId)}
                        title="Copy ID"
                      >
                        {copiedId === inc.incidentId ? <Check size={12} color="#059669" /> : <Copy size={12} color="#94A3B8" />}
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {inc.type || inc.category}
                  </td>
                  <td style={{ maxWidth: '280px', color: '#64748B' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.description || 'Emergency report'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-atlas ${inc.severity ? inc.severity.toLowerCase() : 'medium'}`}>
                      {inc.severity || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-atlas ${inc.status === 'RESOLVED' ? 'resolved' : 'dispatched'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="mono text-center font-bold">
                    {inc.peopleAffected || 0}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#14233B' }}>
                      {inc.assignedTeam && !inc.assignedTeam.includes('Pending') ? inc.assignedTeam : 'Awaiting Dispatch'}
                    </div>
                    {inc.hospital && inc.hospital !== 'NONE' && (
                      <div style={{ color: '#64748B', fontSize: '11px' }}>{inc.hospital}</div>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap' }}>
                    {inc.createdAt ? new Date(inc.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Recent'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button 
                        className="btn-atlas-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${inc.incidentId}`);
                        }}
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>

                      {inc.status !== 'RESOLVED' && (
                        <button
                          className="btn-table-resolve"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveIncident(inc.incidentId);
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Showing <strong>{filteredIncidents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, filteredIncidents.length)}</strong> of <strong>{filteredIncidents.length}</strong> incident records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#FFFFFF' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                className="btn-atlas-secondary"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '4px 10px', fontSize: '11px', opacity: currentPage <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>

              <span style={{ fontSize: '12px', fontWeight: 600, color: '#14233B', padding: '0 8px' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="btn-atlas-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: '4px 10px', fontSize: '11px', opacity: currentPage >= totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
