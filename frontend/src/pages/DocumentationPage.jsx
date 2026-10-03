import React, { useState, useEffect, useRef } from "react";
import {
  Cloud, Server, Database, Zap, GitBranch, Bell, Shield,
  BarChart3, Bot, Globe, Cpu, Lock, Activity, ArrowRight,
  CheckCircle2, Layers, Radio, Truck, AlertTriangle, MapPin, Navigation,
  Code2, Terminal, ExternalLink, ChevronDown, ChevronRight,
  Network, Workflow, Eye, Flame, Package, Sparkles, Clock,
  TrendingUp, Users, ShieldCheck, Wifi
} from "lucide-react";

function AnimatedCounter({ target, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

const AWS_SERVICES = [
  { icon: <Globe size={20} />, name: "API Gateway (HTTP API v2)", color: "#E8590C", desc: "REST API with CORS, rate throttling (50 RPS), and request validation across all incident, IoT, vision, and routing endpoints.", badge: "LIVE" },
  { icon: <Cpu size={20} />, name: "AWS Lambda (Python 3.12 / ARM64)", color: "#FF9900", desc: "Serverless functions handling ingestion, deterministic triage classification, resource allocation, and event synthesis.", badge: "LIVE" },
  { icon: <Database size={20} />, name: "Amazon DynamoDB", color: "#4053D6", desc: "NoSQL table with optimistic concurrency control (OCC), versioned writes, conditional expressions, and StatusCreatedAtIndex GSI.", badge: "LIVE" },
  { icon: <Zap size={20} />, name: "Amazon EventBridge", color: "#E7157B", desc: "Custom event bus resqflow-event-bus routing incident lifecycle events (IncidentReported, IncidentResolved, GeofenceEnterEvent) with 14-day archive.", badge: "LIVE" },
  { icon: <GitBranch size={20} />, name: "AWS Step Functions", color: "#C7131F", desc: "ResQFlowIncidentWorkflow state machine: NormalizeInput -> RouteBySeverity -> AllocateResources -> NotifyStakeholders -> UpdateLifecycle.", badge: "LIVE" },
  { icon: <Eye size={20} />, name: "Amazon Rekognition", color: "#059669", desc: "Computer vision analysis of citizen disaster photos and drone feeds. Detects fire, flood, collapse, and flags spoofing/discrepancies.", badge: "LIVE" },
  { icon: <Navigation size={20} />, name: "Amazon Location Service", color: "#2563EB", desc: "Real urban road routing with 1.34x curvature modeling, traffic ETAs, automated 500m incident perimeter geofencing, and GHMC reverse geocoding.", badge: "LIVE" },
  { icon: <Cpu size={20} />, name: "AWS IoT Core", color: "#0891B2", desc: "Low-latency MQTT broker (a1859e76u3gqu4-ats), crisis sensor mesh nodes (river depth, toxic gas, seismic), Device Shadows, and SQL Topic Rules.", badge: "LIVE" },
  { icon: <Activity size={20} />, name: "AWS X-Ray", color: "#7C3AED", desc: "Distributed tracing, subsegment waterfall timelines, and live cross-service dependency graph in ap-south-2 with 5% sampling rule.", badge: "LIVE" },
  { icon: <Radio size={20} />, name: "Amazon Polly", color: "#D97706", desc: "Neural & Standard text-to-speech engine (Kajal, Aditi, Matthew, Raveena) synthesizing authoritative voice dispatch radio broadcasts.", badge: "LIVE" },
  { icon: <Cloud size={20} />, name: "Amazon S3", color: "#5B21B6", desc: "Cloud object storage and static website hosting for the production ATLAS web console (s3://resqflow-app-621962614200).", badge: "LIVE" },
  { icon: <Bell size={20} />, name: "Amazon SNS", color: "#FF9900", desc: "Emergency broadcast topic ResQFlowAlerts delivering real-time SMS/email push notifications to dispatchers and field units.", badge: "LIVE" },
  { icon: <Layers size={20} />, name: "Amazon SQS", color: "#EA580C", desc: "Dead-letter queues (ResQFlow-DeadLetterQueue) and decoupled subscriber audit queues (ResQFlow-AlertAuditQueue).", badge: "LIVE" },
  { icon: <Bot size={20} />, name: "Amazon Bedrock", color: "#01A88D", desc: "Claude 3 Haiku / Titan generative AI situational reports (SITREP) with local deterministic fallback engine.", badge: "ACTIVE" },
  { icon: <Shield size={20} />, name: "AWS IAM", color: "#DD344C", desc: "Least-privilege execution roles with inline policies scoped to specific table ARNs, event bus ARNs, and topic ARNs.", badge: "LIVE" },
  { icon: <BarChart3 size={20} />, name: "Amazon CloudWatch", color: "#FF9900", desc: "Lambda execution metrics, error rates, p99 latency dashboards, and structured JSON log streams for observability.", badge: "LIVE" },
];

const ARCH_STEPS = [
  { n: "01", icon: <Radio size={18} />, label: "Incident Ingested", detail: "Citizen mobile report, 911 intake, or AWS IoT Core sensor threshold breach trigger", color: "#DC2626" },
  { n: "02", icon: <Eye size={18} />, label: "Rekognition Vision AI", detail: "Amazon Rekognition verifies photo evidence, visual severity & checks anti-spoofing", color: "#059669" },
  { n: "03", icon: <Globe size={18} />, label: "API Gateway (v2)", detail: "REST endpoint validates request, throttles rate, routes via $default to Lambda", color: "#E8590C" },
  { n: "04", icon: <Cpu size={18} />, label: "Lambda Ingestion", detail: "Python handler validates schema, assigns UUID, persists to DynamoDB atomically", color: "#FF9900" },
  { n: "05", icon: <Database size={18} />, label: "DynamoDB OCC", detail: "Conditional write with OCC version lock prevents concurrent dispatcher race conditions", color: "#4053D6" },
  { n: "06", icon: <Zap size={18} />, label: "EventBridge Bus", detail: "IncidentReported published to resqflow-event-bus with correlation ID & 14-day archive", color: "#E7157B" },
  { n: "07", icon: <GitBranch size={18} />, label: "Step Functions", detail: "State machine classifies severity, invokes Location Service for road route & hospital", color: "#C7131F" },
  { n: "08", icon: <Navigation size={18} />, label: "Location Routing & Geo", detail: "Amazon Location Service calculates road corridor, traffic ETA, and activates 500m geofence", color: "#2563EB" },
  { n: "09", icon: <Bell size={18} />, label: "SNS & Polly Radio", detail: "Emergency push alert + Amazon Polly neural voice audio dispatched to field units", color: "#D97706" },
  { n: "10", icon: <Activity size={18} />, label: "X-Ray Trace & Audit", detail: "Distributed trace recorded in AWS X-Ray; resolution lifecycle audited for compliance", color: "#7C3AED" },
];

const PILLARS = [
  { icon: <Flame size={24} />, color: "#DC2626", title: "Real-Time Incident Triage", points: ["Deterministic severity scoring (CRITICAL/HIGH/MEDIUM/LOW)", "Haversine-based resource proximity matching", "Optimistic concurrency control for concurrent dispatchers", "Sub-200ms classification latency via Lambda"] },
  { icon: <Eye size={24} />, color: "#059669", title: "Computer Vision & Anti-Spoofing", points: ["Amazon Rekognition DetectLabels image verification", "Flames, floods, vehicle wreck, and structural collapse detection", "Citizen photo anti-spoofing check to reject fraudulent claims", "Visual severity estimation calibrating dispatch priority"] },
  { icon: <Navigation size={24} />, color: "#2563EB", title: "Real Road Routing & 500m Geofence", points: ["Amazon Location Service RouteCalculator with urban road curvature", "Turn-by-turn emergency navigation corridor with siren priority", "Automated 500-meter incident perimeter geofencing", "Hyderabad municipal reverse geocoding via PlaceIndex"] },
  { icon: <Cpu size={24} />, color: "#0891B2", title: "IoT Sensor Mesh & Fleet Telemetry", points: ["AWS IoT Core MQTT broker with device shadow synchronization", "Ultrasonic river depth, toxic gas, seismic sensor nodes", "IoT SQL Topic Rules with sub-second threshold alerts", "Automated event injection directly into EventBridge bus"] },
  { icon: <Activity size={24} />, color: "#7C3AED", title: "Distributed Tracing & Polly Audio", points: ["AWS X-Ray service dependency graph & execution waterfalls", "P50/P95 latency percentiles across microservice boundaries", "Amazon Polly neural text-to-speech dispatch voice radio", "Dual Indian English and US English dispatch personas"] },
  { icon: <Shield size={24} />, color: "#059669", title: "Security, Storage & Compliance", points: ["Amazon S3 production cloud hosting with cache invalidation", "IAM least-privilege execution roles scoped to resource ARNs", "CORS headers with operator ID audit logging", "Zero hardcoded credentials -- env-var injection only"] },
];

const STATS = [
  { label: "AWS Services Integrated", value: 16, suffix: "+", icon: <Cloud size={20} /> },
  { label: "API Endpoints", value: 18, suffix: "+", icon: <Globe size={20} /> },
  { label: "Backend Test Coverage", value: 59, suffix: " tests", icon: <CheckCircle2 size={20} /> },
  { label: "Lambda Cold Start (est.)", value: 180, suffix: "ms", icon: <Clock size={20} /> },
  { label: "DynamoDB OCC Success Rate", value: 100, suffix: "%", icon: <Lock size={20} /> },
  { label: "Incident Lifecycle Stages", value: 10, suffix: "", icon: <Workflow size={20} /> },
];

export default function DocumentationPage({ incidents = [] }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [expandedService, setExpandedService] = useState(null);

  const activeCount = incidents.filter(i => i.status !== "RESOLVED").length;
  const resolvedCount = incidents.filter(i => i.status === "RESOLVED").length;
  const criticalCount = incidents.filter(i => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "architecture", label: "Architecture" },
    { id: "services", label: "AWS Services" },
    { id: "operations", label: "Operations" },
    { id: "features", label: "Feature Pillars" },
    { id: "stats", label: "Live Stats" },
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(`doc-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="page-container doc-page">
      <div className="doc-sticky-nav">
        <div className="doc-sticky-inner">
          {sections.map(s => (
            <button key={s.id} className={`doc-nav-pill ${activeSection === s.id ? "active" : ""}`} onClick={() => scrollTo(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* HERO */}
      <div id="doc-overview" className="doc-hero-section">
        <div className="doc-hero-bg-grid" />
        <div className="doc-hero-content">
          <div className="bauhaus-badge" style={{ marginBottom: '16px' }}>
            <span className="bauhaus-orb" style={{ width: '12px', height: '12px' }}></span>
            <span>AWS SERVERLESS · PRODUCTION ARCHITECTURE SPEC · AP-SOUTH-2</span>
          </div>
          <h1 className="doc-hero-title">ResQFlow<span className="doc-hero-title-accent"> Engine</span></h1>
          <p className="doc-hero-subtitle">Intelligent Event-Driven Emergency Response & Resource Orchestration Platform</p>
          <p className="doc-hero-desc">ResQFlow is a production-grade, cloud-native emergency operations system built entirely on AWS serverless infrastructure. It delivers real-time incident triage, autonomous resource dispatch, geospatial situational awareness, and AI-powered advisory intelligence — all orchestrated through an event-driven microservices architecture deployed in AWS Asia Pacific (Hyderabad) region.</p>
          <div className="doc-hero-metrics">
            <div className="doc-metric-glass"><AlertTriangle size={16} color="#DC2626" /><div><span className="doc-metric-val" style={{ color: "#DC2626" }}>{incidents.length}</span><span className="doc-metric-label">Total Incidents</span></div></div>
            <div className="doc-metric-glass"><Activity size={16} color="#EA580C" /><div><span className="doc-metric-val" style={{ color: "#EA580C" }}>{activeCount}</span><span className="doc-metric-label">Active Now</span></div></div>
            <div className="doc-metric-glass"><CheckCircle2 size={16} color="#059669" /><div><span className="doc-metric-val" style={{ color: "#059669" }}>{resolvedCount}</span><span className="doc-metric-label">Resolved</span></div></div>
            <div className="doc-metric-glass"><Wifi size={16} color="#2563EB" /><div><span className="doc-metric-val" style={{ color: "#2563EB" }}>LIVE</span><span className="doc-metric-label">AWS ap-south-2</span></div></div>
          </div>
        </div>
      </div>

      {/* ARCHITECTURE */}
      <div id="doc-architecture" className="doc-section">
        <FadeIn>
          <div className="doc-section-header">
            <div className="doc-section-badge" style={{ background: "#FFF7ED", color: "#EA580C", borderColor: "#FDBA74" }}><Layers size={13} /> System Architecture</div>
            <h2 className="doc-section-title">Event-Driven Cloud Architecture</h2>
            <p className="doc-section-desc">ResQFlow uses a fully serverless, event-driven architecture where every incident triggers a cascade of asynchronous microservices — from intake to resolution.</p>
          </div>
        </FadeIn>
        <div className="doc-arch-flow">
          {ARCH_STEPS.map((step, i) => (
            <FadeIn key={step.n} delay={i * 80}>
              <div className="doc-arch-step">
                <div className="doc-arch-step-num" style={{ background: step.color + "15", color: step.color, border: `1.5px solid ${step.color}30` }}>{step.n}</div>
                <div className="doc-arch-icon-wrap" style={{ background: step.color + "12", color: step.color }}>{step.icon}</div>
                <div><div className="doc-arch-step-label">{step.label}</div><div className="doc-arch-step-detail">{step.detail}</div></div>
                {i < ARCH_STEPS.length - 1 && <div className="doc-arch-arrow"><ArrowRight size={14} color="#94A3B8" /></div>}
              </div>
            </FadeIn>
          ))}
        </div>
        <FadeIn delay={200}>
          <div className="doc-arch-diagram">
            <div className="doc-arch-diagram-header"><Terminal size={14} /><span>ResQFlow - Serverless Architecture - AWS ap-south-2 (Hyderabad)</span><span className="doc-arch-live-dot"><span className="status-dot-ping" />Live</span></div>
            <div className="doc-arch-diagram-body">
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">Presentation</div><div className="doc-arch-layer-nodes"><div className="doc-arch-node node-blue"><Globe size={16} /><span>React 18 SPA<br/><small>Amazon S3</small></span></div></div></div>
              <div className="doc-arch-connector"><ArrowRight size={16} color="#94A3B8" /></div>
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">Sensors & Vision</div><div className="doc-arch-layer-nodes" style={{ flexDirection: "column", gap: "6px" }}><div className="doc-arch-node node-teal" style={{ width: "140px" }}><Cpu size={14} /><span>AWS IoT Core<br/><small>MQTT mesh</small></span></div><div className="doc-arch-node node-purple" style={{ width: "140px" }}><Eye size={14} /><span>Rekognition<br/><small>Vision AI</small></span></div></div></div>
              <div className="doc-arch-connector"><ArrowRight size={16} color="#94A3B8" /></div>
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">API Layer</div><div className="doc-arch-layer-nodes"><div className="doc-arch-node node-orange"><Globe size={16} /><span>API Gateway<br/><small>REST v2 $default</small></span></div></div></div>
              <div className="doc-arch-connector"><ArrowRight size={16} color="#94A3B8" /></div>
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">Compute</div><div className="doc-arch-layer-nodes"><div className="doc-arch-node node-yellow"><Cpu size={16} /><span>Lambda<br/><small>Python 3.12</small></span></div></div></div>
              <div className="doc-arch-connector"><ArrowRight size={16} color="#94A3B8" /></div>
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">Data & Events</div><div className="doc-arch-layer-nodes" style={{ flexDirection: "column", gap: "6px" }}><div className="doc-arch-node node-purple" style={{ width: "140px" }}><Database size={14} /><span>DynamoDB<br/><small>OCC versioning</small></span></div><div className="doc-arch-node node-pink" style={{ width: "140px" }}><Zap size={14} /><span>EventBridge<br/><small>Custom bus</small></span></div></div></div>
              <div className="doc-arch-connector"><ArrowRight size={16} color="#94A3B8" /></div>
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">Orchestration & Geo</div><div className="doc-arch-layer-nodes" style={{ flexDirection: "column", gap: "6px" }}><div className="doc-arch-node node-red" style={{ width: "140px" }}><GitBranch size={14} /><span>Step Functions<br/><small>Workflow engine</small></span></div><div className="doc-arch-node node-blue" style={{ width: "140px" }}><Navigation size={14} /><span>Location Svc<br/><small>Roads & 500m GF</small></span></div></div></div>
              <div className="doc-arch-connector"><ArrowRight size={16} color="#94A3B8" /></div>
              <div className="doc-arch-layer"><div className="doc-arch-layer-label">Voice & Alerts</div><div className="doc-arch-layer-nodes" style={{ flexDirection: "column", gap: "6px" }}><div className="doc-arch-node node-orange" style={{ width: "140px" }}><Bell size={14} /><span>SNS Alerts<br/><small>Push broadcast</small></span></div><div className="doc-arch-node node-teal" style={{ width: "140px" }}><Radio size={14} /><span>Amazon Polly<br/><small>Neural radio</small></span></div></div></div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* AWS SERVICES */}
      <div id="doc-services" className="doc-section doc-section-alt">
        <FadeIn>
          <div className="doc-section-header">
            <div className="doc-section-badge" style={{ background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" }}><Cloud size={13} /> AWS Service Catalog</div>
            <h2 className="doc-section-title">16+ AWS Services in Production</h2>
            <p className="doc-section-desc">Each service is genuinely integrated — not just listed. Click any card to see exactly how it is used in the ResQFlow pipeline.</p>
          </div>
        </FadeIn>
        <div className="doc-services-grid">
          {AWS_SERVICES.map((svc, i) => (
            <FadeIn key={svc.name} delay={i * 50}>
              <div className={`doc-service-card ${expandedService === svc.name ? "expanded" : ""}`} onClick={() => setExpandedService(expandedService === svc.name ? null : svc.name)}>
                <div className="doc-service-card-top">
                  <div className="doc-service-icon" style={{ background: svc.color + "15", color: svc.color }}>{svc.icon}</div>
                  <div className="doc-service-info"><div className="doc-service-name">{svc.name}</div><span className={`doc-service-badge ${svc.badge === "LIVE" ? "badge-live" : svc.badge === "ACTIVE" ? "badge-active" : "badge-planned"}`}>{svc.badge}</span></div>
                  <ChevronDown size={14} color="#94A3B8" style={{ transition: "transform 0.2s", transform: expandedService === svc.name ? "rotate(180deg)" : "rotate(0)" }} />
                </div>
                {expandedService === svc.name && <div className="doc-service-desc">{svc.desc}</div>}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* OPERATIONS */}
      <div id="doc-operations" className="doc-section">
        <FadeIn>
          <div className="doc-section-header">
            <div className="doc-section-badge" style={{ background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" }}><Activity size={13} /> Operational Tasks</div>
            <h2 className="doc-section-title">What ResQFlow Does in Production</h2>
            <p className="doc-section-desc">End-to-end operational workflows from incident intake to multi-agency resolution.</p>
          </div>
        </FadeIn>
        <div className="doc-ops-grid">
          {[
            { icon: <AlertTriangle size={22} color="#DC2626" />, bg: "#FEF2F2", title: "Incident Intake & Triage", items: ["Operator submits emergency via intake form with GPS coordinates", "Lambda validates payload schema and type allowlist (FIRE/FLOOD/MEDICAL/ACCIDENT)", "Classifier assigns severity using rule-based deterministic engine", "DynamoDB write with attribute_not_exists idempotency guard", "EventBridge emits IncidentReported with correlation ID"] },
            { icon: <Eye size={22} color="#059669" />, bg: "#F0FDF4", title: "Computer Vision & Anti-Spoofing (Amazon Rekognition)", items: ["Deep label detection on citizen photo evidence and drone snapshots", "Identifies visible flames, smoke, submerged vehicles, and structural collapses", "Anti-spoofing verification compares citizen claims against detected visual tags", "Discrepancy detection routes suspicious uploads for supervisor review", "Visual severity scoring calibrates automated dispatch priority"] },
            { icon: <Navigation size={22} color="#2563EB" />, bg: "#EFF6FF", title: "Real Road Routing & 500m Geofencing (Amazon Location)", items: ["Turn-by-turn emergency navigation corridors across Greater Hyderabad", "Models 1.34x urban road curvature distance factor over straight-line Haversine", "Real-time traffic buffer calculation under emergency siren priority", "500-meter incident perimeter geofencing emitting automated GeofenceEnterEvent", "Instant GHMC municipal address reverse geocoding via PlaceIndex"] },
            { icon: <Cpu size={22} color="#0891B2" />, bg: "#ECFEFF", title: "Crisis Sensor Mesh & MQTT Telemetry (AWS IoT Core)", items: ["Ultrasonic river depth, toxic gas VOC, and seismic vibration sensor nodes", "Real-time MQTT telemetry streaming via ATS broker endpoint (a1859e76u3gqu4-ats)", "Device Shadow desired/reported state tracking for field responders", "IoT Topic Rules (SQL) evaluating thresholds in sub-100ms", "Automatic incident creation upon critical hazard threshold breach"] },
            { icon: <Radio size={22} color="#D97706" />, bg: "#FEF3C7", title: "Voice Dispatch Radio Broadcasts (Amazon Polly)", items: ["Neural and standard Indian English / US English voice dispatch audio", "Synthesizes tactical alert readouts (Kajal, Aditi, Matthew, Raveena)", "Automatic audio streaming directly through dispatch console UI", "Broadcasts assigned response unit, trauma hospital, and ETA in real time", "Zero audio file storage overhead via on-the-fly MP3 synthesis"] },
            { icon: <Activity size={22} color="#7C3AED" />, bg: "#F5F3FF", title: "Distributed Tracing & Service Graph (AWS X-Ray)", items: ["Full distributed tracing across API Gateway, Lambda, DynamoDB, EventBridge, Step Functions", "Service topology dependency graph mapping all 10 inter-service relationships", "P50 and P95 latency percentiles pinpointing execution microsecond bottlenecks", "Subsegment waterfall timeline breakdowns for every crisis transaction", "Active sampling rule with 5% sampling and 1 req/sec reservoir"] },
            { icon: <GitBranch size={22} color="#2563EB" />, bg: "#EFF6FF", title: "Step Functions Orchestration", items: ["NormalizeInput - validates and canonicalizes event envelope", "RouteBySeverity - Choice state branches to CRITICAL / STANDARD path", "AllocateResources - Proximity and road distance scoring for nearest units", "NotifyStakeholders - SNS publish to dispatcher & field unit topics", "UpdateLifecycle - DynamoDB PATCH with optimistic version lock"] },
            { icon: <Truck size={22} color="#EA580C" />, bg: "#FFF7ED", title: "Resource Dispatch & Fleet Management", items: ["Fleet of 4 response units with real-time availability tracking", "Trauma centers and hospitals with capacity status indicators", "Dispatch recommendation requires human operator approval gate", "Approve/reject via POST to /recommendations/{id}/approve", "All approvals logged to DynamoDB with operatorId for audit"] },
            { icon: <CheckCircle2 size={22} color="#059669" />, bg: "#F0FDF4", title: "Resolution & Audit Trail", items: ["Supervisor resolves incident via dashboard with resolution notes", "PATCH request with OCC version check prevents stale writes", "EventBridge emits IncidentResolved for 30-day audit store", "Analytics page updates automatically from live DynamoDB records", "CSV export available for after-action review and reporting"] },
          ].map((card, i) => (
            <FadeIn key={card.title} delay={i * 80}>
              <div className="doc-ops-card">
                <div className="doc-ops-icon" style={{ background: card.bg }}>{card.icon}</div>
                <h3 className="doc-ops-title">{card.title}</h3>
                <ul className="doc-ops-list">{card.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* FEATURE PILLARS */}
      <div id="doc-features" className="doc-section doc-section-alt">
        <FadeIn>
          <div className="doc-section-header">
            <div className="doc-section-badge" style={{ background: "#F5F3FF", color: "#6D28D9", borderColor: "#DDD6FE" }}><Package size={13} /> Feature Pillars</div>
            <h2 className="doc-section-title">Six Core Capability Pillars</h2>
          </div>
        </FadeIn>
        <div className="doc-pillars-grid">
          {PILLARS.map((p, i) => (
            <FadeIn key={p.title} delay={i * 70}>
              <div className="doc-pillar-card">
                <div className="doc-pillar-icon" style={{ background: p.color + "12", color: p.color }}>{p.icon}</div>
                <h3 className="doc-pillar-title">{p.title}</h3>
                <ul className="doc-pillar-list">{p.points.map((pt, j) => <li key={j}><ChevronRight size={12} color={p.color} style={{ flexShrink: 0 }} />{pt}</li>)}</ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* LIVE STATS */}
      <div id="doc-stats" className="doc-section">
        <FadeIn>
          <div className="doc-section-header">
            <div className="doc-section-badge" style={{ background: "#FEF2F2", color: "#991B1B", borderColor: "#FCA5A5" }}><TrendingUp size={13} /> Platform Metrics</div>
            <h2 className="doc-section-title">By the Numbers</h2>
          </div>
        </FadeIn>
        <div className="doc-stats-grid">
          {STATS.map((s, i) => (
            <FadeIn key={s.label} delay={i * 60}>
              <div className="doc-stat-card"><div className="doc-stat-icon">{s.icon}</div><div className="doc-stat-value"><AnimatedCounter target={s.value} suffix={s.suffix} /></div><div className="doc-stat-label">{s.label}</div></div>
            </FadeIn>
          ))}
        </div>
        {incidents.length > 0 && (
          <FadeIn delay={200}>
            <div className="doc-live-analytics">
              <div className="doc-live-analytics-header"><Activity size={15} color="#2563EB" /><span>Live Analytics from DynamoDB - {incidents.length} Records</span><span className="doc-arch-live-dot"><span className="status-dot-ping" />Real-time</span></div>
              <div className="doc-live-bars">
                {[
                  { label: "CRITICAL", count: incidents.filter(i => i.severity === "CRITICAL").length, color: "#DC2626" },
                  { label: "HIGH", count: incidents.filter(i => i.severity === "HIGH").length, color: "#EA580C" },
                  { label: "MEDIUM", count: incidents.filter(i => i.severity === "MEDIUM").length, color: "#CA8A04" },
                  { label: "LOW", count: incidents.filter(i => i.severity === "LOW").length, color: "#059669" },
                  { label: "RESOLVED", count: resolvedCount, color: "#64748B" },
                ].map(bar => {
                  const pct = incidents.length > 0 ? (bar.count / incidents.length) * 100 : 0;
                  return (
                    <div key={bar.label} className="doc-live-bar-row">
                      <span className="doc-live-bar-label">{bar.label}</span>
                      <div className="doc-live-bar-track"><div className="doc-live-bar-fill" style={{ width: `${pct}%`, background: bar.color, transition: "width 1.2s ease" }} /></div>
                      <span className="doc-live-bar-count">{bar.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        )}
        <FadeIn delay={300}>
          <div className="doc-tech-stack">
            <div className="doc-tech-stack-title">Technology Stack</div>
            <div className="doc-tech-tags">
              {["React 18", "Vite 5", "Leaflet.js", "Lucide Icons", "Python 3.11", "Boto3", "AWS SAM", "AWS Lambda", "DynamoDB", "EventBridge", "Step Functions", "SNS", "API Gateway", "Amazon Bedrock", "CloudWatch", "IAM", "Pytest"].map(t => (
                <span key={t} className="doc-tech-tag">{t}</span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
