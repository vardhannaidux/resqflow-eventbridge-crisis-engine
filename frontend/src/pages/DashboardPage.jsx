import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Flame, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Play, 
  Search, 
  ShieldAlert, 
  Radio, 
  GitBranch, 
  Layers, 
  PlusCircle,
  Eye,
  Check,
  Sparkles,
  Zap,
  Globe,
  Cpu,
  Navigation
} from 'lucide-react';
import IncidentMap from '../components/IncidentMap';
import PollyVoiceRadio from '../components/PollyVoiceRadio';
import { DEMO_RESPONSE_UNITS } from '../fixtures/demoScenarios';

export default function DashboardPage({
  incidents = [],
  onResolveIncident,
  onOpenReportModal,
  onTriggerDrill,
  onInjectScenario,
  isDrillRunning = false,
  connectionStatus = { online: true, latencyMs: 45 },
  lastUpdated = null
}) {
  const navigate = useNavigate();
  const [feedSearch, setFeedSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // KPI Calculations
  const total = incidents.length;
  const critical = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const high = incidents.filter(i => i.severity === 'HIGH' && i.status !== 'RESOLVED').length;
  const active = incidents.filter(i => i.status !== 'RESOLVED').length;
  const resolved = incidents.filter(i => i.status === 'RESOLVED').length;
  const pendingApprovals = incidents.filter(i => i.status === 'CLASSIFIED');

  const assignedTeams = new Set(
    incidents
      .filter(i => i.status === 'DISPATCHED' && i.assignedTeam && !i.assignedTeam.includes('Pending'))
      .map(i => i.assignedTeam)
  );
  const unitsDeployed = assignedTeams.size;
  const unitsTotal = DEMO_RESPONSE_UNITS.length;
  const unitsAvailable = Math.max(0, unitsTotal - unitsDeployed);

  // Filtered recent incidents
  const filteredRecent = useMemo(() => {
    let list = [...incidents].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase().trim();
      list = list.filter(i => 
        (i.incidentId && i.incidentId.toLowerCase().includes(q)) ||
        (i.type && i.type.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.assignedTeam && i.assignedTeam.toLowerCase().includes(q))
      );
    }
    if (severityFilter !== 'ALL') {
      list = list.filter(i => i.severity === severityFilter);
    }
    return list.slice(0, 8);
  }, [incidents, feedSearch, severityFilter]);

  return (
    <div className="page-container">
      {/* Swiss Editorial Display Header */}
      <div className="page-header-row">
        <div>
          <div className="bauhaus-badge" style={{ marginBottom: '14px' }}>
            <span className="bauhaus-orb"></span>
            <span>AUTONOMOUS ORCHESTRATION ENGINE</span>
          </div>
          <h1 className="page-title">OPERATIONAL THEATRE</h1>
          <p className="page-subtitle">
            Continuous real-time incident intelligence, Amazon Bedrock automated classification, and sub-second fleet dispatch orchestration across metropolitan sectors.
          </p>
        </div>

        {/* Precision Telemetry Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: '#FFFFFF', 
            border: '1px solid #0D0D0D', 
            padding: '8px 16px', 
            borderRadius: '9999px',
            boxShadow: '2px 2px 0px #0D0D0D'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionStatus.online ? '#059669' : '#E11D48',
              boxShadow: connectionStatus.online ? '0 0 6px #059669' : 'none'
            }} />
            <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#0D0D0D' }}>
              AWS ap-south-2 · {connectionStatus.latencyMs ? `${connectionStatus.latencyMs}ms` : '38ms'}
            </span>
            <span className="mono" style={{ fontSize: '11px', color: '#828076', borderLeft: '1px solid #DCD8CD', paddingLeft: '10px' }}>
              OCC LOCKED
            </span>
          </div>

          {lastUpdated && (
            <span className="mono" style={{ fontSize: '10px', color: '#828076' }}>
              LAST SYNC: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Abstract Bauhaus Geometric Accent Banner */}
      <div className="atlas-card" style={{ 
        padding: '24px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '20px',
        background: '#FFFFFF',
        border: '1px solid #0D0D0D',
        boxShadow: '3px 3px 0px #0D0D0D'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', maxWidth: '820px' }}>
          {/* Abstract Bauhaus Ring Accent */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--gradient-bauhaus)',
            border: '2px solid #0D0D0D',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 0px #0D0D0D'
          }}>
            <Sparkles size={20} color="#FFFFFF" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#0D0D0D', letterSpacing: '0.08em' }}>
                ENTERPRISE EVENT-DRIVEN CORE
              </span>
              <span className="mono" style={{ fontSize: '10px', background: '#F5F4EE', border: '1px solid #DCD8CD', padding: '1px 6px', borderRadius: '4px', color: '#57554E' }}>
                SCHEMA v1.0.4
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#57554E', marginTop: '4px', lineHeight: '1.45' }}>
              Ingestion pipelines active across 11 REST API Gateway routes with DynamoDB atomic transactions and Step Functions multi-agent routing.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="btn-atlas-secondary"
            onClick={() => navigate('/vision-ai')}
            title="Inspect Amazon Rekognition disaster evidence photo analysis and anti-spoofing"
          >
            <Eye size={13} color="#0D0D0D" />
            <span>Vision AI</span>
          </button>
          <button 
            className="btn-atlas-secondary"
            onClick={() => navigate('/location-routing')}
            title="Inspect Amazon Location Service turn-by-turn road routing and 500m geofencing"
          >
            <Navigation size={13} color="#0D0D0D" />
            <span>Road Routing</span>
          </button>
          <button 
            className="btn-atlas-secondary"
            onClick={() => navigate('/iot-mesh')}
            title="Open AWS IoT Core sensor mesh and telemetry console"
          >
            <Cpu size={13} color="#0D0D0D" />
            <span>IoT Sensor Mesh</span>
          </button>
          <button 
            className="btn-atlas-secondary"
            onClick={() => navigate('/xray-tracing')}
            title="Inspect AWS X-Ray distributed trace waterfalls and service map"
          >
            <GitBranch size={13} color="#0D0D0D" />
            <span>X-Ray Traces</span>
          </button>
          <button 
            className="btn-atlas-secondary"
            onClick={onTriggerDrill}
            disabled={isDrillRunning}
            title="Inject simulated load for pipeline throughput verification"
          >
            <Play size={13} color="#0D0D0D" />
            <span>{isDrillRunning ? 'Simulating Load...' : 'Simulate Ingestion'}</span>
          </button>
        </div>
      </div>

      {/* Human Authorization Approval Callout (if classified pending) */}
      {pendingApprovals.length > 0 && (
        <div className="atlas-card" style={{ 
          padding: '20px 24px', 
          background: '#FFFBEB', 
          border: '1px solid #0D0D0D', 
          boxShadow: '2px 2px 0px #0D0D0D',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '14px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0D0D0D', color: '#FFD23F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0D0D0D', letterSpacing: '-0.02em' }}>
                {pendingApprovals.length} Incident Triage Recommendations Require Operator Authorization
              </h3>
              <p style={{ fontSize: '12px', color: '#57554E', marginTop: '2px' }}>
                Deterministic AI scoring complete. Tactical unit dispatch waiting for operator confirmation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {pendingApprovals.slice(0, 2).map(inc => (
              <button 
                key={inc.incidentId}
                className="btn-atlas-secondary"
                onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                <span>Authorize {inc.incidentId}</span>
                <ArrowRight size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Oversized Swiss KPI Display Cards */}
      <div className="atlas-kpi-grid">
        {/* Card 1: Active Emergencies */}
        <div className="atlas-card atlas-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-metric-title">Active Ingestion</span>
            <div className="kpi-icon-container kpi-icon-blue">
              <Activity size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-number">{active}</span>
            <span className="kpi-sub-tag tag-blue">Live Stream</span>
          </div>
          <div className="kpi-footer-text">
            <span>{critical} CRITICAL</span>
            <span>{high} HIGH TIER</span>
          </div>
        </div>

        {/* Card 2: Critical Tier-1 Emergencies */}
        <div className="atlas-card atlas-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-metric-title">Tier-1 Critical</span>
            <div className="kpi-icon-container kpi-icon-red">
              <Flame size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-number" style={{ color: '#E11D48' }}>{critical}</span>
            <span className="kpi-sub-tag tag-red">ERT Priority</span>
          </div>
          <div className="kpi-footer-text">
            <span>Sub-200ms Triage SLA</span>
            <span className="mono">0 PENDING</span>
          </div>
        </div>

        {/* Card 3: Fleet Deployment */}
        <div className="atlas-card atlas-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-metric-title">Fleet Allocation</span>
            <div className="kpi-icon-container kpi-icon-orange">
              <Truck size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-number">{unitsDeployed} <span style={{ fontSize: '18px', color: '#828076', fontWeight: 600 }}>/ {unitsTotal}</span></span>
            <span className="kpi-sub-tag tag-green">{unitsAvailable} Available</span>
          </div>
          <div className="kpi-footer-text">
            <span>Step Functions Haversine</span>
            <span className="mono">ROUTED</span>
          </div>
        </div>

        {/* Card 4: Resolved & Cleared */}
        <div className="atlas-card atlas-kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-metric-title">Cleared Incidents</span>
            <div className="kpi-icon-container kpi-icon-green">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-big-number" style={{ color: '#059669' }}>{resolved}</span>
            <span className="kpi-sub-tag tag-green">
              {total > 0 ? `${((resolved / total) * 100).toFixed(0)}% OCC RATE` : '100%'}
            </span>
          </div>
          <div className="kpi-footer-text">
            <span>EventBridge Audit Bus</span>
            <span className="mono">REPLAYABLE</span>
          </div>
        </div>
      </div>

      {/* Main Operations Split: Map + Stream Table */}
      <div className="ops-split-grid">
        {/* Left: Map Section */}
        <div className="atlas-map-card">
          <div className="map-card-toolbar">
            <div className="map-toolbar-title-wrap">
              <span className="bauhaus-orb"></span>
              <span className="map-header-title">Geospatial Operations Theatre</span>
              <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>
                HYDERABAD · 17.4065° N, 78.4772° E
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="filter-btn-pill active"
                onClick={() => onOpenReportModal()}
                title="Plot GPS coordinate"
              >
                + Pin Incident
              </button>
            </div>
          </div>
          <div className="map-leaflet-wrapper">
            <IncidentMap 
              incidents={incidents}
              onSelectIncident={(inc) => navigate(`/incidents/${inc.incidentId}`)}
              onMapClick={(loc) => onOpenReportModal(loc)}
            />
          </div>
        </div>

        {/* Right: Live Stream Feed */}
        <div className="atlas-table-card">
          <div className="table-controls-header">
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: '#0D0D0D', letterSpacing: '-0.02em' }}>
                Live Incident Telemetry
              </h3>
              <p className="mono" style={{ fontSize: '11px', color: '#828076' }}>
                EventBridge stream · OCC version tracking
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {filteredRecent.length > 0 && (
                <PollyVoiceRadio incident={filteredRecent[0]} compact={true} />
              )}
              <button 
                className="btn-atlas-secondary"
                onClick={() => navigate('/incidents')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <span>Full Directory</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div style={{ padding: '10px 20px', background: '#FAF9F5', borderBottom: '1px solid #E0DDD4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={13} color="#0D0D0D" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input 
                type="text"
                placeholder="Filter stream..."
                value={feedSearch}
                onChange={e => setFeedSearch(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '6px 10px 6px 30px', 
                  fontSize: '12px', 
                  fontFamily: 'var(--font-sans)',
                  border: '1px solid #DCD8CD', 
                  borderRadius: '6px', 
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
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
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <table className="atlas-data-table" style={{ minWidth: '560px' }}>
              <thead>
                <tr>
                  <th>INCIDENT ID</th>
                  <th>CLASSIFICATION</th>
                  <th>SEVERITY</th>
                  <th>STATUS</th>
                  <th>ASSIGNED FLEET</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecent.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#828076' }}>
                      No active incident telemetry found.
                    </td>
                  </tr>
                ) : (
                  filteredRecent.map(inc => (
                    <tr 
                      key={inc.incidentId}
                      className="atlas-table-row"
                      onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                    >
                      <td className="mono" style={{ fontWeight: 700, color: '#0D0D0D', fontSize: '12px' }}>
                        {inc.incidentId}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0D0D0D' }}>
                        {inc.type || inc.category}
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
                      <td className="mono" style={{ fontSize: '11px', color: '#57554E' }}>
                        {inc.assignedTeam && !inc.assignedTeam.includes('Pending')
                          ? inc.assignedTeam.split('(')[0]
                          : 'Triage pending'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {inc.status !== 'RESOLVED' ? (
                          <button
                            className="btn-table-resolve"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveIncident(inc.incidentId);
                            }}
                          >
                            Resolve
                          </button>
                        ) : (
                          <span className="mono" style={{ color: '#059669', fontSize: '11px', fontWeight: 700 }}>CLEARED</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
