import { ShieldAlert, MapPin, Clock, Truck, Building2 } from 'lucide-react';

export default function IncidentTable({ incidents, onSelectIncident }) {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="badge badge-critical">CRITICAL</span>;
      case 'HIGH':
        return <span className="badge badge-high">HIGH</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">MEDIUM</span>;
      default:
        return <span className="badge badge-unknown">UNKNOWN</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REPORTED':
        return <span className="badge badge-reported">REPORTED</span>;
      case 'CLASSIFIED':
        return <span className="badge badge-classified">CLASSIFIED</span>;
      case 'DISPATCHED':
        return <span className="badge badge-dispatched">DISPATCHED</span>;
      case 'RESOLVED':
        return <span className="badge badge-resolved">RESOLVED</span>;
      default:
        return <span className="badge badge-unknown">{status}</span>;
    }
  };

  return (
    <div className="glass-panel table-card">
      <div className="table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={20} color="#00e5ff" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Live Incident Feed & Dispatch Grid</h2>
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Real-time EventBridge Stream ({incidents.length} records)
        </div>
      </div>

      <div className="incident-table-wrapper">
        <table className="incident-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Casualties</th>
              <th>Deployment & Medical Center</th>
              <th>Location</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  No active incidents recorded. Submit the emergency form to test live ingestion.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.incidentId}>
                  <td className="mono" style={{ fontWeight: 600, color: '#00e5ff' }}>
                    {incident.incidentId}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {incident.type || incident.category}
                  </td>
                  <td>
                    {getSeverityBadge(incident.severity)}
                  </td>
                  <td>
                    {getStatusBadge(incident.status)}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {incident.peopleAffected}
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f1f5f9' }}>
                        <Truck size={12} color="#22c55e" />
                        <span>{incident.assignedTeam || 'Triage In Progress...'}</span>
                      </div>
                      {incident.hospital && incident.hospital !== 'NONE' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
                          <Building2 size={12} color="#ef4444" />
                          <span>{incident.hospital}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: '11px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} color="#94a3b8" />
                      <span>{Number(incident.latitude).toFixed(3)}, {Number(incident.longitude).toFixed(3)}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
