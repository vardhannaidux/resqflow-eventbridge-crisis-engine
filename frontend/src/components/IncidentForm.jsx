import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export default function IncidentForm({ onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    type: 'FIRE',
    description: '',
    peopleAffected: 12,
    latitude: 17.3850,
    longitude: 78.4867,
    reportedBy: 'DISPATCHER-HYD-01'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peopleAffected' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      type: formData.type,
      description: formData.description,
      peopleAffected: Number(formData.peopleAffected),
      location: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      },
      reportedBy: formData.reportedBy
    });
  };

  return (
    <div className="glass-panel form-card">
      <div className="form-title">
        <AlertCircle size={20} color="#ef4444" />
        Report New Emergency
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Incident Category</label>
          <select 
            name="type" 
            className="form-select"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="FIRE">FIRE (Multi-alarm, smoke, wildfire)</option>
            <option value="MEDICAL">MEDICAL (Trauma, cardiac, mass casualty)</option>
            <option value="FLOOD">FLOOD (Water rescue, inundation)</option>
            <option value="ACCIDENT">ACCIDENT (Highway, extrication)</option>
            <option value="OTHER">OTHER (Hazardous, structural)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Situation Description</label>
          <textarea
            name="description"
            className="form-textarea"
            rows="3"
            placeholder="Describe immediate danger, trapped individuals..."
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">People Affected (Triage Threshold)</label>
          <input
            type="number"
            name="peopleAffected"
            className="form-input"
            min="0"
            value={formData.peopleAffected}
            onChange={handleChange}
            required
          />
          <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block' }}>
            &ge; 10 triggers CRITICAL dispatch | &ge; 5 triggers HIGH dispatch
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              step="0.0001"
              name="latitude"
              className="form-input mono"
              value={formData.latitude}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              step="0.0001"
              name="longitude"
              className="form-input mono"
              value={formData.longitude}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Reporting Officer / Unit</label>
          <input
            type="text"
            name="reportedBy"
            className="form-input"
            value={formData.reportedBy}
            onChange={handleChange}
          />
        </div>

        <button 
          type="submit" 
          className="btn-submit"
          disabled={isSubmitting}
        >
          <Send size={16} />
          {isSubmitting ? 'Transmitting via EventBridge...' : 'Dispatch Emergency Ingestion'}
        </button>
      </form>
    </div>
  );
}
