import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Truck, 
  Building2, 
  ShieldAlert, 
  Zap, 
  GitBranch, 
  Check, 
  X, 
  Copy, 
  Activity,
  FileText,
  AlertCircle,
  Download,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import PollyVoiceRadio from '../components/PollyVoiceRadio';

export default function IncidentDetailPage({
  incidents = [],
  onResolveIncident
}) {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Recommendation action states
  const [approvalStatus, setApprovalStatus] = useState(null); // 'APPROVED' | 'REJECTED' | null
  const [isResolving, setIsResolving] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Edit Incident states
  const [showEditModal, setShowEditModal] = useState(false);
  const [isPatching, setIsPatching] = useState(false);
  const [patchError, setPatchError] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    peopleAffected: 0,
    assignedTeam: '',
    notes: ''
  });

  // Action confirmation states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('Traffic congestion on arterial flyover; alternate unit requested');

  useEffect(() => {
    // 1. Try finding in loaded incidents props
    const found = incidents.find(i => i.incidentId === incidentId);
    if (found) {
      setIncident(found);
      setLoading(false);
    } else {
      // 2. Fetch directly from API
      api.getIncidentById(incidentId)
        .then(data => {
          setIncident(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [incidentId, incidents]);

  const handleCopyId = () => {
    if (incident?.incidentId) {
      navigator.clipboard.writeText(incident.incidentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenEditModal = () => {
    if (!incident || incident.status === 'RESOLVED') return;
    setEditForm({
      description: incident.description || '',
      peopleAffected: incident.peopleAffected || 0,
      assignedTeam: incident.assignedTeam || '',
      notes: incident.notes || incident.resolutionNotes || ''
    });
    setPatchError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!incident) return;
    setIsPatching(true);
    setPatchError(null);
    try {
      const payload = {
        description: editForm.description.trim(),
        peopleAffected: Number(editForm.peopleAffected)
      };
      if (editForm.assignedTeam.trim()) {
        payload.assignedTeam = editForm.assignedTeam.trim();
      }
      if (editForm.notes.trim()) {
        payload.notes = editForm.notes.trim();
      }

      const res = await api.patchIncident(incident.incidentId, payload);
      if (res.incident) {
        setIncident(res.incident);
      } else {
        setIncident(prev => ({ ...prev, ...payload }));
      }
      setShowEditModal(false);
    } catch (err) {
      setPatchError(err.message || 'Failed to update incident record');
    } finally {
      setIsPatching(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!incident || incident.status === 'RESOLVED') return;
    setIsApproving(true);
    try {
      await api.approveRecommendation(incident.incidentId, 'REC-HYD-01');
      setApprovalStatus('APPROVED');
      setIncident(prev => ({
        ...prev,
        status: 'DISPATCHED',
        recommendationDecision: 'APPROVED',
        approvedAt: new Date().toISOString()
      }));
      setShowApproveModal(false);
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!incident) return;
    setIsRejecting(true);
    try {
      await api.rejectRecommendation(incident.incidentId, 'REC-HYD-01', rejectReason);
      setApprovalStatus('REJECTED');
      setIncident(prev => ({
        ...prev,
        recommendationDecision: 'REJECTED',
        rejectedAt: new Date().toISOString(),
        assignedTeam: 'Manual Re-evaluation Required'
      }));
      setShowRejectModal(false);
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!incident) return;
    setIsResolving(true);
    try {
      if (onResolveIncident) {
        await onResolveIncident(incident.incidentId, resolveNotes);
      } else {
        await api.resolveIncident(incident.incidentId, resolveNotes);
      }
      setIncident(prev => ({
        ...prev,
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        resolutionNotes: resolveNotes || 'Resolved by command center operator.'
      }));
      setShowResolveModal(false);
    } catch (err) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="atlas-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Activity size={32} className="spin-anim" style={{ margin: '0 auto 16px', color: '#2563EB' }} />
          <h3>Loading incident dossier from DynamoDB...</h3>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px' }}>
            Fetching record {incidentId} across AWS ap-south-2...
          </p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="page-container">
        <div className="page-header-row">
          <Link to="/incidents" className="btn-atlas-secondary">
            <ArrowLeft size={14} /> Back to Directory
          </Link>
        </div>
        <div className="atlas-card" style={{ padding: '40px', textAlign: 'center', marginTop: '20px' }}>
          <AlertCircle size={36} color="#DC2626" style={{ margin: '0 auto 12px' }} />
          <h2>Incident Record Not Found</h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px' }}>
            Could not locate record <code className="mono">{incidentId}</code> in DynamoDB table <code className="mono">ResQFlowIncidents</code>.
          </p>
          <button className="btn-atlas-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/incidents')}>
            Return to Incidents
          </button>
        </div>
      </div>
    );
  }

  const severity = incident.severity || 'UNKNOWN';
  const status = incident.status || 'REPORTED';
  const isResolved = status === 'RESOLVED';
  const isDispatched = status === 'DISPATCHED' || approvalStatus === 'APPROVED';

  // Lifecycle steps calculation
  const steps = [
    { id: 'REPORTED', label: 'Reported & Ingested', done: true, time: incident.createdAt },
    { id: 'CLASSIFIED', label: 'Triage Classified', done: status !== 'REPORTED', time: incident.updatedAt },
    { id: 'RECOMMENDED', label: 'Resource Recommendation', done: true, time: incident.updatedAt },
    { id: 'DISPATCHED', label: 'Simulated Dispatch Approved', done: isDispatched || isResolved, time: incident.approvedAt },
    { id: 'RESOLVED', label: 'Stabilized & Resolved', done: isResolved, time: incident.resolvedAt }
  ];

  return (
    <div className="page-container">
      {/* Top Header & Breadcrumb */}
      <div className="page-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn-header-tool" onClick={() => navigate('/incidents')} title="Back to Directory">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="page-title">{incident.incidentId}</h1>
              <button 
                onClick={handleCopyId}
                className="btn-header-tool"
                style={{ width: '26px', height: '26px' }}
                title="Copy Incident ID"
              >
                {copied ? <Check size={12} color="#059669" /> : <Copy size={12} color="#94A3B8" />}
              </button>
              <span className={`badge-atlas ${severity.toLowerCase()}`}>{severity}</span>
              <span className={`badge-atlas ${status.toLowerCase()}`}>{status}</span>
            </div>
            <p className="page-subtitle">
              {incident.type || incident.category || 'Emergency Incident'} • Ingested via API Gateway at {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Recent'}
            </p>
          </div>
        </div>

        {/* Action Header Button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn-atlas-secondary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
            onClick={() => {
              const artifact = {
                s3Bucket: "resqflow-incident-archives-hyd",
                s3Key: `incidents/${incident.incidentId}/dossier-${new Date().toISOString().slice(0, 10)}.json`,
                archivedAt: new Date().toISOString(),
                incidentId: incident.incidentId,
                type: incident.type || incident.category,
                severity: incident.severity,
                status: incident.status,
                peopleAffected: incident.peopleAffected,
                location: incident.location,
                assignedTeam: incident.assignedTeam,
                hospital: incident.hospital,
                etaMinutes: incident.etaMinutes,
                createdAt: incident.createdAt,
                updatedAt: incident.updatedAt,
                resolvedAt: incident.resolvedAt,
                resolutionNotes: incident.resolutionNotes,
                telemetry: {
                  table: "ResQFlowIncidents",
                  bus: "resqflow-event-bus",
                  stateMachine: "ResQFlowIncidentWorkflow",
                  region: "ap-south-2"
                }
              };
              const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ResQFlow-${incident.incidentId}-S3-Archive.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Export full incident dossier formatted for Amazon S3 disaster data lake"
          >
            <Download size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            Export S3 Archive
          </button>

          {!isResolved && (
            <button 
              className="btn-atlas-secondary"
              onClick={handleOpenEditModal}
              title="Edit incident parameters (Optimistic locking protected)"
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              <Edit3 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              Edit Record
            </button>
          )}

          {!isResolved ? (
            <button 
              className="btn-table-resolve" 
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setShowResolveModal(true)}
            >
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              Resolve Emergency
            </button>
          ) : (
            <span className="badge-atlas resolved" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              Incident Cleared
            </span>
          )}
        </div>
      </div>

      {/* Lifecycle Stepper Bar */}
      <div className="atlas-card" style={{ padding: '18px 24px', margin: '4px 0' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Serverless EventBridge & Step Functions Execution Lifecycle
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '14px', left: '20px', right: '20px', height: '2px', background: '#E2E8F0', zIndex: 1 }} />
          {steps.map((st, idx) => (
            <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: st.done ? '#2563EB' : '#FFFFFF',
                border: `2px solid ${st.done ? '#2563EB' : '#CBD5E1'}`,
                color: st.done ? '#FFFFFF' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {st.done ? <Check size={14} /> : idx + 1}
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: st.done ? 600 : 500, 
                color: st.done ? '#14233B' : '#94A3B8', 
                marginTop: '6px',
                textAlign: 'center'
              }}>
                {st.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Amazon Polly Tactical Dispatch Radio Bar */}
      <div style={{ marginBottom: '20px' }}>
        <PollyVoiceRadio incident={incident} />
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Details & Explainability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Description & Geolocation */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#2563EB" />
              Incident Dossier & Intake Details
            </h3>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Description</span>
              <p style={{ fontSize: '14px', color: '#14233B', marginTop: '4px', lineHeight: 1.5 }}>
                {incident.description || 'No detailed narrative provided.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> People Affected
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: incident.peopleAffected >= 10 ? '#DC2626' : '#14233B', marginTop: '2px', display: 'block' }}>
                  {incident.peopleAffected ?? 'N/A'} Persons
                </span>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> Geographic Sector
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#14233B', marginTop: '4px', display: 'block' }}>
                  {incident.location?.latitude ? `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}` : 'Hyderabad Core Grid'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Explainable Triage & AI Assistant */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} color="#EA580C" />
                Explainable Triage & AI Operational Assistant
              </h3>
              <span className="badge-atlas low" style={{ fontSize: '10px' }}>
                Safety-Gated
              </span>
            </div>

            {/* AI Assistant State Banner */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  AI Foundation Model Status
                </span>
                <span className="badge-atlas dispatched" style={{ fontSize: '10px' }}>
                  Amazon Bedrock: Standby
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
                AWS Bedrock model access (Claude 3 / Titan) is restricted on this AWS account. 
                ResQFlow operates in <strong>Deterministic Heuristic Triage Mode</strong>. 
                Automated models are strictly advisory and <em>cannot authorize dispatch</em>.
              </p>
            </div>

            {/* Evaluated Severity & Reason */}
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#C2410C' }}>
                  Evaluated Severity: {severity}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, background: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FDBA74' }}>
                  Deterministic Rule Engine v2.1
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#7C2D12', marginTop: '6px', lineHeight: 1.4 }}>
                <strong>Reasoning: </strong>
                {incident.peopleAffected >= 10 
                  ? `Critical casualty threshold triggered (≥10 casualties: ${incident.peopleAffected} reported). Escalated to Tier-1 Rapid Deployment.`
                  : incident.type === 'FIRE' || incident.type === 'MEDICAL'
                    ? `Emergency category '${incident.type}' with ${incident.peopleAffected} casualties matches Priority Tier-2 Response criteria.`
                    : `Standard emergency response criteria applied based on verified parameters.`
                }
              </p>
            </div>

            {/* AI Synthesized Operational Briefing */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '14px', fontSize: '12px', color: '#1E40AF', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>AI Incident Synthesis Brief:</span>
                <span style={{ fontSize: '10px', background: '#DBEAFE', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Rule-Synthesized</span>
              </div>
              <div>• <strong>Situation Brief:</strong> {incident.description || 'No description recorded.'}</div>
              <div>• <strong>Casualty Assessment:</strong> {incident.peopleAffected || 0} individuals reported at location ({incident.location?.name || 'Central Sector'}).</div>
              <div>• <strong>Allocated Asset:</strong> {incident.assignedTeam || 'Pending Allocation'} (Estimated response: {incident.etaMinutes || 10} mins).</div>
              <div>• <strong>Trauma Destination:</strong> {incident.hospital || 'Nearest Level-1 Center'}.</div>
              <div style={{ fontSize: '11px', color: '#6B7280', borderTop: '1px dashed #BFDBFE', paddingTop: '6px', marginTop: '2px' }}>
                ⚠️ Notice: AI assistant outputs are non-binding. Dispatch authority is reserved exclusively for authenticated command operators.
              </div>
            </div>
          </div>

          {/* Card 3: Traceable Serverless Infrastructure Telemetry */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#2563EB" />
              Traceable Cloud Telemetry & Event Audit
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>DynamoDB Table:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlowIncidents</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>EventBridge Bus:</span>
                <span className="mono" style={{ fontWeight: 600 }}>resqflow-event-bus</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Correlation ID:</span>
                <span className="mono" style={{ fontWeight: 600 }}>{incident.incidentId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748B' }}>Step Functions Workflow:</span>
                <span className="mono" style={{ fontWeight: 600 }}>ResQFlowIncidentWorkflow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recommendations & Approval Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card: Resource Recommendation & Human Approval */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={16} color="#2563EB" />
              Resource Recommendation & Dispatch
            </h3>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Recommended Unit</span>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginTop: '2px' }}>
                    {incident.assignedTeam && !incident.assignedTeam.includes('Pending') 
                      ? incident.assignedTeam 
                      : (severity === 'CRITICAL' ? 'ERT-Hyderabad-Alpha (Special Rapid Deployment)' : 'PRT-Hyderabad-Bravo (Priority Tactical Unit)')}
                  </h4>
                </div>
                <span className="badge-atlas dispatched">
                  {approvalStatus === 'APPROVED' || isDispatched ? 'DISPATCHED' : 'AWAITING APPROVAL'}
                </span>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#14233B' }}>
                  <Building2 size={15} color="#64748B" />
                  <span><strong>Trauma Center:</strong> {incident.hospital || 'Apollo Emergency & Trauma Care, Hyderabad'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#14233B' }}>
                  <Clock size={15} color="#64748B" />
                  <span><strong>Calculated Transit ETA:</strong> ~{incident.etaMinutes || (severity === 'CRITICAL' ? 8 : 15)} mins (Straight-line Haversine estimate)</span>
                </div>
              </div>
            </div>

            {/* Operator Approval / Decision Interface */}
            {!isResolved && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#14233B', display: 'block', marginBottom: '8px' }}>
                  Operator Verification & Human-in-the-Loop Action:
                </span>
                
                {approvalStatus === 'APPROVED' || isDispatched ? (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <CheckCircle2 size={18} color="#059669" style={{ margin: '0 auto 4px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>
                      Simulated Dispatch Approved & Confirmed
                    </span>
                    <p style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                      Event published to SNS ResQFlowAlerts & SQS fan-out queue.
                    </p>
                  </div>
                ) : approvalStatus === 'REJECTED' ? (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <X size={18} color="#DC2626" style={{ margin: '0 auto 4px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>
                      Recommendation Rejected by Operator
                    </span>
                    <p style={{ fontSize: '11px', color: '#B91C1C', marginTop: '2px' }}>
                      Awaiting manual dispatch allocation or secondary unit re-routing.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn-atlas-primary" 
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setShowApproveModal(true)}
                    >
                      <Check size={14} /> Approve Dispatch
                    </button>
                    <button 
                      className="btn-atlas-secondary" 
                      style={{ flex: 1, justifyContent: 'center', color: '#DC2626', borderColor: '#FCA5A5' }}
                      onClick={() => setShowRejectModal(true)}
                    >
                      <X size={14} /> Reject / Re-evaluate
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card: Hospital Readiness Snapshot */}
          <div className="atlas-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="#059669" />
              Assigned Trauma Center Status (Simulated)
            </h3>
            <div style={{ fontSize: '13px', color: '#14233B', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Trauma Bed Availability:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>14 of 50 Available</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>ICU Capacity:</span>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>6 Critical Beds Open</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Blood Bank Inventory:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>OPTIMAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Aviation Helipad:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>ACTIVE (Clear for Ingress)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Confirmation Modal */}
      {showResolveModal && (
        <div className="atlas-modal-backdrop" onClick={() => setShowResolveModal(false)}>
          <div className="atlas-modal-box" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h3 className="modal-title">Resolve Emergency Incident</h3>
              <button className="btn-header-tool" onClick={() => setShowResolveModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body-content">
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Confirming resolution will mark <strong className="mono">{incident.incidentId}</strong> as <strong>RESOLVED</strong> in DynamoDB and publish an <code className="mono">IncidentResolved</code> audit event to EventBridge.
              </p>
              <div className="atlas-form-group">
                <label className="atlas-label">Operator Stabilization Notes</label>
                <textarea 
                  className="atlas-textarea"
                  rows={3}
                  placeholder="e.g., Casualties transferred to Apollo Trauma Center. Threat fully contained by Unit Alpha."
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer-bar">
              <button className="btn-atlas-secondary" onClick={() => setShowResolveModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-atlas-primary" 
                style={{ background: '#059669' }}
                onClick={handleConfirmResolve}
                disabled={isResolving}
              >
                {isResolving ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Incident Record Modal */}
      {showEditModal && (
        <div className="atlas-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="atlas-modal-box" style={{ width: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} color="#2563EB" />
                <h3 className="modal-title">Edit Incident Dossier: {incident.incidentId}</h3>
              </div>
              <button className="btn-header-tool" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-content">
              {patchError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
                  {patchError}
                </div>
              )}

              <div className="atlas-form-group">
                <label className="atlas-label">Situation Description</label>
                <textarea 
                  className="atlas-textarea"
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="atlas-form-group">
                <label className="atlas-label">People Affected Headcount</label>
                <input 
                  type="number"
                  min="0"
                  className="atlas-input"
                  value={editForm.peopleAffected}
                  onChange={e => setEditForm(prev => ({ ...prev, peopleAffected: e.target.value }))}
                />
              </div>

              <div className="atlas-form-group">
                <label className="atlas-label">Designated Tactical Unit</label>
                <input 
                  type="text"
                  className="atlas-input"
                  value={editForm.assignedTeam}
                  onChange={e => setEditForm(prev => ({ ...prev, assignedTeam: e.target.value }))}
                />
              </div>

              <div className="atlas-form-group">
                <label className="atlas-label">Operational Notes</label>
                <input 
                  type="text"
                  className="atlas-input"
                  placeholder="Supervisor addendum..."
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer-bar">
              <button className="btn-atlas-secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-atlas-primary"
                onClick={handleSaveEdit}
                disabled={isPatching}
              >
                {isPatching ? 'Saving changes...' : 'Save & Sync DynamoDB'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Dispatch Confirmation Modal */}
      {showApproveModal && (
        <div className="atlas-modal-backdrop" onClick={() => setShowApproveModal(false)}>
          <div className="atlas-modal-box" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#2563EB" />
                <h3 className="modal-title">Authorize Tactical Deployment</h3>
              </div>
              <button className="btn-header-tool" onClick={() => setShowApproveModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body-content">
              <p style={{ fontSize: '13px', color: '#14233B', lineHeight: 1.5 }}>
                You are about to authorize simulated dispatch for <strong className="mono">{incident.incidentId}</strong>:
              </p>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Assigned Team:</strong> {incident.assignedTeam && !incident.assignedTeam.includes('Pending') ? incident.assignedTeam : 'ERT-Hyderabad-Alpha'}</div>
                <div><strong>Trauma Center:</strong> {incident.hospital || 'Apollo Emergency & Trauma Care'}</div>
                <div><strong>Estimated Transit:</strong> ~{incident.etaMinutes || 8} min (Straight-line Haversine estimate)</div>
                <div><strong>Operator ID:</strong> DISP-HYD-01</div>
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                *This action will emit <code className="mono">ResourceRecommendationApproved</code> to EventBridge and transition status to <strong>DISPATCHED</strong>.
              </p>
            </div>
            <div className="modal-footer-bar">
              <button className="btn-atlas-secondary" onClick={() => setShowApproveModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-atlas-primary"
                onClick={handleConfirmApprove}
                disabled={isApproving}
              >
                {isApproving ? 'Authorizing...' : 'Authorize Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Recommendation Modal */}
      {showRejectModal && (
        <div className="atlas-modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="atlas-modal-box" style={{ width: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#DC2626" />
                <h3 className="modal-title">Reject Recommendation</h3>
              </div>
              <button className="btn-header-tool" onClick={() => setShowRejectModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body-content">
              <p style={{ fontSize: '13px', color: '#64748B' }}>
                Provide the operational reason for rejecting this recommended unit. An audit event <code className="mono">ResourceRecommendationRejected</code> will be logged to EventBridge.
              </p>
              <div className="atlas-form-group">
                <label className="atlas-label">Rejection / Re-routing Reason</label>
                <textarea 
                  className="atlas-textarea"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer-bar">
              <button className="btn-atlas-secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-atlas-primary"
                style={{ background: '#DC2626' }}
                onClick={handleConfirmReject}
                disabled={isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
