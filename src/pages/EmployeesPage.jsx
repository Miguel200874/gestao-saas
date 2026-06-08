import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const CARGOS = ['Gerente', 'Vendedor', 'Operador', 'Administrativo', 'Estoquista', 'Atendente', 'Técnico', 'Outro']
const STATUS_OPTIONS = ['ativo', 'ferias', 'afastado', 'inativo']
const STATUS_LABELS = { ativo: 'Ativo', ferias: 'Férias', afastado: 'Afastado', inativo: 'Inativo' }
const STATUS_BADGE = { ativo: 'badge-green', ferias: 'badge-blue', afastado: 'badge-orange', inativo: 'badge-gray' }

const EMPTY = { nome: '', cpf: '', cargo: '', salario: '', data_admissao: '', email: '', telefone: '', status: 'ativo', observacao: '' }

export default function EmployeesPage({ toast }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    const sub = supabase
      .channel('funcionarios-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'funcionarios' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('funcionarios').select('*').order('nome')
    setEmployees(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(emp) { setEditing(emp.id); setForm(emp); setShowModal(true) }

  async function handleSave() {
    if (!form.nome || !form.cargo) return toast('Nome e cargo são obrigatórios', 'error')
    setSaving(true)
    const payload = { ...form, salario: parseFloat(form.salario) || 0 }
    const { error } = editing
      ? await supabase.from('funcionarios').update(payload).eq('id', editing)
      : await supabase.from('funcionarios').insert([payload])
    if (error) toast('Erro: ' + error.message, 'error')
    else { toast(editing ? 'Atualizado!' : 'Funcionário cadastrado!', 'success'); setShowModal(false); loadData() }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Remover funcionário?')) return
    await supabase.from('funcionarios').delete().eq('id', id)
    toast('Removido', 'success'); loadData()
  }

  const filtered = employees.filter(e =>
    e.nome?.toLowerCase().includes(search.toLowerCase()) ||
    e.cargo?.toLowerCase().includes(search.toLowerCase())
  )

  const ativos = employees.filter(e => e.status === 'ativo').length
  const folha = employees.filter(e => e.status === 'ativo').reduce((s, e) => s + (e.salario || 0), 0)

  return (
    <div className="page-content animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Funcionários</h2>
          <p>Gestão de equipe e recursos humanos</p>
        </div>
        <button className="btn btn-accent" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Funcionário
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Total Cadastrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-value">{ativos}</div>
          <div className="stat-label">Funcionários Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="stat-value">R$ {folha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="stat-label">Folha Mensal</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Equipe</div>
          <div className="search-wrap" style={{ width: 220 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar funcionário..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p style={{ animation: 'pulse 1.5s infinite' }}>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>Nenhum funcionário encontrado</p>
            <small>Cadastre o primeiro funcionário para começar</small>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Cargo</th>
                  <th>Admissão</th>
                  <th>Salário</th>
                  <th>Status</th>
                  <th>Contato</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', flexShrink: 0 }}>
                          {emp.nome?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--gray-900)' }}>{emp.nome}</div>
                          {emp.cpf && <div style={{ fontSize: 11.5, color: 'var(--gray-300)' }}>CPF: {emp.cpf}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{emp.cargo}</td>
                    <td style={{ color: 'var(--gray-300)', fontSize: 12.5 }}>
                      {emp.data_admissao ? format(new Date(emp.data_admissao + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td style={{ fontWeight: 500 }}>R$ {(emp.salario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td><span className={`badge ${STATUS_BADGE[emp.status] || 'badge-gray'}`}>{STATUS_LABELS[emp.status] || emp.status}</span></td>
                    <td style={{ fontSize: 12.5, color: 'var(--gray-300)' }}>{emp.telefone || emp.email || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(emp)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(emp.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </div>
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
                <div className="modal-title">{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</div>
                <div className="modal-subtitle">Preencha as informações da pessoa</div>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Nome Completo *</label>
                <input placeholder="Nome do funcionário" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>CPF</label>
                <input placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Cargo *</label>
                <select value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Salário (R$)</label>
                <input type="number" placeholder="0,00" step="0.01" value={form.salario} onChange={e => setForm(f => ({ ...f, salario: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Data de Admissão</label>
                <input type="date" value={form.data_admissao} onChange={e => setForm(f => ({ ...f, data_admissao: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input placeholder="(47) 99999-9999" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Observações</label>
                <textarea placeholder="Notas adicionais..." value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
