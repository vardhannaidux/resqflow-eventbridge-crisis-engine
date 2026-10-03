/**
 * Amazon Polly Speech Synthesis Service
 * Provides automated tactical radio dispatch voice broadcasts with audio visualizer support.
 * Primary: Real AWS Polly Speech Synthesis (ap-south-1 / ap-south-2 via backend API)
 * Secondary: Graceful Web Speech API browser fallback when offline
 */

const DEFAULT_API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://ezdw12h7z5.execute-api.ap-south-2.amazonaws.com');

export const POLLY_VOICES = [
  { id: 'Kajal', name: 'Kajal', lang: 'en-IN', engine: 'neural', label: 'Kajal (Neural · en-IN)', role: 'Primary Dispatch Supervisor' },
  { id: 'Aditi', name: 'Aditi', lang: 'en-IN', engine: 'standard', label: 'Aditi (Standard · en-IN)', role: 'Municipal Broadcaster' },
  { id: 'Matthew', name: 'Matthew', lang: 'en-US', engine: 'neural', label: 'Matthew (Neural · en-US)', role: 'Tactical Field Commander' },
  { id: 'Raveena', name: 'Raveena', lang: 'en-IN', engine: 'standard', label: 'Raveena (Standard · en-IN)', role: 'Operations Coordinator' }
];

let currentAudioInstance = null;

/**
 * Format an authoritative tactical radio broadcast announcement for an incident
 */
export function generateIncidentRadioText(incident) {
  if (!incident) return 'Attention all units: ResQFlow Priority Dispatch Notification.';

  const id = incident.incidentId || 'UNKNOWN';
  const type = incident.type || 'Emergency';
  const severity = incident.severity || 'HIGH';
  const location = typeof incident.location === 'object' 
    ? `${incident.location.latitude?.toFixed?.(4) || ''}, ${incident.location.longitude?.toFixed?.(4) || ''}`
    : (incident.location || 'Reported Sector');
  const team = incident.assignedTeam && !incident.assignedTeam.includes('Pending')
    ? incident.assignedTeam
    : 'Rapid Tactical Response Unit';
  const hospital = incident.hospital && incident.hospital !== 'NONE'
    ? incident.hospital
    : 'Regional Trauma Command Center';
  const people = incident.peopleAffected ? `${incident.peopleAffected} individuals affected.` : '';

  return `Attention all field units and command personnel. Priority alert for incident ${id}. Classification: ${type}. Severity grade: ${severity}. Location coordinates: ${location}. ${people} Assigned dispatch: ${team}. Designated trauma center: ${hospital}. All responders acknowledge on tactical frequency Alpha.`;
}

/**
 * Synthesize and stream speech using Amazon Polly
 * @param {Object} options - { text, voiceId, apiEndpoint, onStart, onEnd, onError }
 */
export async function playPollyBroadcast({
  text,
  voiceId = 'Kajal',
  apiEndpoint = DEFAULT_API_ENDPOINT,
  onStart,
  onEnd,
  onError
}) {
  // Stop any currently playing broadcast
  stopPollyBroadcast();

  if (!text || !text.trim()) {
    if (onError) onError(new Error('No text provided for broadcast'));
    return null;
  }

  try {
    // 1. Attempt AWS Amazon Polly Synthesis via backend
    const endpoint = apiEndpoint.endsWith('/') ? apiEndpoint.slice(0, -1) : apiEndpoint;
    const response = await fetch(`${endpoint}/polly/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        voiceId
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.audioBase64) {
        const audioSrc = `data:${data.contentType || 'audio/mpeg'};base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        currentAudioInstance = audio;

        audio.onplay = () => {
          if (onStart) onStart({ source: 'Amazon Polly (AWS Cloud)', voiceId: data.voiceId, engine: data.engine });
        };

        audio.onended = () => {
          currentAudioInstance = null;
          if (onEnd) onEnd();
        };

        audio.onerror = (e) => {
          console.warn('Audio playback error, falling back to browser synthesis', e);
          fallbackWebSpeech(text, voiceId, onStart, onEnd, onError);
        };

        await audio.play();
        return {
          stop: stopPollyBroadcast,
          source: 'polly'
        };
      }
    }

    // 2. If backend Polly endpoint returns non-200, fallback gracefully to browser speech
    console.warn('Polly backend unavailable, engaging browser speech synthesis fallback');
    return fallbackWebSpeech(text, voiceId, onStart, onEnd, onError);

  } catch (err) {
    console.warn('Polly fetch failed, engaging browser speech synthesis fallback', err.message);
    return fallbackWebSpeech(text, voiceId, onStart, onEnd, onError);
  }
}

/**
 * Stop any active Polly or Speech broadcast
 */
export function stopPollyBroadcast() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioInstance = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Fallback synthesizer using browser Web Speech API
 */
function fallbackWebSpeech(text, voiceId, onStart, onEnd, onError) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onError) onError(new Error('Speech synthesis not supported in this environment'));
    return null;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1.0;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-US')) || voices[0];
    if (match) utterance.voice = match;

    utterance.onstart = () => {
      if (onStart) onStart({ source: 'Web Speech Fallback', voiceId, engine: 'browser' });
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      if (onError) onError(err);
    };

    window.speechSynthesis.speak(utterance);
    return {
      stop: stopPollyBroadcast,
      source: 'webspeech'
    };
  } catch (e) {
    if (onError) onError(e);
    return null;
  }
}
