import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { pool } from './db.js';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

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

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_clients (
      id VARCHAR(64) PRIMARY KEY,
      societe VARCHAR(150),
      nom_prenom VARCHAR(150),
      email VARCHAR(120),
      telephone VARCHAR(30),
      adresse TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_articles (
      id VARCHAR(64) PRIMARY KEY,
      ref VARCHAR(50),
      nom VARCHAR(150),
      prix DECIMAL(12,2) DEFAULT 0,
      prix_achat DECIMAL(12,2) DEFAULT 0,
      tva DECIMAL(5,2) DEFAULT 0,
      stock DECIMAL(12,2) DEFAULT 0,
      warehouse VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_warehouses (
      id VARCHAR(64) PRIMARY KEY,
      nom VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_infos (
      id VARCHAR(64) PRIMARY KEY,
      nom VARCHAR(150),
      adresse TEXT,
      telephone VARCHAR(30),
      email VARCHAR(120),
      siret VARCHAR(30),
      tva_intracom VARCHAR(40),
      site_web VARCHAR(120),
      iban VARCHAR(50),
      bic VARCHAR(20),
      conditions_paiement TEXT,
      signature_path LONGTEXT,
      stamp_path LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    res.json({ status: 'ok', db: rows?.[0]?.ok === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM app_clients ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { id, societe, nom_prenom, email, telephone, adresse, notes } = req.body || {};
    await pool.query(
      `INSERT INTO app_clients (id, societe, nom_prenom, email, telephone, adresse, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, societe, nom_prenom, email, telephone, adresse, notes]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { societe, nom_prenom, email, telephone, adresse, notes } = req.body || {};
    await pool.query(
      `UPDATE app_clients
       SET societe=?, nom_prenom=?, email=?, telephone=?, adresse=?, notes=?
       WHERE id=?`,
      [societe, nom_prenom, email, telephone, adresse, notes, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_clients WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM app_articles ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { id, ref, nom, prix, prix_achat, tva, stock, warehouse } = req.body || {};
    await pool.query(
      `INSERT INTO app_articles (id, ref, nom, prix, prix_achat, tva, stock, warehouse)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ref, nom, prix, prix_achat, tva, stock, warehouse]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { ref, nom, prix, prix_achat, tva, stock, warehouse } = req.body || {};
    await pool.query(
      `UPDATE app_articles
       SET ref=?, nom=?, prix=?, prix_achat=?, tva=?, stock=?, warehouse=?
       WHERE id=?`,
      [ref, nom, prix, prix_achat, tva, stock, warehouse, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_articles WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/warehouses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM app_warehouses ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { id, nom } = req.body || {};
    await pool.query(
      `INSERT INTO app_warehouses (id, nom) VALUES (?, ?)`,
      [id, nom]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_warehouses WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/infos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM app_infos ORDER BY created_at DESC');
    res.json(rows);
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
    await pool.query(
      `INSERT INTO app_infos
       (id, nom, adresse, telephone, email, siret, tva_intracom, site_web, iban, bic, conditions_paiement, signature_path, stamp_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nom, adresse, telephone, email, siret, tva_intracom, site_web, iban, bic, conditions_paiement, signature_path, stamp_path]
    );
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
    await pool.query(
      `UPDATE app_infos
       SET nom=?, adresse=?, telephone=?, email=?, siret=?, tva_intracom=?, site_web=?, iban=?, bic=?, conditions_paiement=?, signature_path=?, stamp_path=?
       WHERE id=?`,
      [nom, adresse, telephone, email, siret, tva_intracom, site_web, iban, bic, conditions_paiement, signature_path, stamp_path, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/infos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_infos WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/env', async (req, res) => {
  try {
    const { data } = await readEnvFile();
    res.json({
      DB_HOST: data.DB_HOST || '',
      DB_PORT: data.DB_PORT || '',
      DB_NAME: data.DB_NAME || '',
      DB_USER: data.DB_USER || '',
      DB_PASSWORD: data.DB_PASSWORD || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/env', async (req, res) => {
  try {
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = req.body || {};
    await writeEnvFile({ DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD });
    res.json({ ok: true, restartRequired: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to init schema', err);
    process.exit(1);
  });
