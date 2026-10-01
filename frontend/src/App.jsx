import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import SimulationBanner from './components/SimulationBanner';
import KPICards from './components/KPICards';
import IncidentMap from './components/IncidentMap';
import IncidentFeed from './components/IncidentFeed';
import IncidentDetailModal from './components/IncidentDetailModal';
import IncidentFormModal from './components/IncidentFormModal';
import ResourcePanel from './components/ResourcePanel';
import ActivityTimeline from './components/ActivityTimeline';
import CommandPalette from './components/CommandPalette';
import NotificationDrawer from './components/NotificationDrawer';
import ToastContainer from './components/ToastContainer';

import { 
  playTacticalBlip, 
  setSoundMuted, 
  getSoundMuted 
} from './utils/sound';

import { 
  Layers, 
  MapPin, 
  ShieldAlert, 
  Truck, 
  History, 
  LayoutDashboard 
} from 'lucide-react';

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com';

export default function App() {
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_API_ENDPOINT);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Loading & Polling States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrillRunning, setIsDrillRunning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({ online: true, latencyMs: null });

  // Modal & Drawer State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Preference & Feature Toggles
  const [isSoundMutedState, setIsSoundMutedState] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [showCinematicBg, setShowCinematicBg] = useState(true);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('operations'); // 'operations' | 'fleet' | 'telemetry'

  // Toast System
  const [toasts, setToasts] = useState([]);

  // Live Broadcast Notifications
  const [notifications, setNotifications] = useState([]);
  const previousIncidentCountRef = useRef(0);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const handleDismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch Incidents from AWS API Gateway with Latency Timing
  const fetchIncidents = useCallback(async () => {
    const startTime = performance.now();
    try {
      setIsRefreshing(true);
      const res = await fetch(`${apiEndpoint}/incidents`);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      const data = await res.json();
      const loadedIncidents = data.incidents || [];
      setIncidents(loadedIncidents);
      setLastUpdated(new Date().toISOString());
      setConnectionStatus({ online: true, latencyMs: latency });

      // Detect newly arrived incidents for tactical notification & audio cue
      if (previousIncidentCountRef.current > 0 && loadedIncidents.length > previousIncidentCountRef.current) {
        const diff = loadedIncidents.length - previousIncidentCountRef.current;
        const newest = loadedIncidents[0];
        playTacticalBlip(newest?.severity === 'CRITICAL' ? 'critical' : 'info');
        
        addToast({
          type: newest?.severity === 'CRITICAL' ? 'warning' : 'info',
          title: '🚨 Emergency Incident Ingested',
          message: `${newest?.type || 'New emergency'} reported in Hyderabad sector. State machine dispatch initiated.`
        });

        // Add to broadcast notification drawer
        setNotifications(prev => [
          {
            id: `notif-${Date.now()}`,
            incident: newest,
            type: 'INGESTED',
            severity: newest?.severity,
            title: `[${newest?.severity || 'REPORTED'}] ${newest?.incidentId}: ${newest?.type}`,
            message: newest?.description || 'Emergency incident ingested into ResQFlow pipeline.',
            target: newest?.assignedTeam || 'Regional Command Units',
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
      }
      previousIncidentCountRef.current = loadedIncidents.length;

    } catch (err) {
      console.warn('Gateway connection error:', err.message);
      setConnectionStatus({ online: false, latencyMs: null });
    } finally {
      setIsRefreshing(false);
    }
  }, [apiEndpoint, addToast]);

  // Polling Interval (every 4 seconds for real-time EventBridge updates)
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 4000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsReportModalOpen(false);
        setIsDetailModalOpen(false);
        setIsCommandPaletteOpen(false);
        setIsNotificationDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Theme Sync to body element
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.remove('theme-tactical');
    } else {
      document.body.classList.add('theme-tactical');
    }
  }, [isDarkTheme]);

  // Report New Incident Handler
  const handleReportIncident = async (payload) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiEndpoint}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      playTacticalBlip(payload.peopleAffected >= 10 ? 'critical' : 'info');
      addToast({
        type: 'success',
        title: 'Emergency Ingested Successfully',
        message: `Incident ${data.incidentId} published to EventBridge. Step Functions triage activated.`
      });

      setIsReportModalOpen(false);
      await fetchIncidents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Ingestion Error',
        message: err.message || 'Failed to submit incident to API Gateway.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Multi-Incident Simulation Drill Handler
  const handleTriggerDrill = async () => {
    setIsDrillRunning(true);
    try {
      const res = await fetch(`${apiEndpoint}/incidents/drill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      playTacticalBlip('critical');
      addToast({
        type: 'warning',
        title: '🚨 Disaster Drill Initiated',
        message: '3 synchronized multi-tier emergencies dispatched across Hyderabad Sector.'
      });

      await fetchIncidents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Drill Execution Error',
        message: err.message || 'Failed to trigger cloud simulation drill.'
      });
    } finally {
      setIsDrillRunning(false);
    }
  };

  // Inject Deterministic Demo Scenario Handler
  const handleInjectScenario = (scenario) => {
    handleReportIncident({
      type: scenario.category,
      description: `${scenario.title}: ${scenario.description}`,
      peopleAffected: scenario.peopleAffected,
      location: scenario.location,
      reportedBy: scenario.reportedBy
    });
  };

  // Resolve Incident Handler
  const handleResolveIncident = async (incidentId, notes = '') => {
    try {
      const res = await fetch(`${apiEndpoint}/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || 'Incident cleared by command center supervisor.' })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      playTacticalBlip('resolve');
      addToast({
        type: 'success',
        title: 'Emergency Cleared & Stabilized',
        message: `Incident ${incidentId} marked as RESOLVED. Telemetry archived.`
      });

      // Update selected incident in view if open
      if (selectedIncident && selectedIncident.incidentId === incidentId) {
        setSelectedIncident(prev => ({
          ...prev,
          status: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
          resolutionNotes: notes
        }));
      }

      await fetchIncidents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Resolution Failed',
        message: err.message || 'Could not resolve incident on cloud backend.'
      });
    }
  };

  const handleSelectIncident = (incident) => {
    setSelectedIncident(incident);
    setIsDetailModalOpen(true);
  };

  const handleToggleSound = () => {
    const nextMuted = !isSoundMutedState;
    setSoundMuted(nextMuted);
    setIsSoundMutedState(nextMuted);
    addToast({
      type: 'info',
      title: nextMuted ? 'Audio Alerts Muted' : 'Audio Alerts Active',
      message: nextMuted ? 'Tactical sound effects disabled.' : 'Subtle tactical audio cues enabled.'
    });
  };

  const handleToggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const handleToggleCinematicBg = () => {
    setShowCinematicBg(prev => !prev);
  };

  return (
    <>
      {/* 1. Cinematic Night-City Backdrop Layer */}
      <div 
        className={`cinematic-backdrop-layer ${!showCinematicBg ? 'hidden' : ''}`}
        style={{ backgroundImage: `url('/night-city-bg.jpg')` }}
        aria-hidden="true"
      />
      <div className="ambient-grid-overlay" aria-hidden="true" />

      {/* 2. Main Mission Control Viewport */}
      <div className="app-viewport">
        {/* Global Command Header */}
        <Header
          apiEndpoint={apiEndpoint}
          onApiEndpointChange={setApiEndpoint}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          onRefresh={fetchIncidents}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenDrillModal={handleTriggerDrill}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleNotifications={() => setIsNotificationDrawerOpen(prev => !prev)}
          unreadAlertCount={notifications.length}
          isDrillRunning={isDrillRunning}
          isSoundMuted={isSoundMutedState}
          onToggleSound={handleToggleSound}
          isDarkTheme={isDarkTheme}
          onToggleTheme={handleToggleTheme}
          showCinematicBg={showCinematicBg}
          onToggleCinematicBg={handleToggleCinematicBg}
          connectionStatus={connectionStatus}
        />

        {/* Persistent Simulation & Drill Warning Banner */}
        <SimulationBanner
          onInjectScenario={handleInjectScenario}
          onTriggerCloudDrill={handleTriggerDrill}
          onResetDemoData={fetchIncidents}
          isDrillRunning={isDrillRunning}
        />

        {/* Situational Awareness Metric Cards */}
        <KPICards incidents={incidents} />

        {/* Operations Workspace Tab Navigation */}
        <div className="workspace-views-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeWorkspaceTab === 'operations'}
            className={`tab-nav-btn ${activeWorkspaceTab === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveWorkspaceTab('operations')}
          >
            <LayoutDashboard size={14} />
            <span>Operations Center (Map & Incident Stream)</span>
            <span className="tab-count-pill">{incidents.length}</span>
          </button>

          <button
            role="tab"
            aria-selected={activeWorkspaceTab === 'fleet'}
            className={`tab-nav-btn ${activeWorkspaceTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveWorkspaceTab('fleet')}
          >
            <Truck size={14} />
            <span>Response Fleet & Trauma Facilities</span>
          </button>

          <button
            role="tab"
            aria-selected={activeWorkspaceTab === 'telemetry'}
            className={`tab-nav-btn ${activeWorkspaceTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveWorkspaceTab('telemetry')}
          >
            <History size={14} />
            <span>Serverless EventBridge Audit Stream</span>
          </button>
        </div>

        {/* Workspace Views Content */}
        <main className="main-ops-grid">
          {activeWorkspaceTab === 'operations' && (
            <>
              {/* Split Dashboard Row: Leaflet Geospatial Operations Map & Incident Command Feed */}
              <div className="split-dashboard-row">
                <IncidentMap 
                  incidents={incidents} 
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncident}
                />
                <IncidentFeed 
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncident}
                  onResolveIncident={handleResolveIncident}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  onOpenDrillModal={handleTriggerDrill}
                />
              </div>

              {/* Supporting Panels: Resource Overview & Audit Timeline */}
              <ResourcePanel incidents={incidents} />
              <ActivityTimeline incidents={incidents} />
            </>
          )}

          {activeWorkspaceTab === 'fleet' && (
            <ResourcePanel incidents={incidents} />
          )}

          {activeWorkspaceTab === 'telemetry' && (
            <ActivityTimeline incidents={incidents} />
          )}
        </main>
      </div>

      {/* 3. Floating Modals, Drawers & Portals */}
      {/* Incident Intake Portal Modal */}
      <IncidentFormModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportIncident}
        isSubmitting={isSubmitting}
      />

      {/* Incident Detail & Command Dossier Modal */}
      {isDetailModalOpen && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setIsDetailModalOpen(false)}
          onResolve={handleResolveIncident}
        />
      )}

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onTriggerDrill={handleTriggerDrill}
        onRecenterMap={() => {
          // Handled via map instance recenter
          addToast({ type: 'info', title: 'Map Recenter', message: 'Map view centered to Hyderabad Core Sector.' });
        }}
        onToggleSound={handleToggleSound}
        isSoundMuted={isSoundMutedState}
        onToggleTheme={handleToggleTheme}
        onToggleCinematicBg={handleToggleCinematicBg}
      />

      {/* Notification Center Slide-Out Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        onSelectIncident={handleSelectIncident}
      />

      {/* Floating Action Feedback Toasts */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={handleDismissToast} 
      />
    </>
  );
}
