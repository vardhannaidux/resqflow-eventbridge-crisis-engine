import React, { useState } from 'react';
import { 
  Truck, 
  Building2, 
  ShieldCheck, 
  MapPin, 
  Activity, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Radio,
  Users,
  Layers
} from 'lucide-react';
import { DEMO_RESPONSE_UNITS, DEMO_HOSPITALS } from '../fixtures/demoScenarios';

export default function ResourcePanel({ incidents = [] }) {
  const [activeTab, setActiveTab] = useState('units');

  // Match incidents to units to show dynamic assignment
  const unitStatuses = DEMO_RESPONSE_UNITS.map(unit => {
    const activeIncident = incidents.find(
      i => i.status !== 'RESOLVED' && i.assignedTeam && i.assignedTeam.includes(unit.name.split(' ')[0])
    );
    return {
      ...unit,
      assignedIncident: activeIncident ? activeIncident.incidentId : null,
      currentStatus: activeIncident ? 'EN_ROUTE / DISPATCHED' : 'STANDBY'
    };
  });

  return (
    <div className="glass-panel resource-panel-container" role="region" aria-label="Response Fleet & Medical Centers">
      {/* Panel Top Header */}
      <div className="resource-header-row">
        <div className="resource-title-group">
          <Layers size={18} className="text-cyan" />
          <div>
            <h3 className="resource-panel-title">Response Fleet & Trauma Network</h3>
            <span className="resource-disclaimer-pill">[SIMULATED SEEDED RESOURCE MODEL]</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="resource-tab-pills">
          <button
            className={`res-tab-btn ${activeTab === 'units' ? 'active' : ''}`}
            onClick={() => setActiveTab('units')}
          >
            <Truck size={13} />
            <span>Response Fleet ({DEMO_RESPONSE_UNITS.length})</span>
          </button>
          <button
            className={`res-tab-btn ${activeTab === 'hospitals' ? 'active' : ''}`}
            onClick={() => setActiveTab('hospitals')}
          >
            <Building2 size={13} />
            <span>Trauma Facilities ({DEMO_HOSPITALS.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Units Grid */}
      {activeTab === 'units' && (
        <div className="units-card-grid">
          {unitStatuses.map(unit => {
            const isAssigned = unit.assignedIncident !== null;
            return (
              <div 
                key={unit.id} 
                className={`unit-detail-card ${isAssigned ? 'unit-card-dispatched' : 'unit-card-standby'}`}
              >
                <div className="unit-card-header">
                  <div>
                    <span className="unit-tier-label">{unit.tier}</span>
                    <h4 className="unit-name-title">{unit.name}</h4>
                  </div>
                  <span className={`unit-status-badge ${isAssigned ? 'badge-dispatched' : 'badge-standby'}`}>
                    {isAssigned ? <Radio size={11} className="spin-slow" /> : <ShieldCheck size={11} />}
                    <span>{unit.currentStatus}</span>
                  </span>
                </div>

                <div className="unit-body-meta">
                  <div className="unit-meta-line">
                    <span className="u-label">Vehicle:</span>
                    <span className="u-val">{unit.vehicle}</span>
                  </div>
                  <div className="unit-meta-line">
                    <span className="u-label">Base Depot:</span>
                    <span className="u-val">{unit.baseLocation}</span>
                  </div>
                  <div className="unit-meta-line">
                    <span className="u-label">Crew Strength:</span>
                    <span className="u-val">{unit.crewSize} Certified Responders</span>
                  </div>
                  {isAssigned && (
                    <div className="unit-assignment-highlight">
                      <AlertCircle size={12} className="text-amber" />
                      <span>Assigned Target: <strong>{unit.assignedIncident}</strong></span>
                    </div>
                  )}
                </div>

                <div className="unit-tags-row">
                  {unit.specialties.map(spec => (
                    <span key={spec} className="unit-spec-tag">{spec}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Hospitals Grid */}
      {activeTab === 'hospitals' && (
        <div className="hospitals-card-grid">
          {DEMO_HOSPITALS.map(hosp => (
            <div key={hosp.id} className="hospital-detail-card">
              <div className="hosp-card-header">
                <div>
                  <span className="hosp-tier-pill">{hosp.tier}</span>
                  <h4 className="hosp-name-title">{hosp.name}</h4>
                </div>
                <div className="hosp-cross-icon">+</div>
              </div>

              <div className="hosp-address-row">
                <MapPin size={12} className="text-muted" />
                <span>{hosp.address}</span>
              </div>

              <div className="hosp-capacity-stats">
                <div className="capacity-stat-box">
                  <span className="cap-label">Available Emergency Beds</span>
                  <span className="cap-val text-emerald">
                    {hosp.emergencyBedsAvailable} <span className="cap-denom">/ {hosp.emergencyBedsTotal}</span>
                  </span>
                  <div className="mini-meter">
                    <div 
                      className="mini-meter-fill"
                      style={{ width: `${(hosp.emergencyBedsAvailable / hosp.emergencyBedsTotal) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="capacity-stat-box">
                  <span className="cap-label">ICU Trauma Capacity</span>
                  <span className="cap-val text-cyan">
                    {hosp.icuBedsAvailable} Units
                  </span>
                  <span className="cap-note">Blood Bank: {hosp.bloodBankStatus}</span>
                </div>
              </div>

              <div className="hosp-footer-features">
                <span className="hosp-feature-pill">
                  Helipad: {hosp.helipadAvailable ? 'ACTIVE' : 'N/A'}
                </span>
                <span className="hosp-feature-pill">
                  Simulated Dispatch Hot-line
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
