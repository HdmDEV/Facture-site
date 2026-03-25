import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_URL,
  SUPERADMIN_EMAIL,
  VITE_SUPERADMIN_EMAIL,
} = process.env;
const effectiveSupabaseUrl = SUPABASE_URL || VITE_SUPABASE_URL || '';
const effectiveSuperadminEmail = (SUPERADMIN_EMAIL || VITE_SUPERADMIN_EMAIL || '').toLowerCase();
const DEV_DISABLE_EMAIL_CONFIRMATION = process.env.DEV_DISABLE_EMAIL_CONFIRMATION === 'true';
const ROLE_PERMISSION_KEYS = [
  'invoice_access',
  'client_access',
  'article_access',
  'info_access',
  'logs_access',
  'admin_access',
  'user_manage',
  'role_manage',
];
const BUILTIN_ROLES = {
  visitor: {
    label: 'Visiteur',
    permissions: {
      invoice_access: true,
      client_access: false,
      article_access: false,
      info_access: false,
      logs_access: false,
      admin_access: false,
      user_manage: false,
      role_manage: false,
    },
  },
  user: {
    label: 'Utilisateur',
    permissions: {
      invoice_access: true,
      client_access: true,
      article_access: true,
      info_access: true,
      logs_access: false,
      admin_access: false,
      user_manage: false,
      role_manage: false,
    },
  },
  admin: {
    label: 'Admin',
    permissions: {
      invoice_access: true,
      client_access: true,
      article_access: true,
      info_access: true,
      logs_access: true,
      admin_access: true,
      user_manage: true,
      role_manage: true,
    },
  },
  root: {
    label: 'Root',
    permissions: {
      invoice_access: true,
      client_access: true,
      article_access: true,
      info_access: true,
      logs_access: true,
      admin_access: true,
      user_manage: true,
      role_manage: true,
    },
  },
};

const normalizePermissions = (permissions = {}) => {
  const out = {};
  for (const key of ROLE_PERMISSION_KEYS) {
    out[key] = !!permissions[key];
  }
  return out;
};

const defaultRoleDefinition = (slug) => {
  const key = String(slug || 'user').toLowerCase();
  const builtin = BUILTIN_ROLES[key] || BUILTIN_ROLES.user;
  return { slug: key, label: builtin.label, permissions: normalizePermissions(builtin.permissions) };
};

const mergeRoleDefinition = (row) => {
  if (!row?.slug) return null;
  const fallback = defaultRoleDefinition(row.slug);
  return {
    slug: String(row.slug).toLowerCase(),
    label: row.label || fallback.label,
    permissions: normalizePermissions({ ...fallback.permissions, ...(row.permissions || {}) }),
    created_at: row.created_at || null,
  };
};

const isBuiltinRole = (slug) => Object.prototype.hasOwnProperty.call(BUILTIN_ROLES, String(slug || '').toLowerCase());

const supabase =
  effectiveSupabaseUrl && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(effectiveSupabaseUrl, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const resolveEnvPath = async () => {
  const candidates = [
    path.join(process.cwd(), 'server', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // continue
    }
  }
  return candidates[0];
};

const readEnvFile = async () => {
  const envPath = await resolveEnvPath();
  try {
    const content = await fs.readFile(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    const data = {};
    for (const line of lines) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      data[key] = value;
    }
    return { envPath, data };
  } catch {
    return { envPath, data: {} };
  }
};

const writeEnvFile = async (patch) => {
  const { envPath, data } = await readEnvFile();
  const next = { ...data, ...patch };
  const lines = Object.entries(next).map(([k, v]) => `${k}=${v}`);
  await fs.writeFile(envPath, lines.join('\n'), 'utf8');
  return next;
};

const seedDefaultRoles = async () => {
  const sb = assertSupabase();
  const rows = Object.entries(BUILTIN_ROLES).map(([slug, def]) => ({
    slug,
    label: def.label,
    permissions: normalizePermissions(def.permissions),
  }));
  const { error } = await sb.from('app_roles').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
};

const fetchRoles = async (sb) => {
  try {
    const { data, error } = await sb.from('app_roles').select('slug,label,permissions,created_at').order('slug');
    if (error) throw error;
    const merged = new Map(Object.entries(BUILTIN_ROLES).map(([slug, def]) => [slug, defaultRoleDefinition(slug)]));
    for (const row of data || []) {
      const mergedRow = mergeRoleDefinition(row);
      if (mergedRow) merged.set(mergedRow.slug, mergedRow);
    }
    return [...merged.values()];
  } catch (err) {
    return Object.entries(BUILTIN_ROLES).map(([slug]) => defaultRoleDefinition(slug));
  }
};

const fetchRoleDefinition = async (sb, slug) => {
  const normalized = String(slug || '').toLowerCase();
  try {
    const { data, error } = await sb
      .from('app_roles')
      .select('slug,label,permissions,created_at')
      .eq('slug', normalized)
      .maybeSingle();
    if (error) throw error;
    if (data) return mergeRoleDefinition(data);
  } catch {
    // ignore and fallback
  }
  if (BUILTIN_ROLES[normalized]) return defaultRoleDefinition(normalized);
  return null;
};

const roleExists = async (sb, slug) => {
  if (!slug) return false;
  const def = await fetchRoleDefinition(sb, slug);
  return !!def;
};

const assertSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase non configurée. Vérifie SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabase;
};

const getBearerToken = (req) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
};

const requireAdmin = async (req, permissionKey = 'admin_access') => {
  const sb = assertSupabase();
  const token = getBearerToken(req);
  if (!token) throw new Error('Token manquant.');
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr) throw userErr;
  const user = userData?.user;
  if (!user?.id) throw new Error('Utilisateur invalide.');
  const { data: profile, error: profErr } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profErr) throw profErr;
  const isSuperadmin =
    effectiveSuperadminEmail && (user.email || '').toLowerCase() === effectiveSuperadminEmail;
  const roleSlug = profile?.role || 'user';
  const role = (await fetchRoleDefinition(sb, roleSlug)) || defaultRoleDefinition(roleSlug);
  if (!isSuperadmin && !role.permissions[permissionKey]) {
    const err = new Error('Accès refusé.');
    err.statusCode = 403;
    throw err;
  }
  return { user, role: isSuperadmin ? 'root' : role.slug };
};

app.get('/api/health', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { error } = await sb
      .from('app_clients')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'ok', db: true });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { data, error } = await sb
      .from('app_clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { id, societe, nom_prenom, email, telephone, adresse, notes } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb.from('app_clients').insert({
      id,
      societe,
      nom_prenom,
      email,
      telephone,
      adresse,
      notes,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { societe, nom_prenom, email, telephone, adresse, notes } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb
      .from('app_clients')
      .update({ societe, nom_prenom, email, telephone, adresse, notes })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { error } = await sb.from('app_clients').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { data, error } = await sb
      .from('app_articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { id, ref, nom, prix, prix_achat, tva, stock, warehouse } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb.from('app_articles').insert({
      id,
      ref,
      nom,
      prix,
      prix_achat,
      tva,
      stock,
      warehouse,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { ref, nom, prix, prix_achat, tva, stock, warehouse } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb
      .from('app_articles')
      .update({ ref, nom, prix, prix_achat, tva, stock, warehouse })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { error } = await sb.from('app_articles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/warehouses', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { data, error } = await sb
      .from('app_warehouses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { id, nom } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb.from('app_warehouses').insert({ id, nom });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { error } = await sb.from('app_warehouses').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/infos', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { data, error } = await sb
      .from('app_infos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/infos', async (req, res) => {
  try {
    const {
      id,
      nom,
      adresse,
      telephone,
      email,
      siret,
      tva_intracom,
      site_web,
      iban,
      bic,
      conditions_paiement,
      signature_path,
      stamp_path,
    } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb.from('app_infos').insert({
      id,
      nom,
      adresse,
      telephone,
      email,
      siret,
      tva_intracom,
      site_web,
      iban,
      bic,
      conditions_paiement,
      signature_path,
      stamp_path,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/infos/:id', async (req, res) => {
  try {
    const {
      nom,
      adresse,
      telephone,
      email,
      siret,
      tva_intracom,
      site_web,
      iban,
      bic,
      conditions_paiement,
      signature_path,
      stamp_path,
    } = req.body || {};
    const sb = assertSupabase();
    const { error } = await sb
      .from('app_infos')
      .update({
        nom,
        adresse,
        telephone,
        email,
        siret,
        tva_intracom,
        site_web,
        iban,
        bic,
        conditions_paiement,
        signature_path,
        stamp_path,
      })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/infos/:id', async (req, res) => {
  try {
    const sb = assertSupabase();
    const { error } = await sb.from('app_infos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/env', async (req, res) => {
  try {
    await requireAdmin(req, 'admin_access');
    const { data } = await readEnvFile();
    res.json({
      SUPABASE_URL: data.SUPABASE_URL || '',
      SUPABASE_SERVICE_ROLE_KEY: data.SUPABASE_SERVICE_ROLE_KEY || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me/access', async (req, res) => {
  try {
    const sb = assertSupabase();
    const token = getBearerToken(req);
    if (!token) throw new Error('Token manquant.');
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user?.id) throw new Error('Utilisateur invalide.');
    const { data: profile, error: profErr } = await sb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profErr) throw profErr;
    const isSuperadmin =
      effectiveSuperadminEmail && (user.email || '').toLowerCase() === effectiveSuperadminEmail;
    const roleSlug = isSuperadmin ? 'root' : (profile?.role || 'user');
    const role = (await fetchRoleDefinition(sb, roleSlug)) || defaultRoleDefinition(roleSlug);
    res.json({
      role: role.slug,
      label: role.label,
      permissions: role.permissions,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/auth/dev-signup', async (req, res) => {
  try {
    if (!DEV_DISABLE_EMAIL_CONFIRMATION) {
      throw new Error('Le mode dev sans confirmation email est désactivé.');
    }
    const sb = assertSupabase();
    const { email, password, name } = req.body || {};
    if (!email || !password) throw new Error('Email et mot de passe requis.');
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || '' },
    });
    if (error) throw error;
    res.json({
      ok: true,
      id: data?.user?.id || null,
      email: data?.user?.email || email,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    await requireAdmin(req, 'user_manage');
    const sb = assertSupabase();
    let authUsers = [];
    try {
      const { data: usersData, error: listErr } = await sb.auth.admin.listUsers();
      if (listErr) throw listErr;
      authUsers = usersData?.users || [];
    } catch (err) {
      console.warn('Auth admin listUsers failed, falling back to profiles only:', err.message);
    }
    const { data: profiles, error: profErr } = await sb
      .from('profiles')
      .select('id,email,name,role,created_at');
    if (profErr) throw profErr;
    const byId = new Map((authUsers || []).map((u) => [u.id, u]));
    const byEmail = new Map(
      (authUsers || [])
        .filter((u) => u.email)
        .map((u) => [u.email.toLowerCase(), u]),
    );

    const merged = (profiles || []).map((p) => {
      const authUser = byId.get(p.id) || (p.email ? byEmail.get(p.email.toLowerCase()) : null);
      return {
        id: p.id || authUser?.id || '',
        email: p.email || authUser?.email || '',
        created_at: p.created_at || authUser?.created_at || '',
        name: p.name || authUser?.user_metadata?.name || '',
        role: p.role || 'user',
      };
    });

    for (const u of authUsers) {
      if (merged.some((row) => row.id === u.id)) continue;
      merged.push({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at || '',
        name: u.user_metadata?.name || '',
        role: 'user',
      });
    }

    merged.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    res.json(merged);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/admin/roles', async (req, res) => {
  try {
    await requireAdmin(req, 'role_manage');
    const sb = assertSupabase();
    const roles = await fetchRoles(sb);
    res.json(roles);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/admin/roles', async (req, res) => {
  try {
    await requireAdmin(req, 'role_manage');
    const sb = assertSupabase();
    const { slug, label, permissions } = req.body || {};
    const normalizedSlug = String(slug || '').trim().toLowerCase();
    if (!normalizedSlug) throw new Error('Slug requis.');
    if (!label?.trim()) throw new Error('Label requis.');
    if (!Array.isArray(permissions) && typeof permissions !== 'object') {
      throw new Error('Permissions invalides.');
    }
    const row = {
      slug: normalizedSlug,
      label: label.trim(),
      permissions: normalizePermissions(permissions || {}),
    };
    const { error } = await sb.from('app_roles').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    const saved = (await fetchRoleDefinition(sb, normalizedSlug)) || defaultRoleDefinition(normalizedSlug);
    res.json(saved);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.put('/api/admin/roles/:slug', async (req, res) => {
  try {
    await requireAdmin(req, 'role_manage');
    const sb = assertSupabase();
    const currentSlug = String(req.params.slug || '').trim().toLowerCase();
    const { label, permissions } = req.body || {};
    if (!currentSlug) throw new Error('Slug manquant.');
    const row = {
      slug: currentSlug,
      label: label?.trim() || currentSlug,
      permissions: normalizePermissions(permissions || {}),
    };
    const { error } = await sb.from('app_roles').upsert(row, { onConflict: 'slug' });
    if (error) throw error;
    const saved = (await fetchRoleDefinition(sb, currentSlug)) || defaultRoleDefinition(currentSlug);
    res.json(saved);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.delete('/api/admin/roles/:slug', async (req, res) => {
  try {
    await requireAdmin(req, 'role_manage');
    const sb = assertSupabase();
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) throw new Error('Slug manquant.');
    if (isBuiltinRole(slug)) throw new Error('Rôle système non supprimable.');
    const { error } = await sb.from('app_roles').delete().eq('slug', slug);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    await requireAdmin(req, 'user_manage');
    const sb = assertSupabase();
    const { email, password, name, role } = req.body || {};
    if (!email || !password) throw new Error('Email et mot de passe requis.');
    if (!(await roleExists(sb, role || 'user'))) throw new Error('Rôle inconnu.');
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || '' },
    });
    if (createErr) throw createErr;
    const user = created?.user;
    if (!user?.id) throw new Error('Création échouée.');
    const { error: profErr } = await sb.from('profiles').insert({
      id: user.id,
      email,
      name: name || '',
      role: role || 'user',
    });
    if (profErr) throw profErr;
    res.json({ ok: true, id: user.id });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    await requireAdmin(req, 'user_manage');
    const sb = assertSupabase();
    const { role, name } = req.body || {};
    const patch = {};
    if (role) {
      if (!(await roleExists(sb, role))) throw new Error('Rôle inconnu.');
      patch.role = role;
    }
    if (name !== undefined) patch.name = name;
    if (Object.keys(patch).length === 0) throw new Error('Aucune modification.');
    const { error } = await sb.from('profiles').update(patch).eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.put('/api/admin/env', async (req, res) => {
  try {
    await requireAdmin(req, 'admin_access');
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = req.body || {};
    await writeEnvFile({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY });
    res.json({ ok: true, restartRequired: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

if (supabase) {
  seedDefaultRoles().catch((err) => {
    console.warn('Role seed skipped:', err.message);
  });
}
