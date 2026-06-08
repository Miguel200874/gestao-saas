import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CATEGORIAS = ['Eletrônicos', 'Vestuário', 'Alimentos', 'Limpeza', 'Escritório', 'Ferramentas', 'Outros']
const EMPTY = { nome: '', sku: '', categoria: '', quantidade: '', quantidade_minima: '5', preco_custo: '', preco_venda: '', fornecedor: '', localizacao: '', descricao: '' }

export default function StockPage({ toast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAjusteModal, setShowAjusteModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [ajuste, setAjuste] = useState({ tipo: 'entrada', quantidade: '', motivo: '' })
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('todos')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
    const sub = supabase
      .channel('estoque-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, () => loadData())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('estoque').select('*').order('nome')
    setItems(data || [])
    setLoading(false)
  }

  function openNew() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(item) { setEditing(item.id); setForm(item); setShowModal(true) }
  function openAjuste(item) { setSelectedItem(item); setAjuste({ tipo: 'entrada', quantidade: '', motivo: '' }); setShowAjusteModal(true) }

  async function handleSave() {
    if (!form.nome) return toast('Nome é obrigatório', 'error')
    setSaving(true)
    const payload = {
      ...form,
      quantidade: parseInt(form.quantidade) || 0,
      quantidade_minima: parseInt(form.quantidade_minima) || 5,
      preco_custo: parseFloat(form.preco_custo) || 0,
      preco_venda: parseFloat(form.preco_venda) || 0,
    }
    const { error } = editing
      ? await supabase.from('estoque').update(payload).eq('id', editing)
      : await supabase.from('estoque').insert([payload])
    if (error) toast('Erro: ' + error.message, 'error')
    else { toast(editing ? 'Atualizado!' : 'Item cadastrado!', 'success'); setShowModal(false); loadData() }
    setSaving(false)
  }

  async function handleAjuste() {
    if (!ajuste.quantidade) return toast('Informe a quantidade', 'error')
    const qty = parseInt(ajuste.quantidade)
    const novaQtd = ajuste.tipo === 'entrada'
      ? (selectedItem.quantidade || 0) + qty
      : Math.max(0, (selectedItem.quantidade || 0) - qty)
    const { error } = await supabase.from('estoque').update({ quantidade: novaQtd }).eq('id', selectedItem.id)
    if (error) toast('Erro: ' + error.message, 'error')
    else {
      // Log movement
      await supabase.from('movimentacoes_estoque').insert([{
        estoque_id: selectedItem.id, tipo: ajuste.tipo, quantidade: qty, motivo: ajuste.motivo
      }])
      toast(`${ajuste.tipo === 'entrada' ? '+ ' + qty : '- ' + qty} unidades registrado`, 'success')
      setShowAjusteModal(false)
      loadData()
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover item do estoque?')) return
    await supabase.from('estoque').delete().eq('id', id)
    toast('Removido', 'success'); loadData()
  }

  const filtered = items
    .filter(i => filterCat === 'todos' || i.categoria === filterCat)
    .filter(i => i.nome?.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()))

  const criticos = items.filter(i => (i.quantidade || 0) <= (i.quantidade_minima || 5))
  const totalItens = items.reduce((s, i) => s + (i.quantidade || 0), 0)
  const valorTotal = items.reduce((s, i) => s + ((i.quantidade || 0) * (i.preco_custo || 0)), 0)

  return (
    <div className="page-content animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Estoque</h2>
          <p>Controle de mercadorias e inventário</p>
        </div>
        <button className="btn btn-accent" onClick={openNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Item
        </button>
      </div>

      {criticos.length > 0 && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span><strong>{criticos.length} item(s) com estoque crítico:</strong> {criticos.map(c => `${c.nome} (${c.quantidade} un.)`).join(', ')}</span>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">SKUs Cadastradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <div className="stat-value">{totalItens.toLocaleString('pt-BR')}</div>
          <div className="stat-label">Unidades em Estoque</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div className="stat-value">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
          <div className="stat-label">Valor em Estoque</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div className="stat-value">{criticos.length}</div>
          <div className="stat-label">Itens Críticos</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="card-title" style={{ marginRight: 8 }}>Inventário</div>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button className={`tab ${filterCat === 'todos' ? 'active' : ''}`} onClick={() => setFilterCat('todos')}>Todos</button>
              {CATEGORIAS.slice(0, 4).map(c => (
                <button key={c} className={`tab ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div className="search-wrap" style={{ width: 200 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar item, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p style={{ animation: 'pulse 1.5s infinite' }}>Carregando...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <p>Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th>Qtd. Atual</th>
                  <th>Preço Custo</th>
                  <th>Preço Venda</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const critico = (item.quantidade || 0) <= (item.quantidade_minima || 5)
                  const zerado = (item.quantidade || 0) === 0
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.nome}</div>
                        {item.localizacao && <div style={{ fontSize: 11.5, color: 'var(--gray-300)' }}>📍 {item.localizacao}</div>}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gray-300)' }}>{item.sku || '—'}</td>
                      <td><span className="badge badge-gray">{item.categoria || '—'}</span></td>
                      <td>
                        <span style={{ fontWeight: 600, color: zerado ? '#dc2626' : critico ? '#c2410c' : 'var(--gray-900)' }}>
                          {item.quantidade || 0}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--gray-300)', marginLeft: 3 }}>un.</span>
                      </td>
                      <td style={{ color: 'var(--gray-500)' }}>R$ {(item.preco_custo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ fontWeight: 500 }}>R$ {(item.preco_venda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`badge ${zerado ? 'badge-red' : critico ? 'badge-orange' : 'badge-green'}`}>
                          {zerado ? 'Esgotado' : critico ? 'Crítico' : 'Normal'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-sm btn-ghost" onClick={() => openAjuste(item)}>Ajustar</button>
                          <button className="btn-icon" onClick={() => openEdit(item)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon" onClick={() => handleDelete(item.id)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Item */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">{editing ? 'Editar Item' : 'Novo Item'}</div>
                <div className="modal-subtitle">Cadastrar produto no estoque</div>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Nome do Produto *</label>
                <input placeholder="Ex: Camiseta Polo M" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>SKU / Código</label>
                <input placeholder="SKU-001" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade Atual</label>
                <input type="number" placeholder="0" min="0" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Qtd. Mínima (alerta)</label>
                <input type="number" placeholder="5" min="0" value={form.quantidade_minima} onChange={e => setForm(f => ({ ...f, quantidade_minima: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Preço de Custo (R$)</label>
                <input type="number" placeholder="0,00" step="0.01" value={form.preco_custo} onChange={e => setForm(f => ({ ...f, preco_custo: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Preço de Venda (R$)</label>
                <input type="number" placeholder="0,00" step="0.01" value={form.preco_venda} onChange={e => setForm(f => ({ ...f, preco_venda: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Fornecedor</label>
                <input placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Localização</label>
                <input placeholder="Ex: Prateleira A3" value={form.localizacao} onChange={e => setForm(f => ({ ...f, localizacao: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Descrição</label>
                <textarea placeholder="Descrição do produto..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ minHeight: 55 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste de Estoque */}
      {showAjusteModal && selectedItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAjusteModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Ajustar Estoque</div>
                <div className="modal-subtitle">{selectedItem.nome}</div>
              </div>
              <button className="btn-icon" onClick={() => setShowAjusteModal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Quantidade atual</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--gray-900)' }}>{selectedItem.quantidade || 0} un.</span>
            </div>

            <div className="tabs">
              {['entrada', 'saida'].map(t => (
                <button key={t} className={`tab ${ajuste.tipo === t ? 'active' : ''}`} onClick={() => setAjuste(a => ({ ...a, tipo: t }))}>
                  {t === 'entrada' ? '+ Entrada' : '− Saída'}
                </button>
              ))}
            </div>
            <div className="form-group">
              <label>Quantidade</label>
              <input type="number" placeholder="0" min="1" value={ajuste.quantidade} onChange={e => setAjuste(a => ({ ...a, quantidade: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Motivo</label>
              <input placeholder="Ex: Compra, Venda, Devolução, Avaria..." value={ajuste.motivo} onChange={e => setAjuste(a => ({ ...a, motivo: e.target.value }))} />
            </div>

            {ajuste.quantidade && (
              <div style={{ background: ajuste.tipo === 'entrada' ? 'var(--green-light)' : 'var(--red-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: ajuste.tipo === 'entrada' ? '#15803d' : '#dc2626', fontWeight: 500 }}>
                Novo total: {ajuste.tipo === 'entrada'
                  ? (selectedItem.quantidade || 0) + parseInt(ajuste.quantidade || 0)
                  : Math.max(0, (selectedItem.quantidade || 0) - parseInt(ajuste.quantidade || 0))
                } unidades
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAjusteModal(false)}>Cancelar</button>
              <button className="btn btn-accent" onClick={handleAjuste}>Confirmar Ajuste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
