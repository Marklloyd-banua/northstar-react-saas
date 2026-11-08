export function StoreWorkspacePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <section className="panel" style={{ padding: 20 }}>
      <div className="settings-notice" role="status" style={{ marginBottom: 12 }}>
        <i className="bi bi-cone-striped" /> <strong>Placeholder (demo)</strong>: {title} is not yet implemented. This area is labeled intentionally and does not perform real store operations.
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>{title}</h2>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{description}</p>
    </section>
  )
}