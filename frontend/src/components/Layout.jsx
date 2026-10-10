import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

function Layout({ children, pageTitle = '' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = localStorage.getItem('ghost_auth_user') || 'sec_admin'
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimeStr(now.toUTCString().slice(17, 25) + ' UTC')
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('ghost_auth_user')
    navigate('/login')
  }

  const getBreadcrumb = () => {
    if (pageTitle) return pageTitle
    const path = location.pathname
    if (path.includes('dashboard')) return 'Infrastructure Overview'
    if (path.includes('admin')) return 'Administration Console'
    if (path.includes('users')) return 'IAM User Management'
    if (path.includes('api-keys')) return 'API Credentials & KMS'
    return 'Decoy Portal'
  }

  return (
    <div className="portal-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-symbol">G</div>
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
            <span>🖥️</span> Infrastructure Overview
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span>⚙️</span> Administration
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span>👥</span> User Management
          </NavLink>
          <NavLink
            to="/api-keys"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span>🔑</span> API Credentials
          </NavLink>

          <div className="nav-group-title" style={{ marginTop: '20px' }}>
            THREAT RADAR & SOC OPS
          </div>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              isActive ? 'nav-item monitor-nav active' : 'nav-item monitor-nav'
            }
          >
            <span>🛡️</span> Security Monitor
            <span className="nav-badge">LIVE</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar-mini">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-text">
              <span className="username" title={currentUser}>
                {currentUser}
              </span>
              <span className="user-role-label">Cloud Admin</span>
            </div>
          </div>
          <button onClick={handleSignOut} className="sign-out-btn" title="Sign Out">
            Exit
          </button>
        </div>
      </aside>

      <main className="portal-content">
        <header className="portal-topbar">
          <div className="portal-breadcrumbs">
            <span>Enterprise Cloud</span>
            <span>/</span>
            <span className="current">{getBreadcrumb()}</span>
          </div>

          <div className="portal-topbar-actions">
            <div className="node-pill">
              <span className="node-dot"></span>
              <span>AWS ap-south-1a</span>
            </div>

            <div className="live-clock" title="System Synchronized UTC Clock">
              ⏱ {timeStr}
            </div>

            <NavLink to="/monitor" className="soc-launch-pill">
              <span>🛡️</span> Open SOC Radar
            </NavLink>
          </div>
        </header>

        <div className="portal-page-body">{children}</div>
      </main>
    </div>
  )
}

export default Layout
