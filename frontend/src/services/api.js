const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy'

// Ensure API_BASE_URL always points to the decoy root without trailing '/logs' or slashes
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/logs\/?$/, '').replace(/\/+$/, '')

// LOGS_URL points specifically to the /logs endpoint
const LOGS_URL =
  import.meta.env.VITE_LOGS_URL || `${API_BASE_URL}/logs`

export async function submitLogin(username, password) {
  // Always log the credentials to API_BASE_URL + '/login' (decoy login probe capture)
  try {
    if (API_BASE_URL) {
      await fetch(API_BASE_URL + '/login', {
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
    // Attackers request was dispatched; even if CORS or backend error occurs,
    // the honeypot still captured the probe on AWS.
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
