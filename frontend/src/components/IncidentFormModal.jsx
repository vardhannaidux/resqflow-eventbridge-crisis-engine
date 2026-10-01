import React, { useState } from 'react';
import { 
  X, 
  Send, 
  AlertCircle, 
  MapPin, 
  Users, 
  ShieldAlert, 
  Check, 
  Sparkles,
  Info
} from 'lucide-react';
import { HYDERABAD_PRESETS } from '../fixtures/demoScenarios';

export default function IncidentFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) {
  const [formData, setFormData] = useState({
    type: 'FIRE',
    description: '',
    peopleAffected: 12,
    latitude: 17.3850,
    longitude: 78.4867,
    reportedBy: 'DISPATCHER-HYD-01'
  });

  const [validationError, setValidationError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peopleAffected' ? (parseInt(value, 10) || 0) : value
    }));
    setValidationError('');
  };

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      latitude: preset.latitude,
      longitude: preset.longitude
    }));
  };

  const validate = () => {
    if (!formData.description.trim()) {
      setValidationError('Please provide a situation description.');
      return false;
    }
    if (formData.peopleAffected < 0) {
      setValidationError('People affected count cannot be negative.');
      return false;
    }
    const lat = Number(formData.latitude);
    const lon = Number(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setValidationError('Latitude must be a valid number between -90 and 90.');
      return false;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setValidationError('Longitude must be a valid number between -180 and 180.');
      return false;
    }
    return true;
  };

  const handleProceedToConfirm = (e) => {
    e.preventDefault();
    if (validate()) {
      setShowConfirm(true);
    }
  };

  const handleFinalSubmit = () => {
    const payload = {
      type: formData.type,
      description: formData.description.trim(),
      peopleAffected: Number(formData.peopleAffected),
      location: {
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      },
      reportedBy: formData.reportedBy.trim() || 'DISPATCHER-HYD-01'
    };
    onSubmit(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-glass-container form-modal-width" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-top-bar">
          <div className="modal-title-group">
            <div className="modal-icon-badge alert-red">
              <ShieldAlert size={20} className="text-critical" />
            </div>
            <div>
              <div className="modal-eyebrow">Emergency Intake Portal</div>
              <h3 className="modal-main-title">Ingest Emergency Incident</h3>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close intake form">
            <X size={18} />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="form-error-banner">
            <AlertCircle size={15} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Form Body */}
        {!showConfirm ? (
          <form onSubmit={handleProceedToConfirm} className="modal-form-content">
            <div className="form-row-two">
              {/* Category */}
              <div className="form-group-v2">
                <label className="form-label-v2">Incident Category</label>
                <select
                  name="type"
                  className="form-select-v2"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="FIRE">FIRE (Structure, multi-alarm, wildfire)</option>
                  <option value="MEDICAL">MEDICAL (Trauma, cardiac, mass casualties)</option>
                  <option value="FLOOD">FLOOD (Water rescue, structural inundation)</option>
                  <option value="ACCIDENT">ACCIDENT (Transit collision, extrication)</option>
                  <option value="EARTHQUAKE">EARTHQUAKE (Structural collapse, SAR)</option>
                  <option value="OTHER">OTHER (Hazardous spill, industrial)</option>
                </select>
              </div>

              {/* People Affected / Triage */}
              <div className="form-group-v2">
                <label className="form-label-v2">
                  People Affected <span className="label-hint">(&ge;10 CRITICAL, &ge;5 HIGH)</span>
                </label>
                <div className="input-with-icon">
                  <Users size={15} className="input-icon text-muted" />
                  <input
                    type="number"
                    name="peopleAffected"
                    className="form-input-v2"
                    min="0"
                    max="10000"
                    value={formData.peopleAffected}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-group-v2">
              <label className="form-label-v2">Situation Description & Hazards</label>
              <textarea
                name="description"
                className="form-textarea-v2"
                rows="3"
                placeholder="Describe scene conditions, entrapment, structural integrity, hazardous materials..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Coordinates & Presets */}
            <div className="form-group-v2">
              <div className="label-with-actions">
                <label className="form-label-v2">Geographic Coordinates (Hyderabad Target)</label>
                <span className="preset-quick-label">Quick Presets:</span>
              </div>

              {/* Preset Buttons */}
              <div className="presets-pill-list">
                {HYDERABAD_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    className="preset-pill-btn"
                    onClick={() => handleApplyPreset(p)}
                  >
                    <MapPin size={11} />
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              <div className="form-row-two" style={{ marginTop: '8px' }}>
                <div className="input-with-icon">
                  <span className="coord-tag">LAT</span>
                  <input
                    type="number"
                    step="0.0001"
                    name="latitude"
                    className="form-input-v2 mono"
                    value={formData.latitude}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-with-icon">
                  <span className="coord-tag">LON</span>
                  <input
                    type="number"
                    step="0.0001"
                    name="longitude"
                    className="form-input-v2 mono"
                    value={formData.longitude}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Reporter */}
            <div className="form-group-v2">
              <label className="form-label-v2">Reporting Authority / Officer Call-Sign</label>
              <input
                type="text"
                name="reportedBy"
                className="form-input-v2 mono"
                value={formData.reportedBy}
                onChange={handleChange}
                required
              />
            </div>

            {/* Footer Buttons */}
            <div className="modal-footer-actions">
              <button type="button" className="btn-cancel-modal" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit-intake">
                <Send size={14} />
                <span>Review & Submit</span>
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Step */
          <div className="confirmation-step-content">
            <div className="confirm-hero-box">
              <AlertCircle size={28} className="text-amber" />
              <h4>Confirm Emergency Ingestion</h4>
              <p>
                You are about to submit a simulated emergency incident to the live AWS Serverless ingestion pipeline (API Gateway ➔ Lambda ➔ DynamoDB ➔ EventBridge).
              </p>
            </div>

            <div className="confirm-summary-list">
              <div className="summary-item">
                <span>Category:</span> <strong>{formData.type}</strong>
              </div>
              <div className="summary-item">
                <span>People Affected:</span> <strong>{formData.peopleAffected}</strong>
              </div>
              <div className="summary-item">
                <span>Coordinates:</span> <strong className="mono">{formData.latitude}, {formData.longitude}</strong>
              </div>
              <div className="summary-item">
                <span>Reporter:</span> <strong className="mono">{formData.reportedBy}</strong>
              </div>
              <div className="summary-item">
                <span>Description:</span> <em>"{formData.description}"</em>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button 
                type="button" 
                className="btn-cancel-modal" 
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                Back to Edit
              </button>
              <button 
                type="button" 
                className="btn-submit-intake confirmed-submit"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Ingesting to AWS...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Authorize Cloud Ingestion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
