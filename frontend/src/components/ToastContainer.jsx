import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald" />;
      case 'error':
        return <AlertCircle size={16} className="text-critical" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber" />;
      default:
        return <Info size={16} className="text-cyan" />;
    }
  };

  return (
    <div className="toast-floating-container" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast-card toast-${toast.type || 'info'}`}>
          <div className="toast-icon-wrap">
            {getIcon(toast.type)}
          </div>
          <div className="toast-content-wrap">
            {toast.title && <h5 className="toast-title">{toast.title}</h5>}
            <p className="toast-message">{toast.message}</p>
          </div>
          <button 
            className="btn-toast-dismiss" 
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
