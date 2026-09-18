const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function submitLogin(username, password) {
  if (!API_BASE_URL) {
    // Temporary local response until AWS API Gateway is available.
    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      success: false,
      message: 'Invalid username or password.',
    }
  }

  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export async function getSecurityEvents() {
  if (!API_BASE_URL) {
    return []
  }

  const response = await fetch(`${API_BASE_URL}/events`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}