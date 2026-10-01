import React, { useEffect, useRef, useState } from 'react';
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
  Eye, 
  EyeOff, 
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react';
import { DEMO_HOSPITALS, DEMO_RESPONSE_UNITS } from '../fixtures/demoScenarios';

const HYDERABAD_CENTER = [17.4065, 78.4772];
const DEFAULT_ZOOM = 12;

export default function IncidentMap({
  incidents = [],
  selectedIncident = null,
  onSelectIncident
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const hospitalsLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  const [showHospitals, setShowHospitals] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapError, setMapError] = useState(null);

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

      // OpenStreetMap Tiles transformed with Dark Tactical Glass filter
      const tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19
        }
      );

      tileLayer.addTo(map);

      // Attribution control in bottom-right
      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

      // Add Zoom Control at bottom-left
      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // Create feature group layers
      markersLayerRef.current = L.layerGroup().addTo(map);
      hospitalsLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);

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
          <div class="popup-badge badge-hospital">TRAUMA FACILITY</div>
          <h4 class="popup-title">${hosp.name}</h4>
          <p class="popup-tier">${hosp.tier}</p>
          <div class="popup-stat-grid">
            <div>Available Beds: <strong>${hosp.emergencyBedsAvailable} / ${hosp.emergencyBedsTotal}</strong></div>
            <div>ICU Units: <strong>${hosp.icuBedsAvailable} Available</strong></div>
            <div>Helipad: <strong>${hosp.helipadAvailable ? 'YES' : 'NO'}</strong></div>
          </div>
          <div class="popup-footer-note">[SIMULATED CAPACITY RECORD]</div>
        </div>
      `);
      marker.addTo(hospLayer);
    });
  }, [showHospitals]);

  // Update Incident Markers and Illustrative Route Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markLayer = markersLayerRef.current;
    const routeLayer = routesLayerRef.current;
    if (!map || !markLayer || !routeLayer) return;

    markLayer.clearLayers();
    routeLayer.clearLayers();

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
        </div>
      `);

      marker.addTo(markLayer);

      // If active and assigned to a hospital, draw an illustrative approximate route line
      if (showRoutes && !isResolved && incident.assignedTeam && !incident.assignedTeam.includes('Pending')) {
        // Find nearest or matched demo hospital
        const matchedHosp = DEMO_HOSPITALS.find(h => incident.hospital && incident.hospital.includes(h.name.split(' ')[0])) || DEMO_HOSPITALS[0];
        if (matchedHosp) {
          const latlngs = [
            [matchedHosp.latitude, matchedHosp.longitude],
            [Number(incident.latitude), Number(incident.longitude)]
          ];

          const polyline = L.polyline(latlngs, {
            color: severity === 'CRITICAL' ? '#ff3b5c' : '#00e5ff',
            weight: 2,
            dashArray: '6, 8',
            opacity: 0.65
          });

          polyline.bindTooltip(
            `Illustrative Route Vector: ${matchedHosp.name.split(',')[0]} ➔ ${incident.incidentId} (~${incident.etaMinutes || 10} min ETA)<br><em>*Approximate illustrative route, not live GPS navigation</em>`,
            { sticky: true, className: 'map-route-tooltip' }
          );

          polyline.addTo(routeLayer);
        }
      }
    });

    // Auto-fit bounds if we have valid incidents
    if (validIncidents.length > 0 && !selectedIncident) {
      try {
        const bounds = L.latLngBounds(validIncidents.map(i => [Number(i.latitude), Number(i.longitude)]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // bounds calculation error fallback
      }
    }
  }, [incidents, selectedIncident, showRoutes]);

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

  return (
    <div className="glass-panel map-card-container" role="region" aria-label="Interactive Geospatial Operations Map">
      {/* Map Control Toolbar Header */}
      <div className="map-toolbar">
        <div className="map-toolbar-left">
          <div className="map-title-row">
            <Crosshair size={18} className="text-cyan" />
            <h2 className="map-title">Geospatial Operations Theatre</h2>
            <span className="map-count-badge">{incidents.length} Geocoded Incidents</span>
          </div>
          <span className="map-subtitle">
            Sector ap-south-2 • Hyderabad Municipal & Cyberabad Metropolitan Area
          </span>
        </div>

        <div className="map-toolbar-actions">
          {/* Toggle Hospitals */}
          <button
            className={`map-ctrl-btn ${showHospitals ? 'active' : ''}`}
            onClick={() => setShowHospitals(prev => !prev)}
            title="Toggle Hospital Trauma Facilities"
          >
            <Building2 size={13} />
            <span>Trauma Centers</span>
          </button>

          {/* Toggle Illustrative Routes */}
          <button
            className={`map-ctrl-btn ${showRoutes ? 'active' : ''}`}
            onClick={() => setShowRoutes(prev => !prev)}
            title="Toggle Illustrative Dispatch Route Vectors"
          >
            <Navigation size={13} />
            <span>Dispatch Vectors</span>
          </button>

          {/* Recenter Hyderabad */}
          <button
            className="map-ctrl-btn"
            onClick={handleRecenterHyderabad}
            title="Recenter Map on Hyderabad Core"
          >
            <Crosshair size={13} />
            <span>Recenter</span>
          </button>

          {/* Fit Bounds */}
          <button
            className="map-ctrl-btn"
            onClick={handleFitAll}
            title="Fit view to show all active incidents"
          >
            <Maximize2 size={13} />
            <span>Fit All</span>
          </button>
        </div>
      </div>

      {/* Map Canvas or Error */}
      <div className="map-canvas-wrapper">
        {mapError ? (
          <div className="map-fallback-banner">
            <AlertTriangle size={24} className="text-critical" />
            <p>{mapError}</p>
          </div>
        ) : (
          <div ref={mapContainerRef} className="leaflet-map-element" id="resqflow-operations-map" />
        )}

        {/* Floating Map Legend Overlay */}
        <div className="map-legend-overlay">
          <div className="legend-header">Operational Legend</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-dot dot-critical"></span>
              <span>Critical (Tier-1 ERT)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-high"></span>
              <span>High (Tier-2 PRT)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-medium"></span>
              <span>Medium (Tier-3 SRT)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot dot-resolved"></span>
              <span>Resolved</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon-box text-cyan">+</span>
              <span>Trauma Center</span>
            </div>
          </div>
          <div className="legend-disclaimer">
            *Routes are approximate illustrative vectors. Not turn-by-turn road navigation.
          </div>
        </div>
      </div>
    </div>
  );
}
