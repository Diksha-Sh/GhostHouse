import Layout from '../components/Layout'

function ApiKeys() {
  const keys = [
    ['Production API', 'Active', '12 Aug 2026'],
    ['Analytics API', 'Active', '02 Jul 2026'],
    ['Testing API', 'Revoked', '18 Jun 2026'],
  ]

  return (
    <Layout>
      <h1>API Credentials</h1>

      <div className="portal-card">
        {keys.map(([name, status, date]) => (
          <p key={name}>
            <strong>{name}</strong> — {status} — Created {date}
          </p>
        ))}

        <p className="fake-token">
          Token: gh_test_xxxxxxxxxxxxxxxxx
        </p>
      </div>
    </Layout>
  )
}

export default ApiKeys