import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Layers, 
  Maximize2, 
  Crosshair, 
  Building2, 
  Truck, 
  Navigation, 
  AlertTriangle,
  Flame,
  Search,
  PlusCircle,
  X,
  Info
} from 'lucide-react';
import { DEMO_HOSPITALS, DEMO_RESPONSE_UNITS } from '../fixtures/demoScenarios';

const HYDERABAD_CENTER = [17.4065, 78.4772];
const DEFAULT_ZOOM = 12;

export default function IncidentMap({
  incidents = [],
  selectedIncident = null,
  onSelectIncident,
  onMapClick
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const fleetLayerRef = useRef(null);
  const hospitalsLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  const [showIncidents, setShowIncidents] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [isPinpointMode, setIsPinpointMode] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapError, setMapError] = useState(null);
  const [activePin, setActivePin] = useState(null);

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: HYDERABAD_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false
      });

      // OpenStreetMap Standard Tiles (100% Free, Zero API Key required, No Watermarks)
      const tileLayer = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }
      );

      tileLayer.addTo(map);

      // Attribution control in bottom-right
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      // Zoom Control at bottom-left
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Create feature group layers
      markersLayerRef.current = L.layerGroup().addTo(map);
      fleetLayerRef.current = L.layerGroup().addTo(map);
      hospitalsLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);

      // Handle map clicks for coordinate selection
      map.on('click', (e) => {
        const lat = parseFloat(e.latlng.lat.toFixed(5));
        const lon = parseFloat(e.latlng.lng.toFixed(5));
        setActivePin({ lat, lon });
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
      setMapError('Failed to initialize map display. Using fallback tactical list.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Hospital and Response Base Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hospLayer = hospitalsLayerRef.current;
    if (!map || !hospLayer) return;

    hospLayer.clearLayers();

    if (!showHospitals) return;

    DEMO_HOSPITALS.forEach(hosp => {
      const icon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="map-hospital-pin" title="${hosp.name} (${hosp.tier})">
            <span class="hospital-cross">+</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([hosp.latitude, hosp.longitude], { icon });
      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-badge badge-hospital" style="background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE;">TRAUMA FACILITY</div>
          <h4 class="popup-title" style="font-size: 14px; font-weight: 700; color: #14233B; margin: 4px 0;">${hosp.name}</h4>
          <p class="popup-tier" style="font-size: 12px; color: #64748B;">${hosp.tier}</p>
          <div class="popup-stat-grid" style="display: grid; grid-template-columns: 1fr; gap: 4px; font-size: 11px; margin-top: 8px;">
            <div>Available Beds: <strong>${hosp.emergencyBedsAvailable} / ${hosp.emergencyBedsTotal}</strong></div>
            <div>ICU Units: <strong>${hosp.icuBedsAvailable} Available</strong></div>
            <div>Helipad: <strong>${hosp.helipadAvailable ? 'YES' : 'NO'}</strong></div>
          </div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 8px; border-top: 1px solid #E2E8F0; padding-top: 4px;">
            [SIMULATED CAPACITY RECORD • AWS AP-SOUTH-2]
          </div>
        </div>
      `);
      marker.addTo(hospLayer);
    });
  }, [showHospitals]);

  // Update Tactical Fleet Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const fltLayer = fleetLayerRef.current;
    if (!map || !fltLayer) return;

    fltLayer.clearLayers();

    if (!showFleet) return;

    // Check active dispatches to colorize fleet
    const activeTeams = new Set(
      incidents
        .filter(i => i.status === 'DISPATCHED' && i.assignedTeam && !i.assignedTeam.includes('Pending'))
        .map(i => i.assignedTeam)
    );

    DEMO_RESPONSE_UNITS.forEach(unit => {
      const isBusy = Array.from(activeTeams).some(t => t.includes(unit.id) || t.includes(unit.name));
      const icon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="map-fleet-pin ${isBusy ? 'fleet-busy' : 'fleet-standby'}" title="${unit.name} (${unit.tier})">
            <span class="fleet-icon">⚡</span>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([unit.latitude, unit.longitude], { icon });
      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-badge" style="background: ${isBusy ? '#FEF2F2' : '#ECFDF5'}; color: ${isBusy ? '#DC2626' : '#059669'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
            ${isBusy ? 'DISPATCHED' : 'STANDBY (READY)'}
          </div>
          <h4 class="popup-title" style="font-size: 14px; font-weight: 700; color: #14233B; margin: 4px 0;">${unit.name}</h4>
          <p style="font-size: 12px; color: #64748B;">${unit.type} • Crew Size: ${unit.crewSize}</p>
          <p style="font-size: 11px; color: #14233B; margin-top: 4px;"><strong>Base:</strong> ${unit.baseLocation}</p>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 8px; border-top: 1px solid #E2E8F0; padding-top: 4px;">
            [SIMULATED FLEET REGISTRY]
          </div>
        </div>
      `);
      marker.addTo(fltLayer);
    });
  }, [showFleet, incidents]);

  // Update Incident Markers and Illustrative Route Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markLayer = markersLayerRef.current;
    const routeLayer = routesLayerRef.current;
    if (!map || !markLayer || !routeLayer) return;

    markLayer.clearLayers();
    routeLayer.clearLayers();

    if (!showIncidents) return;

    const validIncidents = incidents.filter(
      inc => inc.latitude && inc.longitude && !isNaN(inc.latitude) && !isNaN(inc.longitude)
    );

    validIncidents.forEach(incident => {
      const isSelected = selectedIncident && selectedIncident.incidentId === incident.incidentId;
      const isResolved = incident.status === 'RESOLVED';
      const severity = incident.severity || 'UNKNOWN';

      let sevClass = 'sev-medium';
      if (isResolved) sevClass = 'sev-resolved';
      else if (severity === 'CRITICAL') sevClass = 'sev-critical';
      else if (severity === 'HIGH') sevClass = 'sev-high';

      const icon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div class="map-incident-marker ${sevClass} ${isSelected ? 'is-selected' : ''}">
            <div class="marker-pulse-ring"></div>
            <div class="marker-core-dot">
              <span class="marker-code">${(incident.type || 'INC').substring(0, 1)}</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([Number(incident.latitude), Number(incident.longitude)], { icon });

      marker.on('click', () => {
        if (onSelectIncident) {
          onSelectIncident(incident);
        }
      });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-badge badge-${sevClass}">${severity} • ${incident.status}</div>
          <h4 class="popup-title">${incident.type} Emergency</h4>
          <p class="popup-desc">${incident.description || 'No description provided'}</p>
          <div class="popup-stat-grid">
            <div>Casualties: <strong>${incident.peopleAffected || 0}</strong></div>
            <div>Assigned Team: <strong>${incident.assignedTeam || 'Pending'}</strong></div>
            <div>ETA: <strong>${incident.etaMinutes ? `${incident.etaMinutes} min` : 'Triage In Progress'}</strong></div>
          </div>
          <div class="popup-coordinates mono">${Number(incident.latitude).toFixed(4)}, ${Number(incident.longitude).toFixed(4)}</div>
          <div style="margin-top: 8px;">
            <a href="/incidents/${incident.incidentId}" style="display: block; text-align: center; background: #2563EB; color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-decoration: none;">
              Open Full Dossier →
            </a>
          </div>
        </div>
      `);

      marker.addTo(markLayer);

      // Illustrative straight-line route vector
      if (showRoutes && !isResolved && incident.assignedTeam && !incident.assignedTeam.includes('Pending')) {
        const matchedHosp = DEMO_HOSPITALS.find(h => incident.hospital && incident.hospital.includes(h.name.split(' ')[0])) || DEMO_HOSPITALS[0];
        if (matchedHosp) {
          const latlngs = [
            [matchedHosp.latitude, matchedHosp.longitude],
            [Number(incident.latitude), Number(incident.longitude)]
          ];

          const polyline = L.polyline(latlngs, {
            color: severity === 'CRITICAL' ? '#DC2626' : '#2563EB',
            weight: 2,
            dashArray: '6, 8',
            opacity: 0.75
          });

          polyline.bindTooltip(
            `Illustrative Dispatch Vector: ${matchedHosp.name.split(',')[0]} ➔ ${incident.incidentId} (~${incident.etaMinutes || 10} min Haversine estimate)<br><em>*Straight-line Euclidean estimate, not road navigation.</em>`,
            { sticky: true, className: 'map-route-tooltip' }
          );

          polyline.addTo(routeLayer);
        }
      }
    });

    // Auto-fit bounds if we have valid incidents and none is explicitly focused
    if (validIncidents.length > 0 && !selectedIncident) {
      try {
        const bounds = L.latLngBounds(validIncidents.map(i => [Number(i.latitude), Number(i.longitude)]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // Fallback
      }
    }
  }, [incidents, selectedIncident, showIncidents, showRoutes]);

  // Center on selected incident if provided
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncident) return;
    const lat = Number(selectedIncident.latitude);
    const lon = Number(selectedIncident.longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1.2 });
    }
  }, [selectedIncident]);

  const handleRecenterHyderabad = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(HYDERABAD_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const valid = incidents.filter(i => i.latitude && i.longitude);
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map(i => [Number(i.latitude), Number(i.longitude)]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      handleRecenterHyderabad();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!mapSearch.trim() || !mapInstanceRef.current) return;
    const q = mapSearch.toLowerCase().trim();
    const found = incidents.find(i => 
      i.incidentId.toLowerCase().includes(q) || 
      (i.type && i.type.toLowerCase().includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
    if (found && found.latitude && found.longitude) {
      mapInstanceRef.current.flyTo([Number(found.latitude), Number(found.longitude)], 15, { duration: 1.2 });
      if (onSelectIncident) onSelectIncident(found);
    }
  };

  return (
    <div className="atlas-card map-card-container" role="region" aria-label="Interactive Geospatial Operations Map" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Map Control Toolbar Header */}
      <div className="map-toolbar" style={{ padding: '10px 16px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Crosshair size={16} color="#2563EB" />
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#14233B', margin: 0 }}>
            Geospatial Operations Theatre
          </h2>
          <span className="badge-atlas dispatched" style={{ fontSize: '10px' }}>
            {incidents.length} Active Points
          </span>
        </div>

        {/* Quick Map Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ position: 'relative', width: '180px' }}>
            <Search size={12} color="#94A3B8" style={{ position: 'absolute', left: '8px', top: '7px' }} />
            <input 
              type="text"
              placeholder="Find incident on map..."
              value={mapSearch}
              onChange={e => setMapSearch(e.target.value)}
              style={{ width: '100%', padding: '4px 8px 4px 26px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '4px', outline: 'none' }}
            />
          </div>
        </form>

        {/* Layer Toggles & View Controls */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Toggle Incidents */}
          <button
            className={`filter-btn-pill ${showIncidents ? 'active' : ''}`}
            onClick={() => setShowIncidents(prev => !prev)}
            title="Toggle Incident Markers"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Incidents
          </button>

          {/* Toggle Fleet Units */}
          <button
            className={`filter-btn-pill ${showFleet ? 'active' : ''}`}
            onClick={() => setShowFleet(prev => !prev)}
            title="Toggle Tactical Response Units"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Tactical Fleet
          </button>

          {/* Toggle Hospitals */}
          <button
            className={`filter-btn-pill ${showHospitals ? 'active' : ''}`}
            onClick={() => setShowHospitals(prev => !prev)}
            title="Toggle Hospital Trauma Facilities"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Trauma Centers
          </button>

          {/* Toggle Route Vectors */}
          <button
            className={`filter-btn-pill ${showRoutes ? 'active' : ''}`}
            onClick={() => setShowRoutes(prev => !prev)}
            title="Toggle Illustrative Dispatch Vectors"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Vectors
          </button>

          {/* Recenter */}
          <button
            className="filter-btn-pill"
            onClick={handleRecenterHyderabad}
            title="Recenter Map on Hyderabad Core"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Recenter
          </button>

          {/* Fit All */}
          <button
            className="filter-btn-pill"
            onClick={handleFitAll}
            title="Fit view to show all active records"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            Fit All
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="map-canvas-wrapper" style={{ flex: 1, position: 'relative', minHeight: '440px' }}>
        {mapError ? (
          <div className="map-fallback-banner" style={{ padding: '40px', textAlign: 'center' }}>
            <AlertTriangle size={24} color="#DC2626" />
            <p style={{ marginTop: '8px', color: '#14233B' }}>{mapError}</p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="leaflet-map-element" id="resqflow-operations-map" style={{ width: '100%', height: '100%', minHeight: '440px' }} />
        )}

        {/* Click-to-Pin Action Banner */}
        {activePin && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: '#FFFFFF',
            border: '1px solid #2563EB',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>Selected Map Location</span>
              <div className="mono" style={{ fontSize: '12px', fontWeight: 600, color: '#14233B' }}>
                Lat {activePin.lat}, Lon {activePin.lon}
              </div>
            </div>
            {onMapClick && (
              <button 
                className="btn-atlas-primary"
                onClick={() => {
                  onMapClick({ latitude: activePin.lat, longitude: activePin.lon });
                  setActivePin(null);
                }}
                style={{ padding: '6px 10px', fontSize: '11px' }}
              >
                <PlusCircle size={12} />
                <span>Report Here</span>
              </button>
            )}
            <button 
              onClick={() => setActivePin(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Floating Map Legend Overlay */}
        <div className="map-legend-overlay" style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '10px 12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: 999,
          fontSize: '11px',
          color: '#14233B',
          maxWidth: '220px'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '6px', color: '#14233B', borderBottom: '1px solid #F1F5F9', paddingBottom: '4px' }}>
            Operational Legend
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }}></span>
              <span>Critical (Tier-1 ERT)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EA580C' }}></span>
              <span>High (Tier-2 PRT)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CA8A04' }}></span>
              <span>Medium (Tier-3 SRT)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
              <span>Resolved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#2563EB', fontWeight: 700 }}>+</span>
              <span>Trauma Center</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#D97706' }}>⚡</span>
              <span>Response Unit Base</span>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '6px', borderTop: '1px solid #F1F5F9', paddingTop: '4px' }}>
            *Click map to report with coordinates. Vectors are Haversine approximations.
          </div>
        </div>
      </div>
    </div>
  );
}
