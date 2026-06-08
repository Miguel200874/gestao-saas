import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid var(--gray-100)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: 'var(--shadow-md)' }}>
      <p style={{ fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name !== 'Qtd' ? `R$ ${p.value.toLocaleString('pt-BR')}` : p.value}
        </p>
      ))}
    </div>
  )
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ receita: 0, despesa: 0, funcionarios: 0, estoque: 0, estoqueItens: 0 })
  const [cashflowChart, setCashflowChart] = useState([])
  const [stockChart, setStockChart] = useState([])
  const [alertas, setAlertas] = useState([])
  const [recentTrans, setRecentTrans] = useState([])

  useEffect(() => {
    loadAll()
    // Realtime subscription para transações
    const sub = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, () => loadAll())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function loadAll() {
    setLoading(true)
    const now = new Date()
    const mesAtual = now.getMonth() + 1
    const anoAtual = now.getFullYear()
    // Início do mês
    const inicioMes = `${anoAtual}-${String(mesAtual).padStart(2,'0')}-01`

    const [
      { data: transacoes },
      { count: empCount },
      { data: estoqueData },
      { data: estoqueBaixo },
      { data: transRecentes }
    ] = await Promise.all([
      supabase.from('transacoes').select('tipo, valor, data, categoria'),
      supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
      supabase.from('estoque').select('nome, quantidade, quantidade_minima, categoria, preco_custo'),
      supabase.from('estoque').select('nome, quantidade').lte('quantidade', 5),
      supabase.from('transacoes').select('*').order('created_at', { ascending: false }).limit(5)
    ])

    // Stats do mês atual
    const transMes = (transacoes || []).filter(t => t.data >= inicioMes)
    const receita = transMes.filter(t => t.tipo === 'receita').reduce((s, t) => s + (t.valor || 0), 0)
    const despesa = transMes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (t.valor || 0), 0)
    const totalItens = (estoqueData || []).reduce((s, i) => s + (i.quantidade || 0), 0)
    const valorEstoque = (estoqueData || []).reduce((s, i) => s + ((i.quantidade || 0) * (i.preco_custo || 0)), 0)

    setStats({ receita, despesa, funcionarios: empCount || 0, estoque: totalItens, valorEstoque })
    setAlertas(estoqueBaixo || [])
    setRecentTrans(transRecentes || [])

    // Cashflow chart — últimos 6 meses
    const chart = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoAtual, mesAtual - 1 - i, 1)
      const mes = d.getMonth() + 1
      const ano = d.getFullYear()
      const prefix = `${ano}-${String(mes).padStart(2,'0')}`
      const ts = (transacoes || []).filter(t => t.data?.startsWith(prefix))
      chart.push({
        mes: MESES[mes - 1],
        receita: ts.filter(t => t.tipo === 'receita').reduce((s, t) => s + (t.valor || 0), 0),
        despesa: ts.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (t.valor || 0), 0),
      })
    }
    setCashflowChart(chart)

    // Stock chart — por categoria
    const catMap = {}
    ;(estoqueData || []).forEach(i => {
      const cat = i.categoria || 'Outros'
      catMap[cat] = (catMap[cat] || 0) + (i.quantidade || 0)
    })
    setStockChart(Object.entries(catMap).map(([categoria, quantidade]) => ({ categoria, quantidade })))

    setLoading(false)
  }

  const saldo = stats.receita - stats.despesa

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--gray-100)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
          <div style={{ fontSize: 13, color: 'var(--gray-300)' }}>Carregando dados...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="page-content animate-fade">
      {alertas.length > 0 && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span><strong>{alertas.length} item(s) com estoque crítico:</strong> {alertas.map(a => `${a.nome} (${a.quantidade} un.)`).join(', ')}</span>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div className="stat-value">R$ {stats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Receita do Mês</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          </div>
          <div className="stat-value">R$ {stats.despesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Despesas do Mês</div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${saldo >= 0 ? 'teal' : 'red'}`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-value" style={{ color: saldo >= 0 ? 'var(--accent)' : 'var(--red)' }}>
            R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-label">Saldo {saldo >= 0 ? 'Positivo' : 'Negativo'}</div>
          {stats.receita > 0 && <div className="stat-delta up">Margem: {((saldo/stats.receita)*100).toFixed(1)}%</div>}
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-value">{stats.funcionarios}</div>
          <div className="stat-label">Funcionários Ativos</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Fluxo de Caixa — 6 meses</div>
              <div className="card-subtitle">Receitas vs Despesas (dados reais)</div>
            </div>
          </div>
          {cashflowChart.every(d => d.receita === 0 && d.despesa === 0) ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p style={{ fontSize: 13 }}>Sem transações para exibir</p>
              <small>Cadastre transações no Fluxo de Caixa</small>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cashflowChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15}/><stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#0f766e" strokeWidth={2} fill="url(#colorReceita)" />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#ef4444" strokeWidth={2} fill="url(#colorDespesa)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Estoque por Categoria</div>
              <div className="card-subtitle">{stats.estoque} unidades em estoque</div>
            </div>
          </div>
          {stockChart.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p style={{ fontSize: 13 }}>Sem itens no estoque</p>
              <small>Cadastre itens no módulo Estoque</small>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stockChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="categoria" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8eaed' }} />
                <Bar dataKey="quantidade" name="Qtd" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Últimas Transações</div>
          <div className="card-subtitle">5 mais recentes</div>
        </div>
        {recentTrans.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <p style={{ fontSize: 13 }}>Nenhuma transação ainda</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Data</th></tr></thead>
              <tbody>
                {recentTrans.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.descricao}</td>
                    <td><span className="badge badge-gray">{t.categoria || '—'}</span></td>
                    <td><span className={`badge ${t.tipo === 'receita' ? 'badge-green' : 'badge-red'}`}>{t.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
                    <td style={{ fontWeight: 600, color: t.tipo === 'receita' ? '#15803d' : '#dc2626' }}>
                      {t.tipo === 'receita' ? '+' : '-'} R$ {(t.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: 'var(--gray-300)', fontSize: 12 }}>{t.data ? new Date(t.data + 'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
