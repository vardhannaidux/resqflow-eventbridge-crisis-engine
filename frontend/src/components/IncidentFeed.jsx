import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Truck, 
  Building2, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Copy, 
  Check, 
  Eye, 
  AlertCircle,
  RotateCcw,
  Users
} from 'lucide-react';

export default function IncidentFeed({
  incidents = [],
  selectedIncident = null,
  onSelectIncident,
  onResolveIncident,
  onOpenReportModal,
  onOpenDrillModal
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and Sort Incidents
  const filteredIncidents = useMemo(() => {
    let result = [...incidents];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(inc => 
        (inc.incidentId && inc.incidentId.toLowerCase().includes(q)) ||
        (inc.description && inc.description.toLowerCase().includes(q)) ||
        (inc.type && inc.type.toLowerCase().includes(q)) ||
        (inc.assignedTeam && inc.assignedTeam.toLowerCase().includes(q)) ||
        (inc.reportedBy && inc.reportedBy.toLowerCase().includes(q))
      );
    }

    // Severity Filter
    if (severityFilter !== 'ALL') {
      result = result.filter(inc => inc.severity === severityFilter);
    }

    // Status Filter
    if (statusFilter === 'ACTIVE') {
      result = result.filter(inc => inc.status !== 'RESOLVED');
    } else if (statusFilter !== 'ALL') {
      result = result.filter(inc => inc.status === statusFilter);
    }

    // Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(inc => (inc.type === categoryFilter || inc.category === categoryFilter));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'casualties') {
        return (Number(b.peopleAffected) || 0) - (Number(a.peopleAffected) || 0);
      }
      if (sortBy === 'severity') {
        const order = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'UNKNOWN': 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      return 0;
    });

    return result;
  }, [incidents, searchQuery, severityFilter, statusFilter, categoryFilter, sortBy]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || severityFilter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  return (
    <div className="glass-panel feed-card-container" role="region" aria-label="Incident Command Feed">
      {/* Header and Live Count */}
      <div className="feed-header-row">
        <div className="feed-title-meta">
          <div className="feed-title-wrap">
            <ShieldAlert size={18} className="text-cyan" />
            <h2 className="feed-title">Incident Command Stream</h2>
          </div>
          <span className="feed-sub-count">
            {filteredIncidents.length} of {incidents.length} active records
          </span>
        </div>

        {/* Global Feed Search */}
        <div className="feed-search-box">
          <Search size={14} className="search-icon-muted" />
          <input
            type="text"
            className="feed-search-input mono"
            placeholder="Search by ID, keyword, team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      {/* Filter and Sort Controls Bar */}
      <div className="feed-controls-bar">
        {/* Severity Filter Tabs */}
        <div className="filter-pill-group">
          <span className="filter-group-label">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
            <button
              key={sev}
              className={`pill-btn ${severityFilter === sev ? 'active' : ''} ${sev.toLowerCase()}`}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="filter-pill-group">
          <span className="filter-group-label">Status:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'DISPATCHED', label: 'Dispatched' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map(st => (
            <button
              key={st.id}
              className={`pill-btn ${statusFilter === st.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(st.id)}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="sort-dropdown-wrap">
          <ArrowUpDown size={13} className="text-muted" />
          <select
            className="feed-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="severity">Highest Severity</option>
            <option value="casualties">Most Casualties</option>
          </select>
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button className="btn-clear-filters" onClick={resetAllFilters} title="Reset all search filters">
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Feed Incident Table / Cards */}
      <div className="feed-table-scroll-area">
        {filteredIncidents.length === 0 ? (
          <div className="feed-empty-state">
            <AlertCircle size={32} className="text-muted" />
            <h3 className="empty-title">No Emergency Incidents Match Current Filter</h3>
            <p className="empty-subtitle">
              {hasActiveFilters 
                ? 'Adjust your search query or reset filters to view all records.'
                : 'No incidents present in DynamoDB table. Report a new emergency or trigger the multi-incident simulation drill.'}
            </p>
            <div className="empty-actions">
              {hasActiveFilters ? (
                <button className="btn-empty-action" onClick={resetAllFilters}>
                  Clear All Filters
                </button>
              ) : (
                <>
                  <button className="btn-empty-action primary" onClick={onOpenDrillModal}>
                    Launch Cloud Drill
                  </button>
                  <button className="btn-empty-action secondary" onClick={onOpenReportModal}>
                    Report New Incident
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <table className="feed-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Incident ID</th>
                <th>Type & Scope</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Casualties</th>
                <th>Assigned Resources</th>
                <th>Location</th>
                <th>Reported Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(incident => {
                const isSelected = selectedIncident && selectedIncident.incidentId === incident.incidentId;
                const isResolved = incident.status === 'RESOLVED';
                const severity = incident.severity || 'UNKNOWN';

                let sevBadgeClass = 'badge-medium';
                if (severity === 'CRITICAL') sevBadgeClass = 'badge-critical';
                else if (severity === 'HIGH') sevBadgeClass = 'badge-high';

                let statusBadgeClass = 'badge-dispatched';
                if (isResolved) statusBadgeClass = 'badge-resolved';
                else if (incident.status === 'REPORTED') statusBadgeClass = 'badge-reported';
                else if (incident.status === 'CLASSIFIED') statusBadgeClass = 'badge-classified';

                return (
                  <tr
                    key={incident.incidentId}
                    className={`feed-row ${isSelected ? 'row-selected' : ''} ${isResolved ? 'row-resolved' : ''}`}
                    onClick={() => onSelectIncident(incident)}
                  >
                    {/* ID & Copy */}
                    <td className="mono feed-id-cell">
                      <div className="id-flex">
                        <span className="incident-id-text">{incident.incidentId}</span>
                        <button
                          className="btn-copy-id"
                          onClick={(e) => handleCopyId(e, incident.incidentId)}
                          title="Copy Incident ID"
                        >
                          {copiedId === incident.incidentId ? (
                            <Check size={12} className="text-emerald" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Category & Description */}
                    <td className="feed-desc-cell">
                      <div className="desc-main-text">
                        <span className="type-tag">{incident.type || incident.category}</span>
                        <span className="desc-snippet" title={incident.description}>
                          {incident.description || 'Emergency incident report'}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td>
                      <span className={`badge ${sevBadgeClass}`}>
                        {severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${statusBadgeClass}`}>
                        {incident.status}
                      </span>
                    </td>

                    {/* Casualties */}
                    <td className="mono text-center font-bold">
                      <div className="casualties-cell">
                        <Users size={12} className="text-muted" />
                        <span>{incident.peopleAffected || 0}</span>
                      </div>
                    </td>

                    {/* Assigned Resources */}
                    <td>
                      <div className="resource-assignment-cell">
                        <div className="assigned-unit-row">
                          <Truck size={12} className="text-emerald" />
                          <span className="unit-name">
                            {incident.assignedTeam && !incident.assignedTeam.includes('Pending')
                              ? incident.assignedTeam
                              : 'Triage In Progress...'}
                          </span>
                        </div>
                        {incident.hospital && incident.hospital !== 'NONE' && (
                          <div className="assigned-hosp-row">
                            <Building2 size={11} className="text-cyan" />
                            <span className="hosp-name">{incident.hospital}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="mono feed-loc-cell">
                      <div className="loc-flex">
                        <MapPin size={11} className="text-muted" />
                        <span>
                          {incident.latitude ? Number(incident.latitude).toFixed(3) : '17.385'}, 
                          {incident.longitude ? Number(incident.longitude).toFixed(3) : '78.486'}
                        </span>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="feed-time-cell">
                      <div className="time-flex">
                        <Clock size={11} className="text-muted" />
                        <span>
                          {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recent'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions-group">
                        <button
                          className="btn-quick-view"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncident(incident);
                          }}
                          title="Inspect incident details & workflow telemetry"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        {!isResolved ? (
                          <button
                            className="btn-resolve-table"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveIncident(incident.incidentId);
                            }}
                            title="Mark incident as resolved and emit IncidentResolved event"
                          >
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <span className="tag-cleared-check" title="Resolved and logged">
                            <CheckCircle2 size={13} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
