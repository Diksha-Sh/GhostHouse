import { useState } from 'react'
import Layout from '../components/Layout'

function Admin() {
  const [showSecrets, setShowSecrets] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const [settings, setSettings] = useState({
    wafDeception: true,
    mfaEnforcement: true,
    slidingWindowRateLimit: true,
    deceptiveLatency: true,
    auditLogging: true,
    maintenanceMode: false,
  })

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSaveStatus('Settings updated locally.')
    setTimeout(() => setSaveStatus(''), 2500)
  }

  const handleSave = () => {
    setSaveStatus('Security policies committed to cluster configuration.')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  return (
    <Layout pageTitle="Administration Console">
      <div className="portal-header">
        <div>
          <h1>Administration Console</h1>
          <p>System configuration, perimeter defense rules, honeypot telemetry policies, and secrets vault</p>
        </div>

        <button className="control-btn primary" onClick={handleSave}>
          ✓ Save Policy Changes
        </button>
      </div>

      {saveStatus && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#6ee7b7',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          ● {saveStatus}
        </div>
      )}

      <div className="portal-card">
        <div className="portal-card-header">
          <div>
            <h2>Security & Deception Configuration</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Controls adaptive deception behavior, velocity triggers, and response shaping
            </p>
          </div>
          <span className="status-chip active">Policy Active</span>
        </div>

        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <h4>WAF Adaptive Threat Deception Mode</h4>
              <p>Return simulated database errors (SQLi) and synthetic permission errors (Traversal) instead of standard blocks</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.wafDeception}
                onChange={() => toggleSetting('wafDeception')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Sliding-Window Velocity Tracking</h4>
              <p>Trigger brute force classification on clients exceeding 5 requests within a 30-second window</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.slidingWindowRateLimit}
                onChange={() => toggleSetting('slidingWindowRateLimit')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Artificial Network Latency Injection</h4>
              <p>Add 600 ms simulated network propagation delay to mimic enterprise authentication clusters</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.deceptiveLatency}
                onChange={() => toggleSetting('deceptiveLatency')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Immutable DynamoDB Audit Logging</h4>
              <p>Persist full Layer-7 headers, source IP, body payloads, and classification tags to NoSQL store</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.auditLogging}
                onChange={() => toggleSetting('auditLogging')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Strict IAM Multi-Factor Authentication (MFA)</h4>
              <p>Require hardware security keys or TOTP for all elevated cloud infrastructure roles</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.mfaEnforcement}
                onChange={() => toggleSetting('mfaEnforcement')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Emergency Maintenance Mode</h4>
              <p>Reject all non-administrative ingress traffic with HTTP 503 Service Unavailable</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={() => toggleSetting('maintenanceMode')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-header">
          <div>
            <h2>Decoy Environment Secrets & Configurations</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Synthetic configuration parameters instrumented to track credential exfiltration attempts
            </p>
          </div>

          <button
            className="card-action-btn"
            onClick={() => setShowSecrets((prev) => !prev)}
          >
            {showSecrets ? '🔒 Mask Secrets' : '👁️ Reveal Decoy Secrets'}
          </button>
        </div>

        <div className="secrets-vault">
          <div className="secret-row">
            <span className="secret-key">DATABASE_URL</span>
            <span className="secret-val">
              {showSecrets
                ? 'postgresql://ghost_admin:p4ss_cad_2026!@internal-rds.ap-south-1.aws:5432/ghost_prod'
                : 'postgresql://ghost_admin:••••••••••••••••••••@internal-rds.ap-south-1.aws:5432/ghost_prod'}
            </span>
          </div>

          <div className="secret-row">
            <span className="secret-key">AWS_SECRET_ACCESS_KEY</span>
            <span className="secret-val">
              {showSecrets
                ? 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
                : 'wJalrXUtn•••••••••••••••••••••••••••••••'}
            </span>
          </div>

          <div className="secret-row">
            <span className="secret-key">JWT_SIGNING_SECRET</span>
            <span className="secret-val">
              {showSecrets
                ? 'gh_jwt_sec_99a8b7c6d5e4f3a2b1c0d9e8'
                : 'gh_jwt_sec_••••••••••••••••••••••••'}
            </span>
          </div>

          <div className="secret-row">
            <span className="secret-key">REDIS_CLUSTER_AUTH</span>
            <span className="secret-val">
              {showSecrets
                ? 'redis_auth_token_ap_south_98124'
                : 'redis_auth_token_••••••••••••••'}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Admin