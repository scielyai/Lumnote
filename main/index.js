const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');

const INBOX_DAYS_RETAIN = 90; // 3 months

const INBOX_TEMPLATE = `# 暂存区

暂存区保存期限为 ${INBOX_DAYS_RETAIN} 天，过期将自动删除。在此记录临时想法，稍后整理到项目中。
`;

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function getDefaultKnowledgeBasePath() {
  if (process.platform === 'win32') {
    return path.join('C:', 'LumenKnowledgeBase');
  }
  return path.join(os.homedir(), 'LumenKnowledgeBase');
}

async function readConfig() {
  try {
    const raw = await fs.readFile(getConfigPath(), 'utf-8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

async function writeConfig(data) {
  const configPath = getConfigPath();
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
}

function getKnowledgeBasePath() {
  const configPath = getConfigPath();
  try {
    const raw = require('fs').readFileSync(configPath, 'utf-8');
    const data = JSON.parse(raw);
    if (data.knowledgeBasePath && typeof data.knowledgeBasePath === 'string' && data.knowledgeBasePath.trim()) {
      return path.normalize(data.knowledgeBasePath.trim());
    }
  } catch (_) {}
  return getDefaultKnowledgeBasePath();
}

async function ensureKnowledgeBase() {
  const basePath = getKnowledgeBasePath();
  try {
    await fs.access(basePath);
  } catch {
    await fs.mkdir(basePath, { recursive: true });
  }
  const projectsPath = path.join(basePath, 'Projects');
  try {
    await fs.access(projectsPath);
  } catch {
    await fs.mkdir(projectsPath, { recursive: true });
  }
  const inboxDir = path.join(basePath, 'Inbox');
  const oldInboxPath = path.join(basePath, 'Inbox.md');
  try {
    await fs.mkdir(inboxDir, { recursive: true });
  } catch (_) {}
  try {
    const stat = await fs.stat(oldInboxPath);
    if (stat.isFile()) {
      const today = new Date().toISOString().slice(0, 10);
      const todayPath = path.join(inboxDir, `${today}.md`);
      const content = await fs.readFile(oldInboxPath, 'utf-8');
      await fs.writeFile(todayPath, content, 'utf-8');
      await fs.unlink(oldInboxPath);
    }
  } catch (_) {}
  await cleanOldInbox();
  return basePath;
}

let mainWindow = null;

function getWindowIconPath() {
  const candidates = [
    path.join(__dirname, '../assets/icons/ico.png'),
    path.join(__dirname, '../ico.png'),
  ];
  for (const p of candidates) {
    if (fsSync.existsSync(p)) return p;
  }
  return undefined;
}

function createWindow() {
  const iconPath = getWindowIconPath();
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });
  mainWindow = win;
  win.removeMenu();
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  return win;
}

app.whenReady().then(async () => {
  try {
    const config = await readConfig();
    if (!config.knowledgeBasePath || !config.knowledgeBasePath.trim()) {
      const defaultPath = getDefaultKnowledgeBasePath();
      const { filePaths } = await dialog.showOpenDialog(null, {
        title: '选择知识库（笔记）存储位置',
        defaultPath: path.dirname(defaultPath),
        properties: ['openDirectory', 'createDirectory']
      });
      if (filePaths && filePaths.length > 0) {
        await writeConfig({ knowledgeBasePath: filePaths[0] });
      } else {
        await writeConfig({ knowledgeBasePath: defaultPath });
      }
    }
    await ensureKnowledgeBase();
  } catch (err) {
    dialog.showErrorBox('初始化失败', `无法创建知识库: ${err.message}`);
    app.quit();
    return;
  }
  createWindow();

  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    if (win) win.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    const win = BrowserWindow.getFocusedWindow() || mainWindow;
    return win ? win.isMaximized() : false;
  });
});

app.on('window-all-closed', () => app.quit());

ipcMain.handle('get-knowledge-base-path', () => getKnowledgeBasePath());
ipcMain.handle('get-default-knowledge-base-path', () => getDefaultKnowledgeBasePath());
ipcMain.handle('choose-knowledge-base-path', async () => {
  const current = getKnowledgeBasePath();
  const { filePaths } = await dialog.showOpenDialog(null, {
    title: '选择知识库（笔记）存储位置',
    defaultPath: path.dirname(current),
    properties: ['openDirectory', 'createDirectory']
  });
  if (!filePaths || filePaths.length === 0) return null;
  await writeConfig({ knowledgeBasePath: filePaths[0] });
  await ensureKnowledgeBase();
  return filePaths[0];
});

ipcMain.handle('ensure-knowledge-base', async () => {
  try {
    return await ensureKnowledgeBase();
  } catch (err) {
    throw new Error(err.message);
  }
});

ipcMain.handle('read-file', async (_, filePath) => {
  const basePath = getKnowledgeBasePath();
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(basePath, filePath);
  if (!fullPath.startsWith(basePath)) throw new Error('Access denied');
  return await fs.readFile(fullPath, 'utf-8');
});

ipcMain.handle('write-file', async (_, filePath, content) => {
  const basePath = getKnowledgeBasePath();
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(basePath, filePath);
  if (!fullPath.startsWith(basePath)) throw new Error('Access denied');
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  return await fs.writeFile(fullPath, content, 'utf-8');
});

ipcMain.handle('list-projects', async () => {
  const basePath = getKnowledgeBasePath();
  const projectsPath = path.join(basePath, 'Projects');
  try {
    const entries = await fs.readdir(projectsPath, { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name).sort();
  } catch {
    return [];
  }
});

ipcMain.handle('list-notes', async (_, projectName) => {
  const basePath = getKnowledgeBasePath();
  const projectPath = path.join(basePath, 'Projects', projectName);
  if (!projectPath.startsWith(path.join(basePath, 'Projects'))) return [];
  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => e.name)
      .sort();
  } catch {
    return [];
  }
});

ipcMain.handle('create-project', async (_, name) => {
  const basePath = getKnowledgeBasePath();
  const projectPath = path.join(basePath, 'Projects', name);
  if (/[<>:"/\\|?*]/.test(name)) throw new Error('Invalid project name');
  if (projectPath !== path.join(basePath, 'Projects', path.basename(projectPath))) {
    throw new Error('Invalid project name');
  }
  await fs.mkdir(projectPath, { recursive: true });
  return projectPath;
});

ipcMain.handle('create-note', async (_, projectName, noteName, initialContent = '') => {
  const basePath = getKnowledgeBasePath();
  const notePath = path.join(basePath, 'Projects', projectName, noteName);
  if (!notePath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  const dir = path.dirname(notePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(notePath, initialContent || '', 'utf-8');
  return notePath;
});

ipcMain.handle('delete-project', async (_, projectName) => {
  const basePath = getKnowledgeBasePath();
  const projectPath = path.join(basePath, 'Projects', projectName);
  if (!projectPath.startsWith(path.join(basePath, 'Projects')) || projectPath === path.join(basePath, 'Projects')) {
    throw new Error('Access denied');
  }
  await fs.rm(projectPath, { recursive: true });
});

ipcMain.handle('delete-note', async (_, projectName, noteName) => {
  const basePath = getKnowledgeBasePath();
  const notePath = path.join(basePath, 'Projects', projectName, noteName);
  if (!notePath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  await fs.unlink(notePath).catch(() => {});
  const stem = path.basename(noteName, '.md');
  const assetsDir = path.join(basePath, 'Projects', projectName, '.assets', stem);
  try {
    await fs.rm(assetsDir, { recursive: true, force: true });
  } catch (_) {}
});

ipcMain.handle('rename-project', async (_, oldName, newName) => {
  const basePath = getKnowledgeBasePath();
  const oldPath = path.join(basePath, 'Projects', oldName);
  const newPath = path.join(basePath, 'Projects', newName);
  if (!oldPath.startsWith(path.join(basePath, 'Projects')) || oldPath === path.join(basePath, 'Projects')) {
    throw new Error('Access denied');
  }
  if (/[<>:"/\\|?*]/.test(newName)) throw new Error('Invalid project name');
  await fs.rename(oldPath, newPath);
});

ipcMain.handle('rename-note', async (_, projectName, oldNoteName, newNoteName) => {
  const basePath = getKnowledgeBasePath();
  const oldPath = path.join(basePath, 'Projects', projectName, oldNoteName);
  if (!newNoteName.endsWith('.md')) newNoteName += '.md';
  const newPath = path.join(basePath, 'Projects', projectName, newNoteName);
  if (!oldPath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  await fs.rename(oldPath, newPath);
});

ipcMain.handle('export-project', async (_, projectName) => {
  const basePath = getKnowledgeBasePath();
  const projectPath = path.join(basePath, 'Projects', projectName);
  if (!projectPath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  const notes = await fs.readdir(projectPath, { withFileTypes: true });
  const mdFiles = notes.filter(e => e.isFile() && e.name.endsWith('.md')).map(e => e.name).sort();
  let content = `# ${projectName}\n\n`;
  for (const f of mdFiles) {
    const fileContent = await fs.readFile(path.join(projectPath, f), 'utf-8');
    content += `## ${f.replace('.md', '')}\n\n${fileContent}\n\n---\n\n`;
  }
  return content;
});

ipcMain.handle('export-note-content', async (_, projectName, noteName, content) => {
  return content || await fs.readFile(path.join(getKnowledgeBasePath(), 'Projects', projectName, noteName), 'utf-8');
});

ipcMain.handle('insert-attachments', async (_, projectName, noteName, kind, explicitPaths) => {
  const basePath = getKnowledgeBasePath();
  const notePath = path.join(basePath, 'Projects', projectName, noteName);
  if (!notePath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  const stem = path.basename(noteName, '.md');
  const assetsDir = path.join(basePath, 'Projects', projectName, '.assets', stem);
  let filePaths = Array.isArray(explicitPaths) && explicitPaths.length > 0 ? explicitPaths : null;
  if (!filePaths) {
    const filters = kind === 'image'
      ? [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
      : kind === 'video'
      ? [{ name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'webm'] }]
      : kind === 'audio'
      ? [{ name: 'Audio', extensions: ['mp3', 'm4a', 'wav', 'flac', 'ogg'] }]
      : [{ name: 'All Files', extensions: ['*'] }];
    const res = await dialog.showOpenDialog(null, {
      title: '选择附件文件',
      properties: ['openFile', 'multiSelections'],
      filters
    });
    if (res.canceled || !res.filePaths || res.filePaths.length === 0) return [];
    filePaths = res.filePaths;
  }
  await fs.mkdir(assetsDir, { recursive: true });
  const results = [];
  for (const src of filePaths) {
    const name = path.basename(src);
    const dest = path.join(assetsDir, name);
    await fs.copyFile(src, dest);
    const rel = path.join('.assets', stem, name).replace(/\\/g, '/');
    results.push({ path: rel, name });
  }
  return results;
});

ipcMain.handle('export-note-assets', async (_, projectName, noteName, targetFilePath) => {
  if (!targetFilePath) return 0;
  const basePath = getKnowledgeBasePath();
  const stem = path.basename(noteName, '.md');
  const srcDir = path.join(basePath, 'Projects', projectName, '.assets', stem);
  try {
    const stat = await fs.stat(srcDir);
    if (!stat.isDirectory()) return 0;
  } catch {
    return 0;
  }
  const destRoot = path.dirname(targetFilePath);
  const destDir = path.join(destRoot, '.assets', stem);
  async function copyDir(from, to) {
    await fs.mkdir(to, { recursive: true });
    const entries = await fs.readdir(from, { withFileTypes: true });
    for (const e of entries) {
      const src = path.join(from, e.name);
      const dst = path.join(to, e.name);
      if (e.isDirectory()) {
        await copyDir(src, dst);
      } else if (e.isFile()) {
        await fs.copyFile(src, dst);
      }
    }
  }
  await copyDir(srcDir, destDir);
  return 1;
});

ipcMain.handle('open-attachment', async (_, projectName, noteName, relPath) => {
  const basePath = getKnowledgeBasePath();
  const noteFullPath = path.join(basePath, 'Projects', projectName, noteName);
  if (!noteFullPath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  const noteDir = path.dirname(noteFullPath);
  const stem = path.basename(noteName, '.md');
  let safeRel = relPath || '';
  // 兼容旧数据：既支持 .assets/stem/name，也支持仅文件名
  if (!safeRel.startsWith('.assets/')) {
    safeRel = path.join('.assets', stem, safeRel).replace(/\\/g, '/');
  }
  const fullPath = path.isAbsolute(safeRel) ? safeRel : path.join(noteDir, safeRel);
  if (!fullPath.startsWith(basePath)) throw new Error('Access denied');
  await shell.openPath(fullPath);
  return fullPath;
});

ipcMain.handle('show-save-dialog', async (_, defaultPath, filters) => {
  const result = await dialog.showSaveDialog({ defaultPath, filters: filters || [{ name: 'Markdown', extensions: ['md'] }] });
  if (result.canceled) return null;
  return result.filePath;
});

ipcMain.handle('write-export-file', async (_, filePath, content) => {
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
});

function getInboxDirPath() {
  return path.join(getKnowledgeBasePath(), 'Inbox');
}

function getInboxDayPath(dateStr) {
  return path.join(getInboxDirPath(), `${dateStr}.md`);
}

async function cleanOldInbox() {
  const dir = getInboxDirPath();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INBOX_DAYS_RETAIN);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) {
        const dayStr = e.name.replace('.md', '');
        if (dayStr < cutoffStr) {
          await fs.unlink(path.join(dir, e.name));
        }
      }
    }
  } catch (_) {}
}

ipcMain.handle('ensure-inbox', async () => {
  const dir = getInboxDirPath();
  await fs.mkdir(dir, { recursive: true });
  await cleanOldInbox();
  return dir;
});

ipcMain.handle('list-inbox-days', async () => {
  const dir = getInboxDirPath();
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter(e => e.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(e.name))
      .map(e => e.name.replace('.md', ''))
      .sort()
      .reverse();
  } catch {
    return [];
  }
});

ipcMain.handle('read-inbox-day', async (_, dateStr) => {
  const fp = getInboxDayPath(dateStr);
  if (!fp.startsWith(getInboxDirPath())) throw new Error('Access denied');
  try {
    return await fs.readFile(fp, 'utf-8');
  } catch {
    return INBOX_TEMPLATE;
  }
});

ipcMain.handle('write-inbox-day', async (_, dateStr, content) => {
  const fp = getInboxDayPath(dateStr);
  if (!fp.startsWith(getInboxDirPath())) throw new Error('Access denied');
  await fs.writeFile(fp, content || INBOX_TEMPLATE, 'utf-8');
});

ipcMain.handle('append-to-note', async (_, projectName, noteName, content) => {
  const basePath = getKnowledgeBasePath();
  const notePath = path.join(basePath, 'Projects', projectName, noteName);
  if (!notePath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  const existing = await fs.readFile(notePath, 'utf-8').catch(() => '');
  await fs.writeFile(notePath, existing + (existing.endsWith('\n') ? '' : '\n') + content, 'utf-8');
});

ipcMain.handle('get-all-notes-for-link', async () => {
  const basePath = getKnowledgeBasePath();
  const projectsPath = path.join(basePath, 'Projects');
  const result = [];
  try {
    const projects = await fs.readdir(projectsPath, { withFileTypes: true });
    for (const p of projects.filter(e => e.isDirectory())) {
      const notesPath = path.join(projectsPath, p.name);
      const notes = await fs.readdir(notesPath, { withFileTypes: true }).catch(() => []);
      for (const n of notes.filter(e => e.isFile() && e.name.endsWith('.md'))) {
        result.push({ project: p.name, note: n.name });
      }
    }
  } catch {}
  return result;
});

ipcMain.handle('resolve-note-path', (_, projectName, noteName) => {
  const basePath = getKnowledgeBasePath();
  return path.join(basePath, 'Projects', projectName, noteName);
});

ipcMain.handle('get-inbox-path', () => getInboxDirPath());

ipcMain.handle('file-exists', async (_, filePath) => {
  try {
    const normalized = path.normalize(filePath);
    await fs.access(normalized);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('note-exists', async (_, projectName, noteName) => {
  const basePath = getKnowledgeBasePath();
  const notePath = path.join(basePath, 'Projects', projectName, noteName);
  try {
    await fs.access(notePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('get-app-version', () => {
  try {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
});

function getProductName() {
  try {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    return (pkg.build && pkg.build.productName) || pkg.name || 'LumNote';
  } catch {
    return 'LumNote';
  }
}

ipcMain.handle('is-packaged', () => app.isPackaged);

ipcMain.handle('get-uninstaller-path', () => {
  if (!app.isPackaged) return null;
  if (process.platform === 'win32') {
    const productName = getProductName();
    const uninstallerPath = path.join(path.dirname(process.execPath), `Uninstall ${productName}.exe`);
    try {
      if (fsSync.existsSync(uninstallerPath)) return uninstallerPath;
    } catch (_) {}
  }
  return null;
});

ipcMain.handle('open-uninstaller', async () => {
  if (!app.isPackaged) return { ok: false, reason: 'not-packaged' };
  if (process.platform === 'win32') {
    const productName = getProductName();
    const uninstallerPath = path.join(path.dirname(process.execPath), `Uninstall ${productName}.exe`);
    try {
      if (!fsSync.existsSync(uninstallerPath)) return { ok: false, reason: 'not-found' };
    } catch (_) {
      return { ok: false, reason: 'not-found' };
    }
    await shell.openPath(uninstallerPath);
    setTimeout(() => app.quit(), 500);
    return { ok: true };
  }
  return { ok: false, reason: 'unsupported' };
});

ipcMain.handle('move-to-note', async (_, projectName, noteName, contentToAppend, inboxContentToReplace, inboxDateStr) => {
  const basePath = getKnowledgeBasePath();
  const notePath = path.join(basePath, 'Projects', projectName, noteName);
  if (!notePath.startsWith(path.join(basePath, 'Projects'))) throw new Error('Access denied');
  const existing = await fs.readFile(notePath, 'utf-8').catch(() => '');
  const separator = existing.endsWith('\n') ? '' : '\n';
  await fs.writeFile(notePath, existing + separator + contentToAppend, 'utf-8');
  const inboxPath = getInboxDayPath(inboxDateStr || new Date().toISOString().slice(0, 10));
  await fs.writeFile(inboxPath, inboxContentToReplace, 'utf-8');
});
