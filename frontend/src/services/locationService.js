/**
 * ResQFlow — Amazon Location Service Client
 * Provides real road routing, traffic-adjusted ETAs, 500m incident perimeter geofencing,
 * and reverse geocoding for Hyderabad municipal coordinates.
 */

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com');

class LocationService {
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

  async getGeoHubs() {
    const res = await fetch(`${this.baseUrl}/location/hubs`);
    if (!res.ok) {
      throw new Error(`Failed to load response hubs: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.hubs || {};
  }

  async calculateEmergencyRoute({ departure, destination, travelMode = 'Truck' }) {
    const res = await fetch(`${this.baseUrl}/location/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departure,
        destination,
        travelMode
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Route calculation failed: HTTP ${res.status}`);
    }

    return await res.json();
  }

  async evaluateGeofence({ incidentId, responderPosition, incidentPosition, radiusMeters = 500 }) {
    const res = await fetch(`${this.baseUrl}/location/geofence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incidentId,
        responderPosition,
        incidentPosition,
        radiusMeters
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Geofence evaluation failed: HTTP ${res.status}`);
    }

    return await res.json();
  }

  async reverseGeocode(lat, lng) {
    const res = await fetch(`${this.baseUrl}/location/geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Reverse geocode failed: HTTP ${res.status}`);
    }

    return await res.json();
  }
}

export const locationService = new LocationService();
