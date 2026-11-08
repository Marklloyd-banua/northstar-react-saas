import { Link, useLocation } from 'react-router-dom'
import { navGroups } from '../../data/navigation'
export function Breadcrumbs(){const path=useLocation().pathname;const item=navGroups.flatMap(group=>group.items).find(entry=>entry.path===path);return <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Platform</Link><i className="bi bi-chevron-right"/><span>{item?.label??'Overview'}</span></nav>}
