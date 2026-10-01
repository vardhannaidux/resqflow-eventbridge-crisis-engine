import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Flame, 
  Radio, 
  MapPin, 
  PlusCircle, 
  CheckCircle2, 
  Crosshair, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Image as ImageIcon,
  ArrowRight,
  Command
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  incidents = [],
  onSelectIncident,
  onOpenReportModal,
  onTriggerDrill,
  onRecenterMap,
  onToggleSound,
  isSoundMuted,
  onToggleTheme,
  onToggleCinematicBg
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Default action commands
  const baseActions = [
    {
      id: 'cmd-report',
      title: 'Report New Emergency Incident',
      category: 'Intake Action',
      icon: <PlusCircle size={15} className="text-critical" />,
      action: () => { onClose(); onOpenReportModal(); }
    },
    {
      id: 'cmd-drill',
      title: 'Trigger Synchronized 3-Incident Disaster Drill',
      category: 'Simulation',
      icon: <Radio size={15} className="text-purple" />,
      action: () => { onClose(); onTriggerDrill(); }
    },
    {
      id: 'cmd-recenter',
      title: 'Recenter Map to Hyderabad Operations Sector',
      category: 'Geospatial',
      icon: <Crosshair size={15} className="text-cyan" />,
      action: () => { onClose(); onRecenterMap(); }
    },
    {
      id: 'cmd-sound',
      title: isSoundMuted ? 'Unmute Tactical Audio Alerts' : 'Mute Tactical Audio Alerts',
      category: 'Preferences',
      icon: isSoundMuted ? <Volume2 size={15} /> : <VolumeX size={15} />,
      action: () => { onToggleSound(); }
    },
    {
      id: 'cmd-backdrop',
      title: 'Toggle Cinematic Night-City Backdrop',
      category: 'Aesthetics',
      icon: <ImageIcon size={15} className="text-cyan" />,
      action: () => { onToggleCinematicBg(); }
    },
    {
      id: 'cmd-theme',
      title: 'Toggle Dark Glass / High-Contrast Theme',
      category: 'Display',
      icon: <Moon size={15} className="text-amber" />,
      action: () => { onToggleTheme(); }
    }
  ];

  // Incidents transformed to searchable items
  const incidentItems = incidents.map(inc => ({
    id: `inc-${inc.incidentId}`,
    title: `[${inc.severity || 'INC'}] ${inc.incidentId}: ${inc.type} - ${inc.description || 'Emergency'}`,
    category: `Incident (${inc.status})`,
    icon: <Flame size={14} className={inc.severity === 'CRITICAL' ? 'text-critical' : 'text-amber'} />,
    action: () => { onClose(); onSelectIncident(inc); }
  }));

  const allItems = [...baseActions, ...incidentItems];

  const filteredItems = query.trim()
    ? allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 10);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="palette-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-bar">
          <Search size={18} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input mono"
            placeholder="Type a command, incident ID, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="palette-esc-kbd" onClick={onClose}>ESC</kbd>
        </div>

        <div className="palette-results-list">
          {filteredItems.length === 0 ? (
            <div className="palette-no-results">
              No matching commands or incidents found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className={`palette-item-row ${idx === selectedIndex ? 'item-selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="palette-item-left">
                  <div className="palette-icon-wrap">{item.icon}</div>
                  <div className="palette-text-wrap">
                    <span className="palette-title">{item.title}</span>
                    <span className="palette-category">{item.category}</span>
                  </div>
                </div>
                <ArrowRight size={14} className="palette-arrow" />
              </div>
            ))
          )}
        </div>

        <div className="palette-footer-hints">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>esc</kbd> Dismiss</span>
        </div>
      </div>
    </div>
  );
}
