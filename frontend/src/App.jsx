import React, { useState, useEffect } from 'react';
import KPICards from './components/KPICards';
import IncidentForm from './components/IncidentForm';
import IncidentTable from './components/IncidentTable';
import { Flame, RefreshCw, Radio, Check, Globe } from 'lucide-react';

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com';

export default function App() {
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_API_ENDPOINT);
  const [incidents, setIncidents] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiError, setApiError] = useState(null);

  const fetchIncidents = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`${apiEndpoint}/incidents`);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const data = await res.json();
      setIncidents(data.incidents || []);
      setLastUpdated(new Date().toLocaleTimeString());
      setApiError(null);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // Poll every 4 seconds to observe real-time EventBridge & Step Functions state transitions
    const interval = setInterval(fetchIncidents, 4000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  const handleReportIncident = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiEndpoint}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      await fetchIncidents();
    } catch (err) {
      alert(`Error submitting incident: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDrillRunning, setIsDrillRunning] = useState(false);

  const handleTriggerDrill = async () => {
    setIsDrillRunning(true);
    try {
      const res = await fetch(`${apiEndpoint}/incidents/drill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchIncidents();
    } catch (err) {
      alert(`Error triggering drill: ${err.message}`);
    } finally {
      setIsDrillRunning(false);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      const res = await fetch(`${apiEndpoint}/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Incident cleared by field responder command.' })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      await fetchIncidents();
    } catch (err) {
      alert(`Error resolving incident: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Flame size={28} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-title">ResQFlow Command Center</h1>
            <p className="brand-subtitle">Event-Driven Autonomous Emergency Response & Resource Orchestration</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="region-badge">
            <div className="live-indicator"></div>
            <span>AWS ap-south-2 (Hyderabad)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} color="#94a3b8" />
            <input
              type="text"
              className="form-input mono"
              style={{ width: '320px', padding: '6px 10px', fontSize: '12px' }}
              placeholder="API Gateway Base URL"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value.trim())}
            />
          </div>

          <button 
            onClick={handleTriggerDrill}
            disabled={isDrillRunning}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)'
            }}
          >
            <Radio size={14} className={isDrillRunning ? 'spin' : ''} />
            <span>{isDrillRunning ? 'Dispatching Drill...' : '🚨 Disaster Simulation Drill'}</span>
          </button>

          <button 
            onClick={fetchIncidents}
            disabled={isRefreshing}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{lastUpdated ? `Sync: ${lastUpdated}` : 'Sync'}</span>
          </button>
        </div>
      </header>

      {apiError && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          ⚠️ Gateway connection offline ({apiEndpoint}). Enter your deployed API Gateway URL above or start the local simulator.
        </div>
      )}

      {/* KPI Cards */}
      <KPICards incidents={incidents} />

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <IncidentForm 
          onSubmit={handleReportIncident} 
          isSubmitting={isSubmitting} 
        />
        <IncidentTable 
          incidents={incidents} 
          onResolveIncident={handleResolveIncident}
        />
      </div>
    </div>
  );
}
