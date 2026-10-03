import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Flame, 
  LayoutDashboard, 
  AlertCircle, 
  Truck, 
  BarChart3, 
  Zap, 
  GitBranch, 
  Bell, 
  Settings, 
  Search, 
  Globe, 
  RefreshCw, 
  PlusCircle, 
  Radio, 
  User, 
  ShieldCheck, 
  Wifi, 
  WifiOff,
  Bot,
  BookOpen,
  Sparkles,
  Lock,
  LogOut,
  Cpu,
  Activity,
  Eye,
  Navigation
} from 'lucide-react';

export default function AppShell({
  incidents = [],
  connectionStatus = { online: true, latencyMs: 45 },
  isRefreshing = false,
  onRefresh,
  onOpenReportModal,
  onTriggerDrill,
  isDrillRunning = false,
  authUser = null,
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/incidents?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;

  const navItems = [
    { path: '/overview', label: 'Platform Overview', icon: <Sparkles size={16} />, badge: 'SYSTEM' },
    { path: '/dashboard', label: 'Operations Theatre', icon: <LayoutDashboard size={16} /> },
    { path: '/incidents', label: 'Active Incidents', icon: <AlertCircle size={16} />, badge: activeCount },
    { path: '/resources', label: 'Fleet & Hospitals', icon: <Truck size={16} /> },
    { path: '/analytics', label: 'System Analytics', icon: <BarChart3 size={16} /> },
    { path: '/event-stream', label: 'EventBridge Bus', icon: <Zap size={16} /> },
    { path: '/workflows', label: 'Step Functions', icon: <GitBranch size={16} /> },
    { path: '/notifications', label: 'SNS Broadcasts', icon: <Bell size={16} /> },
    { path: '/ai-assistant', label: 'Bedrock Copilot', icon: <Bot size={16} /> },
    { path: '/iot-mesh', label: 'IoT Sensor Mesh', icon: <Cpu size={16} />, badge: 'MQTT' },
    { path: '/xray-tracing', label: 'X-Ray Traces', icon: <Activity size={16} />, badge: 'X-RAY' },
    { path: '/vision-ai', label: 'Vision AI Evidence', icon: <Eye size={16} />, badge: 'VISION' },
    { path: '/location-routing', label: 'Road Routing & Geo', icon: <Navigation size={16} />, badge: 'GEO' },
    { path: '/documentation', label: 'Architecture Specs', icon: <BookOpen size={16} /> },
    { path: '/settings', label: 'Engine Config', icon: <Settings size={16} /> }
  ];

  return (
    <div className="app-shell-container">
      {/* 1. Swiss Editorial Left Navigation */}
      <aside className="app-sidebar" aria-label="Main Navigation">
        {/* Brand Header with Bauhaus Accent */}
        <div className="sidebar-brand-box">
          <div className="sidebar-logo-icon">
            <Flame size={18} />
          </div>
          <div>
            <div className="sidebar-brand-title">ResQFlow</div>
            <div className="sidebar-brand-badge">AI-NATIVE ENGINE · v2.4</div>
          </div>
        </div>

        {/* Navigation Link List */}
        <nav className="sidebar-nav-list">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-item-left">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (typeof item.badge === 'string' ? true : item.badge > 0) && (
                <span className="nav-badge-pill">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Operator Profile Footer */}
        <div className="sidebar-footer-box">
          <div className="sidebar-operator-avatar">
            <User size={15} />
          </div>
          <div className="sidebar-operator-info" style={{ flex: 1, minWidth: 0 }}>
            <span 
              className="sidebar-operator-name" 
              title={authUser?.fullName || 'Commander Elena Vance'} 
              style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              {authUser?.fullName || 'Commander Elena Vance'}
            </span>
            <span className="sidebar-operator-role">
              {authUser?.role || 'Dispatch Supervisor'}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (onLogout) onLogout();
              navigate('/login');
            }}
            title="Sign Out / Switch Operator"
            style={{ 
              background: '#FAF9F5', 
              border: '1px solid #DCD8CD', 
              borderRadius: '4px',
              cursor: 'pointer', 
              color: '#0D0D0D', 
              padding: '5px 7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </aside>

      {/* 2. Main Viewport */}
      <div className="app-main-viewport">
        {/* Editorial Top Header Bar */}
        <header className="atlas-top-header">
          {/* High Contrast Search Box */}
          <form onSubmit={handleSearchSubmit} className="header-search-wrap">
            <Search size={14} color="#0D0D0D" />
            <input
              type="text"
              className="header-search-input"
              placeholder="Search incidents, telemetry, unit IDs... (Press /)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Center Cloud Telemetry Status */}
          <div className="header-status-group">
            <div className={`pill-cloud-status ${connectionStatus.online ? 'online' : 'offline'}`}>
              {connectionStatus.online ? (
                <>
                  <span className="status-dot-ping"></span>
                  <span>AWS CLOUD · {connectionStatus.latencyMs ? `${connectionStatus.latencyMs}ms` : '42ms'}</span>
                </>
              ) : (
                <>
                  <WifiOff size={13} color="#E11D48" />
                  <span>DISCONNECTED</span>
                </>
              )}
            </div>

            <div className="pill-cloud-status">
              <Globe size={13} color="#0D0D0D" />
              <span>ap-south-2</span>
              <ShieldCheck size={12} color="#059669" />
            </div>

            {/* Sync Button */}
            <button
              className="btn-header-tool"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Synchronize from EventBridge & DynamoDB"
              aria-label="Refresh data"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            </button>
          </div>

          {/* Action CTAs */}
          <div className="header-actions-group">
            <button
              className="btn-atlas-secondary"
              onClick={onTriggerDrill}
              disabled={isDrillRunning}
              title="Trigger real-time multi-severity pipeline drill"
            >
              <Radio size={14} color="#0D0D0D" className={isDrillRunning ? 'spin-anim' : ''} />
              <span>{isDrillRunning ? 'Synthesizing...' : 'Simulate Load'}</span>
            </button>

            <button
              className="btn-atlas-primary"
              onClick={onOpenReportModal}
              title="Ingest new emergency incident into live pipeline"
            >
              <PlusCircle size={15} />
              <span>Intake Incident</span>
            </button>
          </div>
        </header>

        {/* 3. Nested Page Content */}
        <Outlet />
      </div>
    </div>
  );
}
