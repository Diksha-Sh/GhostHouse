import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSecurityEvents } from '../services/api'

const SAMPLE_EVENTS = [
  {
    route_hit: 'main_decoy',
    classification: 'sqli_attempt',
    path: '/default/ghostHouseDecoy/login',
    request_id: '36a664b5-df81-4dc9-8307-96aa96381696',
    user_agent: 'Python-urllib/3.12 (GhostHouse Attack Sim)',
    source_ip: '198.51.100.42',
    timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
    method: 'POST',
    body: '{"username": "\' UNION SELECT NULL, username, password FROM users --", "password": "x"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'sqli_attempt',
    path: '/default/ghostHouseDecoy/login',
    request_id: '21b04b4c-3520-4d3d-917e-f1983a19bacb',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    source_ip: '203.0.113.15',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    method: 'POST',
    body: '{"username": "\' OR \'1\'=\'1", "password": "admin"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'brute_force',
    path: '/default/ghostHouseDecoy/api-keys',
    request_id: 'a95c6ae0-08a7-496e-a15b-5efa0c9f119c',
    user_agent: 'sqlmap/1.7.2#stable',
    source_ip: '192.0.2.88',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{"token": "admin_test"}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'scanner',
    path: '/default/ghostHouseDecoy/.env',
    request_id: 'fc2e79f8-95c5-4889-b77e-d31eb2ff2299',
    user_agent: 'Nikto/2.1.6',
    source_ip: '198.51.100.104',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'benign_probe',
    path: '/default/ghostHouseDecoy/',
    request_id: 'efc0980a-5081-4105-9230-e7c90180cba1',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    source_ip: '192.0.2.14',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{}',
  },
]

function classifyEvent(event) {
  const rawType =
    event.classification ||
    event.type ||
    event.attackType ||
    event.attack_type ||
    event.threat

  if (!rawType || rawType === 'null' || rawType === 'undefined') {
    return 'Legacy Event'
  }

  const normalized = String(rawType).toLowerCase().trim()

  if (normalized.includes('sql') || normalized === 'sqli_attempt') {
    return 'SQLi Attempt'
  }

  if (normalized.includes('traversal') || normalized === 'path_traversal') {
    return 'Path Traversal'
  }

  if (normalized.includes('scan') || normalized === 'known_scanner') {
    return 'Known Scanner'
  }

  if (normalized.includes('brute') || normalized === 'brute_force') {
    return 'Brute Force'
  }

  if (normalized.includes('benign') || normalized === 'benign_probe') {
    return 'Benign Probe'
  }

  return rawType || 'Legacy Event'
}

function classificationClass(type) {
  if (type === 'Brute Force') {
    return 'brute-force'
  }

  if (type === 'SQLi Attempt') {
    return 'sqli'
  }

  if (type === 'Path Traversal') {
    return 'traversal'
  }

  if (type === 'Known Scanner' || type === 'Scanner') {
    return 'scanner'
  }

  if (type === 'Benign Probe') {
    return 'benign'
  }

  return 'unknown'
}

function formatTime(value) {
  if (!value) {
    return '--:--:--'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function normalizeEvent(event) {
  const type = classifyEvent(event)

  return {
    raw: event,
    time: formatTime(event.time || event.timestamp || event.createdAt || event.created_at),
    fullTime: event.time || event.timestamp || event.createdAt || event.created_at || 'N/A',
    ip:
      event.ip ||
      event.sourceIp ||
      event.source_ip ||
      event.clientIp ||
      event.client_ip ||
      'Unknown',
    method: event.method || event.httpMethod || event.http_method || 'GET',
    route: event.route || event.path || event.url || event.resource || '/',
    type,
    status: event.status || event.statusCode || event.status_code || '-',
    userAgent: event.user_agent || event.userAgent || 'N/A',
    requestId: event.request_id || event.requestId || 'N/A',
    body: event.body || '',
    queryParams: event.query_params || event.queryParams || '{}',
  }
}

function Monitor() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [isCorsError, setIsCorsError] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [pollInterval, setPollInterval] = useState(7000)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const loadEvents = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true)
    }

    try {
      setError('')
      setIsCorsError(false)

      const records = await getSecurityEvents()

      if (records && records.length > 0) {
        setEvents(records.map(normalizeEvent))
        setUsingDemoData(false)
      } else if (records && records.length === 0 && usingDemoData) {
        // Keep demo data active if user explicitly toggled it
      } else {
        setEvents([])
      }

      setLastUpdated(new Date())
    } catch (requestError) {
      console.error('Unable to load security events:', requestError)
      if (requestError.isCors) {
        setIsCorsError(true)
        setError('Browser CORS restriction detected: Access-Control-Allow-Origin header is missing on AWS.')
      } else {
        setError('Unable to load live security events from the AWS API.')
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [usingDemoData])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (isPaused) {
      return
    }

    const intervalId = window.setInterval(() => {
      loadEvents()
    }, pollInterval)

    return () => window.clearInterval(intervalId)
  }, [loadEvents, isPaused, pollInterval])

  const handleUseDemoData = () => {
    setEvents(SAMPLE_EVENTS.map(normalizeEvent))
    setUsingDemoData(true)
    setError('')
    setIsCorsError(false)
    setLastUpdated(new Date())
  }

  const stats = useMemo(() => {
    const counts = events.reduce(
      (summary, event) => {
        summary.total += 1

        if (event.type !== 'Unknown') {
          summary.suspicious += 1
          summary.byType[event.type] = (summary.byType[event.type] || 0) + 1
        }

        return summary
      },
      {
        total: 0,
        suspicious: 0,
        byType: {},
      },
    )

    return {
      ...counts,
      attackTypes: Object.keys(counts.byType).length,
    }
  }, [events])

  const attackBars = [
    ['Brute Force', 'brute'],
    ['SQLi Attempt', 'sqli'],
    ['Path Traversal', 'traversal'],
    ['Known Scanner', 'scanner'],
    ['Benign Probe', 'benign'],
  ].map(([label, className]) => {
    const count = stats.byType[label] || 0
    const width = stats.suspicious ? `${Math.max((count / stats.suspicious) * 100, 4)}%` : '0%'

    return {
      label,
      className,
      count,
      width,
    }
  })

  // Filter and search logic
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        activeFilter === 'ALL' || event.type.toLowerCase() === activeFilter.toLowerCase()

      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        event.ip.toLowerCase().includes(query) ||
        event.route.toLowerCase().includes(query) ||
        event.method.toLowerCase().includes(query) ||
        event.userAgent.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query)

      return matchesFilter && matchesQuery
    })
  }, [events, activeFilter, searchQuery])

  // Export handlers
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(events.map((e) => e.raw || e), null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ghosthouse-security-events-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const headers = ['Time', 'IP Address', 'Method', 'Route', 'Classification', 'Status', 'User Agent']
    const rows = events.map((e) => [
      `"${e.fullTime}"`,
      `"${e.ip}"`,
      `"${e.method}"`,
      `"${e.route}"`,
      `"${e.type}"`,
      `"${e.status}"`,
      `"${e.userAgent.replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ghosthouse-security-events-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="monitor-page">
      {/* Top Navbar */}
      <div className="monitor-topbar">
        <Link to="/dashboard" className="back-link">
          ← Back to Decoy Portal
        </Link>
        <div className="topbar-actions">
          {usingDemoData && <span className="demo-badge">DEMO DATA MODE</span>}
          <div className="system-status">
            <span className={`status-dot ${isPaused ? 'paused' : 'live'}`}></span>
            {isPaused ? 'POLLING PAUSED' : 'SYSTEM LIVE'}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="monitor-header">
        <div>
          <p className="monitor-label">GHOST HOUSE SOC</p>
          <h1>Security Operations Center</h1>
        </div>

        <div className="monitor-controls">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className={`control-btn ${isPaused ? 'resume' : 'pause'}`}
          >
            {isPaused ? '▶ Resume Live Feed' : '⏸ Pause'}
          </button>

          <button
            onClick={() => loadEvents(true)}
            disabled={isRefreshing}
            className="control-btn refresh"
          >
            {isRefreshing ? '↻ Refreshing...' : '↻ Refresh Now'}
          </button>

          <div className="interval-selector">
            <label htmlFor="poll-select">Poll:</label>
            <select
              id="poll-select"
              value={pollInterval}
              onChange={(e) => setPollInterval(Number(e.target.value))}
            >
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
              <option value={7000}>7s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>

          <button onClick={handleExportCSV} className="control-btn export" title="Export to CSV">
            Export CSV
          </button>
          <button onClick={handleExportJSON} className="control-btn export" title="Export to JSON">
            Export JSON
          </button>
        </div>
      </div>

      {/* CORS / Error Alert Banner */}
      {isCorsError && (
        <div className="cors-warning-banner">
          <div className="banner-icon">⚠️</div>
          <div className="banner-text">
            <strong>CORS Restriction Detected from AWS API:</strong> The browser cannot read
            responses because the <code>Access-Control-Allow-Origin: *</code> header is missing from
            your AWS Lambda / API Gateway response.
          </div>
          <div className="banner-actions">
            <button onClick={handleUseDemoData} className="demo-toggle-btn">
              Load Demo Threat Data
            </button>
          </div>
        </div>
      )}

      {error && !isCorsError && <p className="monitor-error">{error}</p>}

      {/* Statistics Cards */}
      <div className="monitor-stats">
        <div className="monitor-stat-card">
          <span>Total Requests</span>
          <strong>{stats.total}</strong>
          <small>Recorded requests</small>
        </div>

        <div className="monitor-stat-card">
          <span>Suspicious Requests</span>
          <strong>{stats.suspicious}</strong>
          <small>Potential attack activity</small>
        </div>

        <div className="monitor-stat-card">
          <span>Alerts</span>
          <strong>{stats.suspicious}</strong>
          <small>Flagged security events</small>
        </div>

        <div className="monitor-stat-card">
          <span>Attack Types</span>
          <strong>{stats.attackTypes}</strong>
          <small>Distinct threats detected</small>
        </div>
      </div>

      {/* Attack Distribution Bar Chart */}
      <div className="monitor-section">
        <div className="section-header">
          <div>
            <h2>Attack Distribution</h2>
            <p>Detected activity categorized by classification</p>
          </div>
        </div>

        <div className="attack-bars">
          {attackBars.map((attack) => (
            <div className="attack-item" key={attack.label}>
              <div>
                <span>{attack.label}</span>
                <strong>{attack.count}</strong>
              </div>

              <div className="bar">
                <div
                  className={`bar-fill ${attack.className}`}
                  style={{ width: attack.width }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Events Section */}
      <div className="monitor-section">
        <div className="section-header">
          <div>
            <h2>Real-Time Threat Feed</h2>
            <p>Click any event row to inspect full payload, headers, and request metadata</p>
          </div>

          <div className="feed-status-meta">
            {lastUpdated && (
              <span className="last-updated">
                Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <span className={`live-indicator ${isPaused ? 'paused' : 'live'}`}>
              {loading ? 'LOADING' : isPaused ? 'PAUSED' : '● LIVE'}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="table-toolbar">
          <div className="filter-chips">
            {['ALL', 'Brute Force', 'SQLi Attempt', 'Path Traversal', 'Known Scanner', 'Benign Probe'].map((category) => (
              <button
                key={category}
                className={`filter-chip ${activeFilter === category ? 'active' : ''}`}
                onClick={() => setActiveFilter(category)}
              >
                {category}
                {category === 'ALL'
                  ? ` (${events.length})`
                  : stats.byType[category]
                  ? ` (${stats.byType[category]})`
                  : ''}
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by IP, Route, Method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Events Table */}
        <div className="monitor-table">
          <div className="table-header">
            <span>Time</span>
            <span>IP Address</span>
            <span>Method</span>
            <span>Target Route</span>
            <span>Classification</span>
            <span>Status</span>
          </div>

          {!loading && filteredEvents.length === 0 && (
            <div className="empty-events">
              {events.length === 0
                ? 'No security events received yet from the decoy.'
                : 'No security events match your search/filter criteria.'}
            </div>
          )}

          {filteredEvents.map((event, index) => (
            <div
              className="table-row clickable"
              key={`${event.time}-${event.ip}-${index}`}
              onClick={() => setSelectedEvent(event)}
              title="Click to inspect full event details"
            >
              <span>{event.time}</span>

              <span className="ip-address">{event.ip}</span>

              <span className="method">{event.method}</span>

              <span className="route-cell">{event.route}</span>

              <span className={`classification ${classificationClass(event.type)}`}>
                {event.type}
              </span>

              <span className="status-code">{event.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Inspection Modal */}
      {selectedEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">SECURITY INCIDENT INSPECTOR</span>
                <h3>Threat Event Details</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Classification</label>
                  <span
                    className={`classification ${classificationClass(selectedEvent.type)}`}
                  >
                    {selectedEvent.type}
                  </span>
                </div>

                <div className="detail-field">
                  <label>HTTP Method & Route</label>
                  <strong>
                    <code>{selectedEvent.method}</code> {selectedEvent.route}
                  </strong>
                </div>

                <div className="detail-field">
                  <label>Source IP Address</label>
                  <code className="ip-highlight">{selectedEvent.ip}</code>
                </div>

                <div className="detail-field">
                  <label>Event Timestamp</label>
                  <span>{selectedEvent.fullTime}</span>
                </div>

                <div className="detail-field full-width">
                  <label>Request ID</label>
                  <code>{selectedEvent.requestId}</code>
                </div>

                <div className="detail-field full-width">
                  <label>User-Agent (Attacker Client / Tool)</label>
                  <span className="user-agent-str">{selectedEvent.userAgent}</span>
                </div>

                <div className="detail-field full-width">
                  <label>Request Body / Injected Payload</label>
                  <pre className="code-box">
                    {selectedEvent.body || '(Empty body or GET request)'}
                  </pre>
                </div>

                <div className="detail-field full-width">
                  <label>Query Parameters</label>
                  <pre className="code-box">{selectedEvent.queryParams}</pre>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="control-btn"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedEvent.raw, null, 2))
                  alert('Event JSON copied to clipboard!')
                }}
              >
                Copy Raw JSON
              </button>
              <button className="control-btn primary" onClick={() => setSelectedEvent(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Monitor
