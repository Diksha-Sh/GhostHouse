function Admin() {
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
        <h1>Administration</h1>

        <div className="portal-card">
          <h2>System Configuration</h2>

          <p>Database — Connected</p>
          <p>API Gateway — Active</p>
          <p>Authentication — Active</p>
          <p>Monitoring — Enabled</p>
        </div>
      </main>
    </div>
  )
}

export default Admin