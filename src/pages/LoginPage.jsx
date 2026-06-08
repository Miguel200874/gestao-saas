import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nome, setNome] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setNome('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'register') {
      if (password !== confirmPassword) return setError('As senhas não coincidem.')
      if (password.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(true)
      const { error } = await signUp(email, password)
      setLoading(false)
      if (error) return setError(error.message)
      setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro, depois faça login.')
      setMode('login')
      setEmail(email)
      setPassword('')
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 13 L6 8 L9 11 L12 6" />
              <circle cx="12" cy="6" r="1.5" fill="#6ee7b7" stroke="none"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, letterSpacing: '-0.02em' }}>FlowGestão</div>
            <div style={{ fontSize: 10, color: 'var(--gray-300)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sistema de Gestão</div>
          </div>
        </div>

        {/* Tabs login / cadastro */}
        <div className="tabs" style={{ width: '100%', marginBottom: 24 }}>
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => switchMode('register')}
          >
            Cadastrar
          </button>
        </div>

        {/* Header dinâmico */}
        <div className="login-header">
          <h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}</h1>
          <p>{mode === 'login' ? 'Entre com sua conta para continuar' : 'Preencha os dados para se cadastrar'}</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="alert alert-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>{success}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Nome completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Confirmar senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 6 }}
            disabled={loading}
          >
            {loading
              ? (mode === 'login' ? 'Entrando...' : 'Criando conta...')
              : (mode === 'login' ? 'Entrar' : 'Criar Conta')
            }
          </button>
        </form>

        {/* Link alternativo */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-300)', marginTop: 20 }}>
          {mode === 'login' ? (
            <>Não tem conta?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, padding: 0 }}>
                Cadastre-se
              </button>
            </>
          ) : (
            <>Já tem conta?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, padding: 0 }}>
                Entrar
              </button>
            </>
          )}
        </p>

        <div className="divider" style={{ margin: '18px 0 14px' }} />

        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--gray-300)' }}>
          Projeto de Extensão Universitária — Gestão Empresarial
        </p>
      </div>
    </div>
  )
}
