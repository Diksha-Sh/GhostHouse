import { useState } from 'react'
import { submitLogin } from '../services/api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username || !password) {
      setMessage('Please enter your username and password.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const result = await submitLogin(username, password)

      setMessage(result.message || 'Invalid username or password.')
      setPassword('')
    } catch (error) {
      console.error('Login request failed:', error)
      setMessage('Unable to connect to the authentication service.')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">

        <div className="logo">
          <div className="logo-symbol">G</div>
          <h1>GHOST HOUSE</h1>
        </div>

        <p className="subtitle">INTERNAL CLOUD PORTAL</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">
            Email / Username
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <button type="submit" disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        <a href="#" className="forgot">
          Forgot password?
        </a>

        <div className="warning">
          ⚠ Authorized personnel only
        </div>

      </div>
    </div>
  )
}

export default Login