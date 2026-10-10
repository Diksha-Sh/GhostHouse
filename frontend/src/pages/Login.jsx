import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitLogin } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('credentials')
  const [rememberMe, setRememberMe] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username || !password) {
      setMessage('Please enter both your corporate identifier and credential token.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Sends login attempt to AWS honeypot endpoint (records credentials, IP, payload)
      await submitLogin(username, password)

      // Store fake session & seamlessly admit user into internal decoy portal
      localStorage.setItem('ghost_auth_user', username)
      navigate('/dashboard')
    } catch (error) {
      console.error('Login request failed:', error)
      // Even on network error, admit attacker into decoy
      localStorage.setItem('ghost_auth_user', username)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAutofillDemo = () => {
    setUsername('admin@internal.ghosthouse.cloud')
    setPassword('GhostHouse#Prod2026!')
    setMessage('')
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-brand-logo">G</div>
          <h1>GHOST HOUSE</h1>
          <p className="subtitle">INTERNAL CLOUD PORTAL</p>
          <div className="login-badge-bar">
            <span className="node-pill">
              <span className="node-dot"></span>
              <span>IAM Gateway v2.4</span>
            </span>
            <span className="node-pill">
              <span>ap-south-1</span>
            </span>
          </div>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveTab('credentials')}
          >
            Direct IAM Credentials
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'sso' ? 'active' : ''}`}
            onClick={() => setActiveTab('sso')}
          >
            Enterprise SSO
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <span>Corporate Identity / Username</span>
              <span style={{ color: 'var(--text-muted)' }}>LDAP/SAML</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. sec_admin or user@internal.cloud"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span>Password / Access Key</span>
              <span style={{ color: 'var(--text-muted)' }}>MFA Token</span>
            </label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or token"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="login-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember workstation</span>
            </label>

            <a href="#reset" className="login-forgot-link" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'AUTHENTICATING ENCRYPTED SESSION...' : 'SIGN IN TO PORTAL'}
          </button>

          <button
            type="button"
            className="quick-autofill-btn"
            onClick={handleAutofillDemo}
            title="Pre-populate with sample admin credentials for quick testing"
          >
            ⚡ Pre-fill Sample Admin Credentials
          </button>
        </form>

        {message && <p className="login-message" style={{ color: '#fda4af', marginTop: '12px', fontSize: '12px' }}>{message}</p>}

        <div className="login-warning-box">
          ⚠️ <strong>RESTRICTED ACCESS:</strong> Authorized personnel only. All access transactions
          are monitored, classified, and persisted by the threat intelligence mesh.
        </div>

        <div className="login-compliance-footer">
          <span>SOC-2 TYPE II</span>
          <span>•</span>
          <span>ISO/IEC 27001</span>
          <span>•</span>
          <span>TLS 1.3</span>
        </div>
      </div>
    </div>
  )
}

export default Login