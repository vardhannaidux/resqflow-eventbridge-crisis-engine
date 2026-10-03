/**
 * ResQFlow X — Centralized API Client Service
 * Handles live AWS API Gateway communication and local fallback simulation.
 */

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com';

class ApiService {
  constructor() {
    this.baseUrl = DEFAULT_API_ENDPOINT;
  }

  setBaseUrl(url) {
    if (url && typeof url === 'string') {
      this.baseUrl = url.trim().replace(/\/+$/, '');
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async checkHealth() {
    const startTime = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/incidents`, { method: 'GET' });
      const latency = Math.round(performance.now() - startTime);
      return { online: res.ok, latencyMs: latency, status: res.status };
    } catch (err) {
      return { online: false, latencyMs: null, error: err.message };
    }
  }

  async getIncidents(statusFilter = null) {
    const url = statusFilter && statusFilter !== 'ALL'
      ? `${this.baseUrl}/incidents?status=${encodeURIComponent(statusFilter)}`
      : `${this.baseUrl}/incidents`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load incidents: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.incidents || [];
  }

  async getIncidentById(incidentId) {
    const res = await fetch(`${this.baseUrl}/incidents/${encodeURIComponent(incidentId)}`);
    if (!res.ok) {
      throw new Error(`Incident ${incidentId} not found: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async createIncident(payload) {
    const res = await fetch(`${this.baseUrl}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to report incident: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async resolveIncident(incidentId, notes = '') {
    const res = await fetch(`${this.baseUrl}/incidents/${encodeURIComponent(incidentId)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes || 'Incident cleared and verified by command center operator.' })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to resolve incident: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async triggerDrill() {
    const res = await fetch(`${this.baseUrl}/incidents/drill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Failed to trigger disaster drill: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async getResources() {
    try {
      const res = await fetch(`${this.baseUrl}/resources`);
      if (res.ok) {
        const data = await res.json();
        return data.resources || [];
      }
    } catch {
      // Fallback handled in component
    }
    return null;
  }

  async getWorkflows() {
    try {
      const res = await fetch(`${this.baseUrl}/workflows`);
      if (res.ok) {
        const data = await res.json();
        return data.workflows || [];
      }
    } catch {
      // Fallback
    }
    return null;
  }

  async getNotifications() {
    try {
      const res = await fetch(`${this.baseUrl}/notifications`);
      if (res.ok) {
        const data = await res.json();
        return data.notifications || [];
      }
    } catch {
      // Fallback
    }
    return null;
  }
}

export const api = new ApiService();
