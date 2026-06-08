import { useAuth } from '../contexts/AuthContext'

const NAV = [
  {
    section: 'Principal',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    ]
  },
  {
    section: 'Financeiro',
    items: [
      { id: 'cashflow', label: 'Fluxo de Caixa', icon: 'trending-up' },
      { id: 'transactions', label: 'Transações', icon: 'credit-card' },
    ]
  },
  {
    section: 'Pessoas',
    items: [
      { id: 'employees', label: 'Funcionários', icon: 'users' },
      { id: 'payroll', label: 'Folha de Pagamento', icon: 'dollar-sign' },
    ]
  },
  {
    section: 'Operações',
    items: [
      { id: 'stock', label: 'Estoque', icon: 'package' },
      { id: 'suppliers', label: 'Fornecedores', icon: 'truck' },
    ]
  }
]

function Icon({ name, size = 16 }) {
  const icons = {
    grid: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    'trending-up': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    'credit-card': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    'dollar-sign': <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    package: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    truck: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  }
  return icons[name] || null
}

export { Icon }

export default function Sidebar({ currentPage, onNavigate }) {
  const { user, signOut } = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 13 L6 8 L9 11 L12 6" />
              <circle cx="12" cy="6" r="1.5" fill="#6ee7b7" stroke="none"/>
            </svg>
          </div>
          <div className="logo-text">
            FlowGestão
            <span>Sistema de Gestão</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon"><Icon name={item.icon} /></span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.email || 'Administrador'}</div>
            <div className="user-role">Gestor</div>
          </div>
          <button className="btn-icon" onClick={signOut} title="Sair">
            <Icon name="logout" size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
