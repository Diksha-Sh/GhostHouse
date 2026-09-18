function Users() {
  const users = [
    ['001', 'admin', 'Administrator'],
    ['002', 'john.smith', 'Developer'],
    ['003', 'support', 'Support'],
    ['004', 'guest', 'Viewer'],
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
        <h1>User Management</h1>

        <div className="portal-card">
          {users.map(([id, username, role]) => (
            <p key={id}>
              <strong>{id}</strong> — {username} — {role}
            </p>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Users