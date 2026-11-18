import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage'
import DashboardLayout from '../features/dashboard/DashboardLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import ItemsPage from '../features/items/ItemsPage'
import TransactionsPage from '../features/transactions/TransactionsPage'
import HistoryPage from '../features/transactions/HistoryPage'

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="screen-center"><div className="loader" /><span>Loading BizTrack…</span></div>
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/" element={<Protected><DashboardLayout /></Protected>}>
      <Route index element={<DashboardPage />} />
      <Route path="items" element={<ItemsPage />} />
      <Route path="purchases" element={<TransactionsPage type="purchase" />} />
      <Route path="sales" element={<TransactionsPage type="sale" />} />
      <Route path="purchase-history" element={<HistoryPage kind="purchase" />} />
      <Route path="sales-history" element={<HistoryPage kind="sale" />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
  
}
