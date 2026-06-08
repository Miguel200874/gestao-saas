import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function PayrollPage({ toast }) {
  const [employees, setEmployees] = useState([])
  const [payroll, setPayroll] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ funcionario_id: '', mes: new Date().getMonth() + 1, ano: new Date().getFullYear(), salario_bruto: '', bonus: '0', desconto: '0', observacao: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    const sub = supabase
      .channel('folha-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folha_pagamento' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: emp }, { data: pay }] = await Promise.all([
      supabase.from('funcionarios').select('id, nome, salario, cargo').eq('status', 'ativo').order('nome'),
      supabase.from('folha_pagamento').select('*, funcionarios(nome, cargo)').order('ano', { ascending: false }).order('mes', { ascending: false }).limit(50)
    ])
    setEmployees(emp || [])
    setPayroll(pay || [])
    setLoading(false)
  }

  function openNew(emp = null) {
    setForm({
      funcionario_id: emp?.id || '',
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear(),
      salario_bruto: emp?.salario || '',
      bonus: '0',
      desconto: '0',
      observacao: ''
    })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.funcionario_id || !form.salario_bruto) return toast('Funcionário e salário são obrigatórios', 'error')
    setSaving(true)
    const bruto = parseFloat(form.salario_bruto) || 0
    const bonus = parseFloat(form.bonus) || 0
    const desconto = parseFloat(form.desconto) || 0
    const liquido = bruto + bonus - desconto
    const { error } = await supabase.from('folha_pagamento').insert([{
      ...form,
      salario_bruto: bruto, bonus, desconto, salario_liquido: liquido,
      mes: parseInt(form.mes), ano: parseInt(form.ano)
    }])
    if (error) toast('Erro: ' + error.message, 'error')
    else { toast('Folha registrada!', 'success'); setShowModal(false); loadData() }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Remover este lançamento?')) return
    await supabase.from('folha_pagamento').delete().eq('id', id)
    toast('Removido', 'success'); loadData()
  }

  const totalFolha = payroll
    .filter(p => p.mes === new Date().getMonth() + 1 && p.ano === new Date().getFullYear())
    .reduce((s, p) => s + (p.salario_liquido || 0), 0)

  return (
    <div className="page-content animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Folha de Pagamento</h2>
          <p>Controle de salários, bônus e descontos</p>
        </div>
        <button className="btn btn-accent" onClick={() => openNew()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Lançar Pagamento
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-value">R$ {totalFolha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Folha do Mês Atual</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Funcionários Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="stat-value">{payroll.length}</div>
          <div className="stat-label">Lançamentos Total</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Funcionários Ativos</div>
          <div className="card-subtitle">Clique para lançar pagamento</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {employees.map(emp => (
            <div key={emp.id} style={{ padding: '14px 16px', border: '1px solid var(--gray-100)', borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => openNew(emp)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-100)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', flexShrink: 0 }}>
                  {emp.nome?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.nome}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray-300)' }}>{emp.cargo}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--accent)' }}>
                R$ {(emp.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--gray-300)', fontSize: 13 }}>
              Nenhum funcionário ativo. Cadastre funcionários primeiro.
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Histórico de Pagamentos</div>
        </div>
        {loading ? (
          <div className="empty-state"><p style={{ animation: 'pulse 1.5s infinite' }}>Carregando...</p></div>
        ) : payroll.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <p>Nenhum pagamento registrado</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Período</th>
                  <th>Salário Bruto</th>
                  <th>Bônus</th>
                  <th>Descontos</th>
                  <th>Líquido</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payroll.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.funcionarios?.nome || '—'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--gray-300)' }}>{p.funcionarios?.cargo}</div>
                    </td>
                    <td style={{ color: 'var(--gray-300)', fontSize: 12.5 }}>{MESES[(p.mes || 1) - 1]}/{p.ano}</td>
                    <td>R$ {(p.salario_bruto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: '#15803d' }}>+ R$ {(p.bonus || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: '#dc2626' }}>- R$ {(p.desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>R$ {(p.salario_liquido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <button className="btn-icon" onClick={() => handleDelete(p.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
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
                <div className="modal-title">Lançar Pagamento</div>
                <div className="modal-subtitle">Registrar pagamento de salário</div>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="form-group">
              <label>Funcionário *</label>
              <select value={form.funcionario_id} onChange={e => {
                const emp = employees.find(x => x.id === e.target.value)
                setForm(f => ({ ...f, funcionario_id: e.target.value, salario_bruto: emp?.salario || '' }))
              }}>
                <option value="">Selecionar...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.nome} — {e.cargo}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Mês</label>
                <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}>
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Ano</label>
                <input type="number" value={form.ano} onChange={e => setForm(f => ({ ...f, ano: e.target.value }))} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Salário Bruto (R$) *</label>
                <input type="number" placeholder="0,00" step="0.01" value={form.salario_bruto} onChange={e => setForm(f => ({ ...f, salario_bruto: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Bônus (R$)</label>
                <input type="number" placeholder="0,00" step="0.01" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Descontos (R$)</label>
                <input type="number" placeholder="0,00" step="0.01" value={form.desconto} onChange={e => setForm(f => ({ ...f, desconto: e.target.value }))} />
              </div>
            </div>
            {form.salario_bruto && (
              <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--accent-dark)', fontWeight: 500 }}>Salário Líquido</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--accent)' }}>
                  R$ {(parseFloat(form.salario_bruto || 0) + parseFloat(form.bonus || 0) - parseFloat(form.desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Observações</label>
              <textarea placeholder="Notas..." value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} style={{ minHeight: 55 }} />
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
