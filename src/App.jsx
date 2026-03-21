import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const money = (v) => Number(v || 0).toFixed(2)

const createId = () =>
  (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`)

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const DEV_DISABLE_EMAIL_CONFIRMATION = import.meta.env.VITE_DEV_DISABLE_EMAIL_CONFIRMATION === 'true'
const AUTH_STORAGE_MODE_KEY = 'ui.auth.storage_mode'
const DEFAULT_AUTH_STORAGE_MODE = 'persistent'
let authStorageMode = localStorage.getItem(AUTH_STORAGE_MODE_KEY) || DEFAULT_AUTH_STORAGE_MODE
const authStorage = {
  getItem(key) {
    return authStorageMode === 'session' ? sessionStorage.getItem(key) : localStorage.getItem(key)
  },
  setItem(key, value) {
    if (authStorageMode === 'session') {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
  },
  removeItem(key) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storage: authStorage },
      })
    : null
const SUPERADMIN_EMAIL = import.meta.env.VITE_SUPERADMIN_EMAIL || ''
const ROLE_PERMISSION_KEYS = [
  'invoice_access',
  'client_access',
  'article_access',
  'info_access',
  'logs_access',
  'admin_access',
  'user_manage',
  'role_manage',
]
const DEFAULT_ROLE_PERMISSIONS = {
  visitor: {
    invoice_access: true,
    client_access: false,
    article_access: false,
    info_access: false,
    logs_access: false,
    admin_access: false,
    user_manage: false,
    role_manage: false,
  },
  user: {
    invoice_access: true,
    client_access: true,
    article_access: true,
    info_access: true,
    logs_access: false,
    admin_access: false,
    user_manage: false,
    role_manage: false,
  },
  admin: {
    invoice_access: true,
    client_access: true,
    article_access: true,
    info_access: true,
    logs_access: true,
    admin_access: true,
    user_manage: true,
    role_manage: true,
  },
  root: {
    invoice_access: true,
    client_access: true,
    article_access: true,
    info_access: true,
    logs_access: true,
    admin_access: true,
    user_manage: true,
    role_manage: true,
  },
}
const DEFAULT_ROLE_LIST = [
  { slug: 'visitor', label: 'Visiteur', permissions: DEFAULT_ROLE_PERMISSIONS.visitor },
  { slug: 'user', label: 'Utilisateur', permissions: DEFAULT_ROLE_PERMISSIONS.user },
  { slug: 'admin', label: 'Admin', permissions: DEFAULT_ROLE_PERMISSIONS.admin },
  { slug: 'root', label: 'Root', permissions: DEFAULT_ROLE_PERMISSIONS.root },
]
const DEFAULT_UI_PREFS = {
  language: 'fr',
  theme: 'dark',
  keepSessionOnReload: true,
  toastAnchor: 'top-right',
  toastOffsetX: 16,
  toastOffsetY: 16,
}
const UI_LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
]
const UI_THEME_OPTIONS = [
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'navy', label: 'Bleu nuit' },
  { value: 'forest', label: 'Forêt' },
]
const UI_TRANSLATIONS = {
  fr: {
    brand: 'Gestion de Factures',
    nav_invoice: 'Factures',
    nav_clients: 'Clients',
    nav_articles: 'Articles',
    nav_infos: 'Infos',
    nav_logs: 'Notifications',
    nav_admin: 'Admin',
    login: 'Connexion',
    signup: 'Créer un compte',
    logout: 'Déconnexion',
    settings: 'Réglages',
    settings_title: 'Réglages utilisateur',
    settings_language: 'Langue',
    settings_theme: 'Thème',
    settings_session: 'Rester connecté après un rechargement',
    settings_notifications: 'Position des notifications',
    settings_preview: 'Aperçu notif',
    settings_anchor: 'Ancrage',
    settings_offset_x: 'Décalage X',
    settings_offset_y: 'Décalage Y',
    home_eyebrow: 'Plateforme de facturation & stocks',
    home_title: 'Un espace clair pour suivre, facturer, encaisser.',
    home_subtitle:
      'Tout est regroupé au même endroit: clients, articles, stocks, factures, alertes et export. Un outil qui garde le rythme de votre activité.',
    home_open_panel: 'Accéder au panel',
    home_create_account: 'Créer un compte',
    home_highlight_1_value: '2 min',
    home_highlight_1_label: 'par facture',
    home_highlight_2_value: '+48%',
    home_highlight_2_label: 'visibilité stock',
    home_highlight_3_value: '24/7',
    home_highlight_3_label: 'accès sécurisé',
  },
  en: {
    brand: 'Invoice Manager',
    nav_invoice: 'Invoices',
    nav_clients: 'Clients',
    nav_articles: 'Items',
    nav_infos: 'Company',
    nav_logs: 'Notifications',
    nav_admin: 'Admin',
    login: 'Login',
    signup: 'Create account',
    logout: 'Logout',
    settings: 'Settings',
    settings_title: 'User settings',
    settings_language: 'Language',
    settings_theme: 'Theme',
    settings_session: 'Stay signed in after refresh',
    settings_notifications: 'Notification position',
    settings_preview: 'Preview notifications',
    settings_anchor: 'Anchor',
    settings_offset_x: 'X offset',
    settings_offset_y: 'Y offset',
    home_eyebrow: 'Billing & stock platform',
    home_title: 'A clear space to track, bill, and collect.',
    home_subtitle:
      'Everything is grouped in one place: customers, items, stock, invoices, alerts, and exports. A tool that keeps up with your workflow.',
    home_open_panel: 'Open panel',
    home_create_account: 'Create account',
    home_highlight_1_value: '2 min',
    home_highlight_1_label: 'per invoice',
    home_highlight_2_value: '+48%',
    home_highlight_2_label: 'stock visibility',
    home_highlight_3_value: '24/7',
    home_highlight_3_label: 'secure access',
  },
  es: {
    brand: 'Gestor de facturas',
    nav_invoice: 'Facturas',
    nav_clients: 'Clientes',
    nav_articles: 'Artículos',
    nav_infos: 'Empresa',
    nav_logs: 'Notificaciones',
    nav_admin: 'Admin',
    login: 'Iniciar sesión',
    signup: 'Crear cuenta',
    logout: 'Cerrar sesión',
    settings: 'Ajustes',
    settings_title: 'Ajustes del usuario',
    settings_language: 'Idioma',
    settings_theme: 'Tema',
    settings_session: 'Mantener sesión al recargar',
    settings_notifications: 'Posición de notificaciones',
    settings_preview: 'Vista previa de notificaciones',
    settings_anchor: 'Anclaje',
    settings_offset_x: 'Desplazamiento X',
    settings_offset_y: 'Desplazamiento Y',
    home_eyebrow: 'Plataforma de facturación y stock',
    home_title: 'Un espacio claro para seguir, facturar y cobrar.',
    home_subtitle:
      'Todo está reunido en un solo lugar: clientes, artículos, stock, facturas, alertas y exportación. Una herramienta que sigue tu ritmo.',
    home_open_panel: 'Abrir panel',
    home_create_account: 'Crear cuenta',
    home_highlight_1_value: '2 min',
    home_highlight_1_label: 'por factura',
    home_highlight_2_value: '+48%',
    home_highlight_2_label: 'visibilidad stock',
    home_highlight_3_value: '24/7',
    home_highlight_3_label: 'acceso seguro',
  },
  it: {
    brand: 'Gestione Fatture',
    nav_invoice: 'Fatture',
    nav_clients: 'Clienti',
    nav_articles: 'Articoli',
    nav_infos: 'Azienda',
    nav_logs: 'Notifiche',
    nav_admin: 'Admin',
    login: 'Accesso',
    signup: 'Crea account',
    logout: 'Disconnetti',
    settings: 'Impostazioni',
    settings_title: 'Impostazioni utente',
    settings_language: 'Lingua',
    settings_theme: 'Tema',
    settings_session: 'Resta connesso dopo il refresh',
    settings_notifications: 'Posizione notifiche',
    settings_preview: 'Anteprima notifiche',
    settings_anchor: 'Ancora',
    settings_offset_x: 'Offset X',
    settings_offset_y: 'Offset Y',
    home_eyebrow: 'Piattaforma fatture e stock',
    home_title: 'Uno spazio chiaro per seguire, fatturare e incassare.',
    home_subtitle:
      'Tutto è riunito in un solo posto: clienti, articoli, stock, fatture, avvisi ed esportazioni. Uno strumento che segue il tuo ritmo.',
    home_open_panel: 'Apri pannello',
    home_create_account: 'Crea account',
    home_highlight_1_value: '2 min',
    home_highlight_1_label: 'per fattura',
    home_highlight_2_value: '+48%',
    home_highlight_2_label: 'visibilità stock',
    home_highlight_3_value: '24/7',
    home_highlight_3_label: 'accesso sicuro',
  },
}
const uiPrefsKey = (userId) => `ui.prefs.${userId || 'guest'}`
const normalizeUiPrefs = (prefs = {}) => ({
  language: ['fr', 'en', 'es', 'it'].includes(prefs.language) ? prefs.language : DEFAULT_UI_PREFS.language,
  theme: ['dark', 'light', 'navy', 'forest'].includes(prefs.theme) ? prefs.theme : DEFAULT_UI_PREFS.theme,
  keepSessionOnReload: prefs.keepSessionOnReload === undefined ? DEFAULT_UI_PREFS.keepSessionOnReload : !!prefs.keepSessionOnReload,
  toastAnchor: ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(prefs.toastAnchor)
    ? prefs.toastAnchor
    : DEFAULT_UI_PREFS.toastAnchor,
  toastOffsetX: Number.isFinite(Number(prefs.toastOffsetX)) ? Number(prefs.toastOffsetX) : DEFAULT_UI_PREFS.toastOffsetX,
  toastOffsetY: Number.isFinite(Number(prefs.toastOffsetY)) ? Number(prefs.toastOffsetY) : DEFAULT_UI_PREFS.toastOffsetY,
})
const migrateAuthStorageMode = (nextMode) => {
  const mode = nextMode === 'session' ? 'session' : 'persistent'
  if (mode === authStorageMode) return
  const source = authStorageMode === 'session' ? sessionStorage : localStorage
  const target = mode === 'session' ? sessionStorage : localStorage
  Object.keys(source)
    .filter((key) => key.startsWith('sb-'))
    .forEach((key) => {
      const value = source.getItem(key)
      if (value !== null) target.setItem(key, value)
      source.removeItem(key)
    })
  authStorageMode = mode
  localStorage.setItem(AUTH_STORAGE_MODE_KEY, mode)
}
const setAuthStorageMode = (keepSessionOnReload) => {
  migrateAuthStorageMode(keepSessionOnReload ? 'session' : 'persistent')
}
const ROLE_PERMISSION_DEFS = [
  { key: 'invoice_access', label: 'Accès facturation', hint: 'Voir et créer les factures.' },
  { key: 'client_access', label: 'Clients', hint: 'Accès aux clients.' },
  { key: 'article_access', label: 'Articles', hint: 'Accès aux articles et stocks.' },
  { key: 'info_access', label: 'Infos entreprise', hint: 'Accès aux infos entreprise.' },
  { key: 'logs_access', label: 'Notifications / logs', hint: 'Voir les logs et notifications.' },
  { key: 'admin_access', label: 'Accès admin', hint: 'Afficher le menu admin.' },
  { key: 'user_manage', label: 'Gestion des utilisateurs', hint: 'Créer et modifier des comptes.' },
  { key: 'role_manage', label: 'Gestion des rôles', hint: 'Créer et modifier des rôles.' },
]
const normalizePermissions = (permissions = {}) =>
  ROLE_PERMISSION_KEYS.reduce((acc, key) => {
    acc[key] = !!permissions[key]
    return acc
  }, {})
const normalizeRole = (role) => {
  const slug = String(role?.slug || '').trim().toLowerCase()
  const label = String(role?.label || slug).trim()
  const base = DEFAULT_ROLE_PERMISSIONS[slug] || DEFAULT_ROLE_PERMISSIONS.user
  return { slug, label, permissions: normalizePermissions({ ...base, ...(role?.permissions || {}) }) }
}
const permissionsForRole = (role) =>
  normalizePermissions(DEFAULT_ROLE_PERMISSIONS[String(role || 'user').toLowerCase()] || DEFAULT_ROLE_PERMISSIONS.user)
const PAGE_PERMISSION_MAP = {
  facture: 'invoice_access',
  clients: 'client_access',
  articles: 'article_access',
  infos: 'info_access',
  logs: 'logs_access',
  admin: 'admin_access',
}

const normalizeFetchError = (err) => {
  if (!err) return 'Erreur réseau'
  if (err.name === 'TypeError' && /failed to fetch/i.test(err.message || '')) {
    return 'Serveur API injoignable. Lance le backend.'
  }
  return err.message || 'Erreur réseau'
}

const apiFetch = async (path, options) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      let msg = 'Erreur serveur'
      try {
        const data = await res.json()
        if (data?.error) msg = data.error
      } catch {
        // ignore
      }
      throw new Error(msg)
    }
    return res.json()
  } catch (err) {
    throw new Error(normalizeFetchError(err))
  }
}

const apiFetchAuth = async (path, token, options) => {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      ...options,
    })
    if (!res.ok) {
      let msg = 'Erreur serveur'
      try {
        const data = await res.json()
        if (data?.error) msg = data.error
      } catch {
        // ignore
      }
      throw new Error(msg)
    }
    return res.json()
  } catch (err) {
    throw new Error(normalizeFetchError(err))
  }
}

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
  if (!localStorage.getItem(dbKeys.logs)) writeStore(dbKeys.logs, [])
  if (!localStorage.getItem(dbKeys.notifications)) writeStore(dbKeys.notifications, [])
  if (!localStorage.getItem(dbKeys.invoices)) writeStore(dbKeys.invoices, [])
  if (!localStorage.getItem(dbKeys.settings))
    writeStore(dbKeys.settings, {
      low_stock_threshold: '5',
      invoice_template: 'classic',
      invoice_logo_pos: 'left',
      default_warehouse: 'Defaut',
      invoice_logo_path: '',
    })
}

const addLog = (action, message, level = 'info') => {
  const logs = readStore(dbKeys.logs, [])
  logs.unshift({ id: createId(), action, message, level, created_at: nowIso() })
  writeStore(dbKeys.logs, logs)
}

const updateNotifications = (articles = [], settings = readStore(dbKeys.settings, {})) => {
  const threshold = parseFloat(settings.low_stock_threshold || '0')
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

const nextInfoId = () => createId()
const nextClientId = () => createId()
const nextArticleId = () => createId()
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
  const [page, setPage] = useState('home')
  const [authModal, setAuthModal] = useState({
    open: false,
    mode: 'login',
    email: '',
    password: '',
    name: '',
  })
  const [authedUser, setAuthedUser] = useState(null)
  const [authSession, setAuthSession] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [userPermissions, setUserPermissions] = useState(permissionsForRole('user'))
  const [adminUsers, setAdminUsers] = useState([])
  const [adminUserForm, setAdminUserForm] = useState({ email: '', password: '', name: '', role: 'user' })
  const [adminRoles, setAdminRoles] = useState(DEFAULT_ROLE_LIST)
  const [adminRolesLoading, setAdminRolesLoading] = useState(false)
  const [adminRolesLoaded, setAdminRolesLoaded] = useState(false)
  const [adminRolesError, setAdminRolesError] = useState('')
  const [roleForm, setRoleForm] = useState({
    slug: '',
    label: '',
    permissions: permissionsForRole('visitor'),
  })
  const [editingRoleSlug, setEditingRoleSlug] = useState('')
  const [adminSection, setAdminSection] = useState('overview')

  const [clients, setClients] = useState([])
  const [articles, setArticles] = useState([])
  const [allArticles, setAllArticles] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [infos, setInfos] = useState([])
  const [notifications, setNotifications] = useState([])
  const [logs, setLogs] = useState([])
  const [toasts, setToasts] = useState([])
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
  const [adminModal, setAdminModal] = useState({
    open: false,
    value: '',
    mode: 'login',
  })
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminEnv, setAdminEnv] = useState({
    SUPABASE_URL: '',
    SUPABASE_SERVICE_ROLE_KEY: '',
  })
  const [dbHealth, setDbHealth] = useState({ status: 'unknown', db: false, error: '' })
  const [adminPassInput, setAdminPassInput] = useState('')
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [adminUsersLoaded, setAdminUsersLoaded] = useState(false)
  const [adminUsersError, setAdminUsersError] = useState('')
  const [uiPrefs, setUiPrefs] = useState(DEFAULT_UI_PREFS)
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const [notifPreviewOpen, setNotifPreviewOpen] = useState(false)
  const canAccess = useCallback((key) => !!userPermissions?.[key], [userPermissions])
  const canAccessAdmin = useMemo(() => canAccess('admin_access') || ['admin', 'root'].includes(userRole), [canAccess, userRole])
  const t = useCallback(
    (key) => UI_TRANSLATIONS[uiPrefs.language]?.[key] || UI_TRANSLATIONS.fr[key] || key,
    [uiPrefs.language],
  )
  const adminTabs = useMemo(() => {
    const tabs = [{ key: 'overview', label: 'Aperçu', permission: null }]
    if (canAccess('admin_access')) {
      tabs.push({ key: 'settings', label: 'Réglages', permission: 'admin_access' })
    }
    if (canAccess('role_manage')) {
      tabs.push({ key: 'roles', label: 'Rôles', permission: 'role_manage' })
    }
    if (canAccess('user_manage')) {
      tabs.push({ key: 'users', label: 'Utilisateurs', permission: 'user_manage' })
    }
    return tabs
  }, [canAccess])

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
  const settingsMenuRef = useRef(null)
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
    loadUiPrefsForUser(authedUser?.id || 'guest')
  }, [authedUser?.id])

  useEffect(() => {
    document.documentElement.dataset.theme = uiPrefs.theme
    document.body.dataset.theme = uiPrefs.theme
    document.documentElement.lang =
      uiPrefs.language === 'fr'
        ? 'fr'
        : uiPrefs.language === 'en'
        ? 'en'
        : uiPrefs.language === 'es'
        ? 'es'
        : 'it'
  }, [uiPrefs.theme, uiPrefs.language])

  useEffect(() => {
    saveUiPrefsForUser(authedUser?.id || 'guest', uiPrefs)
  }, [uiPrefs, authedUser?.id])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!settingsMenuRef.current) return
      if (!settingsMenuRef.current.contains(event.target)) {
        setSettingsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  useEffect(() => {
    if (!supabase) return
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session || null)
      setAuthedUser(session?.user || null)
      if (session?.user) syncProfile(session.user, session.access_token)
    })
    return () => {
      sub?.subscription?.unsubscribe?.()
    }
  }, [])


  const pushToast = (type, message) => {
    const id = createId()
    setToasts((prev) => [{ id, type, message }, ...prev].slice(0, 6))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  async function init() {
    ensureDb()
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      setAuthSession(data?.session || null)
      setAuthedUser(data?.session?.user || null)
      if (data?.session?.user) await syncProfile(data.session.user, data.session.access_token)
    }
    const savedUser = readStore(dbKeys.settings, {})?.auth_user || null
    if (savedUser) setAuthedUser(savedUser)
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

  function loadUiPrefsForUser(userId) {
    const saved = readStore(uiPrefsKey(userId), DEFAULT_UI_PREFS)
    const next = normalizeUiPrefs(saved)
    setUiPrefs(next)
    setAuthStorageMode(next.keepSessionOnReload)
  }

  function saveUiPrefsForUser(userId, nextPrefs) {
    const next = normalizeUiPrefs(nextPrefs)
    writeStore(uiPrefsKey(userId), next)
    setUiPrefs(next)
    setAuthStorageMode(next.keepSessionOnReload)
  }

  const getAdminPassword = () => readStore(dbKeys.settings, {})?.admin_password || ''

  async function refreshDbHealth() {
    try {
      const data = await apiFetch('/health')
      setDbHealth({ status: data.status, db: !!data.db, error: '' })
    } catch (err) {
      setDbHealth({ status: 'error', db: false, error: err.message })
    }
  }

  async function loadAdminEnv() {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token || authSession?.access_token || ''
      if (!token) throw new Error('Session manquante. Reconnecte-toi.')
      const data = await apiFetchAuth('/admin/env', token)
      setAdminEnv({
        SUPABASE_URL: data.SUPABASE_URL || '',
        SUPABASE_SERVICE_ROLE_KEY: data.SUPABASE_SERVICE_ROLE_KEY || '',
      })
    } catch (err) {
      pushToast('error', `Admin: ${err.message}`)
    }
  }

  async function saveAdminEnv() {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token || authSession?.access_token || ''
      if (!token) throw new Error('Session manquante. Reconnecte-toi.')
      await apiFetchAuth('/admin/env', token, {
        method: 'PUT',
        body: JSON.stringify(adminEnv),
      })
      pushToast('success', 'Env sauvegardé. Redémarre le serveur.')
    } catch (err) {
      pushToast('error', `Env: ${err.message}`)
    }
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
    try {
      const data = await apiFetch('/clients')
      setClients(data)
    } catch (err) {
      pushToast('error', `Clients DB: ${err.message}`)
      setClients([])
    }
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
      try {
        await apiFetch(`/clients/${selectedClientId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setClients((prev) =>
          prev.map((c) => (c.id === selectedClientId ? { ...c, ...payload } : c))
        )
        addLog('client_update', `Client mis à jour: ${payload.nom}`)
      } catch (err) {
        pushToast('error', `Client non enregistré: ${err.message}`)
        addLog('client_error', `Client update échoué: ${err.message}`, 'error')
        return
      }
    } else {
      const entry = { id: nextClientId(), ...payload, created_at: nowIso() }
      try {
        await apiFetch('/clients', {
          method: 'POST',
          body: JSON.stringify(entry),
        })
        setClients((prev) => [entry, ...prev])
        addLog('client_create', `Client créé: ${payload.nom}`)
        setSelectedClientId(entry.id)
      } catch (err) {
        pushToast('error', `Client non enregistré: ${err.message}`)
        addLog('client_error', `Client création échouée: ${err.message}`, 'error')
        return
      }
    }
    await loadClients()
  }

  async function deleteClient() {
    if (!selectedClientId) return alert('Sélectionne un client.')
    const ok = await confirmDialog('Supprimer client', 'Êtes-vous sûr de supprimer ce client ?')
    if (!ok) return
    try {
      await apiFetch(`/clients/${selectedClientId}`, { method: 'DELETE' })
      setClients((prev) => prev.filter((c) => c.id !== selectedClientId))
      addLog('client_delete', `Client supprimé: ${selectedClientId}`)
    } catch (err) {
      pushToast('error', `Client non supprimé: ${err.message}`)
      addLog('client_error', `Client suppression échouée: ${err.message}`, 'error')
      return
    }
    setSelectedClientId(null)
    setClientForm(emptyClient)
    await loadClients()
  }

  async function loadArticles(q) {
    try {
      const data = await apiFetch('/articles')
      setAllArticles(data)
      const term = q?.toLowerCase().trim()
      const filtered = term
        ? data.filter(
            (a) =>
              a.ref?.toLowerCase().includes(term) || a.nom?.toLowerCase().includes(term)
          )
        : data
      setArticles(filtered)
      updateNotifications(data, settings)
    } catch (err) {
      pushToast('error', `Articles DB: ${err.message}`)
      setArticles([])
      setAllArticles([])
    }
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
    const match = allArticles.find((a) => a.nom?.trim().toLowerCase() === term)
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
      try {
        await apiFetch(`/articles/${selectedArticleId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setAllArticles((prev) => {
          const nextAll = prev.map((a) =>
            a.id === selectedArticleId ? { ...a, ...payload } : a
          )
          updateNotifications(nextAll, settings)
          return nextAll
        })
        addLog('article_update', `Article mis à jour: ${payload.ref || payload.nom}`)
      } catch (err) {
        pushToast('error', `Article non enregistré: ${err.message}`)
        addLog('article_error', `Article update échoué: ${err.message}`, 'error')
        return
      }
    } else {
      const entry = { id: nextArticleId(), ...payload, created_at: nowIso() }
      try {
        await apiFetch('/articles', {
          method: 'POST',
          body: JSON.stringify(entry),
        })
        setAllArticles((prev) => {
          const nextAll = [entry, ...prev]
          updateNotifications(nextAll, settings)
          return nextAll
        })
        addLog('article_create', `Article créé: ${payload.ref || payload.nom}`)
        setSelectedArticleId(entry.id)
      } catch (err) {
        pushToast('error', `Article non enregistré: ${err.message}`)
        addLog('article_error', `Article création échouée: ${err.message}`, 'error')
        return
      }
    }
    await loadArticles(articleSearch)
  }

  async function deleteArticle() {
    if (!selectedArticleId) return alert('Sélectionne un article.')
    const ok = await confirmDialog('Supprimer article', 'Êtes-vous sûr de supprimer cet article ?')
    if (!ok) return
    try {
      await apiFetch(`/articles/${selectedArticleId}`, { method: 'DELETE' })
      setAllArticles((prev) => {
        const nextAll = prev.filter((a) => a.id !== selectedArticleId)
        updateNotifications(nextAll, settings)
        return nextAll
      })
      addLog('article_delete', `Article supprimé: ${selectedArticleId}`)
    } catch (err) {
      pushToast('error', `Article non supprimé: ${err.message}`)
      addLog('article_error', `Article suppression échouée: ${err.message}`, 'error')
      return
    }
    setSelectedArticleId(null)
    setArticleForm(emptyArticle)
    updateNotifications(allArticles, settings)
    await loadArticles(articleSearch)
  }

  async function loadWarehouses() {
    try {
      const data = await apiFetch('/warehouses')
      setWarehouses(data)
      if (data.length && !invoice.warehouse) {
        setInvoice((prev) => ({ ...prev, warehouse: data[0].nom }))
      }
    } catch (err) {
      pushToast('error', `Entrepôts DB: ${err.message}`)
      setWarehouses([])
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
    try {
      await apiFetch(`/warehouses/${selectedWarehouseId}`, { method: 'DELETE' })
      setWarehouses((prev) => prev.filter((w) => w.id !== selectedWarehouseId))
      addLog('warehouse_delete', `Entrepôt supprimé: ${selectedWarehouseId}`)
    } catch (err) {
      pushToast('error', `Entrepôt non supprimé: ${err.message}`)
      addLog('warehouse_error', `Entrepôt suppression échouée: ${err.message}`, 'error')
      return
    }
    setSelectedWarehouseId(null)
    await loadWarehouses()
  }
  async function loadInfos() {
    try {
      const data = await apiFetch('/infos')
      setInfos(data)
    } catch (err) {
      pushToast('error', `Infos DB: ${err.message}`)
      setInfos([])
    }
  }

  async function selectInfo(id) {
    setSelectedInfoId(id)
    const info = infos.find((i) => i.id === id) || {}
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
    const found =
      infos.find((i) => String(i.id) === term) ||
      infos.find((i) => i.nom?.toLowerCase().includes(term.toLowerCase()))
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
      allArticles.find((a) => String(a.id) === term) ||
      allArticles.find((a) => a.ref?.toLowerCase() === lower) ||
      allArticles.find((a) => a.nom?.toLowerCase() === lower) ||
      allArticles.find((a) => a.nom?.toLowerCase().includes(lower))
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
    try {
      if (selectedInfoId) {
        await apiFetch(`/infos/${selectedInfoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setInfos((prev) => prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i)))
      } else {
        await apiFetch('/infos', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setInfos((prev) => [{ ...payload, created_at: nowIso() }, ...prev])
      }
      setSelectedInfoId(payload.id)
      addLog('infos_save', `Infos enregistrées: ${payload.nom || payload.id}`)
      await loadInfos()
    } catch (err) {
      pushToast('error', `Infos non enregistrées: ${err.message}`)
      addLog('infos_error', `Infos save échoué: ${err.message}`, 'error')
    }
  }

  async function deleteInfo() {
    if (!selectedInfoId) return alert('Sélectionne une info.')
    const ok = await confirmDialog('Supprimer info', 'Êtes-vous sûr de supprimer cette info ?')
    if (!ok) return
    try {
      await apiFetch(`/infos/${selectedInfoId}`, { method: 'DELETE' })
      setInfos((prev) => prev.filter((i) => i.id !== selectedInfoId))
      addLog('infos_delete', `Infos supprimées: ${selectedInfoId}`)
      setSelectedInfoId(null)
      setInfoForm(emptyInfo)
      await loadInfos()
    } catch (err) {
      pushToast('error', `Infos non supprimées: ${err.message}`)
      addLog('infos_error', `Infos delete échoué: ${err.message}`, 'error')
    }
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
    updateNotifications(allArticles, settings)
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
    updateNotifications(allArticles, payload)
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

      const updated = allArticles.map((a) => {
        const line = invoiceEntry.items.find((it) => it.ref && it.ref === a.ref)
        if (!line) return a
        const nextStock =
          parseFloat(a.stock || '0') - parseFloat(line.stock || line.qty || '0')
        return { ...a, stock: String(nextStock < 0 ? 0 : nextStock) }
      })
      setAllArticles(updated)
      await Promise.all(
        updated.map((a) =>
          apiFetch(`/articles/${a.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              ref: a.ref,
              nom: a.nom,
              prix: a.prix,
              prix_achat: a.prix_achat,
              tva: a.tva,
              stock: a.stock,
              warehouse: a.warehouse,
            }),
          })
        )
      )
    }

    addLog(
      'invoice_export',
      `Facture exportée ${invoiceEntry.numero} (${client?.nom || ''})`
    )
    updateNotifications(allArticles, settings)

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
          const found = allArticles.find((a) => a.ref === patch.ref)
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
    try {
      const entries = rows
        .map((cols) => {
          const [
            ref,
            nom,
            prix = '0',
            prix_achat = '0',
            tva = '0',
            stock = '0',
            warehouse = '',
          ] = cols
          if (!ref && !nom) return null
          return {
            id: createId(),
            ref,
            nom,
            prix,
            prix_achat,
            tva,
            stock,
            warehouse,
            created_at: nowIso(),
          }
        })
        .filter(Boolean)
      await Promise.all(
        entries.map((entry) =>
          apiFetch('/articles', { method: 'POST', body: JSON.stringify(entry) })
        )
      )
      addLog('article_import', 'Import CSV articles')
      await loadArticles(articleSearch)
    } catch (err) {
      pushToast('error', `Import CSV échoué: ${err.message}`)
      addLog('article_error', `Import CSV échoué: ${err.message}`, 'error')
    }
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
    const header = 'ref,nom,prix,prix_achat,tva,stock,warehouse'
    const rows = allArticles.map(
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

  function openAdminTab() {
    if (!authedUser) {
      pushToast('error', 'Connecte-toi pour acceder a l admin.')
      return
    }
    if (!canAccessAdmin) {
      pushToast('error', 'Acces admin refuse.')
      return
    }
    const saved = getAdminPassword()
    if (!saved) {
      setAdminModal({ open: true, value: '', mode: 'set' })
      return
    }
    if (!adminUnlocked) {
      setAdminModal({ open: true, value: '', mode: 'login' })
      return
    }
    setAdminSection('overview')
    setPage('admin')
  }

  function openPanel() {
    if (!authedUser) {
      setAuthModal((prev) => ({ ...prev, open: true, mode: 'login' }))
      return
    }
    if (!canAccess('invoice_access')) {
      pushToast('error', "Ce compte n'a pas accès à la facturation.")
      return
    }
    setPage('facture')
  }

  async function logout() {
    if (!supabase) return
    await supabase.auth.signOut()
    setAuthedUser(null)
    setSettingsMenuOpen(false)
    setNotifPreviewOpen(false)
    setPage('home')
  }

  async function acceptAuthModal() {
    if (!supabase) {
      pushToast('error', 'Supabase non configurée.')
      return
    }
    const email = authModal.email.trim()
    const password = authModal.password.trim()
    if (!email || !password) return

    if (authModal.mode === 'signup') {
      const signupName = authModal.name.trim() || email.split('@')[0]
      if (DEV_DISABLE_EMAIL_CONFIRMATION) {
        try {
          await apiFetch('/auth/dev-signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name: signupName }),
          })
        } catch (err) {
          pushToast('error', err.message)
          return
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: signupName } },
        })
        if (error) {
          pushToast('error', error.message)
          return
        }
        setAuthSession(data?.session || null)
        setAuthedUser(data?.session?.user || data?.user || null)
        if (data?.session?.user) await syncProfile(data.session.user, data.session.access_token)
        pushToast('success', 'Compte créé.')
        setAuthModal({ open: false, mode: 'login', email: '', password: '', name: '' })
        if (data?.session?.user) setPage('facture')
        return
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        pushToast('error', signInError.message)
        return
      }
      setAuthSession(signInData.session)
      setAuthedUser(signInData.session.user)
      await syncProfile(signInData.session.user, signInData.session.access_token)
      pushToast('success', 'Compte créé.')
      setAuthModal({ open: false, mode: 'login', email: '', password: '', name: '' })
      setPage('facture')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      pushToast('error', error.message)
      return
    }
    setAuthSession(data.session)
    setAuthedUser(data.session.user)
    await syncProfile(data.session.user, data.session.access_token)
    setAuthModal({ open: false, mode: 'login', email: '', password: '', name: '' })
    setPage('facture')
  }

  async function syncProfile(user, accessToken = '') {
    if (!supabase || !user) {
      setUserRole('user')
      setUserPermissions(permissionsForRole('user'))
      return
    }
    const isSuperadmin =
      SUPERADMIN_EMAIL && user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      pushToast('error', error.message)
      return
    }
    if (!data) {
      const role = isSuperadmin ? 'root' : 'user'
      const { error: insErr } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        role,
      })
      if (insErr) {
        pushToast('error', insErr.message)
        return
      }
      setUserRole(role)
      setUserPermissions(permissionsForRole(role))
    } else if (isSuperadmin && data.role !== 'root') {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ role: 'root' })
        .eq('id', user.id)
      if (updErr) {
        pushToast('error', updErr.message)
        return
      }
      setUserRole('root')
      setUserPermissions(permissionsForRole('root'))
    } else {
      const role = data.role || 'user'
      setUserRole(role)
      setUserPermissions(permissionsForRole(role))
    }
    const sessionData = accessToken ? null : await supabase.auth.getSession()
    const token = accessToken || sessionData?.data?.session?.access_token || ''
    if (token) {
      try {
        const access = await apiFetchAuth('/me/access', token)
        if (access?.role) setUserRole(access.role)
        if (access?.permissions) setUserPermissions(normalizePermissions(access.permissions))
      } catch {
        // keep fallback role permissions
      }
    }
  }

  async function loadAdminUsers() {
    if (!supabase) return
    setAdminUsersLoading(true)
    setAdminUsersError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token || authSession?.access_token || ''
      if (!token) {
        throw new Error('Session manquante. Reconnecte-toi.')
      }
      const data = await apiFetchAuth('/admin/users', token)
      setAdminUsers(Array.isArray(data) ? data : [])
      setAdminUsersLoaded(true)
    } catch (err) {
      setAdminUsers([])
      setAdminUsersLoaded(true)
      setAdminUsersError(err.message)
      pushToast('error', `Utilisateurs: ${err.message}`)
    } finally {
      setAdminUsersLoading(false)
    }
  }

  async function loadAdminRoles() {
    if (!supabase) return
    setAdminRolesLoading(true)
    setAdminRolesError('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token || authSession?.access_token || ''
      if (!token) throw new Error('Session manquante. Reconnecte-toi.')
      const data = await apiFetchAuth('/admin/roles', token)
      const nextRoles = Array.isArray(data) ? data.map(normalizeRole) : []
      const merged = [...DEFAULT_ROLE_LIST]
      for (const role of nextRoles) {
        const index = merged.findIndex((r) => r.slug === role.slug)
        if (index >= 0) merged[index] = role
        else merged.push(role)
      }
      setAdminRoles(merged)
      setAdminRolesLoaded(true)
      if (editingRoleSlug) {
        const current = merged.find((r) => r.slug === editingRoleSlug)
        if (current) {
          setRoleForm({ slug: current.slug, label: current.label, permissions: current.permissions })
        }
      } else if (!roleForm.slug) {
        setRoleForm({ slug: 'visitor', label: 'Visiteur', permissions: permissionsForRole('visitor') })
      }
    } catch (err) {
      setAdminRoles(DEFAULT_ROLE_LIST)
      setAdminRolesLoaded(true)
      setAdminRolesError(err.message)
      pushToast('error', `Rôles: ${err.message}`)
    } finally {
      setAdminRolesLoading(false)
    }
  }

  async function createAdminUser() {
    if (!supabase) return
    const payload = {
      email: adminUserForm.email.trim(),
      password: adminUserForm.password.trim(),
      name: adminUserForm.name.trim(),
      role: adminUserForm.role || 'user',
    }
    if (!payload.email || !payload.password) {
      pushToast('error', 'Email et mot de passe requis.')
      return
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token || authSession?.access_token || ''
    if (!token) {
      pushToast('error', 'Session manquante. Reconnecte-toi.')
      return
    }
    try {
      await apiFetchAuth('/admin/users', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAdminUserForm({ email: '', password: '', name: '', role: 'user' })
      await loadAdminUsers()
      pushToast('success', 'Utilisateur créé.')
    } catch (err) {
      pushToast('error', `Utilisateur: ${err.message}`)
    }
  }

  async function updateUserRole(id, role) {
    if (!supabase) return
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token || authSession?.access_token || ''
    if (!token) {
      pushToast('error', 'Session manquante. Reconnecte-toi.')
      return
    }
    try {
      await apiFetchAuth(`/admin/users/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      })
      await loadAdminUsers()
      pushToast('success', 'Rôle utilisateur mis à jour.')
    } catch (err) {
      pushToast('error', `Utilisateur: ${err.message}`)
    }
  }

  const startEditRole = (role) => {
    if (!role) return
    setEditingRoleSlug(role.slug)
    setRoleForm({
      slug: role.slug,
      label: role.label || role.slug,
      permissions: normalizePermissions(role.permissions || {}),
    })
  }

  const resetRoleForm = () => {
    setEditingRoleSlug('')
    setRoleForm({
      slug: '',
      label: '',
      permissions: permissionsForRole('visitor'),
    })
  }

  async function saveRoleDefinition() {
    if (!supabase) return
    const slug = roleForm.slug.trim().toLowerCase()
    const label = roleForm.label.trim()
    if (!slug || !label) {
      pushToast('error', 'Slug et label requis.')
      return
    }
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token || authSession?.access_token || ''
    if (!token) {
      pushToast('error', 'Session manquante. Reconnecte-toi.')
      return
    }
    try {
      const method = editingRoleSlug ? 'PUT' : 'POST'
      const endpoint = editingRoleSlug ? `/admin/roles/${editingRoleSlug}` : '/admin/roles'
      await apiFetchAuth(endpoint, token, {
        method,
        body: JSON.stringify({
          slug,
          label,
          permissions: roleForm.permissions,
        }),
      })
      setEditingRoleSlug('')
      setRoleForm({
        slug: '',
        label: '',
        permissions: permissionsForRole('visitor'),
      })
      await loadAdminRoles()
      await loadAdminUsers()
      pushToast('success', 'Rôle enregistré.')
    } catch (err) {
      pushToast('error', `Rôle: ${err.message}`)
    }
  }

  async function deleteRoleDefinition(slug) {
    if (!supabase) return
    const currentSlug = String(slug || '').toLowerCase()
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token || authSession?.access_token || ''
    if (!token) {
      pushToast('error', 'Session manquante. Reconnecte-toi.')
      return
    }
    const ok = await confirmDialog('Supprimer rôle', `Supprimer le rôle ${currentSlug} ?`)
    if (!ok) return
    try {
      await apiFetchAuth(`/admin/roles/${currentSlug}`, token, { method: 'DELETE' })
      if (editingRoleSlug === currentSlug) resetRoleForm()
      await loadAdminRoles()
      await loadAdminUsers()
      pushToast('success', 'Rôle supprimé.')
    } catch (err) {
      pushToast('error', `Rôle: ${err.message}`)
    }
  }

  function acceptAdminModal() {
    const value = adminModal.value.trim()
    if (!value) return
    const current = readStore(dbKeys.settings, {})
    if (adminModal.mode === 'set') {
      writeStore(dbKeys.settings, { ...current, admin_password: value })
      setAdminUnlocked(true)
      setAdminModal({ open: false, value: '', mode: 'login' })
      setPage('admin')
      pushToast('success', 'Mot de passe admin défini.')
      return
    }
    const saved = current.admin_password || ''
    if (value !== saved) {
      pushToast('error', 'Mot de passe admin incorrect.')
      return
    }
    setAdminUnlocked(true)
    setAdminModal({ open: false, value: '', mode: 'login' })
    setPage('admin')
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

  useEffect(() => {
    if (page !== 'admin' || !adminUnlocked) return
    refreshDbHealth()
    loadAdminEnv()
    if (canAccess('role_manage')) loadAdminRoles()
    if (canAccess('user_manage')) loadAdminUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, adminUnlocked, userPermissions, canAccess])

  useEffect(() => {
    if (page !== 'admin') return
    if (!adminTabs.some((tab) => tab.key === adminSection)) {
      setAdminSection('overview')
    }
  }, [page, adminSection, adminTabs])

  useEffect(() => {
    if (page === 'home') return
    const required = PAGE_PERMISSION_MAP[page] || 'invoice_access'
    if (!canAccess(required)) {
      setPage(canAccess('invoice_access') ? 'facture' : 'home')
    }
  }, [page, userPermissions, canAccess])

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
                  const entry = { id: createId(), nom }
                  try {
                    await apiFetch('/warehouses', {
                      method: 'POST',
                      body: JSON.stringify(entry),
                    })
                    addLog('warehouse_create', `Entrepôt créé: ${nom}`)
                    setWarehouseModal({ open: false, value: '' })
                    await loadWarehouses()
                  } catch (err) {
                    pushToast('error', `Entrepôt non enregistré: ${err.message}`)
                    addLog('warehouse_error', `Entrepôt création échouée: ${err.message}`, 'error')
                  }
                }}
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
      {adminModal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">
              {adminModal.mode === 'set' ? 'Définir mot de passe admin' : 'Accès admin'}
            </div>
            <div className="modal-body">
              <label>Mot de passe</label>
              <input
                type="password"
                value={adminModal.value}
                onChange={(e) =>
                  setAdminModal((prev) => ({ ...prev, value: e.target.value }))
                }
                placeholder="Mot de passe"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setAdminModal({ open: false, value: '', mode: 'login' })}>
                Annuler
              </button>
              <button className="primary" onClick={acceptAdminModal}>
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
      {authModal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">
              {authModal.mode === 'signup' ? 'Créer un compte' : 'Connexion'}
            </div>
            <div className="modal-body">
              {authModal.mode === 'signup' && (
                <>
                  <label>Nom</label>
                  <input
                    value={authModal.name}
                    onChange={(e) =>
                      setAuthModal((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nom"
                  />
                </>
              )}
              <label>Email</label>
              <input
                type="email"
                value={authModal.email}
                onChange={(e) =>
                  setAuthModal((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@domaine.com"
              />
              <label>Mot de passe</label>
              <input
                type="password"
                value={authModal.password}
                onChange={(e) =>
                  setAuthModal((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Mot de passe"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() =>
                  setAuthModal({ open: false, mode: 'login', email: '', password: '', name: '' })
                }
              >
                Annuler
              </button>
              <button className="primary" onClick={acceptAuthModal}>
                {authModal.mode === 'signup' ? 'Créer' : 'Se connecter'}
              </button>
            </div>
            <div className="modal-footer">
              {authModal.mode === 'signup' ? (
                <button
                  className="link"
                  onClick={() =>
                    setAuthModal((prev) => ({ ...prev, mode: 'login' }))
                  }
                >
                  Déjà un compte ? Se connecter
                </button>
              ) : (
                <button
                  className="link"
                  onClick={() =>
                    setAuthModal((prev) => ({ ...prev, mode: 'signup' }))
                  }
                >
                  Pas de compte ? Créer un compte
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div
        className="toast-stack"
        style={{
          top: uiPrefs.toastAnchor.startsWith('top') ? `${uiPrefs.toastOffsetY}px` : 'auto',
          bottom: uiPrefs.toastAnchor.startsWith('bottom') ? `${uiPrefs.toastOffsetY}px` : 'auto',
          left: uiPrefs.toastAnchor.endsWith('left') ? `${uiPrefs.toastOffsetX}px` : 'auto',
          right: uiPrefs.toastAnchor.endsWith('right') ? `${uiPrefs.toastOffsetX}px` : 'auto',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type || 'info'}`}>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => removeToast(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
      {notifPreviewOpen && (
        <div className="notif-preview-layer" onClick={() => setNotifPreviewOpen(false)}>
          <div className="notif-preview-window" onClick={(e) => e.stopPropagation()}>
            <div className="notif-preview-head">
              <strong>{t('settings_preview')}</strong>
              <button className="ghost" onClick={() => setNotifPreviewOpen(false)}>
                ×
              </button>
            </div>
            <div
              className="toast-stack toast-preview-stack"
              style={{
                top: uiPrefs.toastAnchor.startsWith('top') ? `${uiPrefs.toastOffsetY}px` : 'auto',
                bottom: uiPrefs.toastAnchor.startsWith('bottom') ? `${uiPrefs.toastOffsetY}px` : 'auto',
                left: uiPrefs.toastAnchor.endsWith('left') ? `${uiPrefs.toastOffsetX}px` : 'auto',
                right: uiPrefs.toastAnchor.endsWith('right') ? `${uiPrefs.toastOffsetX}px` : 'auto',
              }}
            >
              <div className="toast success">
                <div className="toast-message">
                  {uiPrefs.language === 'fr'
                    ? 'Aperçu des notifications'
                    : uiPrefs.language === 'en'
                    ? 'Notification preview'
                    : uiPrefs.language === 'es'
                    ? 'Vista previa de notificaciones'
                    : 'Anteprima notifiche'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="topbar">
        <div
          className="brand"
          role="button"
          tabIndex={0}
          onClick={() => setPage('home')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setPage('home')
          }}
        >
          {t('brand')}
        </div>
        {page === 'home' ? (
          <nav className="home-tabs">
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Prix</a>
            <a href="#security">Sécurité</a>
            <a href="#faq">FAQ</a>
          </nav>
        ) : (
          <nav className="tabs">
            {[
              canAccess('invoice_access') && 'facture',
              canAccess('client_access') && 'clients',
              canAccess('article_access') && 'articles',
              canAccess('info_access') && 'infos',
              canAccess('logs_access') && 'logs',
              canAccessAdmin && 'admin',
            ]
              .filter(Boolean)
              .map((p) => (
              <button
                key={p}
                className={`tab ${page === p ? 'active' : ''}`}
                onClick={() => (p === 'admin' ? openAdminTab() : setPage(p))}
              >
                {p === 'facture'
                  ? t('nav_invoice')
                  : p === 'clients'
                  ? t('nav_clients')
                  : p === 'articles'
                  ? t('nav_articles')
                  : p === 'infos'
                  ? t('nav_infos')
                  : p === 'logs'
                  ? t('nav_logs')
                  : t('nav_admin')}
                {p === 'logs' && notifications.filter((n) => !n.read).length > 0 && (
                  <span className="tab-badge">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                )}
              </button>
              ))}
          </nav>
        )}
        <div className="topbar-actions">
          {page === 'home' && (
            <>
              <button className="ghost" onClick={() => setAuthModal((prev) => ({ ...prev, open: true, mode: 'login' }))}>
                {t('login')}
              </button>
              <button className="primary" onClick={() => setAuthModal((prev) => ({ ...prev, open: true, mode: 'signup' }))}>
                {t('signup')}
              </button>
            </>
          )}
          {page !== 'home' && authedUser && (
            <>
              <button className="ghost" onClick={logout}>
                {t('logout')}
              </button>
              <div className="topbar-settings" ref={settingsMenuRef}>
                <button
                  className="ghost settings-trigger"
                  onClick={() => setSettingsMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={settingsMenuOpen}
                  title={t('settings')}
                >
                  ⚙
                </button>
                {settingsMenuOpen && (
                  <div className="settings-popover">
                    <div className="settings-popover-head">
                      <strong>{t('settings_title')}</strong>
                      <button className="ghost" onClick={() => setSettingsMenuOpen(false)}>
                        ×
                      </button>
                    </div>
                    <label>{t('settings_language')}</label>
                    <CustomSelect
                      value={uiPrefs.language}
                      onChange={(value) => setUiPrefs((prev) => ({ ...prev, language: value }))}
                      options={UI_LANGUAGE_OPTIONS}
                    />
                    <label>{t('settings_theme')}</label>
                    <CustomSelect
                      value={uiPrefs.theme}
                      onChange={(value) => setUiPrefs((prev) => ({ ...prev, theme: value }))}
                      options={UI_THEME_OPTIONS}
                    />
                    <label className="check-line">
                      <input
                        type="checkbox"
                        checked={uiPrefs.keepSessionOnReload}
                        onChange={(e) =>
                          setUiPrefs((prev) => ({
                            ...prev,
                            keepSessionOnReload: e.target.checked,
                          }))
                        }
                      />
                      <span>{t('settings_session')}</span>
                    </label>
                    <div className="settings-divider"></div>
                    <label>{t('settings_notifications')}</label>
                    <div className="settings-grid-2">
                      <div className="field compact">
                        <label>{t('settings_anchor')}</label>
                        <CustomSelect
                          value={uiPrefs.toastAnchor}
                          onChange={(value) =>
                            setUiPrefs((prev) => ({ ...prev, toastAnchor: value }))
                          }
                          options={[
                            { value: 'top-right', label: 'Top right' },
                            { value: 'top-left', label: 'Top left' },
                            { value: 'bottom-right', label: 'Bottom right' },
                            { value: 'bottom-left', label: 'Bottom left' },
                          ]}
                        />
                      </div>
                      <div className="field compact">
                        <label>{t('settings_offset_x')}</label>
                        <input
                          type="number"
                          value={uiPrefs.toastOffsetX}
                          onChange={(e) =>
                            setUiPrefs((prev) => ({ ...prev, toastOffsetX: e.target.value }))
                          }
                        />
                      </div>
                      <div className="field compact">
                        <label>{t('settings_offset_y')}</label>
                        <input
                          type="number"
                          value={uiPrefs.toastOffsetY}
                          onChange={(e) =>
                            setUiPrefs((prev) => ({ ...prev, toastOffsetY: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="btn-row">
                      <button className="ghost" onClick={() => setNotifPreviewOpen((prev) => !prev)}>
                        {t('settings_preview')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main className={`content ${page === 'home' ? 'home-page' : ''}`}>
        {page === 'home' && (
          <section className="page active">
            <div className="hero">
              <div className="hero-left">
                <div className="hero-eyebrow">{t('home_eyebrow')}</div>
                <h1 className="hero-title">{t('home_title')}</h1>
                <p className="hero-subtitle">
                  {t('home_subtitle')}
                </p>
                <div className="hero-cta">
                  <button className="primary" onClick={openPanel}>
                    {t('home_open_panel')}
                  </button>
                  <button
                    className="ghost"
                    onClick={() =>
                      setAuthModal((prev) => ({ ...prev, open: true, mode: 'signup' }))
                    }
                  >
                    {t('home_create_account')}
                  </button>
                </div>
                <div className="hero-highlights">
                  <div className="highlight">
                    <div className="highlight-value">{t('home_highlight_1_value')}</div>
                    <div className="highlight-label">{t('home_highlight_1_label')}</div>
                  </div>
                  <div className="highlight">
                    <div className="highlight-value">{t('home_highlight_2_value')}</div>
                    <div className="highlight-label">{t('home_highlight_2_label')}</div>
                  </div>
                  <div className="highlight">
                    <div className="highlight-value">{t('home_highlight_3_value')}</div>
                    <div className="highlight-label">{t('home_highlight_3_label')}</div>
                  </div>
                </div>
              </div>
              <div className="hero-right">
                <div className="hero-surface">
                  <div className="hero-surface-header">
                    <div className="surface-dot"></div>
                    <div className="surface-dot"></div>
                    <div className="surface-dot"></div>
                  </div>
                  <div className="hero-surface-body">
                    <div className="surface-metric">
                      <div className="surface-label">Factures ce mois</div>
                      <div className="surface-value">128</div>
                    </div>
                    <div className="surface-metric">
                      <div className="surface-label">Encaissements</div>
                      <div className="surface-value">48 240 €</div>
                    </div>
                    <div className="surface-metric">
                      <div className="surface-label">Stocks critiques</div>
                      <div className="surface-value warn">7</div>
                    </div>
                    <div className="surface-timeline">
                      <div className="surface-event">
                        <span className="dot ok"></span>
                        Facture FACT-20260321-003 exportée
                      </div>
                      <div className="surface-event">
                        <span className="dot warn"></span>
                        Alerte stock: REF-8801
                      </div>
                      <div className="surface-event">
                        <span className="dot"></span>
                        Nouveau client: SARL Horizon
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hero-badge">
                  <div className="badge-title">Accès rapide</div>
                  <div className="badge-text">Panel prêt en moins de 2 minutes.</div>
                </div>
              </div>
            </div>

            <div id="features" className="home-section">
              <div className="home-section-title">Conçu pour le quotidien</div>
              <div className="home-grid">
                <div className="home-card">
                  <div className="home-card-title">Factures propres</div>
                  <div className="home-card-text">
                    Modèles clairs, numérotation automatique, export PDF/DOC.
                  </div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Stocks en direct</div>
                  <div className="home-card-text">
                    Seuils d'alerte, historiques et déstockage intégré.
                  </div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Clients suivis</div>
                  <div className="home-card-text">
                    Historique, factures liées et accès rapide aux contacts.
                  </div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Multi-entrepôts</div>
                  <div className="home-card-text">
                    Répartition des stocks par site et filtre rapide.
                  </div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Exports & CSV</div>
                  <div className="home-card-text">
                    Import/export rapide pour articles et journaux.
                  </div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Logs & audit</div>
                  <div className="home-card-text">
                    Traçabilité pour chaque action importante.
                  </div>
                </div>
              </div>
            </div>

            <div className="home-split">
              <div className="home-split-card">
                <div className="home-section-title">Process simple</div>
                <div className="steps">
                  <div className="step">
                    <div className="step-index">01</div>
                    <div>
                      <div className="step-title">Créez votre compte</div>
                      <div className="step-text">Accès sécurisé en quelques secondes.</div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-index">02</div>
                    <div>
                      <div className="step-title">Renseignez vos articles</div>
                      <div className="step-text">Import CSV ou création manuelle.</div>
                    </div>
                  </div>
                  <div className="step">
                    <div className="step-index">03</div>
                    <div>
                      <div className="step-title">Facturez en 2 minutes</div>
                      <div className="step-text">Export PDF, suivi, archives.</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="home-split-card">
                <div className="home-section-title">Pourquoi ça marche</div>
                <div className="quote">
                  «On a enfin un outil lisible, sans menus inutiles. L’équipe va plus vite
                  et on suit mieux les stocks.»
                </div>
                <div className="quote-author">— Lina, gérante boutique</div>
              </div>
            </div>

            <div id="pricing" className="home-section">
              <div className="home-section-title">Prix</div>
              <div className="home-grid pricing-grid">
                <div className="home-card">
                  <div className="home-card-title">Starter</div>
                  <div className="home-card-price">0€/mois</div>
                  <div className="home-card-text">Factures illimitées, 1 utilisateur.</div>
                  <button className="ghost">Démarrer</button>
                </div>
                <div className="home-card home-card-highlight">
                  <div className="home-card-title">Pro</div>
                  <div className="home-card-price">19€/mois</div>
                  <div className="home-card-text">Multi-entrepôts, exports avancés, support.</div>
                  <button className="primary">Choisir Pro</button>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Entreprise</div>
                  <div className="home-card-price">Sur devis</div>
                  <div className="home-card-text">Déploiement sur mesure et SLA.</div>
                  <button className="ghost">Nous contacter</button>
                </div>
              </div>
            </div>

            <div id="security" className="home-section">
              <div className="home-section-title">Sécurité & fiabilité</div>
              <div className="home-grid">
                <div className="home-card">
                  <div className="home-card-title">Chiffrement</div>
                  <div className="home-card-text">Données protégées en transit et au repos.</div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Accès contrôlé</div>
                  <div className="home-card-text">Accès par compte et contrôles d’usage.</div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Sauvegardes</div>
                  <div className="home-card-text">Backups automatiques et restauration rapide.</div>
                </div>
              </div>
            </div>

            <div id="faq" className="home-section">
              <div className="home-section-title">FAQ</div>
              <div className="home-grid">
                <div className="home-card">
                  <div className="home-card-title">Puis-je exporter mes factures ?</div>
                  <div className="home-card-text">Oui, en PDF ou DOC selon vos besoins.</div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Mes données sont-elles privées ?</div>
                  <div className="home-card-text">Oui, tout est isolé par compte et sécurisé.</div>
                </div>
                <div className="home-card">
                  <div className="home-card-title">Le support est-il inclus ?</div>
                  <div className="home-card-text">Support standard inclus, premium en Pro.</div>
                </div>
              </div>
            </div>

            <div className="home-cta">
              <div>
                <div className="home-cta-title">Prêt à simplifier votre gestion ?</div>
                <div className="home-cta-text">
                  Accédez au panel et commencez ? facturer en quelques minutes.
                </div>
              </div>
              <button className="primary" onClick={openPanel}>
                Accéder au panel
              </button>
            </div>
          </section>
        )}
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
                    <label>Date Échéance</label>
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

        {page === 'admin' && adminUnlocked && (
          <section className="page active admin-page">
            <div className="admin-hero card">
              <div>
                <div className="admin-kicker">Console admin</div>
                <h2>Administration</h2>
                <div className="hint">
                  Chaque bloc admin a sa page interne. Plus simple, plus propre, plus lisible.
                </div>
              </div>
              <div className="admin-stats">
                <div className="admin-stat">
                  <span>Utilisateurs</span>
                  <strong>{adminUsers.length}</strong>
                </div>
                <div className="admin-stat">
                  <span>Base</span>
                  <strong className={dbHealth.db ? 'ok-text' : 'bad-text'}>
                    {dbHealth.db ? 'Connectée' : 'Non connectée'}
                  </strong>
                </div>
                <div className="admin-stat">
                  <span>Mode dev</span>
                  <strong>{DEV_DISABLE_EMAIL_CONFIRMATION ? 'Sans email' : 'Normal'}</strong>
                </div>
              </div>
            </div>

            <div className="admin-subnav card">
              {adminTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={adminSection === tab.key ? 'active' : ''}
                  onClick={() => setAdminSection(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {adminSection === 'overview' && (
              <div className="admin-overview-grid">
                <div className="card admin-card">
                  <div className="section-head">
                    <div>
                      <h3>Vue d’ensemble</h3>
                      <div className="hint">
                        Choisis une section pour gérer les réglages, les rôles ou les utilisateurs.
                      </div>
                    </div>
                  </div>
                  <div className="admin-overview-grid-inner">
                    <div className="overview-tile">
                      <span>Réglages</span>
                      <strong>Connexion, env, mot de passe admin</strong>
                    </div>
                    <div className="overview-tile">
                      <span>Rôles</span>
                      <strong>Création et permissions enregistrées en base</strong>
                    </div>
                    <div className="overview-tile">
                      <span>Utilisateurs</span>
                      <strong>Création, lecture et changement de rôle</strong>
                    </div>
                  </div>
                </div>
                <div className="card admin-card">
                  <div className="section-head">
                    <div>
                      <h3>Raccourcis</h3>
                      <div className="hint">Accès direct aux pages internes de l’admin.</div>
                    </div>
                  </div>
                  <div className="admin-quick-actions">
                    {canAccess('admin_access') && (
                      <button className="ghost" onClick={() => setAdminSection('settings')}>
                        Ouvrir les réglages
                      </button>
                    )}
                    {canAccess('role_manage') && (
                      <button className="ghost" onClick={() => setAdminSection('roles')}>
                        Gérer les rôles
                      </button>
                    )}
                    {canAccess('user_manage') && (
                      <button className="ghost" onClick={() => setAdminSection('users')}>
                        Gérer les utilisateurs
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'settings' && canAccess('admin_access') && (
              <div className="admin-section-grid">
                <div className="card admin-card">
                  <div className="section-head">
                    <div>
                      <h3>État base de données</h3>
                      <div className="hint">Vérifie la connexion Supabase et la santé globale.</div>
                    </div>
                    <button className="ghost" onClick={refreshDbHealth}>
                      Tester connexion
                    </button>
                  </div>
                  <div className={`status ${dbHealth.db ? 'ok' : 'bad'}`}>
                    {dbHealth.db ? 'Connectée' : 'Non connectée'}
                  </div>
                  {dbHealth.error && <div className="hint">{dbHealth.error}</div>}
                </div>

                <div className="card admin-card">
                  <div className="section-head">
                    <div>
                      <h3>Configuration .env</h3>
                      <div className="hint">Les changements demandent un redémarrage du serveur.</div>
                    </div>
                  </div>
                  <label>SUPABASE_URL</label>
                  <input
                    value={adminEnv.SUPABASE_URL}
                    onChange={(e) => setAdminEnv({ ...adminEnv, SUPABASE_URL: e.target.value })}
                  />
                  <label>SUPABASE_SERVICE_ROLE_KEY</label>
                  <input
                    type="password"
                    value={adminEnv.SUPABASE_SERVICE_ROLE_KEY}
                    onChange={(e) =>
                      setAdminEnv({
                        ...adminEnv,
                        SUPABASE_SERVICE_ROLE_KEY: e.target.value,
                      })
                    }
                  />
                  <div className="btn-row">
                    <button className="primary" onClick={saveAdminEnv}>
                      Enregistrer
                    </button>
                  </div>
                </div>

                <div className="card admin-card">
                  <div className="section-head">
                    <div>
                      <h3>Mot de passe admin</h3>
                      <div className="hint">Stocké dans les données locales du site.</div>
                    </div>
                  </div>
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                  />
                  <div className="btn-row">
                    <button
                      className="primary"
                      onClick={() => {
                        const next = adminPassInput.trim()
                        if (!next) return
                        const current = readStore(dbKeys.settings, {})
                        writeStore(dbKeys.settings, { ...current, admin_password: next })
                        setAdminPassInput('')
                        pushToast('success', 'Mot de passe admin mis à jour.')
                      }}
                    >
                      Mettre à jour
                    </button>
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'roles' && canAccess('role_manage') && (
              <div className="admin-section-grid">
                <div className="card admin-card">
                  <div className="section-head">
                    <div>
                      <h3>Rôles & permissions</h3>
                      <div className="hint">
                        Les rôles sont stockés dans la base avec leurs permissions.
                      </div>
                    </div>
                    <button className="ghost" onClick={loadAdminRoles}>
                      Rafraîchir
                    </button>
                  </div>

                  <div className="admin-role-editor">
                    <div className="row-2">
                      <div className="field">
                        <label>Slug</label>
                        <input
                          value={roleForm.slug}
                          onChange={(e) =>
                            setRoleForm((prev) => ({ ...prev, slug: e.target.value }))
                          }
                          placeholder="visitor"
                          disabled={!!editingRoleSlug}
                        />
                      </div>
                      <div className="field">
                        <label>Label</label>
                        <input
                          value={roleForm.label}
                          onChange={(e) =>
                            setRoleForm((prev) => ({ ...prev, label: e.target.value }))
                          }
                          placeholder="Visiteur"
                        />
                      </div>
                    </div>

                    <div className="perm-grid">
                      {ROLE_PERMISSION_DEFS.map((perm) => (
                        <label className="perm-item" key={perm.key}>
                          <input
                            type="checkbox"
                            checked={!!roleForm.permissions?.[perm.key]}
                            onChange={(e) =>
                              setRoleForm((prev) => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [perm.key]: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span className="perm-box" aria-hidden="true"></span>
                          <span className="perm-copy">
                            <span className="perm-title">{perm.label}</span>
                            <span className="perm-hint">{perm.hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="btn-row">
                      <button className="primary" onClick={saveRoleDefinition}>
                        {editingRoleSlug ? 'Mettre à jour le rôle' : 'Créer le rôle'}
                      </button>
                      <button className="ghost" onClick={resetRoleForm}>
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  <div className="user-list-meta">
                    <span>
                      {adminRolesLoaded ? `${adminRoles.length} rôle(s)` : 'Liste non chargée'}
                    </span>
                    {adminRolesLoading && <span>Chargement...</span>}
                  </div>
                  {adminRolesError && <div className="error-box">{adminRolesError}</div>}

                  <div className="roles-list">
                    {adminRoles.map((role) => (
                      <div
                        className={`role-card ${editingRoleSlug === role.slug ? 'active' : ''}`}
                        key={role.slug}
                      >
                        <div className="role-head">
                          <div>
                            <div className="role-label">{role.label}</div>
                            <div className="role-slug">{role.slug}</div>
                          </div>
                          <div className="role-actions">
                            <button className="ghost" onClick={() => startEditRole(role)}>
                              Modifier
                            </button>
                            {!['visitor', 'user', 'admin', 'root'].includes(role.slug) && (
                              <button className="danger" onClick={() => deleteRoleDefinition(role.slug)}>
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="role-perms">
                          {ROLE_PERMISSION_DEFS.filter((perm) => role.permissions?.[perm.key]).map(
                            (perm) => (
                              <span key={perm.key} className="role-chip">
                                {perm.label}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'users' && canAccess('user_manage') && (
              <div className="admin-section-grid">
                <div className="card admin-card admin-users-card">
                  <div className="section-head">
                    <div>
                      <h3>Utilisateurs</h3>
                      <div className="hint">
                        Lecture depuis la base de données (`profiles`) avec fallback sur Auth.
                      </div>
                    </div>
                    <button className="ghost" onClick={loadAdminUsers}>
                      Rafraîchir
                    </button>
                  </div>

                  <div className="row-2">
                    <div className="field">
                      <label>Email</label>
                      <input
                        value={adminUserForm.email}
                        onChange={(e) =>
                          setAdminUserForm({ ...adminUserForm, email: e.target.value })
                        }
                        placeholder="email@domaine.com"
                      />
                    </div>
                    <div className="field">
                      <label>Mot de passe</label>
                      <input
                        type="password"
                        value={adminUserForm.password}
                        onChange={(e) =>
                          setAdminUserForm({ ...adminUserForm, password: e.target.value })
                        }
                        placeholder="Mot de passe"
                      />
                    </div>
                  </div>
                  <div className="row-2">
                    <div className="field">
                      <label>Nom</label>
                      <input
                        value={adminUserForm.name}
                        onChange={(e) =>
                          setAdminUserForm({ ...adminUserForm, name: e.target.value })
                        }
                        placeholder="Nom"
                      />
                    </div>
                    <div className="field">
                      <label>Rôle</label>
                      <CustomSelect
                        value={adminUserForm.role}
                        onChange={(value) => setAdminUserForm({ ...adminUserForm, role: value })}
                        options={adminRoles.map((role) => ({ value: role.slug, label: role.label }))}
                      />
                    </div>
                  </div>

                  <div className="btn-row">
                    <button className="primary" onClick={createAdminUser}>
                      Créer utilisateur
                    </button>
                  </div>

                  <div className="user-list-meta">
                    <span>
                      {adminUsersLoaded ? `${adminUsers.length} résultat(s)` : 'Liste non chargée'}
                    </span>
                    {adminUsersLoading && <span>Chargement...</span>}
                  </div>
                  {adminUsersError && <div className="error-box">{adminUsersError}</div>}

                  <div className="list user-list">
                    {!adminUsersLoading && adminUsersLoaded && adminUsers.length === 0 && (
                      <div className="item">Aucun utilisateur trouvé dans la base.</div>
                    )}
                    {adminUsers.map((u) => (
                      <div className="user-row" key={u.id}>
                        <div className="user-main">
                          <div className="user-email">{u.email}</div>
                          <div className="user-name">{u.name || '-'}</div>
                          <div className="user-meta">ID: {u.id}</div>
                        </div>
                        <div className="user-role">
                          <CustomSelect
                            value={u.role}
                            onChange={(value) => updateUserRole(u.id, value)}
                            options={adminRoles.map((role) => ({
                              value: role.slug,
                              label: role.label,
                            }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
