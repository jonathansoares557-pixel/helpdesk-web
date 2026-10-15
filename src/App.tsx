import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './lib/auth'
import type { Role } from './lib/api'
import { ClientsPage, ServicesPage, TechniciansPage } from './pages/Admin'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { NewTicketPage, TicketDetailPage, TicketsPage } from './pages/Tickets'

function RoleRoute({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth()
  return user && roles.includes(user.role) ? <>{children}</> : <Navigate to="/tickets" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/new" element={<RoleRoute roles={['CLIENT']}><NewTicketPage /></RoleRoute>} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/technicians" element={<RoleRoute roles={['ADMIN']}><TechniciansPage /></RoleRoute>} />
            <Route path="/clients" element={<RoleRoute roles={['ADMIN']}><ClientsPage /></RoleRoute>} />
            <Route path="/services" element={<RoleRoute roles={['ADMIN']}><ServicesPage /></RoleRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/tickets" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
