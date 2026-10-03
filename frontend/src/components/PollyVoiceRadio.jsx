import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  Play, 
  Square, 
  Sparkles, 
  Mic, 
  Cpu, 
  ShieldAlert, 
  Check, 
  Globe 
} from 'lucide-react';
import { 
  POLLY_VOICES, 
  generateIncidentRadioText, 
  playPollyBroadcast, 
  stopPollyBroadcast 
} from '../services/pollyService';

export default function PollyVoiceRadio({ 
  incident = null, 
  customText = null,
  title = "Tactical Dispatch Audio",
  compact = false,
  apiEndpoint = ""
}) {
  const [selectedVoice, setSelectedVoice] = useState('Kajal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastSource, setBroadcastSource] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const textToBroadcast = customText || generateIncidentRadioText(incident);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopPollyBroadcast();
    };
  }, []);

  const handleToggleBroadcast = async () => {
    if (isPlaying) {
      stopPollyBroadcast();
      setIsPlaying(false);
      setBroadcastSource(null);
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      await playPollyBroadcast({
        text: textToBroadcast,
        voiceId: selectedVoice,
        apiEndpoint,
        onStart: (info) => {
          setIsLoading(false);
          setIsPlaying(true);
          setBroadcastSource(info.source);
        },
        onEnd: () => {
          setIsPlaying(false);
          setBroadcastSource(null);
        },
        onError: (err) => {
          setIsLoading(false);
          setIsPlaying(false);
          setErrorMsg(err.message || 'Speech broadcast failed');
        }
      });
    } catch (e) {
      setIsLoading(false);
      setIsPlaying(false);
      setErrorMsg(e.message);
    }
  };

  if (compact) {
    return (
      <div className="polly-compact-box" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={handleToggleBroadcast}
          disabled={isLoading}
          className={`btn-polly-compact ${isPlaying ? 'playing' : ''}`}
          title={isPlaying ? "Stop Voice Dispatch" : "Broadcast Voice Dispatch with Amazon Polly"}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #0D0D0D',
            background: isPlaying ? '#0D0D0D' : '#FAF9F5',
            color: isPlaying ? '#FFD23F' : '#0D0D0D',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '1.5px 1.5px 0px #0D0D0D'
          }}
        >
          {isPlaying ? (
            <>
              <Square size={12} fill="#FFD23F" />
              <span>STOP RADIO</span>
              <span className="equalizer-bars mini">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </span>
            </>
          ) : (
            <>
              <Volume2 size={13} />
              <span>{isLoading ? 'SYNTHESIZING...' : 'POLLY RADIO'}</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="polly-radio-panel">
      {/* Top Header */}
      <div className="polly-radio-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`radio-status-blip ${isPlaying ? 'active' : ''}`}>
            <Radio size={14} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="polly-title-brand">AMAZON POLLY</span>
              <span className="polly-title-tag">NEURAL VOICE SYNTHESIS</span>
            </div>
            <span className="polly-channel-freq mono">FREQ: 154.280 MHz · AP-SOUTH-1 · ENCRYPTED DISPATCH</span>
          </div>
        </div>

        {/* Voice Selector */}
        <div className="polly-voice-select-wrap">
          <label className="mono" style={{ fontSize: '10px', color: '#7E7C72' }}>VOICE:</label>
          <select 
            value={selectedVoice} 
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={isPlaying}
            className="polly-voice-select"
          >
            {POLLY_VOICES.map(v => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Broadcast Control Bar */}
      <div className="polly-broadcast-controls">
        <button
          type="button"
          onClick={handleToggleBroadcast}
          disabled={isLoading}
          className={`btn-polly-broadcast ${isPlaying ? 'active' : ''}`}
        >
          {isPlaying ? (
            <>
              <Square size={14} fill="#0D0D0D" />
              <span>HALT TACTICAL BROADCAST</span>
            </>
          ) : (
            <>
              <Volume2 size={15} />
              <span>{isLoading ? 'GENERATING AUDIO STREAM...' : 'BROADCAST TACTICAL DISPATCH'}</span>
            </>
          )}
        </button>

        {/* Audio Equalizer Visualizer */}
        <div className={`polly-equalizer ${isPlaying ? 'animating' : ''}`}>
          <span className="eq-bar bar-1"></span>
          <span className="eq-bar bar-2"></span>
          <span className="eq-bar bar-3"></span>
          <span className="eq-bar bar-4"></span>
          <span className="eq-bar bar-5"></span>
          <span className="eq-bar bar-6"></span>
          <span className="eq-bar bar-7"></span>
          <span className="eq-bar bar-8"></span>
          <span className="eq-bar bar-9"></span>
          <span className="eq-bar bar-10"></span>
          <span className="eq-bar bar-11"></span>
          <span className="eq-bar bar-12"></span>
        </div>
      </div>

      {/* Spoken Text / Radio Transcript Preview */}
      <div className="polly-transcript-box">
        <div className="transcript-header-row mono">
          <span>RADIO DISPATCH TELEMETRY TRANSCRIPT:</span>
          {broadcastSource && (
            <span style={{ color: '#059669', fontWeight: 700 }}>
              ● LIVE STREAM ({broadcastSource})
            </span>
          )}
        </div>
        <p className="transcript-content">
          "{textToBroadcast}"
        </p>
      </div>

      {errorMsg && (
        <div className="polly-error-alert mono">
          <span>NOTICE: {errorMsg}</span>
        </div>
      )}
    </div>
  );
}
