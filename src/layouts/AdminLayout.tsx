import { Outlet } from 'react-router-dom'
import { AdminSidebar } from '../components/layout/AdminSidebar'
import { AdminHeader } from '../components/layout/AdminHeader'
import { useApp } from '../contexts/AppContext'
import { repositoryConfig } from '../services/repositoryConfig'
export function AdminLayout(){const{toasts,dismiss}=useApp();return <div className="admin-shell"><AdminSidebar/><div className="admin-main"><AdminHeader/><main className="page-main"><Outlet/></main><footer className="app-footer"><span>© 2026 Northstar Platform</span><span>{repositoryConfig.useMockApi?'Mock data · changes stay in this browser':'API mode · server authorization is required'}</span></footer></div><div className="toast-stack" aria-live="polite">{toasts.map(item=><div className={`toast-card toast-${item.kind}`} key={item.id}><i className={`bi ${item.kind==='success'?'bi-check-circle-fill':item.kind==='error'?'bi-exclamation-circle-fill':'bi-info-circle-fill'}`}/><span>{item.message}</span><button onClick={()=>dismiss(item.id)} aria-label="Dismiss notification"><i className="bi bi-x"/></button></div>)}</div></div>}
