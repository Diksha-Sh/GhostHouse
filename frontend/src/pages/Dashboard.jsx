function Dashboard() {
  return (
    <div className="portal-page">
      <aside className="sidebar">
        <h2>GHOST HOUSE</h2>

        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/admin">Admin</a>
          <a href="/users">Users</a>
          <a href="/api-keys">API Keys</a>
          <a href="/monitor">Security Monitor</a>
        </nav>
      </aside>

      <main className="portal-content">
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
      </main>
    </div>
  )
}

export default Dashboard