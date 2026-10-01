import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Truck, 
  Building2, 
  CheckCircle2, 
  Users, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  Activity, 
  Layers, 
  Copy,
  FileText
} from 'lucide-react';

export default function IncidentDetailModal({
  incident,
  onClose,
  onResolve
}) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showConfirmResolve, setShowConfirmResolve] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!incident) return null;

  const isResolved = incident.status === 'RESOLVED';
  const severity = incident.severity || 'UNKNOWN';

  const handleCopyId = () => {
    navigator.clipboard.writeText(incident.incidentId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExecuteResolve = async () => {
    setIsResolving(true);
    try {
      await onResolve(incident.incidentId, resolutionNotes || 'Incident cleared by command center supervisor.');
      setShowConfirmResolve(false);
    } finally {
      setIsResolving(false);
    }
  };

  // Lifecycle stage evaluation
  const stages = [
    { key: 'REPORTED', label: 'Reported', desc: 'Ingested into DynamoDB' },
    { key: 'CLASSIFIED', label: 'Classified', desc: 'Triage Severity Evaluated' },
    { key: 'DISPATCHED', label: 'Dispatched', desc: 'Step Functions Fleet Routing' },
    { key: 'ON_SCENE', label: 'On-Scene', desc: 'Responders En Route / Arrived' },
    { key: 'RESOLVED', label: 'Resolved', desc: 'Situation Stabilized & Closed' }
  ];

  const getStageIndex = (status) => {
    if (status === 'RESOLVED') return 4;
    if (status === 'DISPATCHED') return 2;
    if (status === 'CLASSIFIED') return 1;
    if (status === 'REPORTED') return 0;
    return 0;
  };

  const currentStageIndex = getStageIndex(incident.status);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-glass-container detail-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="modal-top-bar">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <ShieldAlert size={20} className="text-cyan" />
            </div>
            <div>
              <div className="modal-eyebrow">Tactical Incident Dossier</div>
              <h3 className="modal-main-title">
                {incident.incidentId} • {incident.type || incident.category} Emergency
              </h3>
            </div>
          </div>

          <div className="modal-top-actions">
            <button className="btn-copy-modal" onClick={handleCopyId} title="Copy Incident ID">
              {copiedId ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>
            <button className="btn-close-modal" onClick={onClose} aria-label="Close details modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable Content */}
        <div className="modal-body-scroll">
          {/* Status & Severity Banner */}
          <div className={`detail-status-banner ${isResolved ? 'banner-resolved' : severity.toLowerCase()}`}>
            <div className="banner-status-left">
              <span className={`badge badge-large ${isResolved ? 'badge-resolved' : `badge-${severity.toLowerCase()}`}`}>
                {severity} TIER
              </span>
              <span className="banner-status-text">
                Current Operational State: <strong>{incident.status}</strong>
              </span>
            </div>
            <div className="banner-status-right mono">
              Reported: {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Recent'}
            </div>
          </div>

          {/* Lifecycle Stepper */}
          <div className="detail-section">
            <div className="section-label">Serverless Workflow Execution Pipeline</div>
            <div className="lifecycle-stepper">
              {stages.map((stage, idx) => {
                const isPassed = idx < currentStageIndex || isResolved;
                const isCurrent = idx === currentStageIndex && !isResolved;
                return (
                  <div key={stage.key} className={`stepper-step ${isPassed ? 'step-completed' : ''} ${isCurrent ? 'step-active' : ''}`}>
                    <div className="step-circle">
                      {isPassed ? <Check size={12} /> : idx + 1}
                    </div>
                    <div className="step-info">
                      <div className="step-name">{stage.label}</div>
                      <div className="step-sub">{stage.desc}</div>
                    </div>
                    {idx < stages.length - 1 && <div className="step-connector"></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description & Impact Summary */}
          <div className="detail-section">
            <div className="section-label">Incident Synopsis & Triage Narrative</div>
            <div className="narrative-box">
              <p className="narrative-text">
                {incident.description || 'No situational description provided with initial report.'}
              </p>
              {incident.summary && (
                <div className="classification-rationale">
                  <strong>Automated Classifier Rationale:</strong> {incident.summary}
                </div>
              )}
            </div>
          </div>

          {/* Key Incident Metadata Grid */}
          <div className="detail-grid-two">
            {/* Left Column: Coordinates & Casualties */}
            <div className="glass-inner-card">
              <div className="inner-card-title">Geospatial Coordinates & Impact</div>
              <div className="metadata-row">
                <span className="meta-label">Casualties Affected:</span>
                <span className="meta-value font-bold text-critical">
                  <Users size={14} className="inline-icon" />
                  {incident.peopleAffected || 0} person(s)
                </span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Geographic Target:</span>
                <span className="meta-value mono">
                  <MapPin size={13} className="inline-icon text-cyan" />
                  {Number(incident.latitude || 17.385).toFixed(4)}, {Number(incident.longitude || 78.486).toFixed(4)}
                </span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Reporting Authority:</span>
                <span className="meta-value mono">{incident.reportedBy || 'UNKNOWN-CITIZEN'}</span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Data Schema Version:</span>
                <span className="meta-value mono">v{incident.version || 1} (Normalized Coordinate Map)</span>
              </div>
            </div>

            {/* Right Column: Step Functions Allocations */}
            <div className="glass-inner-card">
              <div className="inner-card-title">Orchestrated Resource Deployments</div>
              <div className="metadata-row">
                <span className="meta-label">Assigned Response Unit:</span>
                <span className="meta-value text-emerald font-semibold">
                  <Truck size={14} className="inline-icon" />
                  {incident.assignedTeam && !incident.assignedTeam.includes('Pending')
                    ? incident.assignedTeam
                    : 'Awaiting Step Functions Allocation'}
                </span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Receiving Trauma Center:</span>
                <span className="meta-value text-cyan font-semibold">
                  <Building2 size={14} className="inline-icon" />
                  {incident.hospital && incident.hospital !== 'NONE'
                    ? incident.hospital
                    : 'Nearest Regional Facility'}
                </span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Estimated Transit (ETA):</span>
                <span className="meta-value text-amber font-semibold">
                  <Clock size={14} className="inline-icon" />
                  {incident.etaMinutes ? `${incident.etaMinutes} minutes` : 'Under Heuristic Calculation'}
                </span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Idempotency Audit Key:</span>
                <span className="meta-value mono text-xs text-muted">
                  {incident.lastEventId || `${incident.incidentId}:1`}
                </span>
              </div>
            </div>
          </div>

          {/* Resolution Details if Resolved */}
          {isResolved && (
            <div className="resolved-concluded-box">
              <CheckCircle2 size={20} className="text-emerald" />
              <div>
                <div className="resolved-title">Incident Successfully Resolved and Logged</div>
                <div className="resolved-text">
                  Resolved timestamp: {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'Concluded'}
                </div>
                {incident.resolutionNotes && (
                  <div className="resolved-notes">Notes: "{incident.resolutionNotes}"</div>
                )}
              </div>
            </div>
          )}

          {/* Interactive Resolution Action Section */}
          {!isResolved && (
            <div className="resolution-action-section">
              {!showConfirmResolve ? (
                <button 
                  className="btn-open-resolve"
                  onClick={() => setShowConfirmResolve(true)}
                >
                  <CheckCircle2 size={16} />
                  <span>Initiate Resolution & Clear Emergency</span>
                </button>
              ) : (
                <div className="confirm-resolve-panel">
                  <div className="confirm-header">
                    <AlertTriangle size={16} className="text-amber" />
                    <h4>Confirm Emergency Resolution</h4>
                  </div>
                  <p className="confirm-text">
                    This action will update the incident state in Amazon DynamoDB to <code>RESOLVED</code>, emit an <code>IncidentResolved</code> event to Amazon EventBridge, and notify subscribed responders.
                  </p>
                  <div className="form-group-resolve">
                    <label className="resolve-label">Operational Resolution Notes:</label>
                    <input
                      type="text"
                      className="resolve-input"
                      placeholder="e.g. Fire extinguished, casualties stabilized and admitted to trauma center."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </div>
                  <div className="confirm-actions-row">
                    <button
                      className="btn-confirm-yes"
                      onClick={handleExecuteResolve}
                      disabled={isResolving}
                    >
                      {isResolving ? 'Executing...' : 'Confirm Resolution'}
                    </button>
                    <button
                      className="btn-confirm-no"
                      onClick={() => setShowConfirmResolve(false)}
                      disabled={isResolving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
