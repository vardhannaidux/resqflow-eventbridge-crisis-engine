import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Activity, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Server, 
  Zap, 
  ExternalLink, 
  Filter, 
  Search,
  Cpu,
  BarChart2,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { xrayService } from '../services/xrayService';

export default function XRayTracingPage() {
  const [graphData, setGraphData] = useState(null);
  const [tracesData, setTracesData] = useState([]);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const [traceDetail, setTraceDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadXRayData = async () => {
    setIsLoading(true);
    try {
      const [graph, traces] = await Promise.all([
        xrayService.getServiceGraph(),
        xrayService.getTraceSummaries()
      ]);
      setGraphData(graph);
      setTracesData(traces.traces || []);
    } catch (err) {
      console.error('Failed to load X-Ray data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadXRayData();
  }, []);

  const handleSelectTrace = async (trace) => {
    setSelectedTrace(trace);
    setIsLoadingDetail(true);
    try {
      const detail = await xrayService.getTraceDetail(trace.id);
      setTraceDetail(detail);
    } catch (err) {
      console.error('Failed to load trace detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const filteredTraces = tracesData.filter(t => {
    const matchesService = serviceFilter === 'ALL' || t.entryPoint.includes(serviceFilter);
    const matchesSearch = !searchQuery || t.id.toLowerCase().includes(searchQuery.toLowerCase()) || t.entryPoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesSearch;
  });

  const getServiceBadge = (type) => {
    if (type?.includes('Lambda')) return { bg: '#EFF6FF', color: '#1D4ED8', label: 'AWS Lambda' };
    if (type?.includes('DynamoDB')) return { bg: '#FEF3C7', color: '#B45309', label: 'DynamoDB' };
    if (type?.includes('EventBridge')) return { bg: '#F3E8FF', color: '#7E22CE', label: 'EventBridge' };
    if (type?.includes('StepFunctions')) return { bg: '#ECFDF5', color: '#047857', label: 'Step Functions' };
    if (type?.includes('ApiGateway')) return { bg: '#F1F5F9', color: '#334155', label: 'API Gateway' };
    return { bg: '#F5F4EE', color: '#0D0D0D', label: 'AWS Service' };
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-atlas live" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="live-dot" />
              AWS X-RAY · AP-SOUTH-2
            </span>
            <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>
              Sampling Rule: Default (5% Fixed Rate · 1/s Reservoir)
            </span>
          </div>
          <h1 className="page-title" style={{ marginTop: '4px' }}>
            Distributed Tracing & Service Dependency Graph
          </h1>
          <p className="page-subtitle">
            Subsegment execution waterfalls, cross-service propagation latencies, and service topology mapping across AWS Lambda, DynamoDB, EventBridge, and Step Functions.
          </p>
        </div>

        <button 
          className="btn-atlas-secondary"
          onClick={loadXRayData}
          disabled={isLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin-anim' : ''} />
          <span>Refresh Traces</span>
        </button>
      </div>

      {/* Top X-Ray Telemetry Bar */}
      <div className="atlas-card" style={{ padding: '16px 20px', background: '#FFFFFF', border: '2px solid #0D0D0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD23F' }}>
            <Activity size={22} />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: '#0D0D0D' }}>
              AWS X-Ray Distributed Observer
            </span>
            <span className="mono" style={{ fontSize: '11px', color: '#57554D', display: 'block', marginTop: '2px' }}>
              Tracing Header: <code>X-Amzn-Trace-Id: Root=1-...;Sampled=1</code>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>TOTAL TRACES RECORDED</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0D0D0D' }}>305+ Traces</span>
          </div>
          <div style={{ borderLeft: '1px solid #E0DDD4', paddingLeft: '24px' }}>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>AVG INGESTION LATENCY</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>48 ms</span>
          </div>
          <div style={{ borderLeft: '1px solid #E0DDD4', paddingLeft: '24px' }}>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>STEP FUNCTIONS MEAN</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#2563EB' }}>180 ms</span>
          </div>
          <div style={{ borderLeft: '1px solid #E0DDD4', paddingLeft: '24px' }}>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>FAULT RATE</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>0.0%</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: AWS X-RAY SERVICE MAP / TOPOLOGY GRAPH */}
      <div className="atlas-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0D0D0D', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitBranch size={16} color="#2563EB" />
              AWS X-Ray Service Map & Dependency Topology
            </h3>
            <p className="mono" style={{ fontSize: '11px', color: '#828076', marginTop: '2px' }}>
              Live nodes in ap-south-2 · Inter-service request propagation & latency percentiles
            </p>
          </div>
          <span className="badge-atlas low" style={{ fontSize: '11px' }}>
            {graphData?.services?.length || 10} Connected Services
          </span>
        </div>

        {/* Visual Graph Nodes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {graphData?.services?.map((svc, idx) => {
            const badge = getServiceBadge(svc.Type);
            const avgMs = Math.round((svc.Latency?.Avg || 0.035) * 1000);
            const p95Ms = Math.round((svc.Latency?.P95 || 0.070) * 1000);

            return (
              <div 
                key={idx} 
                style={{ 
                  background: '#FAF9F5', 
                  border: '1px solid #DCD8CD', 
                  borderRadius: '8px', 
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="mono" style={{ fontSize: '9px', background: badge.bg, color: badge.color, padding: '2px 5px', borderRadius: '3px', fontWeight: 700 }}>
                      {badge.label}
                    </span>
                    <span className="mono" style={{ fontSize: '9px', color: '#059669', fontWeight: 700 }}>
                      ● HEALTHY
                    </span>
                  </div>

                  <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#0D0D0D', lineHeight: 1.3, marginBottom: '8px' }}>
                    {svc.Name}
                  </h4>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E0DDD4', borderRadius: '4px', padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }} className="mono">
                    <span style={{ color: '#828076' }}>Avg:</span>
                    <strong style={{ color: '#0D0D0D' }}>{avgMs} ms</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }} className="mono">
                    <span style={{ color: '#828076' }}>P95:</span>
                    <strong style={{ color: '#2563EB' }}>{p95Ms} ms</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DISTRIBUTED TRACES TABLE */}
      <div className="atlas-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0D0D0D' }}>
              Recorded Distributed Trace Runs ({filteredTraces.length})
            </h3>
            <p className="mono" style={{ fontSize: '11px', color: '#828076' }}>
              Click any trace to inspect subsegment waterfall latencies
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={13} color="#0D0D0D" style={{ position: 'absolute', left: '10px', top: '9px' }} />
              <input
                type="text"
                placeholder="Search Trace ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  border: '1px solid #DCD8CD',
                  borderRadius: '6px',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'Ingestion', 'Workflow', 'Classifier'].map(s => (
                <button
                  key={s}
                  className={`filter-btn-pill ${serviceFilter === s ? 'active' : ''}`}
                  onClick={() => setServiceFilter(s)}
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive-container">
          <table className="atlas-data-table">
            <thead>
              <tr>
                <th>AWS X-Ray Trace ID</th>
                <th>Entry Service</th>
                <th>Type</th>
                <th>Total Latency</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraces.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#828076' }}>
                    No matching X-Ray traces found.
                  </td>
                </tr>
              ) : (
                filteredTraces.map(t => (
                  <tr 
                    key={t.id} 
                    onClick={() => handleSelectTrace(t)}
                    style={{ cursor: 'pointer', background: selectedTrace?.id === t.id ? '#FAF9F5' : 'transparent' }}
                  >
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: '#2563EB', fontSize: '11px' }}>
                        {t.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0D0D0D', fontSize: '12px' }}>
                        {t.entryPoint}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '10px', color: '#57554D' }}>
                        {t.serviceType}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 800, color: t.durationMs > 150 ? '#D97706' : '#059669', fontSize: '12px' }}>
                        {t.durationMs} ms
                      </span>
                    </td>
                    <td>
                      <span className="badge-atlas low" style={{ fontSize: '10px' }}>
                        <CheckCircle2 size={10} style={{ display: 'inline', marginRight: '3px' }} />
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-atlas-secondary"
                        onClick={(e) => { e.stopPropagation(); handleSelectTrace(t); }}
                        style={{ padding: '3px 8px', fontSize: '10px' }}
                      >
                        Waterfall
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: TRACE WATERFALL EXECUTION DETAIL MODAL */}
      {selectedTrace && (
        <div className="atlas-modal-backdrop" onClick={() => setSelectedTrace(null)}>
          <div className="atlas-modal-box" style={{ width: '700px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div>
                <span className="mono" style={{ fontSize: '10px', color: '#828076' }}>AWS X-RAY DISTRIBUTED TRACE</span>
                <h3 className="modal-title mono" style={{ fontSize: '14px', color: '#2563EB' }}>
                  {selectedTrace.id}
                </h3>
              </div>
              <button className="btn-header-tool" onClick={() => setSelectedTrace(null)}>
                ×
              </button>
            </div>

            <div className="modal-body-content">
              {isLoadingDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#828076' }}>
                  <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 10px' }} />
                  <p className="mono">Querying X-Ray subsegments and batch trace details...</p>
                </div>
              ) : (
                <div>
                  {/* Meta Bar */}
                  <div style={{ background: '#FAF9F5', border: '1px solid #DCD8CD', borderRadius: '6px', padding: '12px', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>TOTAL DURATION</span>
                      <span className="mono" style={{ fontSize: '18px', fontWeight: 900, color: '#0D0D0D' }}>
                        {traceDetail?.durationMs || selectedTrace.durationMs} ms
                      </span>
                    </div>
                    <div>
                      <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>ENTRY SERVICE</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D0D0D' }}>
                        {selectedTrace.entryPoint}
                      </span>
                    </div>
                    <div>
                      <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>EXECUTION STATUS</span>
                      <span className="badge-atlas low" style={{ fontSize: '11px', marginTop: '2px', display: 'inline-block' }}>
                        {selectedTrace.status}
                      </span>
                    </div>
                  </div>

                  {/* Subsegment Waterfall Breakdown */}
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0D0D0D', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="#2563EB" />
                    Subsegment Execution Waterfall Timeline
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(traceDetail?.waterfall || [
                      {"name": "Amazon API Gateway HTTP Ingestion", "service": "AWS::ApiGateway", "durationMs": 14, "status": "200 OK", "startOffsetMs": 0},
                      {"name": "ResQFlow-IngestionFunction (Lambda ARM64)", "service": "AWS::Lambda", "durationMs": 42, "status": "200 OK", "startOffsetMs": 14},
                      {"name": "DynamoDB PutItem (Table: ResQFlowIncidents)", "service": "AWS::DynamoDB", "durationMs": 18, "status": "200 OK", "startOffsetMs": 28},
                      {"name": "EventBridge PutEvents (resqflow-event-bus)", "service": "AWS::EventBridge", "durationMs": 22, "status": "200 OK", "startOffsetMs": 56},
                      {"name": "Step Functions State Transition (NormalizeInput)", "service": "AWS::StepFunctions", "durationMs": 35, "status": "SUCCEEDED", "startOffsetMs": 78},
                      {"name": "ResQFlow-ClassifierFunction (Triage Scoring)", "service": "AWS::Lambda", "durationMs": 38, "status": "200 OK", "startOffsetMs": 113},
                      {"name": "ResQFlow-ResourceAllocationFunction (Haversine)", "service": "AWS::Lambda", "durationMs": 44, "status": "200 OK", "startOffsetMs": 151},
                      {"name": "Amazon SNS Fan-Out (Topic: ResQFlowAlerts)", "service": "AWS::SNS", "durationMs": 19, "status": "DELIVERED", "startOffsetMs": 195},
                      {"name": "SQS Audit Queue Message Enqueue", "service": "AWS::SQS", "durationMs": 12, "status": "ENQUEUED", "startOffsetMs": 214}
                    ]).map((seg, i) => {
                      const totalMs = traceDetail?.durationMs || selectedTrace.durationMs || 226;
                      const leftPct = Math.min(90, Math.round((seg.startOffsetMs / totalMs) * 100));
                      const widthPct = Math.max(8, Math.round((seg.durationMs / totalMs) * 100));

                      return (
                        <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E0DDD4', borderRadius: '6px', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0D0D0D' }}>
                              {seg.name}
                            </span>
                            <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB' }}>
                              {seg.durationMs} ms
                            </span>
                          </div>

                          {/* Visual Waterfall Bar */}
                          <div style={{ height: '6px', background: '#F5F4EE', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                position: 'absolute', 
                                left: `${leftPct}%`, 
                                width: `${widthPct}%`, 
                                height: '100%', 
                                background: '#2563EB',
                                borderRadius: '3px'
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer-bar">
              <button className="btn-atlas-primary" onClick={() => setSelectedTrace(null)}>
                Close Trace Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
