import { NavLink, useNavigate } from 'react-router-dom'

function Layout({ children }) {
  const navigate = useNavigate()
  const currentUser = localStorage.getItem('ghost_auth_user') || 'sec_admin'

  const handleSignOut = () => {
    localStorage.removeItem('ghost_auth_user')
    navigate('/login')
  }

  return (
    <div className="portal-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-symbol small">G</div>
          <div>
            <h2>GHOST HOUSE</h2>
            <span className="brand-sub">INTERNAL CLOUD</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-title">DECOY ENVIRONMENT</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            Infrastructure Overview
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            Administration
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            User Management
          </NavLink>
          <NavLink
            to="/api-keys"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            API Credentials
          </NavLink>

          <div className="nav-group-title" style={{ marginTop: '25px' }}>
            SOC OPS
          </div>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              isActive ? 'nav-item monitor-nav active' : 'nav-item monitor-nav'
            }
          >
            <span className="shield-icon">🛡️</span> Security Monitor
            <span className="nav-badge">LIVE</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="user-dot"></span>
            <span className="username">{currentUser}</span>
          </div>
          <button onClick={handleSignOut} className="sign-out-btn" title="Sign Out">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="portal-content">{children}</main>
    </div>
  )
}

export default Layout
