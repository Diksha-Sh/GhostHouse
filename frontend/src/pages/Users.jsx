import Layout from '../components/Layout'

function Users() {
  const users = [
    ['001', 'admin', 'Administrator'],
    ['002', 'john.smith', 'Developer'],
    ['003', 'support', 'Support'],
    ['004', 'guest', 'Viewer'],
  ]

  return (
    <Layout>
      <h1>User Management</h1>

      <div className="portal-card">
        {users.map(([id, username, role]) => (
          <p key={id}>
            <strong>{id}</strong> — {username} — {role}
          </p>
        ))}
      </div>
    </Layout>
  )
}

export default Users