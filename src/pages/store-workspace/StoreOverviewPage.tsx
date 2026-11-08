import { useOutletContext } from 'react-router-dom'
import type { StoreWorkspaceContext } from './StoreWorkspaceLayout'

export function StoreOverviewPage() {
  const { store } = useOutletContext<StoreWorkspaceContext>()
  return (
    <div className="content-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <section className="panel"><h2 style={{ marginTop: 0, fontSize: 15 }}>Store summary (demo)</h2><div className="details-list"><div><span>Store</span><strong>{store.name}</strong></div><div><span>Owner</span><strong>{store.owner}</strong></div><div><span>Domain</span><strong>{store.domain}</strong></div><div><span>Plan</span><strong>{store.plan}</strong></div><div><span>MRR</span><strong>${Number(store.mrr).toLocaleString()}</strong></div></div></section>
      <section className="panel"><div className="settings-notice" role="status"><i className="bi bi-info-circle"/> Overview metrics are demo context only. Use the Products tab for store-scoped product management.</div></section>
    </div>
  )
}