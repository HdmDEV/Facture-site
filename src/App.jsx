import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const money = (v) => Number(v || 0).toFixed(2)

const createId = () =>
  (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`)

const dbKeys = {
  clients: 'db.clients',
  articles: 'db.articles',
  warehouses: 'db.warehouses',
  infos: 'db.infos',
  logs: 'db.logs',
  notifications: 'db.notifications',
  settings: 'db.settings',
  invoices: 'db.invoices',
}

const readStore = (key, fallback) => {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

const writeStore = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const nowIso = () => new Date().toISOString()

const ensureDb = () => {
  if (!localStorage.getItem(dbKeys.clients)) writeStore(dbKeys.clients, [])
  if (!localStorage.getItem(dbKeys.articles)) writeStore(dbKeys.articles, [])
  if (!localStorage.getItem(dbKeys.warehouses))
    writeStore(dbKeys.warehouses, [{ id: createId(), nom: 'Défaut' }])
  if (!localStorage.getItem(dbKeys.infos)) writeStore(dbKeys.infos, [])
  if (!localStorage.getItem(dbKeys.logs)) writeStore(dbKeys.logs, [])
  if (!localStorage.getItem(dbKeys.notifications)) writeStore(dbKeys.notifications, [])
  if (!localStorage.getItem(dbKeys.invoices)) writeStore(dbKeys.invoices, [])
  if (!localStorage.getItem(dbKeys.settings))
    writeStore(dbKeys.settings, {
      low_stock_threshold: '5',
      invoice_template: 'classic',
      invoice_logo_pos: 'left',
      default_warehouse: 'Défaut',
      invoice_logo_path: '',
    })
}

const addLog = (action, message, level = 'info') => {
  const logs = readStore(dbKeys.logs, [])
  logs.unshift({ id: createId(), action, message, level, created_at: nowIso() })
  writeStore(dbKeys.logs, logs)
}

const updateNotifications = () => {
  const settings = readStore(dbKeys.settings, {})
  const threshold = parseFloat(settings.low_stock_threshold || '0')
  const articles = readStore(dbKeys.articles, [])
  const existing = readStore(dbKeys.notifications, [])
  const existingByKey = new Map(
    existing.map((n) => [n.key || n.ref || n.nom, n])
  )
  const low = articles.filter((a) => parseFloat(a.stock || '0') <= threshold)
  const notifications = low.map((a) => {
    const key = a.id || a.ref || a.nom
    const prev = existingByKey.get(key)
    return (
      prev || {
        id: createId(),
        key,
        created_at: nowIso(),
        read: false,
      }
    )
  }).map((n, idx) => {
    const a = low[idx]
    return {
      ...n,
      message: 'Stock bas',
      ref: a.ref,
      nom: a.nom,
      stock: a.stock,
      threshold,
    }
  })
  writeStore(dbKeys.notifications, notifications)
}

const nextInfoId = () => {
  const infos = readStore(dbKeys.infos, [])
  const maxId = infos.reduce((max, i) => Math.max(max, Number(i.id) || 0), 0)
  return maxId + 1
}

const nextClientId = () => {
  const clients = readStore(dbKeys.clients, [])
  const maxId = clients.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0)
  return maxId + 1
}

const nextArticleId = () => {
  const articles = readStore(dbKeys.articles, [])
  const maxId = articles.reduce((max, a) => Math.max(max, Number(a.id) || 0), 0)
  return maxId + 1
}
const buildPreviewHtml = ({ invoice, items, client, company, totals, logo, logoPos }) => {
  const rows = items
    .map(
      (it) => `
        <tr>
          <td>${it.ref || ''}</td>
          <td>${it.desc || ''}</td>
          <td style="text-align:right">${it.qty}</td>
          <td style="text-align:right">${money(it.unit)}</td>
          <td style="text-align:right">${money(it.tva)}%</td>
          <td style="text-align:right">${money((it.qty || 0) * (it.unit || 0))}</td>
        </tr>
      `
    )
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body{font-family:Arial, sans-serif; color:#111; padding:24px; background:#ffffff;}
          .top{display:flex; justify-content:space-between; margin-bottom:16px;}
          .box{border:1px solid #d1d5db; padding:12px; border-radius:8px; background:#f9fafb;}
          table{width:100%; border-collapse:collapse; margin-top:12px; background:#fff;}
          th,td{border:1px solid #d1d5db; padding:8px; font-size:12px;}
          th{background:#f3f4f6; color:#111; text-align:left;}
          .totals{margin-top:12px; text-align:right;}
          .logo{max-height:64px; display:block;}
          .logo-box{display:flex; justify-content:flex-start;}
          .logo-left{justify-content:flex-start;}
          .logo-center{justify-content:center;}
          .logo-right{justify-content:flex-end;}
        </style>
      </head>
      <body>
        <div class="top">
          <div>
            ${
              logo
                ? `<div class="logo-box logo-${logoPos || 'left'}"><img class="logo" src="${logo}" /></div>`
                : ''
            }
            <div><strong>Nom : ${company?.nom || ''}</strong></div>
            <div>Adresse : ${company?.adresse || ''}</div>
            <div>Téléphone : ${company?.telephone || ''}</div>
            <div>Email : ${company?.email || ''}</div>
            <div>SIRET : ${company?.siret || ''}</div>
            <div>IBAN : ${company?.iban || ''}</div>
            <div>BIC : ${company?.bic || ''}</div>
          </div>
          <div class="box">
            <div><strong>Facture</strong></div>
            <div>Numéro: ${invoice.numero || ''}</div>
            <div>Date: ${invoice.date_facture || ''}</div>
            <div>Statut: ${invoice.statut || ''}</div>
            <div>Échéance: ${invoice.date_echeance || ''}</div>
          </div>
        </div>
        <div class="box">
          <div><strong>Client</strong></div>
          <div>Nom : ${client?.nom_prenom || client?.nom || ''}</div>
          <div>Email : ${client?.email || ''}</div>
          <div>Téléphone : ${client?.telephone || ''}</div>
          <div>Adresse : ${client?.adresse || ''}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Article</th>
              <th style="text-align:right">Qté</th>
              <th style="text-align:right">Prix U.</th>
              <th style="text-align:right">TVA</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div>HT: ${money(totals.ht)} EUR</div>
          <div>TVA: ${money(totals.tva)} EUR</div>
          <div><strong>TTC: ${money(totals.ttc)} EUR</strong></div>
        </div>
      </body>
    </html>
  `
}

const exportPdfFromHtml = async (html, filename) => {
  const { default: html2pdf } = await import('html2pdf.js')
  const container = document.createElement('div')
  container.innerHTML = html
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  document.body.appendChild(container)
  await html2pdf()
    .set({
      margin: 8,
      filename,
      html2canvas: { scale: 2, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(container)
    .save()
  container.remove()
}

const emptyClient = {
  societe: '',
  nom_prenom: '',
  email: '',
  telephone: '',
  adresse: '',
  notes: '',
}

const emptyArticle = {
  ref: '',
  nom: '',
  prix: '0.00',
  prix_achat: '0.00',
  tva: '0',
  stock: '0',
  warehouse: '',
}

const emptyInfo = {
  nom: '',
  adresse: '',
  telephone: '',
  email: '',
  siret: '',
  tva_intracom: '',
  site_web: '',
  iban: '',
  bic: '',
  conditions_paiement: '',
}

const emptyItem = () => ({
  id: createId(),
  ref: '',
  desc: '',
  qty: 1,
  unit: '0.00',
  tva: '0',
  stock: '0',
})

function CustomSelect({ value, onChange, options, placeholder = 'Sélectionner', className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const opts = Array.isArray(options) ? options : []
  const selected = opts.find((opt) => opt.value === value)

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false)
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((prev) => !prev)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div ref={rootRef} className={`cselect ${className} ${open ? 'open' : ''}`.trim()}>
      <button
        type="button"
        className="cselect-button"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cselect-label">{selected?.label ?? placeholder}</span>
        <span className="cselect-chevron" aria-hidden="true"></span>
      </button>
      {open && (
        <div className="cselect-menu" role="listbox">
          {opts.map((opt) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cselect-option ${opt.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange?.(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function App() {
  const [page, setPage] = useState('facture')

  const [clients, setClients] = useState([])
  const [articles, setArticles] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [infos, setInfos] = useState([])
  const [notifications, setNotifications] = useState([])
  const [logs, setLogs] = useState([])
  const [showLogsPanel, setShowLogsPanel] = useState(false)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  })
  const [warehouseModal, setWarehouseModal] = useState({
    open: false,
    value: '',
  })

  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedArticleId, setSelectedArticleId] = useState(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null)
  const [selectedInfoId, setSelectedInfoId] = useState(null)

  const [clientForm, setClientForm] = useState(emptyClient)
  const [articleForm, setArticleForm] = useState(emptyArticle)
  const [infoForm, setInfoForm] = useState(emptyInfo)

  const [articleSearch, setArticleSearch] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [clientInvoiceSearch, setClientInvoiceSearch] = useState('')
  const [infoLookup, setInfoLookup] = useState('')
  const [articleLookup, setArticleLookup] = useState('')

  const [invoice, setInvoice] = useState({
    numero: '',
    date_facture: '',
    statut: 'Brouillon',
    date_echeance: '',
    remise_type: 'percent',
    remise_val: '0',
    template: 'classic',
    warehouse: '',
  })

  const [exportPdf, setExportPdf] = useState(true)
  const [exportDocx, setExportDocx] = useState(false)
  const [decrementStock, setDecrementStock] = useState(false)

  const [items, setItems] = useState([emptyItem()])

  const [settings, setSettings] = useState({
    low_stock_threshold: '',
    invoice_template: 'classic',
    invoice_logo_pos: 'left',
    default_warehouse: '',
  })

  const [filters, setFilters] = useState({
    logType: 'all',
    from: '',
    to: '',
    errorsOnly: false,
    onlyArticleCreate: true,
  })

  const [previewHtml, setPreviewHtml] = useState('')
  const previewTimer = useRef(null)
  const logoFileRef = useRef(null)
  const signatureFileRef = useRef(null)
  const stampFileRef = useRef(null)
  const csvImportRef = useRef(null)

  useEffect(() => {
    init()
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    schedulePreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, invoice, clientForm, selectedInfoId])

  useEffect(() => {
    if (articleSearch.trim().length === 0) {
      loadArticles('')
      return
    }
    const t = setTimeout(() => loadArticles(articleSearch), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleSearch])

  async function init() {
    ensureDb()
    const today = new Date().toISOString().slice(0, 10)
    setInvoice((prev) => ({ ...prev, date_facture: today }))
    await Promise.all([
      loadClients(),
      loadArticles(''),
      loadWarehouses(),
      loadInfos(),
      loadNotifications(),
      loadLogs(),
      loadSettings(),
    ])
    await autoNumber(today)
    schedulePreview()
  }

  function schedulePreview() {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(updatePreview, 500)
  }

  async function updatePreview() {
    const company = infos.find((i) => i.id === selectedInfoId) || null
    const settingsData = readStore(dbKeys.settings, {})
    const html = buildPreviewHtml({
      invoice,
      items: items.map((it) => ({
        ref: it.ref,
        desc: it.desc,
        qty: parseFloat(it.qty || '0'),
        unit: parseFloat(it.unit || '0'),
        tva: parseFloat(it.tva || '0'),
        stock: parseFloat(it.stock || '0'),
      })),
      client: clientForm,
      company,
      totals,
      logo: settingsData.invoice_logo_path || '',
      logoPos: settingsData.invoice_logo_pos || 'left',
    })
    setPreviewHtml(html)
  }

  const totals = useMemo(() => {
    const base = items.reduce(
      (acc, it) => {
        const subtotal = parseFloat(it.qty || '0') * parseFloat(it.unit || '0')
        const tva = subtotal * (parseFloat(it.tva || '0') / 100)
        acc.ht += subtotal
        acc.tva += tva
        acc.ttc += subtotal + tva
        return acc
      },
      { ht: 0, tva: 0, ttc: 0 }
    )

    const rem = parseFloat(invoice.remise_val || '0')
    if (invoice.remise_type === 'percent') {
      base.ttc -= base.ttc * (rem / 100)
    } else {
      base.ttc -= rem
    }
    if (base.ttc < 0) base.ttc = 0
    return base
  }, [items, invoice.remise_type, invoice.remise_val])

  const filteredClientsInvoice = useMemo(() => {
    const term = clientInvoiceSearch.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((c) => {
      const label = `${c.id} ${c.societe || ''} ${c.nom_prenom || c.nom || ''}`.toLowerCase()
      return label.includes(term)
    })
  }, [clients, clientInvoiceSearch])

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((c) => {
      const label = `${c.id} ${c.societe || ''} ${c.nom_prenom || c.nom || ''}`.toLowerCase()
      return label.includes(term)
    })
  }, [clients, clientSearch])

  async function loadClients() {
    const data = readStore(dbKeys.clients, [])
    setClients(data)
  }

  async function loadClientHistory(clientId) {
    if (!clientId) return []
    const invoices = readStore(dbKeys.invoices, [])
    return invoices.filter((inv) => inv.client_id === clientId)
  }

  async function selectClient(c) {
    setSelectedClientId(c.id)
    setClientForm({
      societe: c.societe || '',
      nom_prenom: c.nom_prenom || c.nom || '',
      email: c.email || '',
      telephone: c.telephone || '',
      adresse: c.adresse || '',
      notes: c.notes || '',
    })
    schedulePreview()
  }

  async function saveClient(isUpdate) {
    const payload = {
      societe: clientForm.societe.trim(),
      nom_prenom: clientForm.nom_prenom.trim(),
      nom: clientForm.nom_prenom.trim(),
      email: clientForm.email.trim(),
      telephone: clientForm.telephone.trim(),
      adresse: clientForm.adresse.trim(),
      notes: clientForm.notes.trim(),
    }
    if (isUpdate) {
      if (!selectedClientId) return alert('Sélectionne un client.')
      const data = readStore(dbKeys.clients, [])
      const idx = data.findIndex((c) => c.id === selectedClientId)
      if (idx >= 0) data[idx] = { ...data[idx], ...payload }
      writeStore(dbKeys.clients, data)
      addLog('client_update', `Client mis à jour: ${payload.nom}`)
    } else {
      const data = readStore(dbKeys.clients, [])
      const entry = { id: nextClientId(), ...payload, created_at: nowIso() }
      data.unshift(entry)
      writeStore(dbKeys.clients, data)
      addLog('client_create', `Client créé: ${payload.nom}`)
      setSelectedClientId(entry.id)
    }
    await loadClients()
  }

  async function deleteClient() {
    if (!selectedClientId) return alert('Sélectionne un client.')
    const ok = await confirmDialog('Supprimer client', 'Êtes-vous sûr de supprimer ce client ?')
    if (!ok) return
    const data = readStore(dbKeys.clients, [])
    const next = data.filter((c) => c.id !== selectedClientId)
    writeStore(dbKeys.clients, next)
    addLog('client_delete', `Client supprimé: ${selectedClientId}`)
    setSelectedClientId(null)
    setClientForm(emptyClient)
    await loadClients()
  }

  async function loadArticles(q) {
    const data = readStore(dbKeys.articles, [])
    const term = q?.toLowerCase().trim()
    const filtered = term
      ? data.filter(
          (a) =>
            a.ref?.toLowerCase().includes(term) || a.nom?.toLowerCase().includes(term)
        )
      : data
    setArticles(filtered)
  }

  function selectArticle(a) {
    setSelectedArticleId(a.id)
    setArticleForm({
      ref: a.ref || '',
      nom: a.nom || '',
      prix: money(a.prix),
      prix_achat: money(a.prix_achat),
      tva: money(a.tva),
      stock: money(a.stock),
      warehouse: a.warehouse || '',
    })
  }

  function fillArticleFromName(name) {
    const term = name.trim().toLowerCase()
    if (!term) {
      setArticleForm((prev) => ({ ...prev, nom: name }))
      return
    }
    const match = readStore(dbKeys.articles, []).find(
      (a) => a.nom?.trim().toLowerCase() === term
    )
    if (!match) {
      setArticleForm((prev) => ({ ...prev, nom: name }))
      return
    }
    setSelectedArticleId(match.id)
    setArticleForm({
      ref: match.ref || '',
      nom: match.nom || name,
      prix: match.prix || '0.00',
      prix_achat: match.prix_achat || '0.00',
      tva: match.tva || '0',
      stock: match.stock || '0',
      warehouse: match.warehouse || '',
    })
  }

  async function saveArticle(isUpdate) {
    const payload = {
      ref: articleForm.ref.trim(),
      nom: articleForm.nom.trim(),
      prix: articleForm.prix,
      prix_achat: articleForm.prix_achat,
      tva: articleForm.tva,
      stock: articleForm.stock,
      warehouse: articleForm.warehouse.trim(),
    }
    if (isUpdate) {
      if (!selectedArticleId) return alert('Sélectionne un article.')
      const data = readStore(dbKeys.articles, [])
      const idx = data.findIndex((a) => a.id === selectedArticleId)
      if (idx >= 0) data[idx] = { ...data[idx], ...payload }
      writeStore(dbKeys.articles, data)
      addLog('article_update', `Article mis à jour: ${payload.ref || payload.nom}`)
    } else {
      const data = readStore(dbKeys.articles, [])
      const entry = { id: nextArticleId(), ...payload, created_at: nowIso() }
      data.unshift(entry)
      writeStore(dbKeys.articles, data)
      addLog('article_create', `Article créé: ${payload.ref || payload.nom}`)
      setSelectedArticleId(entry.id)
    }
    updateNotifications()
    await loadArticles(articleSearch)
  }

  async function deleteArticle() {
    if (!selectedArticleId) return alert('Sélectionne un article.')
    const ok = await confirmDialog('Supprimer article', 'Êtes-vous sûr de supprimer cet article ?')
    if (!ok) return
    const data = readStore(dbKeys.articles, [])
    const next = data.filter((a) => a.id !== selectedArticleId)
    writeStore(dbKeys.articles, next)
    addLog('article_delete', `Article supprimé: ${selectedArticleId}`)
    setSelectedArticleId(null)
    setArticleForm(emptyArticle)
    updateNotifications()
    await loadArticles(articleSearch)
  }

  async function loadWarehouses() {
    const data = readStore(dbKeys.warehouses, [])
    setWarehouses(data)
    if (data.length && !invoice.warehouse) {
      setInvoice((prev) => ({ ...prev, warehouse: data[0].nom }))
    }
  }

  async function addWarehouse() {
    setWarehouseModal({ open: true, value: '' })
  }

  async function deleteWarehouse() {
    if (!selectedWarehouseId) return
    const ok = await confirmDialog(
      'Supprimer entrepôt',
      'Êtes-vous sûr de supprimer cet entrepôt ?'
    )
    if (!ok) return
    const data = readStore(dbKeys.warehouses, [])
    const next = data.filter((w) => w.id !== selectedWarehouseId)
    writeStore(dbKeys.warehouses, next)
    addLog('warehouse_delete', `Entrepôt supprimé: ${selectedWarehouseId}`)
    setSelectedWarehouseId(null)
    await loadWarehouses()
  }
  async function loadInfos() {
    const data = readStore(dbKeys.infos, [])
    setInfos(data)
  }

  async function selectInfo(id) {
    setSelectedInfoId(id)
    const info = readStore(dbKeys.infos, []).find((i) => i.id === id) || {}
    setInfoForm({
      nom: info.nom || '',
      adresse: info.adresse || '',
      telephone: info.telephone || '',
      email: info.email || '',
      siret: info.siret || '',
      tva_intracom: info.tva_intracom || '',
      site_web: info.site_web || '',
      iban: info.iban || '',
      bic: info.bic || '',
      conditions_paiement: info.conditions_paiement || '',
    })
    await loadInfos()
    setInfoLookup(info.nom || String(info.id))
  }

  function applyInfoLookup() {
    const term = infoLookup.trim()
    if (!term) return
    const infosData = readStore(dbKeys.infos, [])
    const found =
      infosData.find((i) => String(i.id) === term) ||
      infosData.find((i) => i.nom?.toLowerCase().includes(term.toLowerCase()))
    if (!found) {
      alert('Info introuvable')
      return
    }
    setSelectedInfoId(found.id)
    setInfoLookup(found.nom || String(found.id))
    setInfoForm({
      nom: found.nom || '',
      adresse: found.adresse || '',
      telephone: found.telephone || '',
      email: found.email || '',
      siret: found.siret || '',
      tva_intracom: found.tva_intracom || '',
      site_web: found.site_web || '',
      iban: found.iban || '',
      bic: found.bic || '',
      conditions_paiement: found.conditions_paiement || '',
    })
    schedulePreview()
  }

  function applyArticleLookup() {
    const term = articleLookup.trim()
    if (!term) return
    const lower = term.toLowerCase()
    const match =
      articles.find((a) => String(a.id) === term) ||
      articles.find((a) => a.ref?.toLowerCase() === lower) ||
      articles.find((a) => a.nom?.toLowerCase() === lower) ||
      articles.find((a) => a.nom?.toLowerCase().includes(lower))
    if (!match) {
      alert('Article introuvable')
      return
    }
    let targetId = items.find((it) => !(it.ref && it.ref.trim()))?.id
    if (!targetId) {
      const newItem = emptyItem()
      setItems((prev) => [...prev, newItem])
      targetId = newItem.id
    }
    updateItem(targetId, {
      ref: match.ref,
      desc: match.nom,
      unit: match.prix,
      tva: match.tva,
      stock: match.stock,
    })
    setArticleLookup('')
    schedulePreview()
  }

  async function saveInfo() {
    const sigPath = await uploadAsset(signatureFileRef.current)
    const stampPath = await uploadAsset(stampFileRef.current)
    const payload = {
      id: selectedInfoId || nextInfoId(),
      ...infoForm,
      signature_path: sigPath || '',
      stamp_path: stampPath || '',
    }
    const data = readStore(dbKeys.infos, [])
    const idx = data.findIndex((i) => i.id === payload.id)
    if (idx >= 0) data[idx] = { ...data[idx], ...payload }
    else data.unshift({ ...payload, created_at: nowIso() })
    writeStore(dbKeys.infos, data)
    setSelectedInfoId(payload.id)
    addLog('infos_save', `Infos enregistrées: ${payload.nom || payload.id}`)
    await loadInfos()
  }

  async function deleteInfo() {
    if (!selectedInfoId) return alert('Sélectionne une info.')
    const ok = await confirmDialog('Supprimer info', 'Êtes-vous sûr de supprimer cette info ?')
    if (!ok) return
    const data = readStore(dbKeys.infos, [])
    const next = data.filter((i) => i.id !== selectedInfoId)
    writeStore(dbKeys.infos, next)
    addLog('infos_delete', `Infos supprimées: ${selectedInfoId}`)
    setSelectedInfoId(null)
    setInfoForm(emptyInfo)
    await loadInfos()
  }

  async function uploadAsset(input) {
    if (!input || !input.files || !input.files[0]) return ''
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result || '')
      reader.readAsDataURL(input.files[0])
    })
  }

  async function loadNotifications() {
    updateNotifications()
    const data = readStore(dbKeys.notifications, [])
    setNotifications(data)
  }

  async function markAllNotificationsRead() {
    const data = readStore(dbKeys.notifications, [])
    const next = data.map((n) => ({ ...n, read: true }))
    writeStore(dbKeys.notifications, next)
    setNotifications(next)
  }

  async function loadLogs() {
    const data = readStore(dbKeys.logs, [])
    const from = filters.from ? new Date(filters.from) : null
    const to = filters.to ? new Date(filters.to) : null
    const filtered = data.filter((l) => {
      if (filters.logType !== 'all' && l.action !== filters.logType) return false
      if (filters.errorsOnly && l.level !== 'error') return false
      if (from && new Date(l.created_at) < from) return false
      if (to && new Date(l.created_at) > to) return false
      return true
    })
    setLogs(filtered)
  }

  async function loadSettings() {
    const s = readStore(dbKeys.settings, {})
    setSettings({
      low_stock_threshold: s.low_stock_threshold || '',
      invoice_template: s.invoice_template || 'classic',
      invoice_logo_pos: s.invoice_logo_pos || 'left',
      default_warehouse: s.default_warehouse || '',
    })
    if (s.default_warehouse) {
      setInvoice((prev) => ({ ...prev, warehouse: s.default_warehouse }))
    }
  }

  async function saveSettings() {
    const payload = {
      low_stock_threshold: settings.low_stock_threshold,
      invoice_template: settings.invoice_template,
      invoice_logo_pos: settings.invoice_logo_pos,
      default_warehouse: invoice.warehouse,
    }
    const current = readStore(dbKeys.settings, {})
    writeStore(dbKeys.settings, { ...current, ...payload })
    addLog('settings_save', 'Paramètres enregistrés')
    updateNotifications()
  }

  async function uploadLogo() {
    const input = logoFileRef.current
    if (!input || !input.files || !input.files[0]) return
    const dataUrl = await uploadAsset(input)
    const current = readStore(dbKeys.settings, {})
    writeStore(dbKeys.settings, { ...current, invoice_logo_path: dataUrl })
    addLog('settings_logo', 'Logo facture mis à jour')
    schedulePreview()
  }

  async function exportInvoice() {
    if (!selectedClientId) return alert('Sélectionne un client.')
    if (!selectedInfoId) return alert('Sélectionne les infos entreprise.')

    const client = clients.find((c) => c.id === selectedClientId)
    const company = infos.find((i) => i.id === selectedInfoId)

    const invoiceEntry = {
      id: createId(),
      client_id: selectedClientId,
      company_id: selectedInfoId,
      numero: invoice.numero,
      date_facture: invoice.date_facture,
      statut: invoice.statut,
      date_echeance: invoice.date_echeance,
      remise_type: invoice.remise_type,
      remise_val: invoice.remise_val,
      warehouse: invoice.warehouse,
      items: items.map((it) => ({
        ref: it.ref,
        desc: it.desc,
        qty: parseFloat(it.qty || '0'),
        unit: parseFloat(it.unit || '0'),
        tva: parseFloat(it.tva || '0'),
        stock: parseFloat(it.stock || '0'),
      })),
      montant: totals.ttc,
      template: invoice.template,
      created_at: nowIso(),
    }

    const invoices = readStore(dbKeys.invoices, [])
    invoices.unshift(invoiceEntry)
    writeStore(dbKeys.invoices, invoices)

    if (decrementStock) {
      const ok = await confirmDialog(
        'Déstockage',
        'Voulez-vous enlever le stock après export ?'
      )
      if (!ok) return

      const data = readStore(dbKeys.articles, [])
      const updated = data.map((a) => {
        const line = invoiceEntry.items.find((it) => it.ref && it.ref === a.ref)
        if (!line) return a
        const nextStock =
          parseFloat(a.stock || '0') - parseFloat(line.stock || line.qty || '0')
        return { ...a, stock: String(nextStock < 0 ? 0 : nextStock) }
      })
      writeStore(dbKeys.articles, updated)
    }

    addLog(
      'invoice_export',
      `Facture exportée ${invoiceEntry.numero} (${client?.nom || ''})`
    )
    updateNotifications()

    const html = buildPreviewHtml({
      invoice,
      items: invoiceEntry.items,
      client,
      company,
      totals,
      logo: readStore(dbKeys.settings, {}).invoice_logo_path || '',
      logoPos: readStore(dbKeys.settings, {}).invoice_logo_pos || 'left',
    })

    if (exportPdf) {
      await exportPdfFromHtml(html, `${invoice.numero || 'facture'}.pdf`)
    }
    if (exportDocx) {
      exportWordFromHtml(html, `${invoice.numero || 'facture'}.doc`)
    }

    await Promise.all([
      loadClients(),
      loadArticles(articleSearch),
      loadNotifications(),
      loadLogs(),
    ])
  }

  async function autoNumber(dateValue) {
    const dateStr = dateValue || invoice.date_facture
    const base = (dateStr || '').replaceAll('-', '')
    const invoices = readStore(dbKeys.invoices, [])
    const count = invoices.filter((i) => i.date_facture === dateStr).length + 1
    const numero = `FACT-${base}-${String(count).padStart(3, '0')}`
    setInvoice((prev) => ({ ...prev, numero }))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function updateItem(id, patch) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it
        let next = { ...it, ...patch }
        if (patch.ref) {
          const all = readStore(dbKeys.articles, [])
          const found = all.find((a) => a.ref === patch.ref)
          if (found) {
            next = {
              ...next,
              desc: found.nom || next.desc,
              unit: found.prix || next.unit,
              tva: found.tva || next.tva,
            }
          }
        }
        return next
      })
    )
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  function addArticleToInvoice() {
    setItems((prev) => [
      ...prev,
      {
        id: createId(),
        ref: articleForm.ref,
        desc: articleForm.nom,
        qty: 1,
        unit: articleForm.prix,
        tva: articleForm.tva,
        stock: articleForm.stock,
      },
    ])
  }

  async function handleCsvImport(file) {
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (!lines.length) return
    const rows = lines.map((l) => l.split(',').map((v) => v.trim()))
    const data = readStore(dbKeys.articles, [])
    rows.forEach((cols) => {
      const [ref, nom, prix = '0', prix_achat = '0', tva = '0', stock = '0', warehouse = ''] =
        cols
      if (!ref && !nom) return
      data.unshift({
        id: createId(),
        ref,
        nom,
        prix,
        prix_achat,
        tva,
        stock,
        warehouse,
        created_at: nowIso(),
      })
    })
    writeStore(dbKeys.articles, data)
    addLog('article_import', 'Import CSV articles')
    await loadArticles(articleSearch)
  }

  function confirmDialog(title, message) {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title,
        message,
        onConfirm: (value) => resolve(value),
      })
    })
  }

  function downloadFile(name, content, type = 'text/plain') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function exportArticlesCsv() {
    const data = readStore(dbKeys.articles, [])
    const header = 'ref,nom,prix,prix_achat,tva,stock,warehouse'
    const rows = data.map(
      (a) =>
        `${a.ref || ''},${a.nom || ''},${a.prix || ''},${a.prix_achat || ''},${a.tva || ''},${a.stock || ''},${a.warehouse || ''}`
    )
    downloadFile('articles.csv', [header, ...rows].join('\n'), 'text/csv')
    addLog('article_export', 'Export CSV articles')
  }

  function exportLogsTxt() {
    const data = readStore(dbKeys.logs, [])
    const onlyArticle = filters.onlyArticleCreate
    const rows = data
      .filter((l) => (onlyArticle ? l.action === 'article_create' : true))
      .map((l) => `[${l.created_at}] ${l.action} - ${l.message}`)
    downloadFile('logs.txt', rows.join('\n'), 'text/plain')
  }

  function exportLogsCsv() {
    const data = readStore(dbKeys.logs, [])
    const onlyArticle = filters.onlyArticleCreate
    const header = 'created_at,action,level,message'
    const rows = data
      .filter((l) => (onlyArticle ? l.action === 'article_create' : true))
      .map((l) => `${l.created_at},${l.action},${l.level},${l.message}`)
    downloadFile('logs.csv', [header, ...rows].join('\n'), 'text/csv')
  }

  const [clientHistory, setClientHistory] = useState([])
  useEffect(() => {
    if (!selectedClientId) {
      setClientHistory([])
      return
    }
    loadClientHistory(selectedClientId).then(setClientHistory)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId])

  return (
    <div>
      {confirmState.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">{confirmState.title}</div>
            <div className="modal-body">{confirmState.message}</div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  confirmState.onConfirm?.(false)
                  setConfirmState({ open: false, title: '', message: '', onConfirm: null })
                }}
              >
                Annuler
              </button>
              <button
                className="danger"
                onClick={() => {
                  confirmState.onConfirm?.(true)
                  setConfirmState({ open: false, title: '', message: '', onConfirm: null })
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {warehouseModal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">Nouvel entrepôt</div>
            <div className="modal-body">
              <label>Nom entrepôt</label>
              <input
                value={warehouseModal.value}
                onChange={(e) =>
                  setWarehouseModal((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder="Ex: Principal"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setWarehouseModal({ open: false, value: '' })}
              >
                Annuler
              </button>
              <button
                className="primary"
                onClick={async () => {
                  const nom = warehouseModal.value.trim()
                  if (!nom) return
                  const data = readStore(dbKeys.warehouses, [])
                  data.push({ id: createId(), nom })
                  writeStore(dbKeys.warehouses, data)
                  addLog('warehouse_create', `Entrepôt créé: ${nom}`)
                  setWarehouseModal({ open: false, value: '' })
                  await loadWarehouses()
                }}
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="topbar">
        <div className="brand">Gestion de Factures</div>
        <nav className="tabs">
          {['facture', 'clients', 'articles', 'infos', 'logs'].map((p) => (
            <button
              key={p}
              className={`tab ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p === 'facture'
                ? 'Factures'
                : p === 'clients'
                ? 'Clients'
                : p === 'articles'
                ? 'Articles'
                : p === 'infos'
                ? 'Infos'
                : 'Notifications'}
              {p === 'logs' && notifications.filter((n) => !n.read).length > 0 && (
                <span className="tab-badge">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {page === 'facture' && (
          <section className="page active">
            <div className="grid-2">
              <div className="card">
                <h3>Facture</h3>
                <label>Infos entreprise</label>
                <div className="row">
                  <input
                    value={infoLookup}
                    onChange={(e) => setInfoLookup(e.target.value)}
                    placeholder="ID ou nom (ex: 1, Mon info)"
                  />
                  <button onClick={applyInfoLookup}>Charger</button>
                </div>
                <label>ID sélectionné</label>
                <input value={selectedInfoId || ''} readOnly />
                <label>Numéro facture</label>
                <div className="row">
                  <input
                    value={invoice.numero}
                    onChange={(e) => setInvoice({ ...invoice, numero: e.target.value })}
                  />
                  <button onClick={() => autoNumber(invoice.date_facture)}>Auto</button>
                </div>
                <label>Date</label>
                <input
                  type="date"
                  value={invoice.date_facture}
                  onChange={(e) =>
                    setInvoice({ ...invoice, date_facture: e.target.value })
                  }
                />
                <label>Entrepôt</label>
                <div className="row">
                  <CustomSelect
                    value={invoice.warehouse}
                    onChange={(value) => setInvoice({ ...invoice, warehouse: value })}
                    options={warehouses.map((w) => ({ value: w.nom, label: w.nom }))}
                    placeholder="Choisir un entrepôt"
                  />
                </div>
                <label>Statut</label>
                <div className="row">
                  <CustomSelect
                    className={`status-select status-${invoice.statut
                      .toLowerCase()
                      .replace(/\s+/g, '-')}`}
                    value={invoice.statut}
                    onChange={(value) => setInvoice({ ...invoice, statut: value })}
                    options={[
                      { value: 'Brouillon', label: 'Brouillon' },
                      { value: 'Envoyee', label: 'Envoyee' },
                      { value: 'Payee', label: 'Payee' },
                      { value: 'En retard', label: 'En retard' },
                    ]}
                  />
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Date échéance</label>
                    <input
                      type="date"
                      value={invoice.date_echeance}
                      onChange={(e) =>
                        setInvoice({ ...invoice, date_echeance: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Remise</label>
                    <CustomSelect
                      value={invoice.remise_type}
                      onChange={(value) => setInvoice({ ...invoice, remise_type: value })}
                      options={[
                        { value: 'percent', label: 'percent' },
                        { value: 'fixed', label: 'fixed' },
                      ]}
                    />
                  </div>
                </div>
                <div className="row-2">
                  <div className="field">
                    <label>Valeur remise</label>
                    <input
                      value={invoice.remise_val}
                      onChange={(e) =>
                        setInvoice({ ...invoice, remise_val: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>Modèle</label>
                    <CustomSelect
                      value={invoice.template}
                      onChange={(value) => setInvoice({ ...invoice, template: value })}
                      options={[
                        { value: 'classic', label: 'classic' },
                        { value: 'moderne', label: 'moderne' },
                        { value: 'minimal', label: 'minimal' },
                      ]}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Logo</label>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    onChange={uploadLogo}
                  />
                </div>

                <div className="row">
                  <input
                    value={articleLookup}
                    onChange={(e) => setArticleLookup(e.target.value)}
                    placeholder="ID/ref/nom article"
                  />
                  <button onClick={applyArticleLookup}>Ajouter article</button>
                </div>
                <h4>Articles</h4>
                <table className="items">
                  <thead>
                    <tr>
                      <th>Ref</th>
                      <th>Article</th>
                      <th>Qté</th>
                      <th>Prix U.</th>
                      <th>TVA %</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td>
                          <input
                            value={it.ref}
                            onChange={(e) => updateItem(it.id, { ref: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={it.desc}
                            onChange={(e) => updateItem(it.id, { desc: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={it.qty}
                            onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={it.unit}
                            onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            value={it.tva}
                            onChange={(e) => updateItem(it.id, { tva: e.target.value })}
                          />
                        </td>
                        <td>
                          <button onClick={() => removeItem(it.id)}>X</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="btn-row">
                  <button onClick={addItem}>Ajouter article</button>
                </div>
                <div className="total">
                  HT: {money(totals.ht)} | TVA: {money(totals.tva)} | TTC:{' '}
                  {money(totals.ttc)} EUR
                </div>
                <div className="checks">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={exportPdf}
                      onChange={(e) => setExportPdf(e.target.checked)}
                    />
                    <span className="box" aria-hidden="true"></span>
                    <span>Exporter en PDF</span>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={exportDocx}
                      onChange={(e) => setExportDocx(e.target.checked)}
                    />
                    <span className="box" aria-hidden="true"></span>
                    <span>Exporter en Word</span>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={decrementStock}
                      onChange={(e) => setDecrementStock(e.target.checked)}
                    />
                    <span className="box" aria-hidden="true"></span>
                    <span>Enlever du stock après export</span>
                  </label>
                </div>
                <button className="primary" onClick={exportInvoice}>
                  Créer + Exporter
                </button>
              </div>

                <div className="card">
                  <h3>Clients</h3>
                  <input
                    value={clientInvoiceSearch}
                    onChange={(e) => setClientInvoiceSearch(e.target.value)}
                    placeholder="ID / société / nom"
                  />
                  <div className="list">
                    {filteredClientsInvoice.map((c) => (
                      <div
                        key={c.id}
                        className={`item ${c.id === selectedClientId ? 'active' : ''}`}
                        onClick={() => selectClient(c)}
                      >
                        {c.id} - {c.societe || '-'} - {c.nom_prenom || c.nom || ''}
                      </div>
                    ))}
                  </div>
                  <h4>Aperçu facture (PDF)</h4>
                  <iframe
                    id="preview"
                    title="Aperçu facture"
                    srcDoc={previewHtml}
                  ></iframe>
                </div>
            </div>
          </section>
        )}
        {page === 'articles' && (
          <section className="page active">
            <div className="grid-2">
              <div className="card">
                <h3>Recherche</h3>
                <input
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  placeholder="Ref ou nom"
                />
                <h4>Articles</h4>
                <div className="list">
                  {articles.map((a) => (
                    <div
                      key={a.id}
                      className={`item ${a.id === selectedArticleId ? 'active' : ''}`}
                      style={a.low ? { color: '#fca5a5' } : undefined}
                      onClick={() => selectArticle(a)}
                    >
                      {a.id} - {a.nom} - {a.stock}
                    </div>
                  ))}
                </div>
                <h4>Entrepôts</h4>
                <div className="list">
                  {warehouses.map((w) => (
                    <div
                      key={w.id}
                      className={`item ${w.id === selectedWarehouseId ? 'active' : ''}`}
                      onClick={() => setSelectedWarehouseId(w.id)}
                    >
                      {w.nom}
                    </div>
                  ))}
                </div>
                <div className="row">
                  <button onClick={addWarehouse}>Ajouter</button>
                  <button onClick={deleteWarehouse}>Supprimer</button>
                </div>
              </div>
              <div className="card">
                <h3>Détails article</h3>
                <label>Ref</label>
                <input
                  value={articleForm.ref}
                  onChange={(e) => setArticleForm({ ...articleForm, ref: e.target.value })}
                />
                <label>Nom</label>
                <input
                  value={articleForm.nom}
                  onChange={(e) => fillArticleFromName(e.target.value)}
                />
                <label>Prix</label>
                <input
                  value={articleForm.prix}
                  onChange={(e) => setArticleForm({ ...articleForm, prix: e.target.value })}
                />
                <label>Prix achat</label>
                <input
                  value={articleForm.prix_achat}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, prix_achat: e.target.value })
                  }
                />
                <div>Marge: {money(articleForm.prix - articleForm.prix_achat)}</div>
                <label>TVA %</label>
                <input
                  value={articleForm.tva}
                  onChange={(e) => setArticleForm({ ...articleForm, tva: e.target.value })}
                />
                <label>Stock</label>
                <input
                  value={articleForm.stock}
                  onChange={(e) => setArticleForm({ ...articleForm, stock: e.target.value })}
                />
                <label>Entrepôt</label>
                <input
                  value={articleForm.warehouse}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, warehouse: e.target.value })
                  }
                />
                <div className="btn-row">
                  <button onClick={() => saveArticle(false)}>Ajouter</button>
                  <button onClick={() => saveArticle(true)}>Mettre à jour</button>
                  <button onClick={deleteArticle}>Supprimer</button>
                </div>
                <button onClick={addArticleToInvoice}>Ajouter à la facture</button>
                <div className="btn-row">
                  <input
                    ref={csvImportRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCsvImport(e.target.files?.[0])}
                  />
                  <button onClick={exportArticlesCsv}>Exporter CSV</button>
                </div>
              </div>
            </div>
          </section>
        )}
        {page === 'clients' && (
          <section className="page active">
            <div className="grid-2">
              <div className="card">
                <h3>Création client</h3>
                <div>ID: {selectedClientId || '-'}</div>
                <label>Nom société</label>
                <input
                  value={clientForm.societe}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, societe: e.target.value })
                  }
                />
                <label>Nom / Prénom</label>
                <input
                  value={clientForm.nom_prenom}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, nom_prenom: e.target.value })
                  }
                />
                <label>Email</label>
                <input
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                />
                <label>Téléphone</label>
                <input
                  value={clientForm.telephone}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, telephone: e.target.value })
                  }
                />
                <label>Adresse</label>
                <input
                  value={clientForm.adresse}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, adresse: e.target.value })
                  }
                />
                <label>Notes</label>
                <textarea
                  rows="4"
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                ></textarea>
                <div className="btn-row">
                  <button onClick={() => saveClient(false)}>Ajouter</button>
                  <button onClick={() => saveClient(true)}>Mettre à jour</button>
                  <button onClick={deleteClient}>Supprimer</button>
                </div>
                <h4>Historique factures</h4>
                <div className="list">
                  {clientHistory.map((r) => (
                    <div className="item" key={r.id || r.numero}>
                      {r.numero} | {r.date_facture} | {money(r.montant)} | {r.statut}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Clients</h3>
                <input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Recherche..."
                />
                <div className="list">
                  {filteredClients.map((c) => (
                    <div
                      key={c.id}
                      className={`item ${c.id === selectedClientId ? 'active' : ''}`}
                      onClick={() => selectClient(c)}
                    >
                      {c.id} - {c.societe || '-'} - {c.nom_prenom || c.nom || ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'infos' && (
          <section className="page active">
            <div className="grid-2">
              <div className="card">
                <h3>Infos entreprise</h3>
                <div className="list">
                  {infos.map((i) => (
                    <div
                      key={i.id}
                      className={`item ${i.id === selectedInfoId ? 'active' : ''}`}
                      onClick={() => selectInfo(i.id)}
                    >
                      {i.id} - {i.nom}
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Informations entreprise</h3>
                <div>ID: {selectedInfoId || '-'}</div>
                <label>Nom Prénom</label>
                <input
                  value={infoForm.nom}
                  onChange={(e) => setInfoForm({ ...infoForm, nom: e.target.value })}
                />
                <label>Adresse</label>
                <input
                  value={infoForm.adresse}
                  onChange={(e) => setInfoForm({ ...infoForm, adresse: e.target.value })}
                />
                <label>Téléphone</label>
                <input
                  value={infoForm.telephone}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, telephone: e.target.value })
                  }
                />
                <label>Email</label>
                <input
                  value={infoForm.email}
                  onChange={(e) => setInfoForm({ ...infoForm, email: e.target.value })}
                />
                <label>SIRET</label>
                <input
                  value={infoForm.siret}
                  onChange={(e) => setInfoForm({ ...infoForm, siret: e.target.value })}
                />
                <label>TVA intracom</label>
                <input
                  value={infoForm.tva_intracom}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, tva_intracom: e.target.value })
                  }
                />
                <label>Site web</label>
                <input
                  value={infoForm.site_web}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, site_web: e.target.value })
                  }
                />
                <label>IBAN</label>
                <input
                  value={infoForm.iban}
                  onChange={(e) => setInfoForm({ ...infoForm, iban: e.target.value })}
                />
                <label>BIC</label>
                <input
                  value={infoForm.bic}
                  onChange={(e) => setInfoForm({ ...infoForm, bic: e.target.value })}
                />
                <label>Conditions paiement</label>
                <textarea
                  rows="4"
                  value={infoForm.conditions_paiement}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, conditions_paiement: e.target.value })
                  }
                ></textarea>
                <div className="row">
                  <label>Signature</label>
                  <input ref={signatureFileRef} type="file" accept="image/*" />
                </div>
                <div className="row">
                  <label>Cachet</label>
                  <input ref={stampFileRef} type="file" accept="image/*" />
                </div>
                <div className="btn-row">
                  <button onClick={saveInfo}>Enregistrer</button>
                  <button onClick={deleteInfo}>Supprimer</button>
                  <button
                    onClick={() => {
                      setSelectedInfoId(null)
                      setInfoForm(emptyInfo)
                    }}
                  >
                    Nouveau
                  </button>
                  <button onClick={() => setInvoice({ ...invoice, company_id: selectedInfoId })}>
                    Charger dans facture
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'logs' && (
          <section className="page active">
            <div className="grid-1">
              <div className="card notifications-card">
                <div className="notif-header">
                  <div>
                    <div className="notif-title">Notifications stock</div>
                    <div className="notif-subtitle">
                      {notifications.length
                        ? `${notifications.length} alerte(s) active(s)`
                        : 'Aucune alerte active'}
                    </div>
                  </div>
                  <div className="notif-actions">
                    <button className="ghost" onClick={markAllNotificationsRead}>
                      Tout lire
                    </button>
                    <button
                      className="ghost"
                      onClick={async () => {
                        await loadNotifications()
                        await loadLogs()
                      }}
                    >
                      Rafraîchir
                    </button>
                    <button
                      className="primary"
                      onClick={() => {
                        setShowLogsPanel((v) => !v)
                        if (!showLogsPanel) loadLogs()
                      }}
                    >
                      {showLogsPanel ? 'Fermer logs' : 'Logs'}
                    </button>
                  </div>
                </div>

                <div className="notif-controls">
                  <div className="field">
                    <label>Seuil stock</label>
                    <input
                      value={settings.low_stock_threshold}
                      onChange={(e) =>
                        setSettings({ ...settings, low_stock_threshold: e.target.value })
                      }
                    />
                  </div>
                  <button onClick={saveSettings}>Enregistrer</button>
                </div>

                <div className="notif-list">
                  {notifications.length === 0 && (
                    <div className="notif-empty">Tout est ok, aucun stock en alerte.</div>
                  )}
                  {notifications.map((n) => (
                    <div className="notif-item" key={n.id || n.created_at}>
                      <div className="notif-dot" aria-hidden="true"></div>
                      <div className="notif-body">
                        <div className="notif-main">
                          <span className="notif-ref">{n.ref}</span>
                          <span className="notif-name">{n.nom}</span>
                        </div>
                        <div className="notif-meta">
                          Stock: {n.stock} | Seuil: {n.threshold}
                        </div>
                      </div>
                      <div className="notif-time">{n.created_at}</div>
                    </div>
                  ))}
                </div>

                {showLogsPanel && (
                  <div className="logs-panel">
                    <div className="logs-header">
                      <div className="logs-title">Historique des logs</div>
                      <button onClick={exportLogsTxt}>Exporter TXT</button>
                    </div>
                    <div className="logs-list">
                      {logs.map((l) => (
                        <div className="logs-item" key={l.id || l.created_at}>
                          <span className="logs-time">[{l.created_at}]</span> {l.action} -{' '}
                          {l.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App



