import { useState } from 'react'
import Layout from '../components/Layout'

function Users() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('DevOps Lead')

  const [users, setUsers] = useState([
    {
      id: 'USR-001',
      name: 'Riya Mhalgi',
      email: 'riya.mhalgi@internal.ghosthouse.cloud',
      username: 'sec_admin',
      role: 'SuperAdmin',
      mfa: 'Enforced',
      status: 'Active',
      lastIp: '10.0.1.14',
      lastActive: 'Just now',
    },
    {
      id: 'USR-002',
      name: 'Diksha Sharma',
      email: 'diksha.sharma@internal.ghosthouse.cloud',
      username: 'diksha_s',
      role: 'Security Engineer',
      mfa: 'Enforced',
      status: 'Active',
      lastIp: '10.0.1.28',
      lastActive: '12 mins ago',
    },
    {
      id: 'USR-003',
      name: 'Alex Vance',
      email: 'alex.vance@internal.ghosthouse.cloud',
      username: 'alex_devops',
      role: 'DevOps Lead',
      mfa: 'Enforced',
      status: 'Active',
      lastIp: '10.0.2.55',
      lastActive: '1 hour ago',
    },
    {
      id: 'USR-004',
      name: 'Sarah Connor',
      email: 'sarah.connor@internal.ghosthouse.cloud',
      username: 'sarah_cloud',
      role: 'Cloud Architect',
      mfa: 'Enforced',
      status: 'Active',
      lastIp: '10.0.3.102',
      lastActive: '3 hours ago',
    },
    {
      id: 'USR-005',
      name: 'Guest Auditor',
      email: 'auditor@external-compliance.org',
      username: 'guest_audit',
      role: 'Auditor',
      mfa: 'Enforced',
      status: 'Review',
      lastIp: '198.51.100.8',
      lastActive: 'Yesterday',
    },
  ])

  const handleAddUser = (e) => {
    e.preventDefault()
    if (!newUserName || !newUserEmail) return

    const newUser = {
      id: `USR-00${users.length + 1}`,
      name: newUserName,
      email: newUserEmail,
      username: newUserName.toLowerCase().replace(/\s+/g, '_'),
      role: newUserRole,
      mfa: 'Enforced',
      status: 'Active',
      lastIp: '10.0.4.' + (Math.floor(Math.random() * 80) + 10),
      lastActive: 'Just created',
    }

    setUsers([newUser, ...users])
    setNewUserName('')
    setNewUserEmail('')
    setShowAddModal(false)
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <Layout pageTitle="IAM User Management">
      <div className="portal-header">
        <div>
          <h1>IAM User Management</h1>
          <p>Enterprise identity directory, Role-Based Access Control (RBAC), and multi-factor compliance</p>
        </div>

        <button className="control-btn primary" onClick={() => setShowAddModal(true)}>
          + Add IAM User
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Provisioned Users</span>
            <span className="stat-icon">👥</span>
          </div>
          <strong>{users.length}</strong>
          <small className="positive">● All Accounts Verified</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>MFA Compliance</span>
            <span className="stat-icon">🔐</span>
          </div>
          <strong>100%</strong>
          <small className="positive">● FIDO2 / TOTP Enforced</small>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span>Concurrent Sessions</span>
            <span className="stat-icon">⚡</span>
          </div>
          <strong>3</strong>
          <small>Active in ap-south-1</small>
        </div>
      </div>

      <div className="portal-card">
        <div className="portal-card-header">
          <div className="search-box" style={{ minWidth: '300px' }}>
            <input
              type="text"
              placeholder="Search user by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['ALL', 'SuperAdmin', 'Security Engineer', 'DevOps Lead', 'Cloud Architect', 'Auditor'].map((role) => (
              <button
                key={role}
                className={`filter-chip ${roleFilter === role ? 'active' : ''}`}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Identity Name</th>
                <th>Username</th>
                <th>Assigned Role</th>
                <th>MFA Status</th>
                <th>Last Login IP</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="user-avatar-mini" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{user.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><code>@{user.username}</code></td>
                  <td>
                    <span className="status-chip standby" style={{ fontSize: '10px' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className="status-chip online" style={{ fontSize: '10px' }}>
                      ✓ {user.mfa}
                    </span>
                  </td>
                  <td><code>{user.lastIp}</code></td>
                  <td style={{ fontSize: '12px' }}>{user.lastActive}</td>
                  <td>
                    <span className={`status-chip ${user.status.toLowerCase()}`}>
                      ● {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">IAM PROVISIONING</span>
                <h3>Provision New IAM User</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Corporate Email</label>
                  <input
                    type="email"
                    placeholder="e.g. elena@internal.ghosthouse.cloud"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>RBAC Security Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
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
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="Security Engineer">Security Engineer</option>
                    <option value="DevOps Lead">DevOps Lead</option>
                    <option value="Cloud Architect">Cloud Architect</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="control-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="control-btn primary">
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Users