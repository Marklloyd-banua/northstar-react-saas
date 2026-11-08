import { NavLink, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { navGroups } from '../../data/navigation'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { canAccessPath, getRoleLabel } from '../../auth/permissions'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

export function AdminSidebar() {
  const { sidebarOpen, toggleSidebar, toast } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const visibleGroups = useMemo(() => navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => canAccessPath(user, item.path)) }))
    .filter((group) => group.items.length > 0), [user])
  const displayName = user?.name ?? 'Signed in user'
  const displayEmail = user?.email ?? 'demo-session'
  const displayRole = user ? getRoleLabel(user.role) : 'Session'

  const onSignOut = async () => {
    setProfileOpen(false)
    await logout()
    toast('Demo session ended. Frontend-only sign-out; backend sessions must be revoked server-side.', 'info')
    navigate('/login', { replace: true })
  }

  return <>
    <div className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`} onClick={toggleSidebar} aria-hidden="true"/>
    <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><i className="bi bi-hexagon-fill"/></span><span>northstar<span className="brand-small">PLATFORM</span></span><button className="sidebar-close btn-icon" onClick={toggleSidebar} aria-label="Close menu"><i className="bi bi-x-lg"/></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">N</span><span className="workspace-name">Northstar Inc.<small>{displayRole}</small></span><i className="bi bi-chevron-expand ms-auto text-white-50"/></div>
      <nav className="side-nav" aria-label="Main navigation">{visibleGroups.map((group) => <section className="nav-section" key={group.label}><div className="nav-section-title">{group.label}</div>{group.items.map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => sidebarOpen && toggleSidebar()}><i className={`bi ${item.icon}`}/><span>{item.label}</span></NavLink>)}</section>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><span className="help-icon"><i className="bi bi-chat-square-text"/></span><div><strong>Need a hand?</strong><small>Visit our help center</small></div><i className="bi bi-arrow-up-right ms-auto"/></div>
        <div className="sidebar-profile"><div className="profile-avatar">{initials(displayName)}</div><div><strong>{displayName}</strong><small>{displayEmail}</small></div><div className="dropdown ms-auto"><button className="btn-icon" aria-label="Profile menu" onClick={() => setProfileOpen((value) => !value)}><i className="bi bi-three-dots-vertical"/></button>{profileOpen && <div className="dropdown-menu show dropdown-menu-end profile-menu">{canAccessPath(user, '/settings') && <button className="dropdown-item" onClick={() => { setProfileOpen(false); navigate('/settings') }}>Account settings</button>}<button className="dropdown-item" onClick={() => void onSignOut()}>Sign out</button></div>}</div></div>
      </div>
    </aside>
  </>
}
