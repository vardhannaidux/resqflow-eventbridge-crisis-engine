import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  Wifi, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Activity, 
  Zap, 
  Server, 
  ChevronRight, 
  ArrowUpRight, 
  Send,
  Droplets,
  Wind,
  Compass,
  Volume2
} from 'lucide-react';
import { iotService } from '../services/iotService';
import PollyVoiceRadio from '../components/PollyVoiceRadio';

export default function IoTMeshPage({ onOpenReportModal }) {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [rulesData, setRulesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mesh'); // 'mesh' | 'rules' | 'packets'
  const [simulatingDevice, setSimulatingDevice] = useState(null);
  const [lastBreachResult, setLastBreachResult] = useState(null);
  const [packetLogs, setPacketLogs] = useState([
    {
      id: 'pkt-101',
      topic: 'resqflow/sensors/flood/IOT-SENSOR-FL-01/telemetry',
      qos: 1,
      payload: { metric: 'Water Depth', value: 0.85, unit: 'm', status: 'NOMINAL' },
      time: new Date(Date.now() - 14000).toLocaleTimeString()
    },
    {
      id: 'pkt-102',
      topic: 'resqflow/sensors/gas/IOT-SENSOR-GAS-02/telemetry',
      qos: 1,
      payload: { metric: 'Toxic VOC', value: 38, unit: 'PPM', status: 'SAFE' },
      time: new Date(Date.now() - 9000).toLocaleTimeString()
    },
    {
      id: 'pkt-103',
      topic: 'resqflow/fleet/IOT-FLEET-AMB-06/telemetry',
      qos: 1,
      payload: { metric: 'O2 Reserve', value: 92, unit: '%', speedKmh: 54 },
      time: new Date(Date.now() - 3000).toLocaleTimeString()
    }
  ]);

  const loadIoTData = async () => {
    setIsLoading(true);
    try {
      const [devList, rules] = await Promise.all([
        iotService.getDevices(),
        iotService.getRules()
      ]);
      setDevices(devList);
      setRulesData(rules);
    } catch (err) {
      console.error('Failed to load IoT data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIoTData();
  }, []);

  const handleSimulateSpike = async (device, breach = true) => {
    setSimulatingDevice(device.thingName);
    setLastBreachResult(null);

    const spikeValue = breach 
      ? (device.sensorType === 'SOS_BEACON' ? 1 : device.threshold * 1.6)
      : (device.threshold * 0.4);

    try {
      const res = await iotService.publishTelemetry({
        deviceId: device.thingName,
        metricValue: spikeValue,
        threshold: device.threshold,
        emergency: breach
      });

      // Append packet log
      const newPacket = {
        id: `pkt-${Date.now().toString().slice(-4)}`,
        topic: device.mqttTopic,
        qos: 1,
        payload: {
          metric: device.metricName,
          value: spikeValue,
          unit: device.unit,
          emergency: breach,
          ruleMatched: res.matchedRule
        },
        time: new Date().toLocaleTimeString()
      };
      setPacketLogs(prev => [newPacket, ...prev.slice(0, 15)]);

      if (res.isEmergency) {
        setLastBreachResult(res);
      }

      // Refresh device list
      const updatedDevices = await iotService.getDevices();
      setDevices(updatedDevices);
    } catch (err) {
      console.error('Spike simulation failed:', err);
    } finally {
      setSimulatingDevice(null);
    }
  };

  const getSensorIcon = (type) => {
    switch (type) {
      case 'FLOOD': return <Droplets size={16} color="#2563EB" />;
      case 'GAS_LEAK': return <Wind size={16} color="#DC2626" />;
      case 'STRUCTURAL': return <Activity size={16} color="#D97706" />;
      case 'SOS_BEACON': return <ShieldAlert size={16} color="#E11D48" />;
      case 'DRONE': return <Compass size={16} color="#059669" />;
      case 'FLEET_VITALS': return <Zap size={16} color="#7C3AED" />;
      default: return <Cpu size={16} color="#0D0D0D" />;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-atlas live" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span className="live-dot" />
              AWS IOT CORE · AP-SOUTH-1
            </span>
            <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>
              TLS 1.3 / Port 8883 · MQTT Message Broker
            </span>
          </div>
          <h1 className="page-title" style={{ marginTop: '4px' }}>
            Emergency Sensor Mesh & IoT Fleet Telemetry
          </h1>
          <p className="page-subtitle">
            Autonomous sensor telemetry ingestion, Device Shadow state management, and real-time IoT Rules Engine evaluation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-atlas-secondary"
            onClick={loadIoTData}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={isLoading ? 'spin-anim' : ''} />
            <span>Sync Mesh</span>
          </button>
        </div>
      </div>

      {/* IoT Broker Endpoint Architecture Banner */}
      <div className="atlas-card" style={{ padding: '16px 20px', background: '#FFFFFF', border: '2px solid #0D0D0D', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD23F' }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '14px', color: '#0D0D0D' }}>
                AWS IoT Core ATS Data Endpoint
              </span>
              <span className="mono" style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                ONLINE · ATS CA VERIFIED
              </span>
            </div>
            <code className="mono" style={{ fontSize: '11px', color: '#57554D', marginTop: '2px', display: 'block' }}>
              {rulesData?.endpoint || 'https://a1859e76u3gqu4-ats.iot.ap-south-1.amazonaws.com'}
            </code>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>THINGS REGISTERED</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0D0D0D' }}>{devices.length} Nodes</span>
          </div>
          <div style={{ borderLeft: '1px solid #E0DDD4', paddingLeft: '20px' }}>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>RULES ACTIVE</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0D0D0D' }}>3 SQL Rules</span>
          </div>
          <div style={{ borderLeft: '1px solid #E0DDD4', paddingLeft: '20px' }}>
            <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>INGESTION LATENCY</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>&lt; 65 ms</span>
          </div>
        </div>
      </div>

      {/* Threshold Breach Incident Alert Banner */}
      {lastBreachResult && (
        <div className="atlas-card" style={{ padding: '18px 20px', background: '#FFF1F2', border: '2px solid #E11D48', animation: 'fadeIn 0.3s ease-in' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#E11D48', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, color: '#9F1239', fontSize: '15px' }}>
                    CRITICAL SENSOR THRESHOLD BREACH DETECTED
                  </span>
                  <span className="mono" style={{ fontSize: '11px', background: '#FFE4E6', color: '#BE123C', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    RULE: {lastBreachResult.matchedRule}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#881337', marginTop: '4px' }}>
                  Device <strong>{lastBreachResult.deviceId}</strong> breached safe limits with reading: <strong>{lastBreachResult.metricValue} {lastBreachResult.unit}</strong> (Limit: {lastBreachResult.threshold} {lastBreachResult.unit}).
                  AWS IoT Core Rules Engine automatically synthesized incident: <strong>{lastBreachResult.incidentId}</strong> into EventBridge bus <strong>resqflow-event-bus</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lastBreachResult.incident && (
                <PollyVoiceRadio incident={lastBreachResult.incident} compact={true} />
              )}
              {lastBreachResult.incidentId && (
                <button 
                  className="btn-atlas-primary"
                  onClick={() => navigate(`/incidents/${lastBreachResult.incidentId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', fontSize: '12px' }}
                >
                  <span>Open Incident Dossier</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #0D0D0D', paddingBottom: '0' }}>
        <button
          className={`filter-btn-pill ${activeTab === 'mesh' ? 'active' : ''}`}
          onClick={() => setActiveTab('mesh')}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
        >
          Sensor Mesh Nodes ({devices.length})
        </button>
        <button
          className={`filter-btn-pill ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
        >
          AWS IoT Topic Rules Engine ({rulesData?.rules?.length || 3})
        </button>
        <button
          className={`filter-btn-pill ${activeTab === 'packets' ? 'active' : ''}`}
          onClick={() => setActiveTab('packets')}
          style={{ borderRadius: '6px 6px 0 0', borderBottom: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
        >
          Live MQTT Packet Stream
        </button>
      </div>

      {/* TAB 1: SENSOR MESH GRID */}
      {activeTab === 'mesh' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {devices.map(device => {
            const isBreached = device.metricValue >= device.threshold && device.threshold > 0;
            const pct = Math.min(100, Math.round((device.metricValue / (device.threshold * 1.2 || 1)) * 100));

            return (
              <div 
                key={device.thingName} 
                className="atlas-card" 
                style={{ 
                  padding: '18px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: isBreached ? '2px solid #E11D48' : '1px solid #DCD8CD',
                  background: isBreached ? '#FFF5F5' : '#FFFFFF'
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#F5F4EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getSensorIcon(device.sensorType)}
                      </div>
                      <div>
                        <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#0D0D0D' }}>
                          {device.thingName}
                        </span>
                        <span className="mono" style={{ fontSize: '10px', color: '#828076', display: 'block' }}>
                          {device.thingTypeName}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge-atlas ${isBreached ? 'critical' : 'low'}`} style={{ fontSize: '10px' }}>
                        {isBreached ? 'CRITICAL ALERT' : 'NOMINAL'}
                      </span>
                    </div>
                  </div>

                  {/* Description & Sector */}
                  <p style={{ fontSize: '12px', color: '#403E38', marginBottom: '12px', lineHeight: 1.4 }}>
                    {device.description}
                  </p>

                  {/* Metric Value Display */}
                  <div style={{ background: '#FAF9F5', border: '1px solid #E0DDD4', borderRadius: '6px', padding: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>{device.metricName}</span>
                      <span className="mono" style={{ fontSize: '10px', color: '#828076' }}>Safe Limit: {device.threshold} {device.unit}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: isBreached ? '#E11D48' : '#0D0D0D', fontFamily: 'var(--font-display)' }}>
                        {device.metricValue}
                      </span>
                      <span className="mono" style={{ fontSize: '12px', color: '#57554D', fontWeight: 600 }}>
                        {device.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '6px', width: '100%', background: '#E0DDD4', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${pct}%`, 
                          background: isBreached ? '#E11D48' : '#2563EB',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Device Meta Telemetry */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '10px', marginBottom: '14px' }}>
                    <div className="mono" style={{ background: '#F5F4EE', padding: '4px 6px', borderRadius: '4px' }}>
                      BATTERY: <strong>{device.battery}%</strong>
                    </div>
                    <div className="mono" style={{ background: '#F5F4EE', padding: '4px 6px', borderRadius: '4px' }}>
                      RSSI: <strong>{device.rssi} dBm</strong>
                    </div>
                    <div className="mono" style={{ background: '#F5F4EE', padding: '4px 6px', borderRadius: '4px' }}>
                      QoS: <strong>{device.qos}</strong>
                    </div>
                  </div>
                </div>

                {/* Simulation Trigger Bar */}
                <div style={{ borderTop: '1px solid #E0DDD4', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code className="mono" style={{ fontSize: '9px', color: '#828076', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {device.mqttTopic}
                  </code>

                  <button
                    className="btn-atlas-secondary"
                    onClick={() => handleSimulateSpike(device, true)}
                    disabled={simulatingDevice === device.thingName}
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 10px', 
                      background: isBreached ? '#E11D48' : '#0D0D0D', 
                      color: isBreached ? '#FFFFFF' : '#FFD23F',
                      fontWeight: 700 
                    }}
                    title="Publish an out-of-bounds telemetry reading over MQTT to trigger IoT Rule"
                  >
                    {simulatingDevice === device.thingName ? 'PUBLISHING...' : 'SIMULATE SPIKE'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: AWS IOT TOPIC RULES ENGINE */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {rulesData?.rules?.map(rule => (
            <div key={rule.ruleName} className="atlas-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#D97706" />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0D0D0D' }}>{rule.ruleName}</h3>
                    <span className="mono" style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      SQL RULES ENGINE
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#57554D', marginTop: '4px' }}>
                    {rule.description}
                  </p>
                </div>

                <span className="badge-atlas low" style={{ fontSize: '11px' }}>
                  ACTIVE & EVALUATING
                </span>
              </div>

              {/* SQL Statement Display */}
              <div style={{ background: '#0F172A', color: '#F8FAFC', padding: '14px', borderRadius: '6px', margin: '12px 0' }}>
                <span className="mono" style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>
                  TOPIC RULE SQL QUERY:
                </span>
                <code className="mono" style={{ fontSize: '13px', color: '#38BDF8', fontWeight: 600 }}>
                  {rule.sql}
                </code>
              </div>

              {/* Rule Actions */}
              <div>
                <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: '#0D0D0D', display: 'block', marginBottom: '8px' }}>
                  CONFIGURED ACTIONS ({rule.actions.length}):
                </span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {rule.actions.map((act, i) => (
                    <div key={i} style={{ background: '#FAF9F5', border: '1px solid #DCD8CD', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={13} color="#2563EB" />
                      <span><strong>{act.type}:</strong> {act.busName || act.function || act.tableName || act.topicArn}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: LIVE MQTT PACKET STREAM */}
      {activeTab === 'packets' && (
        <div className="atlas-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="#059669" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0D0D0D' }}>MQTT Packet Telemetry Console</h3>
            </div>
            <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>
              Listening on topic pattern: resqflow/# · QoS 1
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {packetLogs.map(pkt => (
              <div 
                key={pkt.id} 
                style={{ 
                  background: pkt.payload.emergency ? '#FFF1F2' : '#FAF9F5', 
                  border: pkt.payload.emergency ? '1px solid #FDA4AF' : '1px solid #E0DDD4', 
                  borderRadius: '6px', 
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: '#828076' }}>{pkt.time}</span>
                  <span className="mono" style={{ fontWeight: 700, color: '#0D0D0D' }}>{pkt.topic}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <code className="mono" style={{ fontSize: '11px', color: pkt.payload.emergency ? '#E11D48' : '#059669', fontWeight: 700 }}>
                    {JSON.stringify(pkt.payload)}
                  </code>
                  <span className="mono" style={{ fontSize: '10px', background: '#E0DDD4', padding: '2px 5px', borderRadius: '3px' }}>
                    QoS {pkt.qos}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
