import React from 'react';
import { AlertTriangle, Flame, CheckCircle, Activity } from 'lucide-react';

export default function KPICards({ incidents }) {
  const total = incidents.length;
  const critical = incidents.filter(i => i.severity === 'CRITICAL').length;
  const active = incidents.filter(i => i.status !== 'RESOLVED').length;
  const resolved = incidents.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="kpi-grid">
      <div className="glass-panel kpi-card">
        <div>
          <div className="kpi-label">Active Emergencies</div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>{active}</div>
        </div>
        <Activity size={32} color="#38bdf8" />
      </div>

      <div className="glass-panel kpi-card">
        <div>
          <div className="kpi-label">Critical Tier-1</div>
          <div className="kpi-value" style={{ color: '#ef4444' }}>{critical}</div>
        </div>
        <Flame size={32} color="#ef4444" />
      </div>

      <div className="glass-panel kpi-card">
        <div>
          <div className="kpi-label">Resolved Incidents</div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{resolved}</div>
        </div>
        <CheckCircle size={32} color="#10b981" />
      </div>

      <div className="glass-panel kpi-card">
        <div>
          <div className="kpi-label">Total Ingested</div>
          <div className="kpi-value" style={{ color: '#f1f5f9' }}>{total}</div>
        </div>
        <AlertTriangle size={32} color="#94a3b8" />
      </div>
    </div>
  );
}
