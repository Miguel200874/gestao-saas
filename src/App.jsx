import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import CashFlowPage from './pages/CashFlowPage'
import EmployeesPage from './pages/EmployeesPage'
import PayrollPage from './pages/PayrollPage'
import StockPage from './pages/StockPage'
import { SuppliersPage } from './pages/SuppliersPage'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'

const PAGE_TITLES = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do negócio' },
  cashflow: { title: 'Fluxo de Caixa', subtitle: 'Gestão financeira' },
  transactions: { title: 'Transações', subtitle: 'Histórico de movimentações' },
  employees: { title: 'Funcionários', subtitle: 'Gestão de pessoas' },
  payroll: { title: 'Folha de Pagamento', subtitle: 'Salários e remuneração' },
  stock: { title: 'Estoque', subtitle: 'Controle de mercadorias' },
  suppliers: { title: 'Fornecedores', subtitle: 'Parceiros e fornecedores' },
}

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('dashboard')
  const { toasts, toast } = useToast()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--off-white)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--gray-900)', marginBottom: 8 }}>FlowGestão</div>
          <div style={{ fontSize: 13, color: 'var(--gray-300)' }}>Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  const info = PAGE_TITLES[page] || PAGE_TITLES.dashboard

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={setPage} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            <h1>{info.title}</h1>
            <p>{info.subtitle}</p>
          </div>
          <div className="topbar-actions">
            <div style={{ fontSize: 12, color: 'var(--gray-300)', textAlign: 'right' }}>
              <div>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
        </div>

        {page === 'dashboard' && <DashboardPage />}
        {page === 'cashflow' && <CashFlowPage toast={toast} />}
        {page === 'transactions' && <CashFlowPage toast={toast} />}
        {page === 'employees' && <EmployeesPage toast={toast} />}
        {page === 'payroll' && <PayrollPage toast={toast} />}
        {page === 'stock' && <StockPage toast={toast} />}
        {page === 'suppliers' && <SuppliersPage toast={toast} />}
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
