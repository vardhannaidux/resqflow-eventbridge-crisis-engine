import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import ResourcesPage from './pages/ResourcesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EventStreamPage from './pages/EventStreamPage';
import WorkflowsPage from './pages/WorkflowsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AIAssistantPage from './pages/AIAssistantPage';
import IoTMeshPage from './pages/IoTMeshPage';
import XRayTracingPage from './pages/XRayTracingPage';
import RekognitionPage from './pages/RekognitionPage';
import LocationRoutingPage from './pages/LocationRoutingPage';
import DocumentationPage from './pages/DocumentationPage';
import PlatformOverviewPage from './pages/PlatformOverviewPage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

import IncidentFormModal from './components/IncidentFormModal';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/ToastContainer';

import { 
  playTacticalBlip, 
  setSoundMuted, 
  getSoundMuted 
} from './utils/sound';

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com';

export default function App() {
  const [apiEndpoint, setApiEndpoint] = useState(DEFAULT_API_ENDPOINT);
  const [incidents, setIncidents] = useState([]);

  // Loading & Connectivity States
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrillRunning, setIsDrillRunning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({ online: true, latencyMs: 45 });

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalLocation, setReportModalLocation] = useState(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const handleOpenReportModal = (loc = null) => {
    setReportModalLocation(loc);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportModalLocation(null);
  };

  // Preference & Feature Toggles
  const [isSoundMutedState, setIsSoundMutedState] = useState(true);

  // Authenticated Operator Session State
  const DEFAULT_OPERATOR = {
    fullName: 'Commander Elena Vance',
    email: 'lead@resqflow.gov',
    operatorId: 'OPS-CMD-01',
    organization: 'Hyderabad Metropolitan Sector Command',
    role: 'Dispatch Supervisor',
    authenticatedAt: new Date().toISOString()
  };

  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem('resqflow_auth_user');
      return stored ? JSON.parse(stored) : DEFAULT_OPERATOR;
    } catch {
      return DEFAULT_OPERATOR;
    }
  });

  const handleLoginSuccess = (user) => {
    setAuthUser(user);
    addToast({
      type: 'info',
      title: 'Operator Authenticated',
      message: `Active session initialized for ${user.fullName} (${user.role}).`
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('resqflow_auth_user');
    setAuthUser(null);
    addToast({
      type: 'info',
      title: 'Session Terminated',
      message: 'Operator signed out of command center.'
    });
  };

  // Toast System
  const [toasts, setToasts] = useState([]);
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

      // Audio cue for newly arrived incidents
      if (previousIncidentCountRef.current > 0 && loadedIncidents.length > previousIncidentCountRef.current) {
        const newest = loadedIncidents[0];
        playTacticalBlip(newest?.severity === 'CRITICAL' ? 'critical' : 'info');
        addToast({
          type: newest?.severity === 'CRITICAL' ? 'warning' : 'info',
          title: '🚨 Emergency Ingested',
          message: `${newest?.type || 'Emergency'} registered. Triage state machine triggered.`
        });
      }
      previousIncidentCountRef.current = loadedIncidents.length;

    } catch (err) {
      console.warn('Gateway connection notice:', err.message);
      setConnectionStatus({ online: false, latencyMs: null });
    } finally {
      setIsRefreshing(false);
    }
  }, [apiEndpoint, addToast]);

  // Polling Interval (every 4 seconds for EventBridge sync)
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
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

      handleCloseReportModal();
      await fetchIncidents();
    } catch (err) {
      playTacticalBlip('info');
      addToast({
        type: 'error',
        title: 'Ingestion Error',
        message: err.message || 'Unable to communicate with ingestion Lambda.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Launch Disaster Drill Handler
  const handleTriggerDrill = async () => {
    setIsDrillRunning(true);
    try {
      const res = await fetch(`${apiEndpoint}/incidents/drill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      playTacticalBlip('critical');
      addToast({
        type: 'warning',
        title: '🚨 Disaster Drill Initiated',
        message: `Simulated ${data.incidents?.length || 3} emergencies across Hyderabad sectors.`
      });

      await fetchIncidents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Drill Trigger Failed',
        message: err.message
      });
    } finally {
      setIsDrillRunning(false);
    }
  };

  // Scenario Injection Handler
  const handleInjectScenario = (scenario) => {
    handleReportIncident({
      description: scenario.description,
      type: scenario.type,
      location: scenario.location,
      peopleAffected: scenario.peopleAffected,
      reportedBy: scenario.reportedBy || 'SCENARIO-INJECTOR'
    });
  };

  // Resolve Incident Handler
  const handleResolveIncident = async (incidentId, notes = '') => {
    try {
      const res = await fetch(`${apiEndpoint}/incidents/${encodeURIComponent(incidentId)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes || 'Incident cleared and verified by command center operator.'
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      playTacticalBlip('resolve');
      addToast({
        type: 'success',
        title: 'Incident Resolved',
        message: `Emergency ${incidentId} marked as RESOLVED and published to EventBridge.`
      });

      await fetchIncidents();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Resolution Failed',
        message: err.message
      });
    }
  };

  // Sound Toggle Handler
  const handleToggleSound = () => {
    const nextMuted = !isSoundMutedState;
    setIsSoundMutedState(nextMuted);
    setSoundMuted(nextMuted);
    addToast({
      type: 'info',
      title: nextMuted ? 'Audio Alerts Muted' : 'Audio Alerts Active',
      message: nextMuted ? 'Tactical sound cues disabled.' : 'Tactical audio cues enabled.'
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Swiss Editorial Landing Page with Event Pipeline Animation */}
        <Route path="/" element={
          <LandingPage 
            incidents={incidents} 
            connectionStatus={connectionStatus} 
          />
        } />

        {/* 2. Public Auth Gateway (Sign In & Register) */}
        <Route path="/login" element={
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        } />

        {/* 3. Operations Console Shell */}
        <Route element={
          <AppShell
            incidents={incidents}
            connectionStatus={connectionStatus}
            isRefreshing={isRefreshing}
            onRefresh={fetchIncidents}
            onOpenReportModal={() => handleOpenReportModal()}
            onTriggerDrill={handleTriggerDrill}
            isDrillRunning={isDrillRunning}
            authUser={authUser}
            onLogout={handleLogout}
          />
        }>
          {/* 0. Platform Overview */}
          <Route path="/overview" element={
            <PlatformOverviewPage
              incidents={incidents}
              onOpenReportModal={handleOpenReportModal}
            />
          } />
          <Route path="/platform-overview" element={<Navigate to="/overview" replace />} />

          {/* Operations Theatre */}
          <Route path="/dashboard" element={
            <DashboardPage
              incidents={incidents}
              onResolveIncident={handleResolveIncident}
              onOpenReportModal={handleOpenReportModal}
              onTriggerDrill={handleTriggerDrill}
              onInjectScenario={handleInjectScenario}
              isDrillRunning={isDrillRunning}
              connectionStatus={connectionStatus}
              lastUpdated={lastUpdated}
            />
          } />

          {/* 2. /incidents */}
          <Route path="/incidents" element={
            <IncidentsPage
              incidents={incidents}
              onResolveIncident={handleResolveIncident}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />
          } />

          {/* 3. /incidents/:incidentId */}
          <Route path="/incidents/:incidentId" element={
            <IncidentDetailPage
              incidents={incidents}
              onResolveIncident={handleResolveIncident}
            />
          } />

          {/* 4. /resources */}
          <Route path="/resources" element={
            <ResourcesPage
              incidents={incidents}
            />
          } />

          {/* 5. /analytics */}
          <Route path="/analytics" element={
            <AnalyticsPage
              incidents={incidents}
            />
          } />

          {/* 6. /event-stream */}
          <Route path="/event-stream" element={
            <EventStreamPage
              incidents={incidents}
            />
          } />

          {/* 7. /workflows */}
          <Route path="/workflows" element={
            <WorkflowsPage
              incidents={incidents}
            />
          } />

          {/* 8. /notifications */}
          <Route path="/notifications" element={
            <NotificationsPage
              incidents={incidents}
            />
          } />

          {/* 9. /ai-assistant */}
          <Route path="/ai-assistant" element={
            <AIAssistantPage
              incidents={incidents}
            />
          } />

          {/* 10. /iot-mesh (AWS IoT Core) */}
          <Route path="/iot-mesh" element={
            <IoTMeshPage
              onOpenReportModal={handleOpenReportModal}
            />
          } />

          {/* 11. /xray-tracing (AWS X-Ray) */}
          <Route path="/xray-tracing" element={
            <XRayTracingPage />
          } />

          {/* 12. /vision-ai (Amazon Rekognition) */}
          <Route path="/vision-ai" element={
            <RekognitionPage />
          } />

          {/* 13. /location-routing (Amazon Location Service) */}
          <Route path="/location-routing" element={
            <LocationRoutingPage />
          } />

          {/* 14. /documentation */}
          <Route path="/documentation" element={
            <DocumentationPage />
          } />

          {/* 11. /settings */}
          <Route path="/settings" element={
            <SettingsPage
              apiEndpoint={apiEndpoint}
              onApiEndpointChange={setApiEndpoint}
              isSoundMuted={isSoundMutedState}
              onToggleSound={handleToggleSound}
              onResetDemoData={fetchIncidents}
              connectionStatus={connectionStatus}
            />
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>

      {/* Floating Incident Intake Modal */}
      <IncidentFormModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        onSubmit={handleReportIncident}
        isSubmitting={isSubmitting}
        initialLocation={reportModalLocation}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        incidents={incidents}
        onSelectIncident={(inc) => {
          setIsCommandPaletteOpen(false);
          window.location.href = `/incidents/${inc.incidentId}`;
        }}
        onOpenReportModal={() => {
          setIsCommandPaletteOpen(false);
          setIsReportModalOpen(true);
        }}
        onTriggerDrill={() => {
          setIsCommandPaletteOpen(false);
          handleTriggerDrill();
        }}
        onRecenterMap={() => {
          addToast({ type: 'info', title: 'Map Centered', message: 'Hyderabad Command Grid centered.' });
        }}
        onToggleSound={handleToggleSound}
        isSoundMuted={isSoundMutedState}
      />

      {/* Floating Action Feedback Toasts */}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={handleDismissToast} 
      />
    </BrowserRouter>
  );
}
