import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Eye,
  Navigation,
  Truck,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  X,
  Clock,
  Compass,
  FileText,
  Sliders,
  Bell,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// --- DATA DEFINITIONS ---

const PLATFORM_STATS = [
  { label: 'AWS Production Services', value: '16', suffix: '+', desc: 'Zero mock services in production' },
  { label: 'Crisis Ingest-to-Dispatch SLA', value: '< 450', suffix: 'ms', desc: 'Sub-second autonomous response' },
  { label: 'Incident Lifecycle Stages', value: '10', suffix: ' Stages', desc: 'End-to-end event choreography' },
  { label: 'Passing Unit & E2E Tests', value: '59', suffix: '/59', desc: '100% test suite pass rate' },
  { label: 'Dual-Region Cloud Mesh', value: '2', suffix: ' Regions', desc: 'ap-south-2 + ap-south-1' }
];

const REAL_WORLD_PROBLEMS = [
  {
    id: 'golden-hour',
    title: 'The "Golden Hour" Delay',
    badge: 'TRAUMA CRITICAL',
    badgeBg: '#FEF2F2',
    badgeColor: '#DC2626',
    traditional: 'Emergency dispatch in congested metros takes 18–35 minutes due to manual call taking, verbal address verification, and outdated CAD queues. Crucial resuscitation and stabilization windows are lost in transit.',
    resqflow: 'ResQFlow eliminates manual triage bottlenecks entirely, executing deterministic AI categorization and automated route calculations in <450ms, getting first responders rolling within seconds.',
    metric: '92% Reduction in Dispatch Latency'
  },
  {
    id: 'siloed-agencies',
    title: 'Fragmented Multi-Agency Silos',
    badge: 'COORDINATION',
    badgeBg: '#FFF7ED',
    badgeColor: '#EA580C',
    traditional: 'Police, Fire & Rescue, EMS, Municipal Drainage (GHMC), and Level-1 Trauma Hospitals operate on isolated radio frequencies and siloed legacy systems with zero shared situational awareness.',
    resqflow: 'Centralized Amazon EventBridge custom event bus and Step Functions state machine publish synchronized incident telemetry across all municipal agency channels simultaneously.',
    metric: 'Unified Situational Picture in Real Time'
  },
  {
    id: 'dispatcher-overload',
    title: 'Dispatcher Cognitive Overload',
    badge: 'HUMAN FACTORS',
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
    traditional: 'During catastrophic urban flash floods or major commercial fires, 911/112 centers receive hundreds of simultaneous calls per minute, leading to human error, misclassification, and delayed dispatches.',
    resqflow: 'Autonomous deterministic engine and Amazon Bedrock advisory copilot prioritize incidents instantaneously by casualty threat and infrastructure risk, presenting pre-computed dispatch recommendations.',
    metric: 'Zero Triage Queues During Surge'
  },
  {
    id: 'spoofing-fraud',
    title: 'Hoax Calls & Unverified Reports',
    badge: 'INTEGRITY',
    badgeBg: '#F0FDF4',
    badgeColor: '#059669',
    traditional: 'Over 25% of municipal emergency reports are false alarms, pranks, or exaggerated claims, diverting scarce heavy rescue engines and advanced life support ambulances away from real victims.',
    resqflow: 'Amazon Rekognition computer vision verifies citizen photo/video evidence against reported hazard categories. Discrepancies trigger automated supervisor review flags before resource allocation.',
    metric: 'Automated Anti-Spoofing Verification'
  },
  {
    id: 'euclidean-routing',
    title: 'Straight-Line Distance Failures',
    badge: 'GEOSPATIAL',
    badgeBg: '#EFF6FF',
    badgeColor: '#2563EB',
    traditional: 'Legacy CAD systems use straight-line Euclidean/Haversine radius for nearest unit assignment, ignoring urban road curvature (1.34x factor), flyover bottlenecks, and flooded low-lying causeways.',
    resqflow: 'Amazon Location Service calculates turn-by-turn road routes across Greater Hyderabad with siren priority buffers and 500m geofence perimeters that emit automated on-scene arrival events.',
    metric: 'Real Road Curvature + 500m Geofencing'
  },
  {
    id: 'reactive-lag',
    title: 'Delayed Ambient Hazard Awareness',
    badge: 'IOT SENSORS',
    badgeBg: '#F5F3FF',
    badgeColor: '#7C3AED',
    traditional: 'Municipalities only react after citizens notice rising water or smell toxic fumes and dial emergency numbers. Flash floods and chemical leaks frequently escalate for hours before first alert.',
    resqflow: 'AWS IoT Core sensor mesh streams river water depth, toxic VOC gas, and seismic sensors in real time via ATS MQTT brokers. Pre-set SQL topic rules trigger automated crisis incidents within 100ms of threshold breach.',
    metric: 'Sub-100ms Sensor Breach Auto-Triage'
  }
];

const KEY_FEATURES = [
  {
    icon: <Eye size={22} color="#059669" />,
    title: 'Computer Vision & Anti-Spoofing',
    service: 'Amazon Rekognition',
    tag: 'VISION AI',
    color: '#059669',
    desc: 'Deep multi-label detection on citizen photos and drone surveillance. Detects active flames, structural smoke, submerged vehicles, and structural collapses while verifying citizen claims against detected visual labels.'
  },
  {
    icon: <Navigation size={22} color="#2563EB" />,
    title: 'Road Routing & 500m Geofencing',
    service: 'Amazon Location Service',
    tag: 'GEOSPATIAL',
    color: '#2563EB',
    desc: 'Turn-by-turn emergency navigation corridors across Greater Hyderabad with 1.34x urban curvature factor, siren-priority traffic buffers, reverse geocoding, and automated 500-meter incident perimeter geofencing.'
  },
  {
    icon: <Cpu size={22} color="#0891B2" />,
    title: 'Crisis Sensor Mesh & MQTT Telemetry',
    service: 'AWS IoT Core',
    tag: 'TELEMETRY',
    color: '#0891B2',
    desc: 'Ultrasonic river depth, toxic gas VOC, and seismic vibration sensor nodes streaming via ATS broker endpoint (a1859e76u3gqu4-ats). Device Shadow desired/reported states and sub-100ms SQL topic rules.'
  },
  {
    icon: <Radio size={22} color="#D97706" />,
    title: 'Neural Tactical Radio Broadcasts',
    service: 'Amazon Polly',
    tag: 'VOICE SYNTH',
    color: '#D97706',
    desc: 'Automated voice dispatch audio readouts synthesized in real time (Kajal, Aditi, Matthew, Raveena) streaming directly to field responders and command consoles for hands-free tactical situational awareness.'
  },
  {
    icon: <Activity size={22} color="#7C3AED" />,
    title: 'Distributed Microsecond Tracing',
    service: 'AWS X-Ray',
    tag: 'OBSERVABILITY',
    color: '#7C3AED',
    desc: 'Full distributed tracing across API Gateway, Lambda, DynamoDB, EventBridge, and Step Functions. Service dependency graph mapping all 10 inter-service relationships with subsegment waterfall breakdowns.'
  },
  {
    icon: <Database size={22} color="#0D0D0D" />,
    title: 'ACID Optimistic Concurrency Control',
    service: 'Amazon DynamoDB',
    tag: 'OCC STATE',
    color: '#0D0D0D',
    desc: 'Zero-loss state persistence with atomic version locking (attribute_not_exists and version = :current). Eliminates race conditions during simultaneous multi-operator status updates and dispatch transitions.'
  },
  {
    icon: <GitBranch size={22} color="#E8590C" />,
    title: 'Express Workflow Orchestration',
    service: 'AWS Step Functions',
    tag: 'STATE MACHINE',
    color: '#E8590C',
    desc: 'Express DAG workflows executing input canonicalization, severity branching, multi-criteria resource allocation, trauma center hospital capacity checks, and automated notification publish cascades.'
  },
  {
    icon: <Bot size={22} color="#4338CA" />,
    title: 'Generative Emergency Advisory Copilot',
    service: 'Amazon Bedrock',
    tag: 'GEN AI',
    color: '#4338CA',
    desc: 'Claude-powered tactical advisor evaluating hazardous chemical reactions, evacuation containment corridors, specialized equipment requirements, and automated multi-lingual incident situation reports.'
  }
];

const REALISTIC_IMAGES = [
  {
    id: 'command-center',
    src: '/images/command-center-ops.jpg',
    title: 'Municipal Incident Command Theatre',
    subtitle: 'Greater Hyderabad Metropolitan Disaster Management Operations Room',
    caption: 'Real-time multi-agency coordination center during critical disaster alert. The curved video wall presents live GIS incident heatmaps, automated resource routing corridors, and sensor mesh streams.',
    services: ['Amazon Location Service', 'Amazon CloudWatch', 'AWS IoT Core', 'Amazon DynamoDB'],
    stats: '16+ Active Municipal Channels · <450ms Refresh'
  },
  {
    id: 'flood-response',
    src: '/images/urban-flood-response.jpg',
    title: 'Monsoon Inundation Search & Rescue',
    subtitle: 'Musi River Causeway & Inundated Urban Sector Operations',
    caption: 'Amphibious rescue boats and disaster relief teams deploying in urban flood zones. Incident triggered autonomously within 85ms of ultrasonic IoT depth sensor breaching critical 4.2m flood stage.',
    services: ['AWS IoT Core', 'Amazon Rekognition', 'AWS Step Functions', 'Amazon SNS'],
    stats: 'Triggered by Ultrasonic IoT Depth Gauge (4.38m breach)'
  },
  {
    id: 'emergency-corridor',
    src: '/images/emergency-road-corridor.jpg',
    title: 'Active Priority Road Corridor & Geofencing',
    subtitle: 'Amazon Location Service Turn-by-Turn Siren Transit Corridor',
    caption: 'Ambulance and heavy rescue apparatus navigating urban traffic corridors. Amazon Location Service calculates real road curvature (1.34x factor) and triggers automated 500m geofence arrival events.',
    services: ['Amazon Location Service', 'Amazon EventBridge', 'Amazon DynamoDB', 'AWS X-Ray'],
    stats: '1.34x Urban Curvature Factor · 500m Perimeter Enter Event'
  },
  {
    id: 'tactical-dispatch',
    src: '/images/field-tactical-dispatch.jpg',
    title: 'Tactical Field Operations Unit',
    subtitle: 'Ruggedized Mobile Command Terminal & Voice Radio Dispatch',
    caption: 'Field incident commander receiving instant Amazon Polly audio readouts and live incident coordinates on a tactical tablet terminal, eliminating reliance on verbal radio channel congestion.',
    services: ['Amazon Polly', 'Amazon SNS', 'API Gateway v2', 'AWS IAM'],
    stats: 'Bilingual Neural Voice Dispatch · Zero File Storage Overhead'
  }
];

const LIFECYCLE_STAGES = [
  {
    step: '01',
    name: 'Crisis Genesis',
    trigger: 'Citizen 911 / IoT Breach',
    tech: 'Mobile Web / MQTT Gateway',
    desc: 'Citizen submits emergency with GPS coordinates and photo evidence via PWA, or an AWS IoT Core sensor node detects hazardous river flood stage (>4.0m) or toxic gas breach (>120 ppm).',
    action: 'Payload created with timestamp, GPS lat/lng, and sensor/citizen metadata.',
    sla: '< 15ms Network Ingest'
  },
  {
    step: '02',
    name: 'Multimodal Evidence',
    trigger: 'Photo / Video Capture',
    tech: 'Client Camera / Drone Feed',
    desc: 'Citizen captures real-world crisis photo or drone streams live video frame. Image payload is converted to base64 or stored temporarily in S3 for instant computer vision processing.',
    action: 'Image encoded with EXIF coordinates and anti-tamper hash check.',
    sla: '< 50ms Client Serialization'
  },
  {
    step: '03',
    name: 'Vision AI & Anti-Spoofing',
    trigger: 'Amazon Rekognition',
    tech: 'Rekognition DetectLabels API',
    desc: 'Amazon Rekognition analyzes visual evidence, detecting fire, smoke, water inundation, and structural collapses. Compares visual tags against user claim; flag anti-spoofing discrepancies.',
    action: 'Visual severity score (0.0 - 1.0) and discrepancy rating added to event envelope.',
    sla: '< 180ms Vision Analysis'
  },
  {
    step: '04',
    name: 'Edge Ingestion & Validation',
    trigger: 'API Gateway HTTP v2',
    tech: 'AWS Lambda (Python 3.12)',
    desc: 'API Gateway validates CORS headers and rate limits (50 RPS). Routes to IngestionFunction Lambda, which validates payload schema, mandatory fields, and GPS coordinate bounds.',
    action: 'Generates immutable incidentId (INC-YYYYMMDD-XXXX) and correlationId.',
    sla: '< 35ms Lambda Execution'
  },
  {
    step: '05',
    name: 'Deterministic Triage & OCC Lock',
    trigger: 'Rule Engine + DynamoDB',
    tech: 'Amazon DynamoDB Pay-per-Request',
    desc: 'Rule-based deterministic classifier assigns severity (CRITICAL / HIGH / MEDIUM / LOW). Writes to DynamoDB with attribute_not_exists(incidentId) condition for idempotent guarantee.',
    action: 'Atomically creates record with status: REPORTED, version: 1.',
    sla: '< 18ms DynamoDB Write'
  },
  {
    step: '06',
    name: 'Custom Event Fan-Out',
    trigger: 'Amazon EventBridge',
    tech: 'EventBridge Custom Bus',
    desc: 'Lambda publishes IncidentReported.v1 to resqflow-event-bus. EventBridge evaluates rule patterns, fanning out asynchronously to Step Functions, audit logs, and notification queues.',
    action: 'Emits structured event envelope with AWS trace header context.',
    sla: '< 25ms Event Routing'
  },
  {
    step: '07',
    name: 'Workflow Orchestration',
    trigger: 'AWS Step Functions',
    tech: 'Express Workflow DAG',
    desc: 'Step Functions state machine validates event envelope, branches on severity, queries nearest fleet resources and hospital capacities, and computes dispatch allocations.',
    action: 'Evaluates nearest available units with hospital bed availability locks.',
    sla: '< 95ms Orchestration Pass'
  },
  {
    step: '08',
    name: 'Road Corridors & Geofencing',
    trigger: 'Amazon Location Service',
    tech: 'CalculateRoute & Geofence APIs',
    desc: 'Calculates real road travel routes across Greater Hyderabad road network. Establishes a 500-meter incident perimeter geofence that emits GeofenceEnterEvent upon responder arrival.',
    action: 'Generates turn-by-turn route coordinates, ETA buffer, and geofence boundary.',
    sla: '< 120ms Routing & Geofence'
  },
  {
    step: '09',
    name: 'Field Dispatch & Polly Radio',
    trigger: 'Amazon SNS + Amazon Polly',
    tech: 'Neural TTS & Push Broadcast',
    desc: 'SNS broadcasts emergency SMS/push to responder units. Amazon Polly synthesizes tactical alert voice audio (Kajal/Aditi/Matthew) streamed live to field tablets for hands-free dispatch.',
    action: 'Responders acknowledge dispatch; status updates to EN_ROUTE.',
    sla: '< 140ms Voice Synthesis'
  },
  {
    step: '10',
    name: 'Resolution, Tracing & Audit',
    trigger: 'AWS X-Ray + DynamoDB OCC',
    tech: 'X-Ray Traces & EventBridge Archive',
    desc: 'Field team arrives (ON_SCENE) and resolves crisis (RESOLVED). DynamoDB OCC validates version lock. AWS X-Ray stores end-to-end trace with microsecond latency breakdown for after-action review.',
    action: 'EventBridge emits IncidentResolved.v1 to 30-day compliance archive.',
    sla: '< 20ms Terminal State Lock'
  }
];

// --- MAIN COMPONENT ---

export default function PlatformOverviewPage({ incidents = [], onOpenReportModal }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('diagram-system');
  const [activeImage, setActiveImage] = useState(null);
  const [activeLifecycleIndex, setActiveLifecycleIndex] = useState(0);
  const [isPlayingLifecycle, setIsPlayingLifecycle] = useState(false);
  const [selectedArchNode, setSelectedArchNode] = useState('api-gw');
  const [problemFilter, setProblemFilter] = useState('all');

  // Automated lifecycle tour timer
  useEffect(() => {
    let timer = null;
    if (isPlayingLifecycle) {
      timer = setInterval(() => {
        setActiveLifecycleIndex(prev => (prev + 1) % LIFECYCLE_STAGES.length);
      }, 3200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingLifecycle]);

  const activeStage = LIFECYCLE_STAGES[activeLifecycleIndex];

  // Architectural nodes for Interactive Diagram
  const ARCH_NODES = {
    'api-gw': {
      title: 'Amazon API Gateway (HTTP API v2)',
      region: 'ap-south-2 (Hyderabad)',
      role: 'Edge Ingestion & Rate Throttling',
      protocol: 'HTTPS / TLS 1.3 / REST',
      detail: 'Serves as the front door for all mobile PWA, dispatcher console, and emergency API calls. Handles CORS preflight, JWT auth validation, and 50 RPS token bucket throttling.',
      upstream: ['Citizen PWA', 'IoT Webhook', 'Dispatcher CAD'],
      downstream: ['ResQFlow-IngestionFunction (Lambda)']
    },
    'lambda-ingest': {
      title: 'AWS Lambda (Python 3.12 / ARM64)',
      region: 'ap-south-2 (Hyderabad)',
      role: 'Deterministic Triage & Business Logic',
      protocol: 'Microservice Compute',
      detail: 'Executes sub-200ms algorithmic classification, schema validation, optimistic concurrency control version checks, and payload canonicalization.',
      upstream: ['Amazon API Gateway'],
      downstream: ['Amazon DynamoDB', 'Amazon EventBridge', 'Amazon Rekognition', 'Amazon Location Service']
    },
    'dynamodb': {
      title: 'Amazon DynamoDB (Pay-per-Request)',
      region: 'ap-south-2 (Hyderabad)',
      role: 'ACID State Machine with OCC Locking',
      protocol: 'boto3 / DynamoDB API',
      detail: 'Stores all incident records with atomic version numbers. Condition expressions (attribute_not_exists and version = :v) guarantee zero lost updates during simultaneous multi-operator transitions.',
      upstream: ['AWS Lambda', 'AWS Step Functions'],
      downstream: ['CloudWatch Audit Store', 'X-Ray Traces']
    },
    'eventbridge': {
      title: 'Amazon EventBridge (Custom Bus)',
      region: 'ap-south-2 (Hyderabad)',
      role: 'Event Broker & Asynchronous Choreography',
      protocol: 'EventBridge PutEvents API',
      detail: 'Custom bus (resqflow-event-bus) decodes and distributes typed event envelopes (IncidentReported.v1, GeofenceEnterEvent, TacticalRadioBroadcast, IncidentResolved.v1) to downstream consumers without tight coupling.',
      upstream: ['AWS Lambda'],
      downstream: ['AWS Step Functions', 'Amazon SNS Topics', 'CloudWatch Logs']
    },
    'step-functions': {
      title: 'AWS Step Functions (Express)',
      region: 'ap-south-2 (Hyderabad)',
      role: 'Multi-Agency Workflow Orchestration',
      protocol: 'Express State Machine',
      detail: 'Deterministic DAG workflow orchestrating resource allocation, road distance scoring, trauma center hospital availability checks, and dispatcher approval gates.',
      upstream: ['Amazon EventBridge'],
      downstream: ['Amazon DynamoDB', 'Amazon SNS', 'Amazon Location Service']
    },
    'rekognition': {
      title: 'Amazon Rekognition (Computer Vision)',
      region: 'ap-south-1 (Mumbai)',
      role: 'Visual Evidence Analysis & Anti-Spoofing',
      protocol: 'boto3 / Rekognition API',
      detail: 'Deep neural network label detection on photos and drone surveillance feeds. Detects fire, flood, vehicle wrecks, and structural damage, and computes anti-spoofing discrepancy scores.',
      upstream: ['AWS Lambda'],
      downstream: ['AWS Lambda (Severity Calibration)']
    },
    'location-service': {
      title: 'Amazon Location Service',
      region: 'ap-south-1 (Mumbai)',
      role: 'Real Road Corridors & 500m Geofencing',
      protocol: 'boto3 / Location Service API',
      detail: 'Turn-by-turn routing across Greater Hyderabad road network factoring 1.34x urban curvature and emergency siren priority. Manages 500-meter incident perimeter geofences for automatic on-scene arrival detection.',
      upstream: ['AWS Lambda', 'AWS Step Functions'],
      downstream: ['Amazon EventBridge (GeofenceEnterEvent)']
    },
    'iot-core': {
      title: 'AWS IoT Core (MQTT Broker)',
      region: 'ap-south-1 (Mumbai)',
      role: 'Crisis Sensor Mesh & Telemetry Rules',
      protocol: 'MQTT / TLS / Device Shadows',
      detail: 'Collects sub-second telemetry from ultrasonic river depth gauges, toxic VOC air sensors, and seismic nodes. Evaluates SQL topic rules and triggers automated incidents within 100ms of critical hazard breach.',
      upstream: ['IoT Sensor Nodes', 'Drone Beacons'],
      downstream: ['AWS Lambda (Auto-Triage)', 'IoT Device Shadows']
    },
    'polly': {
      title: 'Amazon Polly (Neural Voice)',
      region: 'ap-south-1 (Mumbai)',
      role: 'Automated Tactical Radio Broadcasts',
      protocol: 'boto3 / Polly SynthesizeSpeech',
      detail: 'Synthesizes neural Indian English (Kajal, Aditi, Raveena) and US English (Matthew) tactical voice dispatch audio streamed directly to responder consoles for hands-free situational awareness.',
      upstream: ['AWS Lambda', 'Amazon SNS'],
      downstream: ['Field Mobile Consoles', 'Dispatch Radio Audio']
    },
    'xray': {
      title: 'AWS X-Ray (Distributed Tracing)',
      region: 'ap-south-1 (Mumbai)',
      role: 'Microsecond Distributed Tracing',
      protocol: 'AWS X-Ray SDK / Active Tracing',
      detail: 'Provides end-to-end distributed tracing across all 10 inter-service relationships. Visualizes service dependency graphs, p50/p95 latency bottlenecks, and subsegment execution waterfalls.',
      upstream: ['API Gateway', 'Lambda', 'DynamoDB', 'EventBridge', 'Step Functions'],
      downstream: ['Operations Console Service Graph']
    },
    'bedrock': {
      title: 'Amazon Bedrock (Claude 3)',
      region: 'ap-south-1 (Mumbai)',
      role: 'Generative AI Emergency Copilot',
      protocol: 'boto3 / Bedrock Runtime',
      detail: 'Large language model tactical advisor generating HAZMAT containment procedures, evacuation perimeter recommendations, and automated bilingual incident situation reports.',
      upstream: ['AWS Lambda', 'Operator Console'],
      downstream: ['Field Tactical Tablets', 'Command Dispatcher']
    }
  };

  const selectedNodeData = ARCH_NODES[selectedArchNode] || ARCH_NODES['api-gw'];

  return (
    <div className="platform-overview-viewport">
      {/* Top Banner & Quick Navigation Bar */}
      <div className="overview-subnav-strip">
        <div className="overview-subnav-inner">
          <div className="overview-subnav-brand">
            <div className="sidebar-logo-icon" style={{ width: '26px', height: '26px' }}>
              <Flame size={15} />
            </div>
            <div>
              <span className="overview-brand-title">ResQFlow System Blueprint</span>
              <span className="overview-brand-badge mono">AUTONOMOUS DISASTER ARCHITECTURE</span>
            </div>
          </div>

          <div className="overview-subnav-links">
            <a href="#section-mission" className="overview-subnav-link">Mission & What It Is</a>
            <a href="#section-problems" className="overview-subnav-link">Real-World Problem</a>
            <a href="#section-capabilities" className="overview-subnav-link">Key Capabilities</a>
            <a href="#section-imagery" className="overview-subnav-link">Field Imagery</a>
            <a href="#section-lifecycle" className="overview-subnav-link">10-Stage Lifecycle</a>
            <a href="#section-diagrams" className="overview-subnav-link">Interactive Architecture</a>
          </div>

          <div className="overview-subnav-actions">
            <button 
              className="btn-atlas-secondary"
              onClick={() => onOpenReportModal && onOpenReportModal()}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <AlertTriangle size={13} color="#DC2626" />
              <span>Simulate Incident</span>
            </button>
            <button 
              className="btn-atlas-primary"
              onClick={() => navigate('/dashboard')}
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              <span>Launch Theatre</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="overview-content-container">

        {/* ========================================================================= */}
        {/* SECTION 1: WHAT RESQFLOW IS (EXECUTIVE & ARCHITECTURAL SUMMARY) */}
        {/* ========================================================================= */}
        <section id="section-mission" className="overview-hero-section">
          <div className="overview-badge-row">
            <div className="bauhaus-badge">
              <span className="bauhaus-orb"></span>
              <span>EXECUTIVE ARCHITECTURE SPECIFICATION · v2.4</span>
            </div>
            <div className="overview-pill mono">
              <span className="status-dot-ping"></span>
              <span>16 AWS SERVICES ACTIVE · DUAL REGION ap-south-2 / ap-south-1 · SLA &lt;450ms</span>
            </div>
          </div>

          <h1 className="overview-display-title">
            AUTONOMOUS CRISIS<br />
            <span className="title-highlight">INTELLIGENCE</span> & RESPONSE ENGINE
          </h1>

          <p className="overview-hero-lead">
            <strong>ResQFlow</strong> is a mission-critical, enterprise-grade autonomous crisis orchestration engine designed for municipal emergency services, state disaster response authorities (NDRF/SDMA), fire & rescue brigades, and regional trauma networks.
          </p>

          <p className="overview-hero-sublead">
            Natively operating across AWS <strong>ap-south-2</strong> (Hyderabad Core) and <strong>ap-south-1</strong> (Mumbai Mesh), ResQFlow fuses computer vision verification, real-time IoT sensor telemetry, mathematical road curvature routing, 500m geofenced perimeter entry alerts, and neural voice radio broadcasts into a deterministic, sub-450ms incident lifecycle. It eliminates manual triage bottlenecks and multi-agency silos to protect human life when seconds dictate survival.
          </p>

          {/* Quick Metrics Bar */}
          <div className="overview-stats-grid">
            {PLATFORM_STATS.map((s, idx) => (
              <div key={idx} className="overview-stat-card">
                <div className="overview-stat-value mono">{s.value}<span>{s.suffix}</span></div>
                <div className="overview-stat-label">{s.label}</div>
                <div className="overview-stat-desc mono">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Architectural Pillars Pill Bar */}
          <div className="overview-callouts-grid">
            <div className="overview-callout-card">
              <div className="callout-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}><Zap size={18} /></div>
              <div className="callout-title">Instant Deterministic Triage</div>
              <div className="callout-body">Rule-based scoring executed in Python Lambda replaces human dispatch delay during high-volume crisis surges.</div>
            </div>
            <div className="overview-callout-card">
              <div className="callout-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><Navigation size={18} /></div>
              <div className="callout-title">Real Road Corridors & Geofencing</div>
              <div className="callout-body">Calculates true road transit taking into account 1.34x urban curvature and triggers automated 500m geofence events.</div>
            </div>
            <div className="overview-callout-card">
              <div className="callout-icon" style={{ background: '#F0FDF4', color: '#059669' }}><Eye size={18} /></div>
              <div className="callout-title">Computer Vision Anti-Spoofing</div>
              <div className="callout-body">Amazon Rekognition validates citizen photo/video evidence to detect fraudulent alarms and calibrate visual severity.</div>
            </div>
            <div className="overview-callout-card">
              <div className="callout-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}><Lock size={18} /></div>
              <div className="callout-title">Zero-Loss OCC State Machine</div>
              <div className="callout-body">DynamoDB optimistic concurrency locking prevents race conditions and stale writes during concurrent multi-operator updates.</div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: THE REAL-WORLD PROBLEM */}
        {/* ========================================================================= */}
        <section id="section-problems" className="overview-section">
          <div className="section-header-block">
            <div className="doc-section-badge" style={{ background: '#FEF2F2', color: '#991B1B', borderColor: '#FCA5A5' }}>
              <AlertTriangle size={13} /> The Real-World Crisis
            </div>
            <h2 className="section-display-title">Why Legacy Emergency Systems Fail</h2>
            <p className="section-display-desc">
              When catastrophic monsoon floods, multi-alarm commercial blazes, or mass-casualty transit collisions strike modern metropolitan centers, existing 911/112 architectures fracture under stress.
            </p>
          </div>

          <div className="problems-grid">
            {REAL_WORLD_PROBLEMS.map((prob) => (
              <div key={prob.id} className="problem-card">
                <div className="problem-card-header">
                  <span className="problem-badge mono" style={{ background: prob.badgeBg, color: prob.badgeColor }}>
                    {prob.badge}
                  </span>
                  <span className="problem-metric mono">{prob.metric}</span>
                </div>
                <h3 className="problem-title">{prob.title}</h3>
                
                <div className="problem-comparison-box">
                  <div className="comparison-side traditional">
                    <div className="comparison-label">Legacy CAD / Traditional Dispatch</div>
                    <p>{prob.traditional}</p>
                  </div>
                  <div className="comparison-arrow">→</div>
                  <div className="comparison-side resqflow">
                    <div className="comparison-label">ResQFlow Autonomous Solution</div>
                    <p>{prob.resqflow}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: KEY SYSTEM FEATURES & CAPABILITIES */}
        {/* ========================================================================= */}
        <section id="section-capabilities" className="overview-section overview-section-alt">
          <div className="section-header-block">
            <div className="doc-section-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
              <Cpu size={13} /> Integrated Capabilities
            </div>
            <h2 className="section-display-title">Enterprise Feature Matrix</h2>
            <p className="section-display-desc">
              ResQFlow unites 16 native AWS cloud services into an integrated operational engine. Every feature is backed by production code and active test coverage.
            </p>
          </div>

          <div className="features-grid">
            {KEY_FEATURES.map((feat, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-card-top">
                  <div className="feature-icon" style={{ borderColor: `${feat.color}40`, background: `${feat.color}10` }}>
                    {feat.icon}
                  </div>
                  <div className="feature-tags">
                    <span className="feature-service-tag mono">{feat.service}</span>
                    <span className="feature-category-pill mono" style={{ color: feat.color, borderColor: `${feat.color}30` }}>{feat.tag}</span>
                  </div>
                </div>
                <h3 className="feature-title">{feat.title}</h3>
                <p className="feature-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: REALISTIC PROJECT IMAGES SHOWCASE */}
        {/* ========================================================================= */}
        <section id="section-imagery" className="overview-section">
          <div className="section-header-block">
            <div className="doc-section-badge" style={{ background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }}>
              <Eye size={13} /> Visual Platform Showcase
            </div>
            <h2 className="section-display-title">ResQFlow in Real-World Operations</h2>
            <p className="section-display-desc">
              High-fidelity visual representations of ResQFlow coordinating municipal crisis management across Greater Hyderabad — from emergency operations command to urban flood search & rescue.
            </p>
          </div>

          <div className="gallery-grid">
            {REALISTIC_IMAGES.map((img) => (
              <div 
                key={img.id} 
                className="gallery-card"
                onClick={() => setActiveImage(img)}
              >
                <div className="gallery-image-wrap">
                  <img src={img.src} alt={img.title} loading="lazy" />
                  <div className="gallery-overlay">
                    <div className="gallery-zoom-button">
                      <Maximize2 size={16} />
                      <span>Inspect Detail</span>
                    </div>
                  </div>
                </div>
                <div className="gallery-card-body">
                  <div className="gallery-card-subtitle mono">{img.subtitle}</div>
                  <h3 className="gallery-card-title">{img.title}</h3>
                  <p className="gallery-card-caption">{img.caption}</p>
                  
                  <div className="gallery-card-footer">
                    <div className="gallery-services-row">
                      {img.services.map((svc, i) => (
                        <span key={i} className="gallery-svc-tag mono">{svc}</span>
                      ))}
                    </div>
                    <div className="gallery-stats-pill mono">{img.stats}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Lightbox Modal */}
          {activeImage && (
            <div className="image-lightbox-backdrop" onClick={() => setActiveImage(null)}>
              <div className="image-lightbox-modal" onClick={e => e.stopPropagation()}>
                <button className="lightbox-close-btn" onClick={() => setActiveImage(null)}>
                  <X size={20} />
                </button>
                <div className="lightbox-image-container">
                  <img src={activeImage.src} alt={activeImage.title} />
                </div>
                <div className="lightbox-info-pane">
                  <div className="mono" style={{ fontSize: '11px', color: '#E8590C', fontWeight: 800, textTransform: 'uppercase' }}>
                    {activeImage.subtitle}
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 12px 0', color: '#0D0D0D' }}>
                    {activeImage.title}
                  </h2>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#525049', marginBottom: '16px' }}>
                    {activeImage.caption}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {activeImage.services.map((svc, i) => (
                      <span key={i} className="gallery-svc-tag mono" style={{ fontSize: '11px', background: '#F5F4EE' }}>
                        {svc}
                      </span>
                    ))}
                  </div>
                  <div className="mono" style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
                    Operational Context: {activeImage.stats}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: END-TO-END INCIDENT LIFECYCLE (INTERACTIVE 10 STAGES) */}
        {/* ========================================================================= */}
        <section id="section-lifecycle" className="overview-section overview-section-alt">
          <div className="section-header-block">
            <div className="doc-section-badge" style={{ background: '#FFF7ED', color: '#EA580C', borderColor: '#FDBA74' }}>
              <GitBranch size={13} /> Event Choreography
            </div>
            <h2 className="section-display-title">10-Stage Autonomous Crisis Lifecycle</h2>
            <p className="section-display-desc">
              Follow an incident through its entire lifecycle — from initial citizen reporting or ambient IoT sensor breach to automated multi-agency dispatch and immutable audit resolution.
            </p>
          </div>

          {/* Interactive Controller Bar */}
          <div className="lifecycle-controller-bar">
            <div className="controller-left">
              <button 
                className={`btn-lifecycle-control ${isPlayingLifecycle ? 'active' : ''}`}
                onClick={() => setIsPlayingLifecycle(!isPlayingLifecycle)}
              >
                {isPlayingLifecycle ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlayingLifecycle ? 'Pause Autoplay' : 'Autoplay Lifecycle'}</span>
              </button>

              <button 
                className="btn-lifecycle-control"
                onClick={() => { setActiveLifecycleIndex(0); setIsPlayingLifecycle(false); }}
              >
                <RotateCcw size={14} />
                <span>Reset to Stage 1</span>
              </button>
            </div>

            <div className="controller-right mono">
              <span>CURRENT STAGE:</span>
              <strong>{activeStage.step} / 10 · {activeStage.name.toUpperCase()}</strong>
              <span className="sla-badge mono">{activeStage.sla}</span>
            </div>
          </div>

          {/* 10-Stage Horizontal Stepper */}
          <div className="lifecycle-stepper-rail">
            {LIFECYCLE_STAGES.map((st, idx) => {
              const isSelected = activeLifecycleIndex === idx;
              const isPast = activeLifecycleIndex > idx;
              return (
                <div 
                  key={st.step}
                  className={`lifecycle-step-node ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                  onClick={() => { setActiveLifecycleIndex(idx); setIsPlayingLifecycle(false); }}
                >
                  <div className="step-node-number mono">{st.step}</div>
                  <div className="step-node-label">{st.name}</div>
                  <div className="step-node-sub mono">{st.tech}</div>
                  {isSelected && <div className="step-node-indicator" />}
                </div>
              );
            })}
          </div>

          {/* Active Stage Detailed Inspection Card */}
          <div className="lifecycle-detail-panel">
            <div className="detail-panel-left">
              <div className="detail-stage-badge mono">
                STAGE {activeStage.step} OF 10 · RESQFLOW EVENT PIPELINE
              </div>
              <h3 className="detail-stage-title">{activeStage.name}</h3>
              
              <div className="detail-meta-row">
                <div className="meta-item">
                  <span className="meta-label mono">TRIGGER EVENT</span>
                  <span className="meta-val mono">{activeStage.trigger}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label mono">AWS CLOUD COMPONENT</span>
                  <span className="meta-val mono" style={{ color: '#2563EB' }}>{activeStage.tech}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label mono">LATENCY / SLA</span>
                  <span className="meta-val mono" style={{ color: '#059669' }}>{activeStage.sla}</span>
                </div>
              </div>

              <div className="detail-narrative">
                <h4 className="detail-narrative-heading">Operational Action</h4>
                <p>{activeStage.desc}</p>
                <div className="detail-action-callout mono">
                  <strong>SYSTEM MUTATION:</strong> {activeStage.action}
                </div>
              </div>
            </div>

            <div className="detail-panel-right">
              <div className="detail-terminal-shell">
                <div className="detail-terminal-header">
                  <div className="terminal-dots">
                    <span className="t-dot red" /><span className="t-dot yellow" /><span className="t-dot green" />
                  </div>
                  <span className="terminal-title mono">EVENT ENVELOPE · STAGE-{activeStage.step}.json</span>
                  <span className="mono" style={{ fontSize: '10px', color: '#059669' }}>OCC: SYNC</span>
                </div>
                <pre className="detail-terminal-pre mono">
{`{
  "specversion": "1.0",
  "id": "evt-stage-${activeStage.step}-8912f9",
  "source": "resqflow.${activeStage.tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}",
  "type": "ResQFlow.${activeStage.name.replace(/\\s+/g, '')}.v1",
  "time": "${new Date().toISOString()}",
  "region": "ap-south-2",
  "detail": {
    "incidentId": "INC-20261002-8419",
    "stage": "${activeStage.step}",
    "stageName": "${activeStage.name}",
    "triggerSource": "${activeStage.trigger}",
    "executionLatency": "${activeStage.sla}",
    "systemStatus": "PASSING_NOMINAL"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: INTERACTIVE SYSTEM / AWS / EVENT-DRIVEN DIAGRAMS */}
        {/* ========================================================================= */}
        <section id="section-diagrams" className="overview-section">
          <div className="section-header-block">
            <div className="doc-section-badge" style={{ background: '#F5F3FF', color: '#6D28D9', borderColor: '#DDD6FE' }}>
              <Layers size={13} /> Interactive Architecture Blueprint
            </div>
            <h2 className="section-display-title">System & Cloud Topology Explorer</h2>
            <p className="section-display-desc">
              Explore ResQFlow through 3 interactive architectural lenses: the end-to-end component flow, the dual-region AWS cloud topology, and the event choreography state machine.
            </p>
          </div>

          {/* Diagram Tab Navigation */}
          <div className="diagram-tab-row">
            <button 
              className={`diagram-tab-btn ${activeTab === 'diagram-system' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagram-system')}
            >
              <Layers size={15} />
              <span>1. System & Component Flow</span>
            </button>
            <button 
              className={`diagram-tab-btn ${activeTab === 'diagram-topology' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagram-topology')}
            >
              <Globe size={15} />
              <span>2. AWS Dual-Region Cloud Topology</span>
            </button>
            <button 
              className={`diagram-tab-btn ${activeTab === 'diagram-events' ? 'active' : ''}`}
              onClick={() => setActiveTab('diagram-events')}
            >
              <Zap size={15} />
              <span>3. EventBridge & State Machine</span>
            </button>
          </div>

          {/* TAB 1: SYSTEM & COMPONENT FLOW */}
          {activeTab === 'diagram-system' && (
            <div className="diagram-view-box">
              <div className="diagram-instruction-banner">
                <span className="mono">INTERACTIVE NODE INSPECTOR: Click any system node below to inspect its protocols, connections, and cloud configuration.</span>
              </div>

              <div className="system-diagram-grid">
                {/* Layer 1: Ingestion */}
                <div className="diagram-layer-column">
                  <div className="layer-header mono">01 · INGESTION & SENSORS</div>
                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'api-gw' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('api-gw')}
                  >
                    <div className="node-card-top">
                      <Globe size={16} color="#E8590C" />
                      <span className="node-card-service mono">API Gateway v2</span>
                    </div>
                    <div className="node-card-name">HTTP Edge Entry</div>
                    <div className="node-card-desc">REST / CORS / 50 RPS Throttling</div>
                  </div>

                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'iot-core' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('iot-core')}
                  >
                    <div className="node-card-top">
                      <Cpu size={16} color="#0891B2" />
                      <span className="node-card-service mono">AWS IoT Core</span>
                    </div>
                    <div className="node-card-name">Crisis Sensor Mesh</div>
                    <div className="node-card-desc">MQTT ATS / Sub-100ms SQL Rules</div>
                  </div>
                </div>

                <div className="diagram-flow-arrow">→</div>

                {/* Layer 2: Compute & AI */}
                <div className="diagram-layer-column">
                  <div className="layer-header mono">02 · COMPUTE & AI</div>
                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'lambda-ingest' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('lambda-ingest')}
                  >
                    <div className="node-card-top">
                      <Zap size={16} color="#E8590C" />
                      <span className="node-card-service mono">AWS Lambda</span>
                    </div>
                    <div className="node-card-name">IngestionFunction</div>
                    <div className="node-card-desc">Deterministic Triage Engine</div>
                  </div>

                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'rekognition' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('rekognition')}
                  >
                    <div className="node-card-top">
                      <Eye size={16} color="#059669" />
                      <span className="node-card-service mono">Rekognition</span>
                    </div>
                    <div className="node-card-name">Vision AI Evidence</div>
                    <div className="node-card-desc">Anti-Spoofing & Deep Labels</div>
                  </div>

                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'bedrock' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('bedrock')}
                  >
                    <div className="node-card-top">
                      <Bot size={16} color="#4338CA" />
                      <span className="node-card-service mono">Amazon Bedrock</span>
                    </div>
                    <div className="node-card-name">GenAI Advisor</div>
                    <div className="node-card-desc">Claude-3 HAZMAT & Sitreps</div>
                  </div>
                </div>

                <div className="diagram-flow-arrow">→</div>

                {/* Layer 3: Persistence & Event Bus */}
                <div className="diagram-layer-column">
                  <div className="layer-header mono">03 · STATE & BUS</div>
                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'dynamodb' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('dynamodb')}
                  >
                    <div className="node-card-top">
                      <Database size={16} color="#0D0D0D" />
                      <span className="node-card-service mono">Amazon DynamoDB</span>
                    </div>
                    <div className="node-card-name">ResQFlow-Incidents</div>
                    <div className="node-card-desc">ACID State & OCC Version Lock</div>
                  </div>

                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'eventbridge' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('eventbridge')}
                  >
                    <div className="node-card-top">
                      <Sparkles size={16} color="#FF007A" />
                      <span className="node-card-service mono">EventBridge</span>
                    </div>
                    <div className="node-card-name">resqflow-event-bus</div>
                    <div className="node-card-desc">Custom Event Fan-Out Bus</div>
                  </div>
                </div>

                <div className="diagram-flow-arrow">→</div>

                {/* Layer 4: Orchestration & Geospatial */}
                <div className="diagram-layer-column">
                  <div className="layer-header mono">04 · DISPATCH & ROUTE</div>
                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'step-functions' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('step-functions')}
                  >
                    <div className="node-card-top">
                      <GitBranch size={16} color="#2563EB" />
                      <span className="node-card-service mono">Step Functions</span>
                    </div>
                    <div className="node-card-name">Crisis Orchestrator</div>
                    <div className="node-card-desc">Express DAG Multi-Agency Gate</div>
                  </div>

                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'location-service' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('location-service')}
                  >
                    <div className="node-card-top">
                      <Navigation size={16} color="#2563EB" />
                      <span className="node-card-service mono">Location Service</span>
                    </div>
                    <div className="node-card-name">Routing & Geofence</div>
                    <div className="node-card-desc">1.34x Curvature & 500m Perimeter</div>
                  </div>
                </div>

                <div className="diagram-flow-arrow">→</div>

                {/* Layer 5: Field Alerting & Observability */}
                <div className="diagram-layer-column">
                  <div className="layer-header mono">05 · FIELD ALERT & TRACE</div>
                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'polly' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('polly')}
                  >
                    <div className="node-card-top">
                      <Radio size={16} color="#D97706" />
                      <span className="node-card-service mono">Amazon Polly</span>
                    </div>
                    <div className="node-card-name">Neural Radio TTS</div>
                    <div className="node-card-desc">Bilingual Tactical Audio</div>
                  </div>

                  <div 
                    className={`diagram-node-card ${selectedArchNode === 'xray' ? 'active' : ''}`}
                    onClick={() => setSelectedArchNode('xray')}
                  >
                    <div className="node-card-top">
                      <Activity size={16} color="#7C3AED" />
                      <span className="node-card-service mono">AWS X-Ray</span>
                    </div>
                    <div className="node-card-name">Distributed Tracing</div>
                    <div className="node-card-desc">Full Microsecond Waterfall</div>
                  </div>
                </div>
              </div>

              {/* Node Inspector Drawer */}
              <div className="node-inspector-drawer">
                <div className="inspector-header">
                  <div className="inspector-title-row">
                    <span className="inspector-title">{selectedNodeData.title}</span>
                    <span className="inspector-region mono">{selectedNodeData.region}</span>
                    <span className="inspector-protocol mono">{selectedNodeData.protocol}</span>
                  </div>
                  <div className="inspector-role">{selectedNodeData.role}</div>
                </div>

                <div className="inspector-body">
                  <p className="inspector-detail-text">{selectedNodeData.detail}</p>
                  
                  <div className="inspector-links-row">
                    <div className="inspector-link-group">
                      <span className="inspector-group-label mono">UPSTREAM CALLERS:</span>
                      <div className="inspector-tag-list">
                        {selectedNodeData.upstream.map((u, i) => (
                          <span key={i} className="inspector-tag mono">{u}</span>
                        ))}
                      </div>
                    </div>

                    <div className="inspector-link-group">
                      <span className="inspector-group-label mono">DOWNSTREAM TARGETS:</span>
                      <div className="inspector-tag-list">
                        {selectedNodeData.downstream.map((d, i) => (
                          <span key={i} className="inspector-tag downstream mono">{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AWS DUAL-REGION CLOUD TOPOLOGY */}
          {activeTab === 'diagram-topology' && (
            <div className="diagram-view-box">
              <div className="topology-dual-container">
                {/* Region 1: Hyderabad */}
                <div className="region-box primary-region">
                  <div className="region-badge-bar">
                    <div className="region-name-box">
                      <span className="region-indicator-dot green" />
                      <span className="region-name mono">AWS ap-south-2 (Hyderabad)</span>
                    </div>
                    <span className="region-role-pill mono">PRIMARY CORE DATA & COMPUTE</span>
                  </div>

                  <p className="region-desc">
                    Ultra-low latency serverless infrastructure hosting the primary ingestion gate, ACID state storage, event distribution, and workflow orchestration.
                  </p>

                  <div className="region-services-grid">
                    <div className="reg-svc-item">
                      <strong>Amazon API Gateway v2</strong>
                      <span>HTTP API · CORS · Rate limit 50 RPS</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>AWS Lambda (Python 3.12)</strong>
                      <span>IngestionFunction · ARM64 · Deterministic</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon DynamoDB</strong>
                      <span>ResQFlow-Incidents · Pay-per-Request · OCC</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon EventBridge</strong>
                      <span>resqflow-event-bus · Custom Fan-Out</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>AWS Step Functions</strong>
                      <span>ResQFlow-Orchestrator · Express Workflows</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon S3 Static Website</strong>
                      <span>resqflow-app-621962614200 · Public Web Hosting</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon CloudWatch</strong>
                      <span>Structured Logs · Metrics · Alarms</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>AWS IAM</strong>
                      <span>Least Privilege Roles & Policies</span>
                    </div>
                  </div>
                </div>

                {/* Cross-Region Backbone Interconnect */}
                <div className="topology-backbone-pipe">
                  <div className="backbone-line">
                    <div className="backbone-pulse" />
                  </div>
                  <div className="backbone-text mono">
                    AWS GLOBAL BACKBONE · &lt;14ms LATENCY · TLS 1.3
                  </div>
                </div>

                {/* Region 2: Mumbai */}
                <div className="region-box secondary-region">
                  <div className="region-badge-bar">
                    <div className="region-name-box">
                      <span className="region-indicator-dot blue" />
                      <span className="region-name mono">AWS ap-south-1 (Mumbai)</span>
                    </div>
                    <span className="region-role-pill mono" style={{ borderColor: '#2563EB', color: '#2563EB', background: '#EFF6FF' }}>
                      MEDIA, AI & SPECIALTY REGIONAL MESH
                    </span>
                  </div>

                  <p className="region-desc">
                    Specialized managed AWS AI, IoT, and Geospatial engines accessible through high-speed internal AWS backbone peering with automatic IAM authentication.
                  </p>

                  <div className="region-services-grid">
                    <div className="reg-svc-item">
                      <strong>Amazon Rekognition</strong>
                      <span>Computer Vision · Anti-Spoofing Tagging</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon Location Service</strong>
                      <span>Road Routing · 500m Geofencing · PlaceIndex</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>AWS IoT Core</strong>
                      <span>MQTT ATS Broker · Sensor Mesh Rules</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon Polly</strong>
                      <span>Neural Voice Dispatch Radio (Kajal/Aditi)</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>AWS X-Ray</strong>
                      <span>Distributed Tracing & Service Graph</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon Bedrock</strong>
                      <span>Claude-3 Generative Advisory Copilot</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon SNS</strong>
                      <span>Emergency Broadcast & Push Topics</span>
                    </div>
                    <div className="reg-svc-item">
                      <strong>Amazon SQS</strong>
                      <span>Dead Letter Queue (DLQ) & Resilience</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVENT-DRIVEN CHOREOGRAPHY & STATE MACHINE */}
          {activeTab === 'diagram-events' && (
            <div className="diagram-view-box">
              <div className="events-choreography-grid">
                <div className="events-column">
                  <div className="layer-header mono">EVENTBRIDGE EVENT TAXONOMY</div>
                  
                  <div className="event-contract-card">
                    <div className="contract-header">
                      <span className="contract-type mono" style={{ color: '#DC2626' }}>IncidentReported.v1</span>
                      <span className="contract-bus mono">resqflow-event-bus</span>
                    </div>
                    <p className="contract-desc">Emitted when an incident is triaged and atomically written to DynamoDB.</p>
                    <pre className="contract-json mono">
{`{
  "source": "resqflow.ingest",
  "detail-type": "IncidentReported.v1",
  "detail": {
    "incidentId": "INC-20261002-8419",
    "severity": "CRITICAL",
    "type": "FIRE",
    "coordinates": { "lat": 17.4399, "lng": 78.4983 },
    "peopleAffected": 12,
    "version": 1
  }
}`}
                    </pre>
                  </div>

                  <div className="event-contract-card">
                    <div className="contract-header">
                      <span className="contract-type mono" style={{ color: '#2563EB' }}>GeofenceEnterEvent</span>
                      <span className="contract-bus mono">resqflow-event-bus</span>
                    </div>
                    <p className="contract-desc">Emitted by Amazon Location Service when response unit breaches 500m radius.</p>
                    <pre className="contract-json mono">
{`{
  "source": "aws.geo",
  "detail-type": "Location Geofence Event",
  "detail": {
    "EventType": "ENTER",
    "GeofenceId": "GEOFENCE_INC_8419_500M",
    "DeviceId": "FIRE-ENGINE-01",
    "SampleTime": "${new Date().toISOString()}"
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="events-column">
                  <div className="layer-header mono">STEP FUNCTIONS STATE MACHINE (EXPRESS DAG)</div>
                  
                  <div className="step-functions-flow">
                    <div className="sfn-node start">
                      <span className="mono">START</span>
                    </div>
                    <div className="sfn-arrow">↓</div>
                    <div className="sfn-node task">
                      <strong>NormalizeInput</strong>
                      <span className="mono">Validates envelope & timestamp</span>
                    </div>
                    <div className="sfn-arrow">↓</div>
                    <div className="sfn-node choice">
                      <strong>RouteBySeverity</strong>
                      <span className="mono">CRITICAL vs STANDARD</span>
                    </div>
                    <div className="sfn-arrow">↓</div>
                    <div className="sfn-node task">
                      <strong>AllocateResources</strong>
                      <span className="mono">Proximity & Hospital capacity gate</span>
                    </div>
                    <div className="sfn-arrow">↓</div>
                    <div className="sfn-node task">
                      <strong>NotifyStakeholders</strong>
                      <span className="mono">SNS Publish & Polly voice dispatch</span>
                    </div>
                    <div className="sfn-arrow">↓</div>
                    <div className="sfn-node end">
                      <span className="mono">UPDATE LIFECYCLE (DISPATCHED)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* BOTTOM CTA: PLATFORM EXPLORATION */}
        {/* ========================================================================= */}
        <section className="overview-cta-strip">
          <div className="cta-left">
            <h3 className="cta-title">Ready to Experience ResQFlow Live?</h3>
            <p className="cta-text">
              Launch the Operations Theatre to monitor active incidents, test Amazon Rekognition computer vision, or listen to Amazon Polly voice radio dispatch.
            </p>
          </div>
          <div className="cta-right">
            <button 
              className="btn-atlas-secondary"
              onClick={() => navigate('/documentation')}
              style={{ padding: '9px 18px', fontSize: '13px' }}
            >
              <FileText size={15} />
              <span>Full Architecture Docs</span>
            </button>
            <button 
              className="btn-atlas-primary"
              onClick={() => navigate('/dashboard')}
              style={{ padding: '9px 20px', fontSize: '13px' }}
            >
              <span>Launch Operations Theatre</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

      </div>

      {/* Embedded Styles for PlatformOverviewPage */}
      <style>{`
        .platform-overview-viewport {
          background-color: var(--bg-cream, #F5F4EE);
          min-height: 100vh;
          color: #0D0D0D;
          font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }

        .overview-subnav-strip {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(245, 244, 238, 0.94);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-sheet, #E2DFD2);
          padding: 10px 24px;
        }

        .overview-subnav-inner {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .overview-subnav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .overview-brand-title {
          font-family: var(--font-display, inherit);
          font-weight: 800;
          font-size: 13px;
          letter-spacing: -0.02em;
          color: #0D0D0D;
        }

        .overview-brand-badge {
          display: block;
          font-size: 9px;
          color: #7E7C72;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .overview-subnav-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .overview-subnav-link {
          font-size: 12px;
          font-weight: 600;
          color: #525049;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .overview-subnav-link:hover {
          color: #0D0D0D;
          background: #EAE8DE;
        }

        .overview-subnav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .overview-content-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px 24px 80px 24px;
        }

        /* Hero */
        .overview-hero-section {
          padding: 32px 0 48px 0;
          border-bottom: 1px solid var(--border-sheet, #E2DFD2);
        }

        .overview-badge-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .overview-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 100px;
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          font-size: 11px;
          font-weight: 700;
          color: #525049;
        }

        .overview-display-title {
          font-family: var(--font-display, inherit);
          font-size: clamp(2.2rem, 3.8vw, 3.8rem);
          font-weight: 850;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: #0D0D0D;
          margin-bottom: 20px;
          text-transform: uppercase;
        }

        .title-highlight {
          color: #E8590C;
          text-decoration: underline;
          text-decoration-thickness: 4px;
          text-underline-offset: 6px;
        }

        .overview-hero-lead {
          font-size: 19px;
          line-height: 1.45;
          color: #1A1A1A;
          max-width: 980px;
          margin-bottom: 14px;
        }

        .overview-hero-sublead {
          font-size: 15px;
          line-height: 1.6;
          color: #525049;
          max-width: 960px;
          margin-bottom: 32px;
        }

        /* Stats Grid */
        .overview-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .overview-stat-card {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 8px;
          padding: 18px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .overview-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #0D0D0D;
        }

        .overview-stat-value {
          font-size: 28px;
          font-weight: 850;
          color: #0D0D0D;
          letter-spacing: -0.03em;
        }

        .overview-stat-value span {
          font-size: 18px;
          font-weight: 600;
          color: #E8590C;
        }

        .overview-stat-label {
          font-size: 13px;
          font-weight: 700;
          color: #1A1A1A;
          margin-top: 4px;
        }

        .overview-stat-desc {
          font-size: 11px;
          color: #7E7C72;
          margin-top: 2px;
        }

        /* Callouts Grid */
        .overview-callouts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .overview-callout-card {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 8px;
          padding: 18px;
        }

        .callout-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .callout-title {
          font-size: 14px;
          font-weight: 750;
          color: #0D0D0D;
          margin-bottom: 6px;
        }

        .callout-body {
          font-size: 12px;
          line-height: 1.5;
          color: #525049;
        }

        /* Generic Section */
        .overview-section {
          padding: 56px 0;
          border-bottom: 1px solid var(--border-sheet, #E2DFD2);
        }

        .overview-section-alt {
          background: #EFECE3;
          margin: 0 -24px;
          padding: 56px 24px;
          border-top: 1px solid var(--border-sheet, #E2DFD2);
        }

        .section-header-block {
          margin-bottom: 32px;
        }

        .section-display-title {
          font-family: var(--font-display, inherit);
          font-size: clamp(1.8rem, 2.8vw, 2.6rem);
          font-weight: 850;
          letter-spacing: -0.04em;
          color: #0D0D0D;
          margin: 8px 0 10px 0;
        }

        .section-display-desc {
          font-size: 15px;
          line-height: 1.55;
          color: #525049;
          max-width: 820px;
        }

        /* Problems Grid */
        .problems-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 20px;
        }

        .problem-card {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 8px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .problem-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .problem-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .problem-metric {
          font-size: 11px;
          font-weight: 700;
          color: #059669;
        }

        .problem-title {
          font-size: 17px;
          font-weight: 800;
          color: #0D0D0D;
          letter-spacing: -0.02em;
        }

        .problem-comparison-box {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 12px;
          align-items: stretch;
          background: #FAF9F5;
          border: 1px solid #ECE8DC;
          border-radius: 6px;
          padding: 12px;
          margin-top: 4px;
        }

        .comparison-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9B988D;
          font-weight: 800;
          font-size: 16px;
        }

        .comparison-side {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .comparison-label {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .comparison-side.traditional .comparison-label {
          color: #DC2626;
        }

        .comparison-side.resqflow .comparison-label {
          color: #059669;
        }

        .comparison-side p {
          font-size: 11.5px;
          line-height: 1.45;
          color: #525049;
          margin: 0;
        }

        /* Features Matrix */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 18px;
        }

        .feature-card {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 8px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.06);
          border-color: #0D0D0D;
        }

        .feature-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-tags {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .feature-service-tag {
          font-size: 10.5px;
          font-weight: 800;
          color: #0D0D0D;
        }

        .feature-category-pill {
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid transparent;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 800;
          color: #0D0D0D;
          letter-spacing: -0.02em;
        }

        .feature-desc {
          font-size: 12.5px;
          line-height: 1.5;
          color: #525049;
          margin: 0;
        }

        /* Gallery Grid */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
          gap: 24px;
        }

        .gallery-card {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .gallery-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          border-color: #0D0D0D;
        }

        .gallery-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #0D0D0D;
          overflow: hidden;
        }

        .gallery-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .gallery-card:hover .gallery-image-wrap img {
          transform: scale(1.02);
        }

        .gallery-overlay {
          position: absolute;
          inset: 0;
          background: rgba(13, 13, 13, 0.4);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
        }

        .gallery-card:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-zoom-button {
          background: #FFFFFF;
          color: #0D0D0D;
          padding: 8px 16px;
          border-radius: 100px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .gallery-card-body {
          padding: 20px;
        }

        .gallery-card-subtitle {
          font-size: 10.5px;
          font-weight: 800;
          color: #E8590C;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .gallery-card-title {
          font-size: 18px;
          font-weight: 850;
          color: #0D0D0D;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .gallery-card-caption {
          font-size: 13px;
          line-height: 1.5;
          color: #525049;
          margin-bottom: 16px;
        }

        .gallery-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid #ECE8DC;
        }

        .gallery-services-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .gallery-svc-tag {
          font-size: 10px;
          font-weight: 750;
          background: #F5F4EE;
          border: 1px solid #DCD8CD;
          padding: 2px 7px;
          border-radius: 3px;
          color: #0D0D0D;
        }

        .gallery-stats-pill {
          font-size: 10.5px;
          color: #059669;
          font-weight: 750;
        }

        /* Lightbox */
        .image-lightbox-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(13, 13, 13, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .image-lightbox-modal {
          background: #FFFFFF;
          border-radius: 12px;
          max-width: 1050px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .lightbox-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          background: rgba(13, 13, 13, 0.7);
          color: #FFFFFF;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .lightbox-image-container {
          width: 100%;
          background: #000;
          max-height: 580px;
          overflow: hidden;
        }

        .lightbox-image-container img {
          width: 100%;
          max-height: 580px;
          object-fit: contain;
          display: block;
        }

        .lightbox-info-pane {
          padding: 24px;
        }

        /* Lifecycle Controller */
        .lifecycle-controller-bar {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 8px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .controller-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-lifecycle-control {
          background: #FAF9F5;
          border: 1px solid #DCD8CD;
          border-radius: 5px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #0D0D0D;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-lifecycle-control:hover {
          background: #0D0D0D;
          color: #FFFFFF;
          border-color: #0D0D0D;
        }

        .btn-lifecycle-control.active {
          background: #E8590C;
          color: #FFFFFF;
          border-color: #E8590C;
        }

        .controller-right {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }

        .sla-badge {
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 800;
        }

        /* Stepper Rail */
        .lifecycle-stepper-rail {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .lifecycle-step-node {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 6px;
          padding: 12px 10px;
          cursor: pointer;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: all 0.15s ease;
          min-width: 100px;
        }

        .lifecycle-step-node:hover {
          border-color: #0D0D0D;
        }

        .lifecycle-step-node.selected {
          border-color: #E8590C;
          background: #FFF7ED;
          box-shadow: 0 0 0 2px rgba(232, 89, 12, 0.2);
        }

        .lifecycle-step-node.past {
          border-color: #059669;
          background: #F0FDF4;
        }

        .step-node-number {
          font-size: 10px;
          font-weight: 850;
          color: #7E7C72;
        }

        .lifecycle-step-node.selected .step-node-number {
          color: #E8590C;
        }

        .step-node-label {
          font-size: 11.5px;
          font-weight: 750;
          color: #0D0D0D;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .step-node-sub {
          font-size: 9px;
          color: #7E7C72;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .step-node-indicator {
          position: absolute;
          bottom: -1px;
          left: 10%;
          right: 10%;
          height: 3px;
          background: #E8590C;
          border-radius: 2px 2px 0 0;
        }

        /* Detail Panel */
        .lifecycle-detail-panel {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 10px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          padding: 24px;
        }

        @media (max-width: 900px) {
          .lifecycle-detail-panel {
            grid-template-columns: 1fr;
          }
        }

        .detail-stage-badge {
          font-size: 10.5px;
          font-weight: 800;
          color: #E8590C;
          margin-bottom: 6px;
        }

        .detail-stage-title {
          font-size: 24px;
          font-weight: 850;
          letter-spacing: -0.02em;
          color: #0D0D0D;
          margin-bottom: 16px;
        }

        .detail-meta-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-label {
          font-size: 9.5px;
          color: #7E7C72;
          font-weight: 800;
        }

        .meta-val {
          font-size: 12px;
          font-weight: 750;
          color: #0D0D0D;
        }

        .detail-narrative {
          font-size: 13.5px;
          line-height: 1.55;
          color: #525049;
        }

        .detail-narrative-heading {
          font-size: 14px;
          font-weight: 800;
          color: #0D0D0D;
          margin-bottom: 6px;
        }

        .detail-action-callout {
          margin-top: 14px;
          background: #FAF9F5;
          border-left: 3px solid #E8590C;
          padding: 10px 14px;
          font-size: 11.5px;
          color: #1A1A1A;
        }

        .detail-terminal-shell {
          background: #0D0D0D;
          border-radius: 8px;
          overflow: hidden;
          height: 100%;
          min-height: 280px;
          display: flex;
          flex-direction: column;
        }

        .detail-terminal-header {
          background: #1A1A1A;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #2A2A2A;
        }

        .terminal-dots {
          display: flex;
          gap: 6px;
        }

        .t-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .t-dot.red { background: #EF4444; }
        .t-dot.yellow { background: #F59E0B; }
        .t-dot.green { background: #10B981; }

        .terminal-title {
          font-size: 11px;
          color: #D1D5DB;
          font-weight: 700;
        }

        .detail-terminal-pre {
          padding: 16px;
          margin: 0;
          color: #38BDF8;
          font-size: 11.5px;
          line-height: 1.45;
          overflow-x: auto;
          flex: 1;
        }

        /* Diagrams Tabs */
        .diagram-tab-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .diagram-tab-btn {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 6px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 750;
          color: #525049;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .diagram-tab-btn:hover {
          color: #0D0D0D;
          border-color: #0D0D0D;
        }

        .diagram-tab-btn.active {
          background: #0D0D0D;
          color: #FFFFFF;
          border-color: #0D0D0D;
        }

        .diagram-view-box {
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 10px;
          padding: 24px;
        }

        .diagram-instruction-banner {
          background: #FAF9F5;
          border: 1px solid #ECE8DC;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 11.5px;
          color: #525049;
          margin-bottom: 24px;
        }

        /* System Diagram Grid */
        .system-diagram-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr auto 1fr;
          gap: 12px;
          align-items: center;
          overflow-x: auto;
          padding-bottom: 16px;
        }

        .diagram-layer-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 170px;
        }

        .layer-header {
          font-size: 9.5px;
          font-weight: 850;
          color: #7E7C72;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #ECE8DC;
          padding-bottom: 4px;
        }

        .diagram-node-card {
          background: #FAF9F5;
          border: 1px solid #DCD8CD;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .diagram-node-card:hover {
          border-color: #0D0D0D;
          background: #FFFFFF;
        }

        .diagram-node-card.active {
          border-color: #E8590C;
          background: #FFF7ED;
          box-shadow: 0 0 0 2px rgba(232, 89, 12, 0.25);
        }

        .node-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .node-card-service {
          font-size: 9.5px;
          font-weight: 800;
          color: #7E7C72;
        }

        .node-card-name {
          font-size: 12px;
          font-weight: 800;
          color: #0D0D0D;
        }

        .node-card-desc {
          font-size: 10px;
          color: #525049;
          margin-top: 2px;
        }

        .diagram-flow-arrow {
          color: #9B988D;
          font-weight: 800;
          font-size: 18px;
        }

        /* Node Inspector Drawer */
        .node-inspector-drawer {
          margin-top: 24px;
          background: #FAF9F5;
          border: 1px solid #DCD8CD;
          border-radius: 8px;
          padding: 20px;
        }

        .inspector-header {
          border-bottom: 1px solid #ECE8DC;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }

        .inspector-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .inspector-title {
          font-size: 18px;
          font-weight: 850;
          color: #0D0D0D;
        }

        .inspector-region {
          font-size: 11px;
          font-weight: 750;
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
          padding: 2px 8px;
          border-radius: 3px;
        }

        .inspector-protocol {
          font-size: 11px;
          font-weight: 750;
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #BFDBFE;
          padding: 2px 8px;
          border-radius: 3px;
        }

        .inspector-role {
          font-size: 13px;
          font-weight: 700;
          color: #E8590C;
        }

        .inspector-detail-text {
          font-size: 13.5px;
          line-height: 1.55;
          color: #525049;
          margin-bottom: 16px;
        }

        .inspector-links-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 700px) {
          .inspector-links-row {
            grid-template-columns: 1fr;
          }
        }

        .inspector-group-label {
          font-size: 10px;
          color: #7E7C72;
          font-weight: 800;
          margin-bottom: 6px;
          display: block;
        }

        .inspector-tag-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .inspector-tag {
          font-size: 11px;
          font-weight: 750;
          background: #FFFFFF;
          border: 1px solid #DCD8CD;
          padding: 4px 9px;
          border-radius: 4px;
          color: #0D0D0D;
        }

        .inspector-tag.downstream {
          background: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }

        /* Topology Tab */
        .topology-dual-container {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          align-items: center;
        }

        @media (max-width: 950px) {
          .topology-dual-container {
            grid-template-columns: 1fr;
          }
        }

        .region-box {
          border: 1px solid #DCD8CD;
          border-radius: 8px;
          padding: 20px;
          background: #FAF9F5;
        }

        .primary-region {
          border-top: 4px solid #059669;
        }

        .secondary-region {
          border-top: 4px solid #2563EB;
        }

        .region-badge-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .region-name-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .region-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .region-indicator-dot.green { background: #059669; box-shadow: 0 0 0 2px rgba(5,150,105,0.2); }
        .region-indicator-dot.blue { background: #2563EB; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }

        .region-name {
          font-size: 13px;
          font-weight: 800;
          color: #0D0D0D;
        }

        .region-role-pill {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 3px;
          background: #ECFDF5;
          color: #065F46;
          border: 1px solid #A7F3D0;
        }

        .region-desc {
          font-size: 12px;
          line-height: 1.5;
          color: #525049;
          margin-bottom: 16px;
        }

        .region-services-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .reg-svc-item {
          background: #FFFFFF;
          border: 1px solid #ECE8DC;
          border-radius: 5px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .reg-svc-item strong {
          font-size: 11px;
          color: #0D0D0D;
        }

        .reg-svc-item span {
          font-size: 9.5px;
          color: #7E7C72;
        }

        .topology-backbone-pipe {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 0;
        }

        .backbone-line {
          width: 2px;
          height: 80px;
          background: #DCD8CD;
          position: relative;
        }

        .backbone-pulse {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E8590C;
          left: -2px;
          top: 0;
          animation: backbonePulse 2s infinite ease-in-out;
        }

        @keyframes backbonePulse {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .backbone-text {
          font-size: 9.5px;
          font-weight: 800;
          color: #7E7C72;
          text-align: center;
          writing-mode: vertical-rl;
          letter-spacing: 0.05em;
        }

        @media (max-width: 950px) {
          .backbone-line {
            width: 100%;
            height: 2px;
          }
          .backbone-text {
            writing-mode: horizontal-tb;
          }
        }

        /* Event Choreography Tab */
        .events-choreography-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 850px) {
          .events-choreography-grid {
            grid-template-columns: 1fr;
          }
        }

        .events-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .event-contract-card {
          background: #FAF9F5;
          border: 1px solid #DCD8CD;
          border-radius: 8px;
          padding: 16px;
        }

        .contract-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }

        .contract-type {
          font-size: 13px;
          font-weight: 850;
        }

        .contract-bus {
          font-size: 10px;
          color: #7E7C72;
        }

        .contract-desc {
          font-size: 12px;
          color: #525049;
          margin-bottom: 10px;
        }

        .contract-json {
          background: #0D0D0D;
          color: #38BDF8;
          padding: 12px;
          border-radius: 6px;
          font-size: 11px;
          line-height: 1.4;
          margin: 0;
          overflow-x: auto;
        }

        /* Step Functions Flow */
        .step-functions-flow {
          background: #FAF9F5;
          border: 1px solid #DCD8CD;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .sfn-node {
          width: 80%;
          border-radius: 6px;
          padding: 10px 14px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sfn-node.start, .sfn-node.end {
          background: #0D0D0D;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 12px;
        }

        .sfn-node.task {
          background: #FFFFFF;
          border: 1px solid #DCD8CD;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .sfn-node.task strong {
          font-size: 12.5px;
          color: #0D0D0D;
        }

        .sfn-node.task span {
          font-size: 10px;
          color: #525049;
        }

        .sfn-node.choice {
          background: #FEF3C7;
          border: 1px solid #FCD34D;
        }

        .sfn-node.choice strong {
          font-size: 12.5px;
          color: #92400E;
        }

        .sfn-node.choice span {
          font-size: 10px;
          color: #78350F;
        }

        .sfn-arrow {
          font-size: 14px;
          color: #9B988D;
          font-weight: 800;
        }

        /* Bottom CTA Strip */
        .overview-cta-strip {
          margin-top: 48px;
          background: #FFFFFF;
          border: 1px solid var(--border-sheet, #E2DFD2);
          border-radius: 10px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .cta-title {
          font-size: 20px;
          font-weight: 850;
          letter-spacing: -0.02em;
          color: #0D0D0D;
          margin-bottom: 6px;
        }

        .cta-text {
          font-size: 14px;
          color: #525049;
          max-width: 680px;
          margin: 0;
        }

        .cta-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
      `}</style>
    </div>
  );
}
