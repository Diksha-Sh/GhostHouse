import { useState } from 'react'
import Layout from '../components/Layout'

function ApiKeys() {
  const [showTokens, setShowTokens] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [keyEnv, setKeyEnv] = useState('Production')

  const [keys, setKeys] = useState([
    {
      id: 'KEY-01',
      name: 'Production Microservices Gateway',
      env: 'Production',
      status: 'Active',
      created: '12 Aug 2026',
      token: 'gh_live_prod_99f8a42b109c8e7d44ab',
      scopes: ['infra:read', 'k8s:write', 'telemetry:push'],
    },
    {
      id: 'KEY-02',
      name: 'Analytics Ingestion Pipeline',
      env: 'Staging',
      status: 'Active',
      created: '02 Jul 2026',
      token: 'gh_stg_analytics_44c1b98a12ef9012cd',
      scopes: ['logs:write', 'metrics:read'],
    },
    {
      id: 'KEY-03',
      name: 'CI/CD Deployment Pipeline Runner',
      env: 'Production',
      status: 'Active',
      created: '24 Sep 2026',
      token: 'gh_live_deploy_8872b1aa54ee6190ab',
      scopes: ['deploy:lambda', 'apigw:update'],
    },
    {
      id: 'KEY-04',
      name: 'Legacy Test Bed API Token',
      env: 'Testing',
      status: 'Revoked',
      created: '18 Jun 2026',
      token: 'gh_test_revoked_0019283746554433',
      scopes: ['test:all'],
    },
  ])

  const toggleTokenVisibility = (id) => {
    setShowTokens((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleCopy = (id, token) => {
    navigator.clipboard.writeText(token)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateKey = (e) => {
    e.preventDefault()
    if (!keyName) return

    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')

    const newKey = {
      id: `KEY-0${keys.length + 1}`,
      name: keyName,
      env: keyEnv,
      status: 'Active',
      created: 'Just now',
      token: `gh_${keyEnv.toLowerCase().slice(0, 4)}_${randomHex}`,
      scopes: ['api:access', 'telemetry:read'],
    }

    setKeys([newKey, ...keys])
    setKeyName('')
    setShowModal(false)
  }

  return (
    <Layout pageTitle="API Credentials & KMS Vault">
      <div className="portal-header">
        <div>
          <h1>API Credentials & Key Vault</h1>
          <p>Managed cryptographic API tokens, service principals, access scopes, and deception trap credentials</p>
        </div>

        <button className="control-btn primary" onClick={() => setShowModal(true)}>
          + Generate API Key
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Active Key Credentials</span>
            <span className="stat-icon">🔑</span>
          </div>
          <strong>{keys.filter(k => k.status === 'Active').length}</strong>
          <small className="positive">● Fully Provisioned</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Rotation Policy</span>
            <span className="stat-icon">🔄</span>
          </div>
          <strong>30 Days</strong>
          <small>Automated KMS cycle</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Decoy Canary Traps</span>
            <span className="stat-icon">🚨</span>
          </div>
          <strong>ARMED</strong>
          <small className="positive">● Exfiltration monitored</small>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-header">
          <h2>Provisioned Service API Keys</h2>
          <span className="status-chip active">Vault Sealed • AES-256</span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Credential Name</th>
                <th>Environment</th>
                <th>Assigned Scopes</th>
                <th>Created Date</th>
                <th>API Access Token</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)' }}>{k.name}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {k.id}
                    </span>
                  </td>
                  <td>
                    <span className="status-chip standby" style={{ fontSize: '10px' }}>
                      {k.env}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {k.scopes.map((scope) => (
                        <code key={scope} style={{ fontSize: '10px' }}>
                          {scope}
                        </code>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{k.created}</td>
                  <td>
                    <code style={{ fontSize: '11px', color: '#93c5fd' }}>
                      {showTokens[k.id]
                        ? k.token
                        : `${k.token.slice(0, 11)}••••••••••••••••`}
                    </code>
                  </td>
                  <td>
                    <span className={`status-chip ${k.status.toLowerCase()}`}>
                      ● {k.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="card-action-btn"
                        onClick={() => toggleTokenVisibility(k.id)}
                        title="Show/Hide Token"
                      >
                        {showTokens[k.id] ? '🔒' : '👁️'}
                      </button>
                      <button
                        className="card-action-btn"
                        onClick={() => handleCopy(k.id, k.token)}
                        title="Copy to Clipboard"
                      >
                        {copiedId === k.id ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="portal-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '26px' }}>⚠️</span>
          <div>
            <h4 style={{ fontSize: '14px', color: '#fde68a', marginBottom: '4px' }}>
              CANARY CREDENTIAL DECEPTION INSTRUMENTATION
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              All API keys displayed in this console are synthetic decoy tokens monitored by Ghost House threat detection. Any authentication attempt using these keys triggers real-time alerts on the SOC Security Monitor.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">KMS PROVISIONING</span>
                <h3>Generate API Key Token</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateKey}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Application / Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ingress Gateway Proxy"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Deployment Environment</label>
                  <select
                    value={keyEnv}
                    onChange={(e) => setKeyEnv(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Testing">Testing</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="control-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="control-btn primary">
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default ApiKeys