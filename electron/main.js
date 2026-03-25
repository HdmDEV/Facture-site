import { app, BrowserWindow } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const isDev = !app.isPackaged
const frontendUrl = 'http://127.0.0.1:5173'
const backendUrl = 'http://127.0.0.1:3001/api/health'

let mainWindow = null
let frontendProcess = null
let backendProcess = null

function spawnProcess(command, args) {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: { ...process.env },
    shell: true,
    stdio: 'inherit',
  })
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.log(`[electron] ${command} ${args.join(' ')} exited with code ${code}`)
    }
  })
  return child
}

async function waitForUrl(url, timeoutMs = 60000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.ok) return true
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timeout waiting for ${url}`)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#0b1220',
    title: 'Facture Site',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (isDev) {
    mainWindow.loadURL(frontendUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    return
  }

  const distPath = path.resolve(rootDir, 'dist', 'index.html')
  if (existsSync(distPath)) {
    mainWindow.loadFile(distPath)
  } else {
    mainWindow.loadURL(frontendUrl)
  }
}

async function startLocalServices() {
  backendProcess = spawnProcess('node', ['server/index.js'])
  if (isDev) {
    frontendProcess = spawnProcess('npm', ['run', 'dev'])
    await waitForUrl(backendUrl)
    await waitForUrl(frontendUrl)
  } else {
    await waitForUrl(backendUrl)
  }
}

function cleanup() {
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill()
  }
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill()
  }
}

app.whenReady().then(async () => {
  try {
    await startLocalServices()
  } catch (err) {
    console.error('[electron] unable to start local services:', err)
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', cleanup)
app.on('window-all-closed', () => {
  cleanup()
  if (process.platform !== 'darwin') app.quit()
})
