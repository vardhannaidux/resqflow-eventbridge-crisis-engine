import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Users, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Crosshair, 
  Zap, 
  Activity,
  ArrowRightLeft,
  X,
  RefreshCw,
  Info,
  Scale
} from 'lucide-react';
import { DEMO_RESPONSE_UNITS, DEMO_HOSPITALS } from '../fixtures/demoScenarios';
import { api } from '../services/api';

// Sector Command Coordinates (Central Hyderabad)
const SECTOR_COMMAND_LAT = 17.4065;
const SECTOR_COMMAND_LON = 78.4772;

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round((R * c) * 10) / 10;
}

const UNIT_RECOMMENDATION_RATIONALE = {
  'ERT-HYD-01': 'Optimal for CRITICAL fire, hazmat, or multi-story structural collapse emergencies. Heavy tactical extrication crew with Tier-1 trauma stabilization.',
  'PRT-HYD-02': 'Recommended for HIGH severity cardiac, mass casualty traffic collisions, or multi-patient trauma requiring Advanced Life Support (ALS) en-route.',
  'SRT-HYD-03': 'Recommended for MEDIUM and LOW severity incidents, perimeter crowd control, localized hazard mitigation, and rapid triage assessment.',
  'DRT-HYD-04': 'Dedicated amphibious and search-and-rescue team. Recommended for monsoon flooding, water rescues, drone surveillance, and wide-area structural searches.'
};

export default function ResourcesPage({ incidents = [] }) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'FLEET' | 'HOSPITALS'
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // 'ALL' | 'STANDBY' | 'DISPATCHED'
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [units, setUnits] = useState(DEMO_RESPONSE_UNITS);
  const [hospitals, setHospitals] = useState(DEMO_HOSPITALS);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState('Live API Seeded Simulation');

  // Load from backend API if available
  const loadResources = async () => {
    setIsLoading(true);
    try {
      const data = await api.getResources();
      if (data && data.resources && data.resources.length > 0) {
        setUnits(data.resources);
        if (data.hospitals && data.hospitals.length > 0) {
          setHospitals(data.hospitals);
        }
        setDataSource(data.isSimulation ? 'AWS Backend Ingestion API (Simulated Registry)' : 'Live Operational Fleet');
      }
    } catch {
      setDataSource('Local Seeded Demonstration Fixtures');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Dynamically mark fleet status based on active incidents
  const assignedTeams = new Set(
    incidents
      .filter(i => i.status === 'DISPATCHED' && i.assignedTeam && !i.assignedTeam.includes('Pending'))
      .map(i => i.assignedTeam)
  );

  const enrichedUnits = units.map(unit => {
    const isAssigned = Array.from(assignedTeams).some(t => t.includes(unit.id) || t.includes(unit.name));
    const dist = calculateHaversineKm(SECTOR_COMMAND_LAT, SECTOR_COMMAND_LON, unit.latitude, unit.longitude);
    return {
      ...unit,
      status: isAssigned ? 'DISPATCHED' : (unit.status || 'STANDBY'),
      currentAssignment: incidents.find(i => i.status === 'DISPATCHED' && (i.assignedTeam?.includes(unit.id) || i.assignedTeam?.includes(unit.name))),
      distanceKm: dist,
      recommendationWhy: UNIT_RECOMMENDATION_RATIONALE[unit.id] || 'General municipal emergency response capability.'
    };
  });

  const enrichedHospitals = hospitals.map(hosp => {
    const dist = calculateHaversineKm(SECTOR_COMMAND_LAT, SECTOR_COMMAND_LON, hosp.latitude, hosp.longitude);
    return {
      ...hosp,
      distanceKm: dist
    };
  });

  const filteredFleet = enrichedUnits.filter(u => {
    const matchesQuery = !filterQuery || 
      u.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.type.toLowerCase().includes(filterQuery.toLowerCase()) ||
      u.specialties?.some(s => s.toLowerCase().includes(filterQuery.toLowerCase()));
    
    const matchesAvailability = availabilityFilter === 'ALL' || u.status === availabilityFilter;
    return matchesQuery && matchesAvailability;
  });

  const filteredHospitals = enrichedHospitals.filter(h => {
    const matchesQuery = !filterQuery || 
      h.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(filterQuery.toLowerCase()) ||
      h.tier.toLowerCase().includes(filterQuery.toLowerCase());
    
    const matchesAvailability = availabilityFilter === 'ALL' || 
      (availabilityFilter === 'STANDBY' ? h.emergencyBedsAvailable > 0 : h.emergencyBedsAvailable === 0);
    return matchesQuery && matchesAvailability;
  });

  const toggleSelectForComparison = (item) => {
    if (selectedForComparison.some(s => s.id === item.id)) {
      setSelectedForComparison(selectedForComparison.filter(s => s.id !== item.id));
    } else {
      if (selectedForComparison.length >= 3) {
        alert('You can compare a maximum of 3 resources simultaneously.');
        return;
      }
      setSelectedForComparison([...selectedForComparison, item]);
    }
  };

  return (
    <div className="page-container">
      {/* Page Title & Operational Header */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Response Fleet & Emergency Facilities</h1>
          <p className="page-subtitle">Tactical unit availability, capability routing, and trauma hospital readiness</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedForComparison.length > 0 && (
            <button 
              className="btn-atlas-primary"
              onClick={() => setIsComparing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Scale size={14} />
              Compare Selected ({selectedForComparison.length}/3)
            </button>
          )}

          <button 
            className="btn-atlas-secondary"
            onClick={loadResources}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            {isLoading ? 'Polling Fleet...' : 'Sync Registry'}
          </button>
        </div>
      </div>

      {/* Simulation & Data Lineage Notice Banner */}
      <div className="atlas-simulation-banner">
        <div className="banner-left-info">
          <span className="banner-pill-label">
            <AlertTriangle size={13} />
            SIMULATED RESOURCE REGISTRY
          </span>
          <p className="banner-expl-text">
            All tactical units, crew sizes, vehicle classes, and hospital bed capacities are 
            <strong> seeded demo fixtures</strong> backed by {dataSource}. Straight-line distances are computed using the Haversine formula (no road network routing or live GPS tracking implied).
          </p>
        </div>
      </div>

      {/* Filter & View Tabs Toolbar */}
      <div className="atlas-filter-toolbar">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`btn-atlas-secondary ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Resources ({enrichedUnits.length + enrichedHospitals.length})
          </button>
          <button 
            className={`btn-atlas-secondary ${activeTab === 'FLEET' ? 'active' : ''}`}
            onClick={() => setActiveTab('FLEET')}
          >
            <Truck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
            Tactical Fleet ({enrichedUnits.length})
          </button>
          <button 
            className={`btn-atlas-secondary ${activeTab === 'HOSPITALS' ? 'active' : ''}`}
            onClick={() => setActiveTab('HOSPITALS')}
          >
            <Building2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
            Trauma Centers ({enrichedHospitals.length})
          </button>

          {/* Availability Filter Dropdown */}
          <select 
            className="filter-select"
            value={availabilityFilter}
            onChange={e => setAvailabilityFilter(e.target.value)}
            style={{ marginLeft: '8px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="STANDBY">Available / Standby Only</option>
            <option value="DISPATCHED">Dispatched / Full Only</option>
          </select>
        </div>

        <div className="filter-input-wrap" style={{ width: '280px' }}>
          <input 
            type="text" 
            className="filter-text-input"
            placeholder="Search unit, specialty, hospital..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Section 1: Tactical Response Fleet */}
      {(activeTab === 'ALL' || activeTab === 'FLEET') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#14233B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="#2563EB" />
              Emergency Response Units ({filteredFleet.length})
            </h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {enrichedUnits.filter(u => u.status === 'STANDBY').length} Units on Standby • {enrichedUnits.filter(u => u.status === 'DISPATCHED').length} Dispatched
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {filteredFleet.map(unit => {
              const isSelected = selectedForComparison.some(s => s.id === unit.id);
              return (
                <div 
                  key={unit.id} 
                  className="atlas-card" 
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                    boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForComparison(unit)}
                        style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#2563EB' }}
                        title="Select for comparison"
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px' }}>
                            {unit.id}
                          </span>
                          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B' }}>{unit.name}</h3>
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'block' }}>
                          {unit.type} • {unit.tier}
                        </span>
                      </div>
                    </div>

                    <span className={`badge-atlas ${unit.status === 'DISPATCHED' ? 'high' : 'low'}`}>
                      {unit.status}
                    </span>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><strong>Vehicle:</strong> {unit.vehicle}</div>
                    <div><strong>Crew Manifest:</strong> {unit.crewSize} Specialized Responders</div>
                    <div><strong>Base Depot:</strong> {unit.baseLocation}</div>
                    {unit.distanceKm != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                        <MapPin size={12} color="#2563EB" />
                        <span>Approx. straight-line: <strong>{unit.distanceKm} km</strong> from Sector Command</span>
                      </div>
                    )}
                  </div>

                  {unit.currentAssignment && (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#1E40AF' }}>
                      <strong>Active Assignment: </strong> Dispatched to {unit.currentAssignment.incidentId} ({unit.currentAssignment.type})
                    </div>
                  )}

                  {/* Recommendation Rationale */}
                  <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', color: '#166534' }}>
                    <strong>Recommendation Match: </strong> {unit.recommendationWhy}
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Operational Specialties
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {unit.specialties?.map(spec => (
                        <span key={spec} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: '#334155' }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Regional Trauma Centers */}
      {(activeTab === 'ALL' || activeTab === 'HOSPITALS') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#14233B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#059669" />
              Regional Trauma Hospitals ({filteredHospitals.length})
            </h2>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Simulated Bed Capacity Monitoring
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {filteredHospitals.map(hosp => {
              const bedPercent = Math.round((hosp.emergencyBedsAvailable / hosp.emergencyBedsTotal) * 100);
              const isSelected = selectedForComparison.some(s => s.id === hosp.id);

              return (
                <div 
                  key={hosp.id} 
                  className="atlas-card" 
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '14px',
                    borderColor: isSelected ? '#059669' : '#E2E8F0',
                    boxShadow: isSelected ? '0 0 0 2px rgba(5,150,105,0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForComparison(hosp)}
                        style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#059669' }}
                        title="Select for comparison"
                      />
                      <div>
                        <span className="badge-atlas low" style={{ marginBottom: '6px', display: 'inline-block' }}>
                          {hosp.tier}
                        </span>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#14233B', lineHeight: 1.3 }}>{hosp.name}</h3>
                        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{hosp.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bed Occupancy Meter */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748B' }}>Emergency Beds:</span>
                      <span style={{ fontWeight: 700, color: '#14233B' }}>
                        {hosp.emergencyBedsAvailable} / {hosp.emergencyBedsTotal} ({bedPercent}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${bedPercent}%`,
                        height: '100%',
                        background: bedPercent > 25 ? '#059669' : '#DC2626',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>ICU Beds:</span>
                      <span style={{ fontWeight: 700, color: '#2563EB' }}>{hosp.icuBedsAvailable} Open</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Blood Bank:</span>
                      <span style={{ fontWeight: 700, color: '#059669' }}>{hosp.bloodBankStatus}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Helipad Ingress:</span>
                      <span style={{ fontWeight: 700, color: hosp.helipadAvailable ? '#059669' : '#94A3B8' }}>
                        {hosp.helipadAvailable ? 'ACTIVE' : 'NONE'}
                      </span>
                    </div>
                    {hosp.distanceKm != null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #CBD5E1', paddingTop: '6px', marginTop: '2px' }}>
                        <span style={{ color: '#64748B' }}>Haversine Range:</span>
                        <span style={{ fontWeight: 700, color: '#14233B' }}>{hosp.distanceKm} km</span>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={12} />
                    <span>{hosp.contact}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Drawer / Modal */}
      {isComparing && (
        <div className="atlas-modal-overlay" onClick={() => setIsComparing(false)}>
          <div 
            className="atlas-modal-box" 
            style={{ maxWidth: '900px', width: '95%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="atlas-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={20} color="#2563EB" />
                <h3 className="atlas-modal-title">Resource Capability & Readiness Comparison</h3>
              </div>
              <button className="atlas-modal-close" onClick={() => setIsComparing(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="atlas-modal-body" style={{ overflowX: 'auto' }}>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                Side-by-side evaluation of selected response assets and medical facilities for dispatch prioritization.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', width: '160px', color: '#64748B' }}>Parameter</th>
                    {selectedForComparison.map(res => (
                      <th key={res.id} style={{ padding: '12px', textAlign: 'left', color: '#14233B', fontWeight: 700 }}>
                        {res.name}
                        <span className="mono" style={{ display: 'block', fontSize: '11px', color: '#2563EB', fontWeight: 600 }}>
                          {res.id}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Category / Tier</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px' }}>
                        {res.tier || res.type}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Status</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px' }}>
                        <span className={`badge-atlas ${res.status === 'DISPATCHED' ? 'high' : 'low'}`}>
                          {res.status || (res.emergencyBedsAvailable > 0 ? 'AVAILABLE' : 'FULL')}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Capacity / Crew</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px' }}>
                        {res.crewSize ? `${res.crewSize} Responder Crew` : `${res.emergencyBedsAvailable} / ${res.emergencyBedsTotal} Emergency Beds`}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Key Capabilities</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px' }}>
                        {res.specialties 
                          ? res.specialties.join(', ')
                          : `ICU: ${res.icuBedsAvailable} beds, Blood: ${res.bloodBankStatus}, Helipad: ${res.helipadAvailable ? 'Yes' : 'No'}`
                        }
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Location / Base</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px' }}>
                        {res.baseLocation || res.address}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Sector Range</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {res.distanceKm != null ? `${res.distanceKm} km (approx)` : 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ background: '#F8FAFC' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Recommendation Match</td>
                    {selectedForComparison.map(res => (
                      <td key={res.id} style={{ padding: '10px 12px', fontSize: '11px', color: '#166534' }}>
                        {res.recommendationWhy || (res.tier?.includes('1') ? 'Primary trauma stabilization center for critical poly-trauma.' : 'Secondary emergency transfer facility.')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="atlas-modal-footer">
              <button 
                className="btn-atlas-secondary" 
                onClick={() => setSelectedForComparison([])}
              >
                Clear Selection
              </button>
              <button 
                className="btn-atlas-primary" 
                onClick={() => setIsComparing(false)}
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
