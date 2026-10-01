import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  RefreshCw, 
  Radio, 
  Globe, 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  PlusCircle, 
  ShieldCheck, 
  Wifi, 
  WifiOff,
  User,
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react';

export default function Header({
  apiEndpoint,
  onApiEndpointChange,
  isRefreshing,
  lastUpdated,
  onRefresh,
  onOpenReportModal,
  onOpenDrillModal,
  onOpenCommandPalette,
  onToggleNotifications,
  unreadAlertCount,
  isDrillRunning,
  isSoundMuted,
  onToggleSound,
  isDarkTheme,
  onToggleTheme,
  showCinematicBg,
  onToggleCinematicBg,
  connectionStatus
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <header className="command-header">
      {/* Brand & Workspace Title */}
      <div className="header-brand-section">
        <div className="brand-logo-container" title="ResQFlow Autonomous Mission Control">
          <div className="radar-pulse-ring"></div>
          <div className="brand-icon-shield">
            <Flame size={22} className="flame-glow" />
          </div>
        </div>

        <div className="brand-meta">
          <div className="brand-title-row">
            <h1 className="brand-name">ResQFlow <span className="brand-version">X</span></h1>
            <span className="workspace-badge">
              <span className="workspace-dot"></span>
              Emergency Operations Center
            </span>
          </div>
          <p className="brand-tagline">
            Intelligent Event-Driven Emergency Response & Resource Orchestration Platform
          </p>
        </div>
      </div>

      {/* Center Operational Status: Connectivity, AWS Region, Sync */}
      <div className="header-status-strip">
        {/* Latency & Connectivity indicator */}
        <div 
          className={`connectivity-pill ${connectionStatus.online ? 'online' : 'offline'}`}
          title={`Gateway Endpoint: ${apiEndpoint}`}
        >
          {connectionStatus.online ? (
            <>
              <span className="status-blip online-blip"></span>
              <Wifi size={13} />
              <span className="status-text">
                Live Cloud • {connectionStatus.latencyMs ? `${connectionStatus.latencyMs}ms` : 'Connected'}
              </span>
            </>
          ) : (
            <>
              <span className="status-blip offline-blip"></span>
              <WifiOff size={13} />
              <span className="status-text">Standby / Offline</span>
            </>
          )}
        </div>

        {/* Region Badge */}
        <div className="region-pill" title="Amazon Web Services Serverless Stack">
          <Globe size={13} className="text-cyan" />
          <span>AWS ap-south-2 (Hyderabad)</span>
          <ShieldCheck size={12} className="text-emerald" />
        </div>

        {/* Last Sync */}
        <div className="sync-pill" title="Automatic EventBridge state synchronization">
          <button 
            className="btn-sync-icon" 
            onClick={onRefresh} 
            disabled={isRefreshing}
            aria-label="Synchronize data from AWS"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
          <span className="sync-time mono">
            {isRefreshing ? 'Syncing...' : lastUpdated ? `${elapsedSeconds}s ago` : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="header-actions">
        {/* Command Palette Trigger */}
        <button 
          className="header-tool-btn command-k-btn"
          onClick={onOpenCommandPalette}
          title="Open Command Palette (Ctrl+K)"
        >
          <Search size={14} />
          <span className="command-k-label">Search / Actions</span>
          <kbd className="cmd-k-kbd">Ctrl+K</kbd>
        </button>

        {/* Sound FX Toggle */}
        <button
          className={`header-tool-btn icon-only-btn ${!isSoundMuted ? 'active-tool' : ''}`}
          onClick={onToggleSound}
          title={isSoundMuted ? 'Unmute Tactical Audio Alerts' : 'Mute Audio Alerts'}
          aria-label="Toggle tactical sound"
        >
          {isSoundMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-cyan" />}
        </button>

        {/* Cinematic Backdrop Toggle */}
        <button
          className={`header-tool-btn icon-only-btn ${showCinematicBg ? 'active-tool' : ''}`}
          onClick={onToggleCinematicBg}
          title={showCinematicBg ? 'Dim Cinematic City Backdrop' : 'Enable Cinematic Night-City Backdrop'}
          aria-label="Toggle cinematic city background"
        >
          <ImageIcon size={15} />
        </button>

        {/* Theme Toggle */}
        <button
          className="header-tool-btn icon-only-btn"
          onClick={onToggleTheme}
          title={isDarkTheme ? 'Switch to High-Contrast Tactical Theme' : 'Switch to Mission Control Dark Glass'}
          aria-label="Toggle theme"
        >
          {isDarkTheme ? <Moon size={15} /> : <Sun size={15} className="text-amber" />}
        </button>

        {/* Notifications Trigger */}
        <button
          className="header-tool-btn icon-only-btn notification-btn"
          onClick={onToggleNotifications}
          title="Notification Center & Dispatch Audit Feed"
          aria-label="View notifications"
        >
          <Bell size={15} />
          {unreadAlertCount > 0 && (
            <span className="notification-badge-count">{unreadAlertCount}</span>
          )}
        </button>

        {/* Launch Cloud Drill Button */}
        <button 
          className="btn-primary-drill"
          onClick={onOpenDrillModal}
          disabled={isDrillRunning}
          title="Trigger Synchronized 3-Incident Multi-Tier Disaster Simulation"
        >
          <Radio size={14} className={isDrillRunning ? 'spin-anim' : ''} />
          <span>{isDrillRunning ? 'Dispatching...' : 'Disaster Drill'}</span>
        </button>

        {/* New Incident Intake */}
        <button 
          className="btn-accent-report"
          onClick={onOpenReportModal}
          title="Report New Citizen or IoT Emergency Incident"
        >
          <PlusCircle size={15} />
          <span>Report Emergency</span>
        </button>

        {/* Operator Profile */}
        <div className="operator-profile-pill" title="Authenticated Session: Dispatch Supervisor">
          <div className="operator-avatar">
            <User size={13} />
          </div>
          <div className="operator-text">
            <span className="operator-name">DISP-HYD-01</span>
            <span className="operator-role">Supervisor</span>
          </div>
        </div>
      </div>
    </header>
  );
}
