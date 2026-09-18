import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Users from './pages/Users'
import ApiKeys from './pages/ApiKeys'
import Monitor from './pages/Monitor'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/users" element={<Users />} />
        <Route path="/api-keys" element={<ApiKeys />} />
        <Route path="/monitor" element={<Monitor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App