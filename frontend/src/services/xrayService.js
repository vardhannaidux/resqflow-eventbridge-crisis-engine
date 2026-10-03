/**
 * ResQFlow — AWS X-Ray Distributed Tracing Service Client
 * Connects to live AWS X-Ray in ap-south-2 for service graphs and trace waterfalls.
 */

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com');

class XRayService {
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

  async getServiceGraph() {
    const res = await fetch(`${this.baseUrl}/xray/graph`);
    if (!res.ok) {
      throw new Error(`Failed to load X-Ray service graph: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async getTraceSummaries() {
    const res = await fetch(`${this.baseUrl}/xray/traces`);
    if (!res.ok) {
      throw new Error(`Failed to load X-Ray trace summaries: HTTP ${res.status}`);
    }
    return await res.json();
  }

  async getTraceDetail(traceId) {
    const res = await fetch(`${this.baseUrl}/xray/traces/${encodeURIComponent(traceId)}`);
    if (!res.ok) {
      throw new Error(`Failed to load X-Ray trace detail for ${traceId}: HTTP ${res.status}`);
    }
    return await res.json();
  }
}

export const xrayService = new XRayService();
