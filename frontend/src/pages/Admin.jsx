import Layout from '../components/Layout'

function Admin() {
  return (
    <Layout>
      <h1>Administration</h1>

      <div className="portal-card">
        <h2>System Configuration</h2>

        <p>Database — Connected</p>
        <p>API Gateway — Active</p>
        <p>Authentication — Active</p>
        <p>Monitoring — Enabled</p>
      </div>
    </Layout>
  )
}

export default Admin