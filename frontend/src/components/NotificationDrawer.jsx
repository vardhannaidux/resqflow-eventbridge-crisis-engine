import React from 'react';
import { 
  X, 
  Bell, 
  Radio, 
  CheckCheck, 
  Clock, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onClearNotifications,
  onSelectIncident
}) {
  if (!isOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel-right" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-row">
            <Bell size={18} className="text-cyan" />
            <h3 className="drawer-title">Emergency Broadcast Audit</h3>
            <span className="drawer-count-tag">{notifications.length} Alerts</span>
          </div>

          <div className="drawer-header-actions">
            {notifications.length > 0 && (
              <button 
                className="btn-clear-alerts" 
                onClick={onClearNotifications}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark Read</span>
              </button>
            )}
            <button className="btn-close-drawer" onClick={onClose} aria-label="Close notification drawer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Stream Body */}
        <div className="drawer-scroll-body">
          {notifications.length === 0 ? (
            <div className="drawer-empty-state">
              <Bell size={32} className="text-muted" />
              <p className="empty-p">No unread alerts.</p>
              <span className="empty-sub">SNS emergency broadcasts and EventBridge dispatch telemetry will appear here in real-time.</span>
            </div>
          ) : (
            <div className="notification-cards-list">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notif-card ${notif.severity === 'CRITICAL' ? 'card-critical' : notif.type === 'RESOLVED' ? 'card-resolved' : 'card-standard'}`}
                  onClick={() => {
                    if (notif.incident && onSelectIncident) {
                      onSelectIncident(notif.incident);
                      onClose();
                    }
                  }}
                >
                  <div className="notif-top">
                    <span className="notif-channel mono">Amazon SNS • ResQFlowAlerts</span>
                    <span className="notif-time mono">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <h5 className="notif-subject">{notif.title}</h5>
                  <p className="notif-message">{notif.message}</p>

                  <div className="notif-footer">
                    <span className="notif-unit">Target: {notif.target || 'Regional Responders'}</span>
                    <span className="notif-inspect-link">
                      View Dossier <ArrowRight size={11} className="inline-icon" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
