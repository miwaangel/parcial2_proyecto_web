import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './layouts/AdminLayout'
import { PublicLayout } from './layouts/PublicLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import PublicRequestPage from './pages/PublicRequestPage'
import PublicSearchPage from './pages/PublicSearchPage'
import PublicEditPage from './pages/PublicEditPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminRequestsPage from './pages/AdminRequestsPage'
import AdminCatalogsPage from './pages/AdminCatalogsPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/solicitar" element={<PublicRequestPage />} />
          <Route path="/consultar" element={<PublicSearchPage />} />
          <Route path="/modificar" element={<PublicEditPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/solicitudes" element={<AdminRequestsPage />} />
            <Route path="/admin/catalogos" element={<AdminCatalogsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
