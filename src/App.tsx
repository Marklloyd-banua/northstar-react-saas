import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import { AdminLayout } from './layouts/AdminLayout'
import { ProtectedRoute } from './auth/ProtectedRoute'
const OverviewPage = lazy(() => import('./pages/overview/OverviewPage').then((module) => ({ default: module.OverviewPage })))
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })))
const ResourcePage = lazy(() => import('./pages/resource/ResourcePage').then((module) => ({ default: module.ResourcePage })))
const AuthPage = lazy(() => import('./pages/resource/AuthPage').then((module) => ({ default: module.AuthPage })))
const StoreWorkspaceLayout = lazy(() => import('./pages/store-workspace/StoreWorkspaceLayout').then((module) => ({ default: module.StoreWorkspaceLayout })))
const StoreOverviewPage = lazy(() => import('./pages/store-workspace/StoreOverviewPage').then((module) => ({ default: module.StoreOverviewPage })))
const StoreProductsPage = lazy(() => import('./pages/store-workspace/StoreProductsPage').then((module) => ({ default: module.StoreProductsPage })))
const StoreCategoriesPage = lazy(() => import('./pages/store-workspace/StoreCategoriesPage').then((module) => ({ default: module.StoreCategoriesPage })))
const StoreOrdersPage = lazy(() => import('./pages/store-workspace/StoreOrdersPage').then((module) => ({ default: module.StoreOrdersPage })))
const StoreInventoryPage = lazy(() => import('./pages/store-workspace/StoreInventoryPage').then((module) => ({ default: module.StoreInventoryPage })))
const StoreSettingsPage = lazy(() => import('./pages/store-workspace/StoreSettingsPage').then((module) => ({ default: module.StoreSettingsPage })))
const resources = ['stores', 'tenants', 'platform-users', 'roles', 'plans', 'subscriptions', 'billing', 'payments', 'promotions', 'monitoring', 'audit-logs', 'notifications', 'integrations', 'settings', 'security', 'support']
const authRoutes = ['login', 'forgot-password', 'reset-password', 'two-factor', 'unauthorized', 'session-expired']
function Loading() {
  return <div className="page-loading"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div><span>Loading workspace</span></div>
}
export default function App() {
  return <AppProvider><BrowserRouter><AuthProvider><Suspense fallback={<Loading />}><Routes>
    <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/stores/:storeId" element={<StoreWorkspaceLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<StoreOverviewPage />} />
        <Route path="products" element={<StoreProductsPage />} />
        <Route path="categories" element={<StoreCategoriesPage />} />
        <Route path="orders" element={<StoreOrdersPage />} />
        <Route path="inventory" element={<StoreInventoryPage />} />
        <Route path="settings" element={<StoreSettingsPage />} />
      </Route>
      {resources.map((path) => <Route key={path} path={`/${path}`} element={<ResourcePage />} />)}
    </Route>
    {authRoutes.map((path) => <Route key={path} path={`/${path}`} element={<AuthPage />} />)}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AuthProvider></BrowserRouter></AppProvider>
}
