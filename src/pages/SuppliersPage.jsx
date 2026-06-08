import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_SUP = { nome: '', cnpj: '', contato: '', email: '', telefone: '', categoria: '', prazo_pagamento: '', observacao: '' }

export function SuppliersPage({ toast }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_SUP)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    const sub = supabase
      .channel('fornecedores-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fornecedores' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('fornecedores').select('*').order('nome')
    setSuppliers(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY_SUP); setShowModal(true) }
  function openEdit(s) { setEditing(s.id); setForm(s); setShowModal(true) }

  async function handleSave() {
    if (!form.nome) return toast('Nome é obrigatório', 'error')
    setSaving(true)
    const { error } = editing
      ? await supabase.from('fornecedores').update(form).eq('id', editing)
      : await supabase.from('fornecedores').insert([form])
    if (error) toast('Erro: ' + error.message, 'error')
    else { toast(editing ? 'Atualizado!' : 'Fornecedor cadastrado!', 'success'); setShowModal(false); loadData() }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Remover fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id)
    toast('Removido', 'success'); loadData()
  }

  const filtered = suppliers.filter(s =>
    s.nome?.toLowerCase().includes(search.toLowerCase()) ||
    s.categoria?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-content animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Fornecedores</h2>
          <p>Gestão de fornecedores e parceiros</p>
        </div>
        <button className="btn btn-accent" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Fornecedor
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div className="stat-value">{suppliers.length}</div>
          <div className="stat-label">Fornecedores Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-value">{[...new Set(suppliers.map(s => s.categoria).filter(Boolean))].length}</div>
          <div className="stat-label">Categorias</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="stat-value">{suppliers.filter(s => s.prazo_pagamento).length}</div>
          <div className="stat-label">Com Prazo Definido</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Cadastro de Fornecedores</div>
          <div className="search-wrap" style={{ width: 220 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p style={{ animation: 'pulse 1.5s infinite' }}>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <p>Nenhum fornecedor cadastrado</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Fornecedor</th><th>CNPJ</th><th>Categoria</th><th>Contato</th><th>Prazo Pgto.</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.nome}</div>
                      {s.email && <div style={{ fontSize: 11.5, color: 'var(--gray-300)' }}>{s.email}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-300)' }}>{s.cnpj || '—'}</td>
                    <td><span className="badge badge-gray">{s.categoria || '—'}</span></td>
                    <td style={{ fontSize: 12.5 }}>{s.contato || s.telefone || '—'}</td>
                    <td>{s.prazo_pagamento ? <span className="badge badge-blue">{s.prazo_pagamento} dias</span> : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(s)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(s.id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
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
                <div className="modal-title">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</div>
                <div className="modal-subtitle">Cadastrar fornecedor ou parceiro</div>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Razão Social / Nome *</label>
                <input placeholder="Nome do fornecedor" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="form-group"><label>CNPJ</label><input placeholder="00.000.000/0000-00" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} /></div>
              <div className="form-group"><label>Categoria</label><input placeholder="Ex: Matéria-prima, Serviços..." value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} /></div>
              <div className="form-group"><label>Nome do Contato</label><input placeholder="Responsável" value={form.contato} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} /></div>
              <div className="form-group"><label>Telefone</label><input placeholder="(47) 99999-9999" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
              <div className="form-group"><label>E-mail</label><input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label>Prazo de Pagamento (dias)</label><input type="number" placeholder="30" value={form.prazo_pagamento} onChange={e => setForm(f => ({ ...f, prazo_pagamento: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Observações</label><textarea placeholder="Notas..." value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} style={{ minHeight: 55 }} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
