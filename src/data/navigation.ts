import type { Permission } from '../auth/types'

export interface NavItem { label: string; path: string; icon: string; permission?: Permission }
export interface NavGroup { label: string; items: NavItem[] }
/** Permission hints are informational; route access is enforced separately by `ProtectedRoute`/`canAccessPath`. */
export const navGroups: NavGroup[] = [
 { label: 'Platform overview', items: [{label:'Overview',path:'/',icon:'bi-grid-1x2'},{label:'Platform analytics',path:'/analytics',icon:'bi-bar-chart-line'}] },
 { label: 'Tenant management', items: [{label:'Stores',path:'/stores',icon:'bi-shop'},{label:'Tenants',path:'/tenants',icon:'bi-buildings'},{label:'Platform users',path:'/platform-users',icon:'bi-people',permission:'admin:sensitive'},{label:'Roles & permissions',path:'/roles',icon:'bi-shield-check',permission:'admin:sensitive'}] },
 { label: 'SaaS subscriptions', items: [{label:'Subscription plans',path:'/plans',icon:'bi-layers'},{label:'Subscriptions',path:'/subscriptions',icon:'bi-arrow-repeat'},{label:'Billing & invoices',path:'/billing',icon:'bi-receipt'},{label:'Payments & transactions',path:'/payments',icon:'bi-credit-card'},{label:'Discounts & promotions',path:'/promotions',icon:'bi-tag'}] },
 { label: 'Platform operations', items: [{label:'System monitoring',path:'/monitoring',icon:'bi-activity'},{label:'Audit logs',path:'/audit-logs',icon:'bi-journal-text'},{label:'Notifications',path:'/notifications',icon:'bi-bell'},{label:'Integrations & API',path:'/integrations',icon:'bi-plug',permission:'admin:sensitive'}] },
 { label: 'Configuration', items: [{label:'Global settings',path:'/settings',icon:'bi-sliders',permission:'admin:sensitive'},{label:'Security settings',path:'/security',icon:'bi-lock',permission:'admin:sensitive'},{label:'Support & helpdesk',path:'/support',icon:'bi-life-preserver'}] },
]
