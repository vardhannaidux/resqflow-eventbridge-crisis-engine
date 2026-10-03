import React, { useState } from 'react';
import { 
  Settings, 
  Globe, 
  Server, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Database, 
  Zap, 
  GitBranch, 
  Bell, 
  CheckCircle2, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage({
  apiEndpoint,
  onApiEndpointChange,
  isSoundMuted,
  onToggleSound,
  onResetDemoData,
  connectionStatus = { online: true, latencyMs: 45 }
}) {
  const [endpointInput, setEndpointInput] = useState(apiEndpoint || '');
  const [testingHealth, setTestingHealth] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSaveEndpoint = (e) => {
    e.preventDefault();
    if (endpointInput.trim()) {
      if (onApiEndpointChange) {
        onApiEndpointChange(endpointInput.trim());
      }
      api.setBaseUrl(endpointInput.trim());
      handleTestHealth();
    }
  };

  const handleSetPreset = (url) => {
    setEndpointInput(url);
    if (onApiEndpointChange) {
      onApiEndpointChange(url);
    }
    api.setBaseUrl(url);
    setTimeout(handleTestHealth, 100);
  };

  const handleTestHealth = async () => {
    setTestingHealth(true);
    setTestResult(null);
    try {
      const res = await api.checkHealth();
      setTestResult(res);
    } catch (err) {
      setTestResult({ online: false, error: err.message });
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Settings & Cloud Infrastructure Configuration</h1>
          <p className="page-subtitle">Configure API Gateway routing, check live cloud connectivity, and manage operator preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: API Gateway & Cloud Config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: API Endpoint Configuration */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} color="#2563EB" />
              API Gateway Routing Endpoint
            </h2>

            <form onSubmit={handleSaveEndpoint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="atlas-form-group">
                <label className="atlas-label">Active API Base URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="atlas-input"
                    style={{ flex: 1, fontFamily: 'monospace' }}
                    value={endpointInput}
                    onChange={e => setEndpointInput(e.target.value)}
                    placeholder="https://...execute-api.ap-south-2.amazonaws.com"
                  />
                  <button type="submit" className="btn-atlas-primary">
                    Update Endpoint
                  </button>
                </div>
              </div>

              {/* Endpoint Presets */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn-atlas-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => handleSetPreset('https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com')}
                >
                  <Globe size={11} /> AWS Live Cloud (ap-south-2)
                </button>
                <button 
                  type="button" 
                  className="btn-atlas-secondary"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => handleSetPreset('http://localhost:3001')}
                >
                  <Server size={11} /> Local Python Simulator (3001)
                </button>
              </div>

              {/* Health Test */}
              <div style={{ marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn-atlas-secondary"
                  onClick={handleTestHealth}
                  disabled={testingHealth}
                >
                  <RefreshCw size={12} className={testingHealth ? 'spin-anim' : ''} />
                  <span>{testingHealth ? 'Probing Gateway...' : 'Ping Gateway Health'}</span>
                </button>

                {testResult && (
                  <div style={{ fontSize: '12px', fontWeight: 600, color: testResult.online ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {testResult.online ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>{testResult.online ? `Reachable • ${testResult.latencyMs}ms latency` : `Unreachable (${testResult.error || 'Connection refused'})`}</span>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Card: Verified AWS Infrastructure Resource Manifest */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#059669" />
              Verified AWS Cloud Infrastructure Manifest
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Primary AWS Region:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ap-south-2 (Hyderabad, India)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>API Gateway ID:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ezdw12h7z5 (HTTP API v2)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>DynamoDB Table:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlowIncidents (PAY_PER_REQUEST)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>DynamoDB GSI:</span>
                <span className="mono" style={{ fontWeight: 600 }}>StatusCreatedAtIndex</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>EventBridge Bus:</span>
                <span className="mono" style={{ fontWeight: 600 }}>resqflow-event-bus</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>EventBridge Archive:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlow-EventArchive (14-day retention)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Step Functions Workflow:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlowIncidentWorkflow</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>SNS Alert Topic:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlowAlerts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>SQS Fan-Out Audit Queue:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlow-AlertAuditQueue</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748B' }}>SQS Dead-Letter Queue:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlow-DeadLetterQueue (0 drops)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences & Simulation Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Audio & Accessibility */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} color="#2563EB" />
              Tactical Audio & Accessibility
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#14233B' }}>Audio Sound Alerts</span>
                  <p style={{ fontSize: '11px', color: '#64748B' }}>Auditory blips on emergency intake and resolution</p>
                </div>
                <button 
                  className={`btn-atlas-secondary ${!isSoundMuted ? 'active' : ''}`}
                  onClick={onToggleSound}
                >
                  {isSoundMuted ? <VolumeX size={14} color="#94A3B8" /> : <Volume2 size={14} color="#059669" />}
                  <span>{isSoundMuted ? 'Muted' : 'Active'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#14233B' }}>Theme System</span>
                  <p style={{ fontSize: '11px', color: '#64748B' }}>ATLAS Enterprise Light Theme (#F5F8FC Base)</p>
                </div>
                <span className="badge-atlas dispatched">Active Spec</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#14233B' }}>Keyboard Navigation</span>
                  <p style={{ fontSize: '11px', color: '#64748B' }}>Full tab navigation, Esc to close modals</p>
                </div>
                <span className="badge-atlas low">WCAG 2.1 AA</span>
              </div>
            </div>
          </div>

          {/* Card: Operator Role & Security Clearance */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#059669" />
              Operator Role & Security Clearance
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Authenticated Operator:</span>
                <span className="mono" style={{ fontWeight: 700, color: '#2563EB' }}>DISP-HYD-01</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Operational Role:</span>
                <span className="badge-atlas low" style={{ fontSize: '11px' }}>Command Supervisor</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Dispatch Authority:</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>Full Tactical Authorization</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748B' }}>Credential Storage:</span>
                <span style={{ color: '#475569' }}>IAM SigV4 / Zero Client-Side Secrets</span>
              </div>
            </div>
          </div>

          {/* Card: Demonstration & Reset Controls */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} color="#DC2626" />
              Demonstration & Simulation Controls
            </h2>

            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, marginBottom: '14px' }}>
              Resetting synchronizes your local client with live DynamoDB records. 
              Safe to run anytime during a hackathon presentation.
            </p>

            <button 
              className="btn-atlas-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onResetDemoData}
            >
              <RefreshCw size={14} /> Synchronize Live Cloud Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
