import './App.css'

function App() {
  return (
    <div className="login-page">
      <div className="login-box">

        <div className="logo">
          <div className="logo-symbol">G</div>
          <h1>GHOST HOUSE</h1>
        </div>

        <p className="subtitle">INTERNAL CLOUD PORTAL</p>

        <form>
          <label>Email / Username</label>
          <input
            type="text"
            placeholder="Enter your username"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
          />

          <button type="submit">SIGN IN</button>
        </form>

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

export default App