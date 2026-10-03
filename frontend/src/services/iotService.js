/**
 * ResQFlow — AWS IoT Core Service Client
 * Interfaces with AWS IoT Core message broker and sensor telemetry mesh in ap-south-1.
 */

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com');

class IoTService {
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

  async getDevices() {
    const res = await fetch(`${this.baseUrl}/iot/devices`);
    if (!res.ok) {
      throw new Error(`Failed to load IoT devices: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.devices || [];
  }

  async getRules() {
    const res = await fetch(`${this.baseUrl}/iot/rules`);
    if (!res.ok) {
      throw new Error(`Failed to load IoT rules: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async publishTelemetry(payload) {
    const res = await fetch(`${this.baseUrl}/iot/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Failed to publish IoT telemetry: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async updateDeviceShadow(deviceId, desiredState) {
    const res = await fetch(`${this.baseUrl}/iot/devices/${encodeURIComponent(deviceId)}/shadow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desired: desiredState })
    });
    if (!res.ok) {
      throw new Error(`Failed to update Device Shadow: HTTP ${res.status}`);
    }
    return await res.json();
  }
}

export const iotService = new IoTService();
