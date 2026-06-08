import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'

const CATEGORIAS = {
  receita: ['Vendas', 'Serviços', 'Investimentos', 'Outros'],
  despesa: ['Salários', 'Aluguel', 'Fornecedores', 'Marketing', 'Impostos', 'Utilidades', 'Outros'],
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function CashFlowPage({ toast }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('todos')
  const [form, setForm] = useState({ tipo: 'receita', descricao: '', valor: '', categoria: '', data: new Date().toISOString().split('T')[0], observacao: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    const sub = supabase
      .channel('transacoes-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await supabase.from('transacoes').select('*').order('data', { ascending: false }).limit(200)
    if (error) console.error('Erro ao carregar transações:', error)
    setTransactions(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.descricao || !form.valor) return toast('Preencha todos os campos obrigatórios', 'error')
    setSaving(true)
    const { error } = await supabase.from('transacoes').insert([{ ...form, valor: parseFloat(form.valor) }])
    if (error) toast('Erro ao salvar: ' + error.message, 'error')
    else {
      toast('Transação registrada!', 'success')
      setShowModal(false)
      setForm({ tipo: 'receita', descricao: '', valor: '', categoria: '', data: new Date().toISOString().split('T')[0], observacao: '' })
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta transação?')) return
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    if (error) toast('Erro ao remover', 'error')
    else toast('Transação removida', 'success')
  }

  const filtered = filter === 'todos' ? transactions : transactions.filter(t => t.tipo === filter)
  const totalReceita = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + (t.valor || 0), 0)
  const totalDespesa = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (t.valor || 0), 0)
  const saldo = totalReceita - totalDespesa

  const chartData = (() => {
    const map = {}
    transactions.forEach(t => {
      const d = t.data?.slice(0, 7) || ''
      if (!d) return
      if (!map[d]) map[d] = { mes: '', receita: 0, despesa: 0 }
      const [ano, mes] = d.split('-')
      map[d].mes = MESES[parseInt(mes) - 1]
      if (t.tipo === 'receita') map[d].receita += t.valor || 0
      else map[d].despesa += t.valor || 0
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([, v]) => v)
  })()

  return (
    <div className="page-content animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Fluxo de Caixa</h2>
          <p>Controle de entradas e saídas financeiras</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Transação
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div className="stat-value">R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Total Receitas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
          <div className="stat-value">R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Total Despesas</div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${saldo >= 0 ? 'teal' : 'red'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-value" style={{ color: saldo >= 0 ? 'var(--accent)' : 'var(--red)' }}>
            R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-label">Saldo {saldo >= 0 ? 'Positivo' : 'Negativo'}</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Evolução Financeira</div>
            <div className="card-subtitle">Últimos {chartData.length} meses</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gr2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8eaed' }} formatter={v => `R$ ${v.toLocaleString('pt-BR')}`} />
              <Area type="monotone" dataKey="receita" name="Receita" stroke="#0f766e" strokeWidth={2} fill="url(#gr1)" />
              <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" strokeWidth={2} fill="url(#gr2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Histórico de Transações</div>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['todos', 'receita', 'despesa'].map(f => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'todos' ? `Todos (${transactions.length})` : f === 'receita' ? `Receitas (${transactions.filter(t => t.tipo === 'receita').length})` : `Despesas (${transactions.filter(t => t.tipo === 'despesa').length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p style={{ animation: 'pulse 1.5s infinite' }}>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <p>Nenhuma transação registrada</p>
            <small>Clique em "Nova Transação" para começar</small>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--gray-300)', fontSize: 12.5 }}>
                      {t.data ? new Date(t.data + 'T12:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ fontWeight: 500 }}>{t.descricao}</td>
                    <td><span className="badge badge-gray">{t.categoria || '—'}</span></td>
                    <td><span className={`badge ${t.tipo === 'receita' ? 'badge-green' : 'badge-red'}`}>{t.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
                    <td style={{ fontWeight: 600, color: t.tipo === 'receita' ? '#15803d' : '#dc2626' }}>
                      {t.tipo === 'receita' ? '+' : '-'} R$ {(t.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleDelete(t.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Nova Transação</div>
                <div className="modal-subtitle">Registrar entrada ou saída</div>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="tabs">
              {['receita', 'despesa'].map(t => (
                <button key={t} className={`tab ${form.tipo === t ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, tipo: t, categoria: '' }))}>
                  {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                </button>
              ))}
            </div>
            <div className="form-group">
              <label>Descrição *</label>
              <input placeholder="Ex: Venda de produto, Pagamento aluguel..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input type="number" placeholder="0,00" step="0.01" min="0" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                <option value="">Selecionar...</option>
                {CATEGORIAS[form.tipo].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Observação</label>
              <textarea placeholder="Informações adicionais..." value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} style={{ minHeight: 60 }} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Registrar Transação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
