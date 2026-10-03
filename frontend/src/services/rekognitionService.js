/**
 * ResQFlow — Amazon Rekognition Computer Vision Service Client
 * Provides disaster image analysis, drone surveillance verification, anti-spoofing checks,
 * and visual severity estimation via AWS Rekognition in ap-south-1.
 */

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com');

class RekognitionService {
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

  async getCuratedSamples() {
    const res = await fetch(`${this.baseUrl}/rekognition/samples`);
    if (!res.ok) {
      throw new Error(`Failed to fetch Rekognition samples: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.samples || [];
  }

  async analyzeIncidentImage({ imageBase64 = null, reportedType = 'FIRE' }) {
    const res = await fetch(`${this.baseUrl}/rekognition/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64,
        reportedType
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Rekognition analysis failed: HTTP ${res.status}`);
    }

    return await res.json();
  }
}

export const rekognitionService = new RekognitionService();
