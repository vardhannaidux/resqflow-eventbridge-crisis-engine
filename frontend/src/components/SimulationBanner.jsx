import React, { useState } from 'react';
import { AlertTriangle, Shield, Play, RotateCcw, Info, Check, Zap } from 'lucide-react';
import { DEMO_SCENARIOS } from '../fixtures/demoScenarios';

export default function SimulationBanner({
  onInjectScenario,
  onTriggerCloudDrill,
  onResetDemoData,
  isDrillRunning
}) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEMO_SCENARIOS[0].id);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleInject = () => {
    const scenario = DEMO_SCENARIOS.find(s => s.id === selectedScenarioId);
    if (scenario && onInjectScenario) {
      onInjectScenario(scenario);
    }
  };

  return (
    <div className="simulation-banner-container" role="region" aria-label="Simulation Mode Warning">
      <div className="simulation-banner">
        <div className="banner-left">
          <div className="banner-badge">
            <span className="pulse-warning-dot"></span>
            <AlertTriangle size={14} className="banner-icon" />
            <span className="banner-badge-text">SIMULATION & DRILL ENVIRONMENT</span>
          </div>
          <p className="banner-notice">
            <strong>NOTICE:</strong> This dashboard is an operational prototype running live serverless telemetry on AWS. 
            All incidents, hospital triage capacities, response teams, and estimated ETAs are 
            <strong> simulated demo records</strong> for hackathon evaluation. No actual 911/112 emergency calls or real-world dispatches are executed.
          </p>
        </div>

        <div className="banner-controls">
          <div className="scenario-selector-group">
            <label htmlFor="scenario-select" className="scenario-label">Inject Scenario:</label>
            <select
              id="scenario-select"
              className="scenario-dropdown"
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
            >
              {DEMO_SCENARIOS.map(sc => (
                <option key={sc.id} value={sc.id}>
                  [{sc.severity}] {sc.title}
                </option>
              ))}
            </select>
            <button 
              className="btn-inject-scenario"
              onClick={handleInject}
              title="Inject selected deterministic incident scenario into live cloud ingestion pipeline"
            >
              <Zap size={13} />
              <span>Inject</span>
            </button>
          </div>

          <div className="banner-action-buttons">
            <button 
              className="btn-trigger-drill-banner"
              onClick={onTriggerCloudDrill}
              disabled={isDrillRunning}
              title="Trigger 3-incident multi-severity cloud drill via API Gateway"
            >
              <Play size={13} />
              <span>{isDrillRunning ? 'Executing Drill...' : 'Cloud Drill (3-Incident)'}</span>
            </button>

            <button 
              className="btn-reset-demo"
              onClick={onResetDemoData}
              title="Reset simulation filters & reload current active cloud state"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
