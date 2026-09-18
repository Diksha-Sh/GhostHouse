function Monitor() {
  const events = [
    {
      time: '14:21:03',
      ip: '192.0.2.10',
      method: 'POST',
      route: '/login',
      type: 'Unknown',
      status: '403',
    },
    {
      time: '14:21:17',
      ip: '192.0.2.10',
      method: 'POST',
      route: '/login',
      type: 'Brute Force',
      status: '429',
    },
    {
      time: '14:22:04',
      ip: '192.0.2.15',
      method: 'POST',
      route: '/login',
      type: 'SQLi Attempt',
      status: '500',
    },
    {
      time: '14:22:31',
      ip: '192.0.2.21',
      method: 'GET',
      route: '/admin',
      type: 'Scanner',
      status: '403',
    },
    {
      time: '14:23:12',
      ip: '192.0.2.21',
      method: 'GET',
      route: '/users',
      type: 'Scanner',
      status: '403',
    },
    {
      time: '14:23:45',
      ip: '192.0.2.10',
      method: 'POST',
      route: '/login',
      type: 'Brute Force',
      status: '429',
    },
  ]

  return (
    <div className="monitor-page">

      {/* Header */}
      <div className="monitor-header">
        <div>
          <p className="monitor-label">GHOST HOUSE</p>
          <h1>Security Monitor</h1>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </div>

      {/* Statistics */}
      <div className="monitor-stats">

        <div className="monitor-stat-card">
          <span>Total Requests</span>
          <strong>127</strong>
          <small>All recorded requests</small>
        </div>

        <div className="monitor-stat-card">
          <span>Suspicious Requests</span>
          <strong>43</strong>
          <small>Potential attack activity</small>
        </div>

        <div className="monitor-stat-card">
          <span>Alerts</span>
          <strong>18</strong>
          <small>Flagged events</small>
        </div>

        <div className="monitor-stat-card">
          <span>Attack Types</span>
          <strong>3</strong>
          <small>Currently detected</small>
        </div>

      </div>

      {/* Attack distribution */}
      <div className="monitor-section">

        <div className="section-header">
          <div>
            <h2>Attack Distribution</h2>
            <p>Detected activity by classification</p>
          </div>
        </div>

        <div className="attack-bars">

          <div className="attack-item">
            <div>
              <span>Brute Force</span>
              <strong>18</strong>
            </div>

            <div className="bar">
              <div className="bar-fill brute"></div>
            </div>
          </div>

          <div className="attack-item">
            <div>
              <span>SQLi Attempts</span>
              <strong>12</strong>
            </div>

            <div className="bar">
              <div className="bar-fill sqli"></div>
            </div>
          </div>

          <div className="attack-item">
            <div>
              <span>Scanner Activity</span>
              <strong>13</strong>
            </div>

            <div className="bar">
              <div className="bar-fill scanner"></div>
            </div>
          </div>

        </div>

      </div>

      {/* Recent events */}
      <div className="monitor-section">

        <div className="section-header">
          <div>
            <h2>Recent Security Events</h2>
            <p>Latest requests received by Ghost House</p>
          </div>

          <span className="live-indicator">
            ● LIVE
          </span>
        </div>

        <div className="monitor-table">

          <div className="table-header">
            <span>Time</span>
            <span>IP Address</span>
            <span>Method</span>
            <span>Route</span>
            <span>Classification</span>
            <span>Status</span>
          </div>

          {events.map((event, index) => (
            <div className="table-row" key={index}>

              <span>{event.time}</span>

              <span className="ip-address">
                {event.ip}
              </span>

              <span className="method">
                {event.method}
              </span>

              <span>{event.route}</span>

              <span
  className={`classification ${
    event.type === 'Brute Force'
      ? 'brute-force'
      : event.type === 'SQLi Attempt'
        ? 'sqli'
        : event.type === 'Scanner'
          ? 'scanner'
          : 'unknown'
  }`}
>
  {event.type}
</span>

              <span className="status-code">
                {event.status}
              </span>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}

export default Monitor