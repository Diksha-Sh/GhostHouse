import Layout from '../components/Layout'

function Dashboard() {
  return (
    <Layout>
      <h1>Infrastructure Overview</h1>

      <div className="stats">
        <div className="stat-card">
          <span>Servers</span>
          <strong>12</strong>
        </div>

        <div className="stat-card">
          <span>Alerts</span>
          <strong>04</strong>
        </div>

        <div className="stat-card">
          <span>Uptime</span>
          <strong>98.7%</strong>
        </div>
      </div>

      <div className="portal-card">
        <h2>Recent Activity</h2>

        <p>Server-01 — Online</p>
        <p>Server-02 — Online</p>
        <p>Database — Online</p>
        <p>API Gateway — Active</p>
      </div>
    </Layout>
  )
}

export default Dashboard