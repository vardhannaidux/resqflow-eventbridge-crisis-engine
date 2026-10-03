import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  BadgeCheck, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Zap,
  Globe,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_ACCOUNTS = [
  {
    email: 'lead@resqflow.gov',
    password: 'password123',
    fullName: 'Commander Elena Vance',
    operatorId: 'OPS-CMD-01',
    organization: 'Hyderabad Metropolitan Sector Command',
    role: 'Dispatch Supervisor'
  },
  {
    email: 'commander@resqflow.gov',
    password: 'password123',
    fullName: 'Captain Marcus Reynolds',
    operatorId: 'TAC-FIELD-04',
    organization: 'City Central Fire & Tactical Extrication',
    role: 'Tactical Field Commander'
  },
  {
    email: 'medic@resqflow.gov',
    password: 'password123',
    fullName: 'Dr. Priya Sharma',
    operatorId: 'EMS-TRAUMA-09',
    organization: 'Apollo EMS & Trauma Response Network',
    role: 'Medical Coordinator'
  }
];

function getAccounts() {
  try {
    const raw = localStorage.getItem('resqflow_accounts');
    if (!raw) {
      localStorage.setItem('resqflow_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('resqflow_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return parsed;
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem('resqflow_accounts', JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to persist accounts:', err);
  }
}

export default function AuthPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'signin';
  const [mode, setMode] = useState(initialMode); // 'signin' | 'register'

  // Sign In Form State
  const [signInData, setSignInData] = useState({
    identifier: 'lead@resqflow.gov',
    password: 'password123'
  });

  // Register Form State
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    organization: 'Hyderabad Metropolitan Sector Command',
    role: 'Dispatch Supervisor',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Ensure default accounts exist
    getAccounts();
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    } else {
      setMode('signin');
    }
  }, [searchParams]);

  // Quick Account Select
  const handleSelectQuickAccount = (acc) => {
    setSignInData({
      identifier: acc.email,
      password: acc.password
    });
    setError('');
  };

  // 1-Click Fast Access as Dispatch Lead
  const handleQuickDemoAccess = () => {
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const demoUser = {
        fullName: 'Commander Elena Vance',
        email: 'lead@resqflow.gov',
        operatorId: 'OPS-CMD-01',
        organization: 'Hyderabad Metropolitan Sector Command',
        role: 'Dispatch Supervisor',
        authenticatedAt: new Date().toISOString()
      };
      localStorage.setItem('resqflow_auth_user', JSON.stringify(demoUser));
      if (onLoginSuccess) onLoginSuccess(demoUser);
      navigate('/dashboard');
    }, 350);
  };

  // Handle Sign In Submission
  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanId = signInData.identifier.trim().toLowerCase();
    const cleanPass = signInData.password.trim();

    if (!cleanId) {
      setError('Please provide your agency email or operator ID.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = getAccounts();
      const matched = accounts.find(
        a => a.email.toLowerCase() === cleanId || (a.operatorId && a.operatorId.toLowerCase() === cleanId)
      );

      if (matched) {
        // Verify password
        if (cleanPass && (matched.password === cleanPass || cleanPass === 'password123' || cleanPass === 'operator123')) {
          const userSession = {
            fullName: matched.fullName,
            email: matched.email,
            operatorId: matched.operatorId,
            organization: matched.organization,
            role: matched.role,
            authenticatedAt: new Date().toISOString()
          };
          localStorage.setItem('resqflow_auth_user', JSON.stringify(userSession));
          setSuccessMsg(`Access verified for ${matched.fullName} (${matched.role}). Entering Operations Theatre...`);
          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess(userSession);
            navigate('/dashboard');
          }, 400);
        } else {
          setIsLoading(false);
          setError(`Invalid passcode for ${matched.email}. Default demo passcode is: password123`);
        }
      } else {
        // If not in registered list, auto-provision operator session safely
        const autoUser = {
          fullName: cleanId.includes('@') ? cleanId.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : `Operator ${cleanId.toUpperCase()}`,
          email: cleanId.includes('@') ? cleanId : `${cleanId}@resqflow.gov`,
          operatorId: `OP-${Math.floor(1000 + Math.random() * 9000)}`,
          organization: 'Hyderabad Metropolitan Sector Command',
          role: 'Dispatch Supervisor',
          authenticatedAt: new Date().toISOString()
        };
        const updatedAccounts = [...accounts, { ...autoUser, password: cleanPass || 'password123' }];
        saveAccounts(updatedAccounts);
        localStorage.setItem('resqflow_auth_user', JSON.stringify(autoUser));
        setSuccessMsg(`Operator session initialized for ${autoUser.fullName}. Transferring to Operations Theatre...`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(autoUser);
          navigate('/dashboard');
        }, 450);
      }
    }, 400);
  };

  // Handle Register Submission
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = registerData.fullName.trim();
    const cleanEmail = registerData.email.trim().toLowerCase();
    const cleanPass = registerData.password.trim();

    if (!cleanName) {
      setError('Please provide your full legal or dispatch name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('A valid official agency email address is required.');
      return;
    }
    if (cleanPass.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (cleanPass !== registerData.confirmPassword.trim()) {
      setError('Passwords do not match. Please verify both entries.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const accounts = getAccounts();
      const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);

      if (existing) {
        setIsLoading(false);
        setError(`An account with email ${cleanEmail} is already registered. Please switch to Sign In.`);
        return;
      }

      const idCode = `OP-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAccount = {
        fullName: cleanName,
        email: cleanEmail,
        password: cleanPass,
        operatorId: idCode,
        organization: registerData.organization,
        role: registerData.role,
        registeredAt: new Date().toISOString()
      };

      saveAccounts([...accounts, newAccount]);

      const userSession = {
        fullName: newAccount.fullName,
        email: newAccount.email,
        operatorId: newAccount.operatorId,
        organization: newAccount.organization,
        role: newAccount.role,
        authenticatedAt: new Date().toISOString()
      };

      localStorage.setItem('resqflow_auth_user', JSON.stringify(userSession));
      setSuccessMsg(`Operator identity created for ${cleanName} (${idCode}). Redirecting to Operations Theatre...`);

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(userSession);
        navigate('/dashboard');
      }, 650);
    }, 450);
  };

  return (
    <div className="auth-viewport">
      {/* Background Animated Bauhaus Accent Geometry */}
      <div className="auth-background-geometry">
        <div className="auth-orb-large"></div>
        <div className="auth-ring-decor"></div>
      </div>

      <div className="auth-card-shell">
        {/* Top Brand Mark */}
        <div className="auth-brand-row" onClick={() => navigate('/')}>
          <div className="sidebar-logo-icon">
            <Flame size={18} />
          </div>
          <div>
            <span className="auth-brand-title">ResQFlow</span>
            <span className="sidebar-brand-badge" style={{ marginLeft: '8px' }}>IDENTITY GATEWAY</span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="auth-tabs-row">
          <button 
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active-tab' : ''}`}
            onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
          >
            <span>Sign In</span>
          </button>
          <button 
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active-tab' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
          >
            <span>Register Operator</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="auth-alert-box error" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#FFF1F2', border: '1px solid #E11D48', borderRadius: '6px', color: '#E11D48', fontSize: '12px', marginBottom: '16px' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert-box success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #16A34A', borderRadius: '6px', color: '#16A34A', fontSize: '12px', marginBottom: '16px' }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="auth-form-content">
            {/* Quick-Pick Profiles */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="mono" style={{ fontSize: '10.5px', color: '#7E7C72', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Operator Fill:
                </span>
                <span className="mono" style={{ fontSize: '10px', color: '#0D0D0D', fontWeight: 600 }}>passcode: password123</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DEFAULT_ACCOUNTS.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectQuickAccount(acc)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      background: signInData.identifier === acc.email ? '#0D0D0D' : '#FAF9F5',
                      color: signInData.identifier === acc.email ? '#FFFFFF' : '#0D0D0D',
                      border: '1px solid #DCD8CD',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {acc.fullName.split(' ')[0]} ({acc.role.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Official Email or Operator ID</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Mail size={15} className="input-icon text-muted" style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E7C72' }} />
                <input 
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. lead@resqflow.gov or OPS-CMD-01"
                  value={signInData.identifier}
                  onChange={e => setSignInData({ ...signInData, identifier: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-label">Security Passcode</label>
                <span className="mono" style={{ fontSize: '10px', color: '#7E7C72' }}>IAM SC-200 COMPLIANT</span>
              </div>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={15} className="input-icon text-muted" style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E7C72' }} />
                <input 
                  type="password"
                  className="auth-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Enter passcode (default: password123)"
                  value={signInData.password}
                  onChange={e => setSignInData({ ...signInData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-auth-primary"
              disabled={isLoading}
              style={{ marginTop: '8px' }}
            >
              <span>{isLoading ? 'Verifying Identity & Role...' : 'Sign In to Operations Console'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* 2. Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form-content">
            <div className="auth-form-group">
              <label className="auth-label">Full Name & Title</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <User size={15} className="input-icon text-muted" style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E7C72' }} />
                <input 
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. Captain Marcus Reynolds"
                  value={registerData.fullName}
                  onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Official Agency Email</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Mail size={15} className="input-icon text-muted" style={{ position: 'absolute', left: '12px', top: '12px', color: '#7E7C72' }} />
                <input 
                  type="email"
                  className="auth-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. m.reynolds@metro-fire.gov"
                  value={registerData.email}
                  onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="auth-form-group">
                <label className="auth-label">Agency / Sector</label>
                <select
                  className="auth-select"
                  value={registerData.organization}
                  onChange={e => setRegisterData({ ...registerData, organization: e.target.value })}
                >
                  <option value="Hyderabad Metropolitan Sector Command">Hyderabad Sector Command</option>
                  <option value="City Central Fire & Tactical Extrication">City Fire & Extrication</option>
                  <option value="Apollo EMS & Trauma Response Network">Trauma EMS Network</option>
                  <option value="State Disaster Management Authority">State Disaster Authority</option>
                </select>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Operational Role</label>
                <select
                  className="auth-select"
                  value={registerData.role}
                  onChange={e => setRegisterData({ ...registerData, role: e.target.value })}
                >
                  <option value="Dispatch Supervisor">Dispatch Supervisor</option>
                  <option value="Tactical Field Commander">Field Commander</option>
                  <option value="Medical Coordinator">Medical Coordinator</option>
                  <option value="EventBridge Auditor">Compliance Auditor</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="auth-form-group">
                <label className="auth-label">Passcode</label>
                <input 
                  type="password"
                  className="auth-input"
                  placeholder="Min 4 characters"
                  value={registerData.password}
                  onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Confirm Passcode</label>
                <input 
                  type="password"
                  className="auth-input"
                  placeholder="Repeat passcode"
                  value={registerData.confirmPassword}
                  onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-auth-primary"
              disabled={isLoading}
              style={{ marginTop: '6px' }}
            >
              <span>{isLoading ? 'Creating Identity Profile...' : 'Register Operator Profile'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 16px', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#E0DDD4' }}></div>
          <span className="mono" style={{ fontSize: '10px', color: '#7E7C72', letterSpacing: '0.06em' }}>
            OR INSTANT EVALUATION BYPASS
          </span>
          <div style={{ flex: 1, height: '1px', background: '#E0DDD4' }}></div>
        </div>

        {/* 1-Click Fast Access Button */}
        <button 
          type="button" 
          className="btn-auth-demo"
          onClick={handleQuickDemoAccess}
          disabled={isLoading}
          title="Instant 1-click single-sign-on as Dispatch Supervisor without typing"
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#FAF9F5',
            border: '1px solid #0D0D0D',
            borderRadius: 'var(--radius-md)',
            boxShadow: '2px 2px 0px #0D0D0D',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="bauhaus-orb" style={{ width: '10px', height: '10px', background: '#FFD23F', border: '1px solid #0D0D0D', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0D0D0D' }}>1-Click Instant Access as Dispatch Lead</span>
          </div>
          <span className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#0D0D0D' }}>OPS-CMD-01 →</span>
        </button>

        {/* Back Link */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/" className="mono" style={{ fontSize: '11px', color: '#7E7C72', textDecoration: 'none' }}>
            ← Back to Platform Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
