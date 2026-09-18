function ApiKeys() {
  const keys = [
    ['Production API', 'Active', '12 Aug 2026'],
    ['Analytics API', 'Active', '02 Jul 2026'],
    ['Testing API', 'Revoked', '18 Jun 2026'],
  ]

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
        <h1>API Credentials</h1>

        <div className="portal-card">
          {keys.map(([name, status, date]) => (
            <p key={name}>
              <strong>{name}</strong> — {status} — Created {date}
            </p>
          ))}

          <p className="fake-token">
            Token: gh_test_xxxxxxxxxxxxxxxxx
          </p>
        </div>
      </main>
    </div>
  )
}

export default ApiKeys