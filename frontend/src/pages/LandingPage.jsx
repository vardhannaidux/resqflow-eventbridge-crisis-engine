import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  Radio, 
  Bot, 
  CheckCircle2, 
  Layers, 
  Lock, 
  Server,
  GitBranch,
  Terminal,
  Sparkles
} from 'lucide-react';

export default function LandingPage({ incidents = [], connectionStatus = { online: true, latencyMs: 42 } }) {
  const navigate = useNavigate();
  const [pipelineStep, setPipelineStep] = useState(0);

  // Animated pipeline simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setPipelineStep(prev => (prev + 1) % 5);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;

  const PIPELINE_NODES = [
    { id: 'intake', label: '911 & Field Ingestion', icon: <Radio size={16} />, tech: 'API Gateway v2' },
    { id: 'compute', label: 'Deterministic Triage', icon: <Cpu size={16} />, tech: 'Python Lambda' },
    { id: 'persist', label: 'ACID OCC Lock', icon: <Database size={16} />, tech: 'DynamoDB' },
    { id: 'eventbus', label: 'Event Orchestration', icon: <Zap size={16} />, tech: 'EventBridge Bus' },
    { id: 'dispatch', label: 'Autonomous Fleet Route', icon: <GitBranch size={16} />, tech: 'Step Functions' },
  ];

  return (
    <div className="landing-viewport">
      {/* 1. Swiss Editorial Top Navigation Bar */}
      <header className="landing-nav-header">
        <div className="landing-nav-inner">
          <div className="landing-brand-wrap" onClick={() => navigate('/')}>
            <div className="sidebar-logo-icon">
              <Flame size={18} />
            </div>
            <div>
              <span className="landing-brand-title">ResQFlow</span>
              <span className="sidebar-brand-badge" style={{ marginLeft: '8px' }}>ENTERPRISE AI</span>
            </div>
          </div>

          <nav className="landing-links">
            <Link to="/documentation" className="landing-nav-link">Architecture</Link>
            <Link to="/documentation#doc-services" className="landing-nav-link">Cloud Services</Link>
            <Link to="/ai-assistant" className="landing-nav-link">Bedrock Copilot</Link>
            <Link to="/analytics" className="landing-nav-link">Platform SLA</Link>
          </nav>

          <div className="landing-nav-actions">
            <Link to="/login" className="btn-atlas-secondary" style={{ padding: '7px 14px', fontSize: '12px' }}>
              Sign In
            </Link>
            <button 
              className="btn-atlas-primary" 
              onClick={() => navigate('/dashboard')}
              style={{ padding: '7px 16px', fontSize: '12px' }}
            >
              <span>Launch Console</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Oversized Display Typography */}
      <section className="landing-hero-section">
        <div className="landing-container">
          <div className="landing-hero-badge-row">
            <div className="bauhaus-badge">
              <span className="bauhaus-orb"></span>
              <span>AUTONOMOUS EMERGENCY INTELLIGENCE PLATFORM</span>
            </div>
            <div className="landing-telemetry-pill mono">
              <span className="status-dot-ping"></span>
              <span>AWS ap-south-2 · SLA &lt;200ms · {activeCount || 16} ACTIVE EVENTS</span>
            </div>
          </div>

          <h1 className="landing-display-title">
            AUTONOMOUS INCIDENT<br />
            <span className="title-highlight">ORCHESTRATION</span> ENGINE
          </h1>

          <p className="landing-hero-lead">
            Mission-critical situational intelligence designed for state emergency management, municipal fire & rescue, and trauma networks. Powered by deterministic AWS serverless pipelines and real-time Amazon Bedrock advisory agents.
          </p>

          <div className="landing-cta-row">
            <button 
              className="btn-landing-primary"
              onClick={() => navigate('/dashboard')}
            >
              <span>Launch Operations Console</span>
              <ArrowRight size={16} />
            </button>

            <button 
              className="btn-landing-secondary"
              onClick={() => navigate('/login?mode=register')}
            >
              <span>Create Dispatcher Account</span>
            </button>

            <Link 
              to="/documentation" 
              className="landing-docs-link mono"
            >
              Read System Architecture Specs →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Real-Time Cinematic Event Pipeline Simulator */}
      <section className="landing-pipeline-section">
        <div className="landing-container">
          <div className="pipeline-card-shell">
            <div className="pipeline-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={16} color="#0D0D0D" />
                <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#0D0D0D', letterSpacing: '0.06em' }}>
                  EVENT-DRIVEN CLOUD PIPELINE · LIVE ARCHITECTURAL LINEAGE
                </span>
              </div>
              <div className="mono" style={{ fontSize: '11px', color: '#525049' }}>
                OCC STATE: <span style={{ color: '#059669', fontWeight: 700 }}>SYNCHRONIZED (42ms)</span>
              </div>
            </div>

            {/* Pipeline Stage Nodes */}
            <div className="pipeline-stages-grid">
              {PIPELINE_NODES.map((node, index) => {
                const isActive = pipelineStep === index;
                const isPassed = pipelineStep > index;
                return (
                  <div 
                    key={node.id} 
                    className={`pipeline-node-box ${isActive ? 'active-node' : ''} ${isPassed ? 'passed-node' : ''}`}
                  >
                    <div className="node-index-badge mono">0{index + 1}</div>
                    <div className="node-icon-wrap">{node.icon}</div>
                    <div className="node-title">{node.label}</div>
                    <div className="node-tech-tag mono">{node.tech}</div>
                    {isActive && <div className="node-pulse-indicator"></div>}
                  </div>
                );
              })}
            </div>

            <div className="pipeline-terminal-bar">
              <span className="mono terminal-code">
                [SYS.INGEST.STREAM] EventBridge bus <strong>resqflow-event-bus</strong> routing typed payload 
                <span style={{ color: '#FF007A' }}> `IncidentReported.v1` </span> 
                with deterministic triage score 
                <span style={{ color: '#0D0D0D', fontWeight: 700 }}> (CRITICAL / ALS Tier-1)</span>
              </span>
              <span className="mono terminal-latency">p99: 148ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Swiss Architectural Feature Pillars */}
      <section className="landing-pillars-section">
        <div className="landing-container">
          <div className="section-label-row">
            <div className="bauhaus-badge">
              <span className="bauhaus-orb"></span>
              <span>ENGINE CAPABILITY MATRIX</span>
            </div>
            <h2 className="section-heading">Architected for Extreme Situations</h2>
            <p className="section-subtext">
              Zero tolerance for race conditions or data loss. Every incident is atomically persisted and routed using AWS native primitives.
            </p>
          </div>

          <div className="pillars-grid-three">
            {/* Pillar 1 */}
            <div className="pillar-sheet">
              <div className="pillar-header">
                <div className="pillar-icon-box" style={{ background: '#0D0D0D', color: '#FFFFFF' }}>
                  <Zap size={20} />
                </div>
                <span className="mono pillar-tag">CORE INTAKE</span>
              </div>
              <h3 className="pillar-title">Sub-200ms Deterministic Triage</h3>
              <p className="pillar-body">
                Rule-based algorithmic triage classification executed inside serverless AWS Lambda microservices. Eliminates manual dispatcher bottlenecks with immediate severity scoring.
              </p>
              <div className="pillar-spec mono">
                <span>BENCHMARK</span>
                <strong>142ms p95 LATENCY</strong>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-sheet">
              <div className="pillar-header">
                <div className="pillar-icon-box" style={{ background: '#FFFFFF', border: '1px solid #0D0D0D', color: '#0D0D0D' }}>
                  <Globe size={20} />
                </div>
                <span className="mono pillar-tag">GEOSPATIAL</span>
              </div>
              <h3 className="pillar-title">Haversine Proximity Routing</h3>
              <p className="pillar-body">
                Step Functions orchestrates multi-unit allocation using mathematical Haversine proximity matrix against live hospital trauma capacities and available fleet units.
              </p>
              <div className="pillar-spec mono">
                <span>DISPATCH SLA</span>
                <strong>&lt; 1.2s STATE TRANSITION</strong>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-sheet">
              <div className="pillar-header">
                <div className="pillar-icon-box" style={{ background: '#FFD23F', color: '#0D0D0D' }}>
                  <Bot size={20} />
                </div>
                <span className="mono pillar-tag">AI COPILOT</span>
              </div>
              <h3 className="pillar-title">Amazon Bedrock Advisory</h3>
              <p className="pillar-body">
                Context-injected Claude models generate real-time situation reports and hazard advisories without taking autonomous dispatch authority away from licensed human supervisors.
              </p>
              <div className="pillar-spec mono">
                <span>SAFETY GUARD</span>
                <strong>HUMAN-IN-THE-LOOP REQUIRED</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Enterprise Metrics Section */}
      <section className="landing-metrics-section">
        <div className="landing-container">
          <div className="metrics-banner-sheet">
            <div className="metric-col">
              <div className="metric-num">11</div>
              <div className="metric-label mono">REST API GATEWAY ROUTES</div>
            </div>
            <div className="metric-col">
              <div className="metric-num">100%</div>
              <div className="metric-label mono">DYNAMODB ACID OCC INTEGRITY</div>
            </div>
            <div className="metric-col">
              <div className="metric-num">14-Day</div>
              <div className="metric-label mono">EVENTBRIDGE AUDIT RETENTION</div>
            </div>
            <div className="metric-col">
              <div className="metric-num">&lt;200ms</div>
              <div className="metric-label mono">TRIAGE SLA RESPONSE</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. High-Contrast Footer Call to Action */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-card">
            <div className="footer-left">
              <h3 className="footer-heading">Deploy ResQFlow to Your Operations Centre</h3>
              <p className="footer-desc">
                CloudFormation & AWS SAM templates deployable in 8 minutes into any AWS Region (including GovCloud).
              </p>
            </div>
            <div className="footer-right">
              <button 
                className="btn-atlas-primary"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '12px 24px', fontSize: '14px' }}
              >
                <span>Enter Operations Theatre</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="footer-bottom-row mono">
            <span>RESQFLOW EMERGENCY TECHNOLOGIES INC. · SWISS EDITORIAL ENGINE SPEC v2.4</span>
            <span>AWS CLOUD INFRASTRUCTURE (ap-south-2 HYDERABAD)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
