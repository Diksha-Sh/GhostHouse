import { useState } from 'react'
import Layout from '../components/Layout'

function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterType, setFilterType] = useState('ALL')

  const nodes = [
    { name: 'node-ap-south-web-01', type: 't4g.xlarge', ip: '10.0.1.14', role: 'Web Tier', status: 'Online', cpu: '18%', uptime: '99.98%' },
    { name: 'node-ap-south-web-02', type: 't4g.xlarge', ip: '10.0.1.15', role: 'Web Tier', status: 'Online', cpu: '24%', uptime: '99.99%' },
    { name: 'node-ap-south-db-primary', type: 'r6g.2xlarge', ip: '10.0.2.10', role: 'PostgreSQL RDS', status: 'Online', cpu: '42%', uptime: '100%' },
    { name: 'node-ap-south-db-replica', type: 'r6g.2xlarge', ip: '10.0.2.11', role: 'Read Replica', status: 'Online', cpu: '14%', uptime: '99.95%' },
    { name: 'node-ap-south-redis-01', type: 'cache.r6g.large', ip: '10.0.3.5', role: 'In-Memory Cache', status: 'Online', cpu: '9%', uptime: '100%' },
    { name: 'node-ap-south-bastion', type: 't4g.micro', ip: '10.0.0.5', role: 'SSH Gateway', status: 'Standby', cpu: '3%', uptime: '100%' },
  ]

  const filteredNodes = nodes.filter(n => {
    if (filterType === 'ALL') return true
    if (filterType === 'WEB') return n.role.includes('Web')
    if (filterType === 'DB') return n.role.includes('PostgreSQL') || n.role.includes('Replica')
    if (filterType === 'CACHE') return n.role.includes('Cache')
    return true
  })

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 600)
  }

  return (
    <Layout pageTitle="Infrastructure Overview">
      <div className="portal-header">
        <div>
          <h1>Infrastructure Overview</h1>
          <p>Real-time cluster telemetry, compute fleet health, and serverless runtime status</p>
        </div>

        <button className="card-action-btn" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? '↻ Refreshing Fleet...' : '↻ Refresh Fleet'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Compute Nodes</span>
            <span className="stat-icon">🖥️</span>
          </div>
          <strong>14 / 14</strong>
          <small className="positive">● 100% Fleet Operational</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Average CPU Load</span>
            <span className="stat-icon">⚡</span>
          </div>
          <strong>24.8%</strong>
          <small>Nominal threshold &lt; 70%</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Memory Allocated</span>
            <span className="stat-icon">💾</span>
          </div>
          <strong>68.5 GB</strong>
          <small>53.5% of 128 GB allocated</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Deception Mesh</span>
            <span className="stat-icon">🛡️</span>
          </div>
          <strong>ARMED</strong>
          <small className="positive">● 5 Decoy Routes Monitored</small>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-header">
          <div>
            <h2>Cluster Instances Fleet</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Managed EC2 and container nodes deployed across AWS ap-south-1 Availability Zones
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'WEB', 'DB', 'CACHE'].map(type => (
              <button
                key={type}
                className={`filter-chip ${filterType === type ? 'active' : ''}`}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Instance Name</th>
                <th>Instance Type</th>
                <th>Private IP</th>
                <th>Workload Role</th>
                <th>CPU Utilization</th>
                <th>Uptime SLA</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node) => (
                <tr key={node.name}>
                  <td>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {node.name}
                    </strong>
                  </td>
                  <td><code>{node.type}</code></td>
                  <td><code style={{ color: '#93c5fd' }}>{node.ip}</code></td>
                  <td>{node.role}</td>
                  <td>{node.cpu}</td>
                  <td>{node.uptime}</td>
                  <td>
                    <span className={`status-chip ${node.status.toLowerCase()}`}>
                      ● {node.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-header">
          <h2>Serverless Cloud Integrations Health</h2>
          <span className="status-chip active">All Integrations Healthy</span>
        </div>

        <div className="services-health-grid">
          <div className="service-health-card">
            <div className="service-meta">
              <h4>Amazon API Gateway v2</h4>
              <p>HTTP API • Greed Proxy • 1.44ms latency</p>
            </div>
            <span className="status-chip active">Active</span>
          </div>

          <div className="service-health-card">
            <div className="service-meta">
              <h4>AWS Lambda Runtime</h4>
              <p>Python 3.12 • 128 MB RAM • ghostHouseDecoy</p>
            </div>
            <span className="status-chip active">Active</span>
          </div>

          <div className="service-health-card">
            <div className="service-meta">
              <h4>Amazon DynamoDB</h4>
              <p>On-Demand PAY_PER_REQUEST • Encrypted</p>
            </div>
            <span className="status-chip active">Healthy</span>
          </div>

          <div className="service-health-card">
            <div className="service-meta">
              <h4>Vercel Edge Network</h4>
              <p>Global Anycast CDN • SPA Rewrites Active</p>
            </div>
            <span className="status-chip active">Deployed</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard