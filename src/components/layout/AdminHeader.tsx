import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { navGroups } from '../../data/navigation'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { canAccessPath, getRoleLabel } from '../../auth/permissions'
import { searchPlatform, type SearchHit } from '../../services/api/globalSearch'
import { deletePlatformRecord, listPlatformRecords, savePlatformRecord } from '../../services/dataRepository'
import type { BaseRecord, Notification } from '../../types/models'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U'
}

function asNotification(record: BaseRecord): Notification {
  return {
    id: record.id,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
    title: String(record.title ?? record.name ?? record.id),
    type: String(record.type ?? 'Notification'),
    audience: String(record.audience ?? '—'),
    sent: String(record.sent ?? record.createdAt ?? '—'),
    read: record.read === true,
    dismissed: record.dismissed === true,
  }
}

export function AdminHeader() {
  const { toggleTheme, dark, toggleSidebar, toast } = useApp()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const notifRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const helpRef = useRef<HTMLDivElement | null>(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [notifItems, setNotifItems] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState('')
  const [notifBusy, setNotifBusy] = useState<string | null>(null)
  const [notifInitialized, setNotifInitialized] = useState(false)
  const location = useLocation()
  const allItems = useMemo(() => navGroups.flatMap((g) => g.items), [])
  const visibleItems = useMemo(() => allItems.filter((item) => canAccessPath(user, item.path)), [allItems, user])
  const title = allItems.find((item) => item.path === location.pathname)?.label ?? 'Overview'
  const pages = visibleItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())).slice(0, 3)
  const unreadCount = useMemo(() => notifItems.filter((item) => !item.read && !item.dismissed).length, [notifItems])

  useEffect(() => {
    let active = true
    if (search.trim().length < 2) return () => { active = false }
    const timer = window.setTimeout(() => { void searchPlatform(search).then((results) => { if (active) setHits(results.filter((hit) => canAccessPath(user, hit.path))) }).catch(() => { if (active) setHits([]) }) }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [search, user])

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setNotifLoading(true)
    setNotifError('')
    try {
      const data = await listPlatformRecords('notifications', '', 'All', 1, 20, 'createdAt', 'desc')
      setNotifItems(data.items.filter((item) => item.dismissed !== true).map(asNotification))
      setNotifInitialized(true)
    } catch (err) {
      setNotifError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to load notifications.')
    } finally {
      if (!silent) setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!showNotifs) return
    void loadNotifications(!notifInitialized)
  }, [showNotifs, loadNotifications, notifInitialized])

  useEffect(() => {
    if (!showNotifs) return
    const onPointerDown = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifs(false)
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowNotifs(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [showNotifs])

  useEffect(() => {
    if (!showProfile) return
    const onPointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfile(false)
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowProfile(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [showProfile])

  useEffect(() => {
    if (!showHelp) return
    const onPointerDown = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) setShowHelp(false)
    }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowHelp(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [showHelp])

  const markRead = async (item: Notification) => {
    if (item.read || notifBusy) return
    setNotifBusy(`read:${item.id}`)
    try {
      await savePlatformRecord('notifications', { read: true }, item.id)
      setNotifItems((items) => items.map((n) => n.id === item.id ? { ...n, read: true } : n))
    } catch (err) {
      toast(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to mark notification as read.', 'error')
    } finally { setNotifBusy(null) }
  }

  const markAllRead = async () => {
    const unread = notifItems.filter((item) => !item.read)
    if (!unread.length || notifBusy) return
    setNotifBusy('all-read')
    try {
      await Promise.all(unread.map((item) => savePlatformRecord('notifications', { read: true }, item.id)))
      setNotifItems((items) => items.map((n) => ({ ...n, read: true })))
      toast('All notifications marked as read.', 'success')
    } catch (err) {
      toast(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to update notifications.', 'error')
    } finally { setNotifBusy(null) }
  }

  const dismissNotification = async (item: Notification) => {
    if (notifBusy) return
    setNotifBusy(`dismiss:${item.id}`)
    try {
      await deletePlatformRecord('notifications', item.id)
      setNotifItems((items) => items.filter((n) => n.id !== item.id))
      toast('Notification removed.', 'success')
    } catch (err) {
      toast(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to remove notification.', 'error')
    } finally { setNotifBusy(null) }
  }

  const openNotification = async (item: Notification) => {
    setShowNotifs(false)
    if (!item.read) void markRead(item)
    if (canAccessPath(user, '/notifications')) navigate('/notifications')
    else toast('Notification details are not available for this account.', 'info')
  }

  const goSettings = () => { setShowProfile(false); if (canAccessPath(user, '/settings')) navigate('/settings'); else navigate('/unauthorized') }
  const handleLogout = async () => {
    setShowProfile(false)
    await logout()
    toast('Demo session ended. Frontend-only sign-out; backend sessions must be revoked server-side.', 'info')
    navigate('/login', { replace: true })
  }

  const name = user?.name ?? 'Signed in user'
  const email = user?.email ?? 'demo-session'
  const role = user ? getRoleLabel(user.role) : 'Session'
  const canOpenSettings = canAccessPath(user, '/settings')
  const canOpenSupport = canAccessPath(user, '/support')

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="btn-icon sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle navigation"><i className="bi bi-list"/></button>
        <div className="breadcrumb-line"><span>Platform</span><i className="bi bi-chevron-right"/><strong>{title}</strong></div>
      </div>
      <div className="header-actions">
        <div className="global-search">
          <i className="bi bi-search"/>
          <input aria-label="Search platform" placeholder="Search anything..." value={search} onFocus={() => { setShowSearch(true); setShowNotifs(false); setShowProfile(false); setShowHelp(false) }} onChange={(event) => { setSearch(event.target.value); if (event.target.value.trim().length < 2) setHits([]) }} onKeyDown={(event) => { if (event.key === 'Escape') setShowSearch(false) }}/>
          <kbd>⌘ K</kbd>
          {showSearch && search && <div className="search-results">
            {pages.length > 0 && <><div className="search-category">Pages</div>{pages.map((item) => <Link key={item.path} to={item.path} onClick={() => { setSearch(''); setShowSearch(false) }}><i className={`bi ${item.icon}`}/>{item.label}<small>Open page</small></Link>)}</>}
            {hits.length > 0 && <><div className="search-category">Platform records</div>{hits.map((hit) => <Link key={`${hit.category}-${hit.id}`} to={hit.path} onClick={() => { setSearch(''); setShowSearch(false) }}><i className="bi bi-search"/><span>{hit.label}<small>{hit.category} · {hit.description || hit.id}</small></span><small>{hit.id}</small></Link>)}</>}
            {!pages.length && !hits.length && <div className="search-empty">Searching platform records…</div>}
          </div>}
        </div>

        <div className="header-popover-wrap" ref={helpRef}>
          <button className="btn-icon header-help" aria-label="Help center" aria-expanded={showHelp} aria-haspopup="dialog" onClick={() => { setShowHelp((v) => !v); setShowNotifs(false); setShowProfile(false); setShowSearch(false) }}><i className="bi bi-question-circle"/></button>
          {showHelp && <div className="header-popover" role="dialog" aria-label="Help center">
            <div className="header-popover-header"><strong>Help center</strong></div>
            <div className="header-popover-body">
              <p className="header-popover-text">This template runs in demo mode. Use mock data to explore platform workflows; no real backend actions are performed.</p>
              <ul className="header-popover-list">
                <li>Use the sidebar to open dashboard areas you can access.</li>
                <li>Directory pages support demo create/edit/delete where permitted.</li>
                <li>Account access and navigation follow frontend RBAC rules.</li>
              </ul>
              {canOpenSupport && <Link to="/support" className="btn btn-outline-secondary btn-sm w-100" onClick={() => setShowHelp(false)}>Open support &amp; helpdesk</Link>}
            </div>
          </div>}
        </div>

        <button className="btn-icon" aria-label="Toggle theme" onClick={toggleTheme}><i className={`bi ${dark ? 'bi-sun' : 'bi-moon-stars'}`}/></button>

        <div className="notification-wrap" ref={notifRef}>
          <button className="btn-icon notification-trigger" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'} aria-expanded={showNotifs} aria-haspopup="dialog" onClick={() => { setShowNotifs((v) => !v); setShowProfile(false); setShowHelp(false); setShowSearch(false) }}><i className="bi bi-bell"/>{(unreadCount > 0 || (!notifInitialized && notifItems.length === 0)) && <span className="notification-dot" aria-hidden="true"/>}</button>
          {showNotifs && <div className="notification-panel" role="dialog" aria-label="Notifications">
            <div className="notification-panel-header"><strong>Notifications</strong><div className="notification-panel-actions">{unreadCount > 0 && <button type="button" className="btn-quiet" onClick={() => void markAllRead()} disabled={!!notifBusy}>Mark all read</button>}<Link to="/notifications" className="btn-quiet" onClick={() => setShowNotifs(false)}>View all</Link></div></div>
            {notifLoading ? <div className="notification-state"><span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"/><span>Loading notifications…</span></div> : notifError ? <div className="notification-state"><span>{notifError}</span><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => void loadNotifications()}>Try again</button></div> : notifItems.length === 0 ? <div className="notification-state"><i className="bi bi-bell-slash"/><span>No notifications</span></div> : <div className="notification-list">{notifItems.map((item) => <div key={item.id} className={`notification-item${item.read ? ' is-read' : ''}`}><button type="button" className="notification-main" onClick={() => void openNotification(item)}><span className="notification-item-title">{item.title}</span><span className="notification-item-meta">{item.type} · {item.audience}</span><span className="notification-item-meta">{item.sent || item.createdAt}</span></button><div className="notification-item-actions">{!item.read && <button type="button" className="btn-icon" title="Mark as read" aria-label="Mark as read" onClick={() => void markRead(item)} disabled={!!notifBusy}><i className="bi bi-check2"/></button>}<button type="button" className="btn-icon" title="Dismiss" aria-label="Dismiss notification" onClick={() => void dismissNotification(item)} disabled={!!notifBusy}><i className="bi bi-x-lg"/></button></div></div>)}</div>}
          </div>}
        </div>

        <div className="header-popover-wrap" ref={profileRef}>
          <button type="button" className="header-avatar header-profile-trigger" aria-label={`Account menu for ${name}`} aria-expanded={showProfile} aria-haspopup="menu" title={`${name} · ${role}`} onClick={() => { setShowProfile((v) => !v); setShowNotifs(false); setShowHelp(false); setShowSearch(false) }}>{initials(name)}</button>
          {showProfile && <div className="header-popover header-profile-menu" role="menu" aria-label="Account menu">
            <div className="header-profile-summary">
              <strong>{name}</strong>
              <span>{email}</span>
              <span className="header-profile-role">{role}</span>
            </div>
            <div className="header-profile-actions">
              {canOpenSettings && <button type="button" className="dropdown-item" role="menuitem" onClick={goSettings}>Account settings</button>}
              <button type="button" className="dropdown-item" role="menuitem" onClick={() => void handleLogout()}>Sign out</button>
            </div>
          </div>}
        </div>
      </div>
    </header>
  )
}
