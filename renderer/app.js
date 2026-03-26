const MAX_TABS = 6;
const AUTO_SAVE_DEBOUNCE = 500;
const INBOX_ID = '__inbox__';

const MD_TEMPLATE = `声明：
本模板为本软件开源项目配套参考框架，基于项目开源协议提供，用户开发的功能、合规性及数据安全由自身全权负责。
使用本模板需遵守相关法律法规及项目开源协议，不得用于违法侵权场景，项目团队不对模板使用及衍生内容承担法律责任。
注：→ 后表示注释

一、标题

# 一级标题
→ 一级标题，# 后必加空格

## 二级标题
→ 二级标题，# 后必加空格

### 三级标题
→ 三级标题，# 后必加空格

#### 四级标题
→ 四级标题，# 后必加空格

##### 五级标题
→ 五级标题，# 后必加空格

###### 六级标题
→ 六级标题，# 后必加空格

二、文本格式

**文本**
→ 适用于核心结论、关键数据

*文本*
→ 适用于辅助说明、强调补充

***文本***
→ 适用于重点强调的核心信息

\`代码\`
→ 行内代码样式

三、列表

（一）无序列表符号
- 文本
* 文本
+ 文本

（二）有序列表
1. 文本
2. 文本
→ 比如 1、2、3...

同层级用同一符号，不同层级需空行 + 缩进

四、引用与分割线

> 一级引用
→ 单行引用，> 后必加空格

>> 二级引用
→ 二级嵌套引用，>> 后必加空格

---
***
===
→ 分割线

五、链接与图片

[链接名称](https://example.com)
→ 外部基础链接、可点击跳转

[链接名称](https://example.com "提示文字")
→ 带悬浮提示的外部链接（鼠标悬停显示提示）

![图片描述](images/example.png)
→ 插入图片（描述用于无障碍访问，路径支持本地 / 网络）

[跳转文字](#目标标题)
→ 文档内锚点跳转（标题 ID 自动生成，中文标题可直接使用）

六、表格

| 表头1 | 表头2 |
|-------|-------|
| 数据1 | 数据2 |
→ 基础表格（竖线分隔单元格）

| 左对齐 | 居中对齐 | 右对齐 |
| :------ | :-----: | ------: |
| 文本   | 文本    | 文本    |
→ 表格对齐（冒号在左 = 左对齐，两侧 = 居中，右侧 = 右对齐）

七、代码块

示例：

\`\`\`language
代码内容
\`\`\`
→ 围栏代码块（指定语言实现语法高亮，不指定则无高亮）

\`单行代码\`
→ 行内代码（适用于简短代码 / 命令）

\`\`\`diff
+ 新增行
- 删除行
  未修改行
\`\`\`
→ 代码对比（GFM 支持，标记新增 / 删除）

八、任务列表

- [x] 已完成任务
→ 已完成任务（中括号内 x 为小写，无空格）

- [ ] 未完成任务
→ 未完成任务（中括号内有 1 个空格），适用于待办清单、进度跟踪
`;

const MD_TEMPLATE_PROJECT = MD_TEMPLATE;

const state = {
  tabs: [],
  activeTabId: null,
  dualPane: false,
  inboxView: false,
  inboxWasOpenBeforeGuide: false,
  inboxCurrentDay: null,
  inboxSaveTimeout: null,
  sidebarCollapsed: false,
  sidebarWidth: 220,
  paneRatio: 0.75,
  projects: [],
  expandedProjects: {},
  inboxPath: null,
  saveTimeouts: {},
  contextTarget: null,
  moveContext: null,
  dragSourceBlock: null,
  linkCache: [],
  tabCopyContent: null
};

const $ = (id) => document.getElementById(id);

function getDateNoteName() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}.md`;
}

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultNoteName() {
  return getDateNoteName();
}

function setVerticalNavActive(which) {
  const projects = $('nav-projects');
  const guide = $('nav-guide');
  if (projects) projects.classList.toggle('active', which === 'projects');
  if (guide) guide.classList.toggle('active', which === 'guide');
}

async function init() {
  if (typeof window.syncDocumentLang === 'function') window.syncDocumentLang();
  await window.lumenAPI.ensureKnowledgeBase();
  try {
    await window.lumenAPI.ensureInbox();
  } catch (e) {
    console.warn('ensureInbox on startup', e);
  }
  state.inboxPath = await window.lumenAPI.getInboxPath();
  state.sidebarWidth = parseInt(localStorage.getItem('lumen_sidebar_width') || '220', 10);
  state.paneRatio = parseFloat(localStorage.getItem('lumen_pane_ratio') || '0.75');
  await refreshProjects();
  setVerticalNavActive('projects');
  applySidebarWidth();
  await restoreSession();
  exitGuideMode();
  bindEvents();
  updateUIText();

  // 强制确保顶部栏和两个折叠按钮在启动时可见，防止被历史状态带上的 .hidden 影响
  const tabsBarEl = $('tabs-bar');
  if (tabsBarEl) tabsBarEl.classList.remove('hidden');
  const sidebarToggleEl = $('tabs-bar-sidebar-toggle');
  if (sidebarToggleEl) sidebarToggleEl.classList.remove('hidden');
  const inboxToggleEl = $('inbox-toggle-btn');
  if (inboxToggleEl) inboxToggleEl.classList.remove('hidden');
}

function updateUIText() {
  const placeholder = $('placeholder-text');
  if (placeholder) placeholder.textContent = t('selectToStart');
  const empty = $('empty-state');
  if (empty) empty.textContent = t('emptyHint');
  const title = document.querySelector('.toolbar-title');
  if (title) title.textContent = t('appTitle') || t('projects');
  const navProj = $('nav-projects');
  if (navProj) {
    navProj.title = t('projects');
    navProj.setAttribute('aria-label', t('projects'));
  }
  const navGuide = $('nav-guide');
  if (navGuide) navGuide.title = t('guideAndLicense') || t('guide');
  const addProjectBtn = $('add-project-btn');
  if (addProjectBtn) {
    addProjectBtn.title = t('newProject');
    addProjectBtn.setAttribute('aria-label', t('newProject'));
  }
  const sideToggle = $('tabs-bar-sidebar-toggle');
  if (sideToggle) {
    const fold = t('sidebarFold');
    sideToggle.title = fold;
    sideToggle.setAttribute('aria-label', fold);
  }
  document.querySelectorAll('.win-btn-minimize').forEach((btn) => {
    const tx = t('windowMinimize');
    btn.title = tx;
    btn.setAttribute('aria-label', tx);
  });
  document.querySelectorAll('.win-btn-close').forEach((btn) => {
    const tx = t('windowClose');
    btn.title = tx;
    btn.setAttribute('aria-label', tx);
  });
  document.querySelectorAll('#editor-undo, .editor-left-undo, .editor-right-undo').forEach((btn) => {
    const tx = t('undo');
    btn.title = tx;
    btn.setAttribute('aria-label', tx);
  });
  document.querySelectorAll('#editor-redo, .editor-left-redo, .editor-right-redo').forEach((btn) => {
    const tx = t('redo');
    btn.title = tx;
    btn.setAttribute('aria-label', tx);
  });
  const mc = $('modal-cancel');
  const mconf = $('modal-confirm');
  if (mc) mc.textContent = t('cancel');
  if (mconf) mconf.textContent = t('confirm');
  const mpc = $('modal-project-cancel');
  const mpconf = $('modal-project-confirm');
  if (mpc) mpc.textContent = t('cancel');
  if (mpconf) mpconf.textContent = t('confirm');
  const mrc = $('modal-rename-cancel');
  const mrconf = $('modal-rename-confirm');
  if (mrc) mrc.textContent = t('cancel');
  if (mrconf) mrconf.textContent = t('confirm');
  const maok = $('modal-alert-ok');
  if (maok) maok.textContent = t('confirm');
  const mco = $('modal-confirm-ok');
  const mcc = $('modal-confirm-cancel');
  if (mco) mco.textContent = t('confirm');
  if (mcc) mcc.textContent = t('cancel');
  const modalLabel = $('modal-label');
  if (modalLabel) modalLabel.textContent = t('noteName');
  const modalProjectLabel = $('modal-project-label');
  if (modalProjectLabel) modalProjectLabel.textContent = t('projectNameLabel');
  const modalRenameLabel = $('modal-rename-label');
  if (modalRenameLabel) modalRenameLabel.textContent = t('rename');
  const modalTpl = $('modal-template-label');
  if (modalTpl) modalTpl.textContent = t('useTemplate');
  const modalProjTpl = $('modal-project-template-label');
  if (modalProjTpl) modalProjTpl.textContent = t('useProjectTemplate');
  document.querySelectorAll('#lang-popover .lang-option').forEach((el) => {
    const labels = { zh: '中文', en: 'English', fr: 'Français', ja: '日本語', ko: '한국어', de: 'Deutsch', it: 'Italiano' };
    const c = el.dataset.lang;
    if (c && labels[c]) el.textContent = labels[c];
  });
  document.querySelectorAll('.guide-item[data-guide="readme"]').forEach(el => { el.textContent = t('guideReadme'); });
  document.querySelectorAll('.guide-item[data-guide="license"]').forEach(el => { el.textContent = t('guideLicense'); });
  document.querySelectorAll('.guide-item[data-guide="storage"]').forEach(el => { el.textContent = t('guideStorage'); });
  document.querySelectorAll('.guide-item[data-guide="lang"]').forEach(el => { el.textContent = t('languageSettings'); });
  syncInboxToggleButton();
  refreshWindowMaximizeTitles();
}

function refreshWindowMaximizeTitles() {
  if (!window.lumenAPI?.windowIsMaximized) {
    const tx = t('windowMaximize');
    document.querySelectorAll('.win-btn-maximize').forEach((btn) => {
      btn.title = tx;
      btn.setAttribute('aria-label', tx);
    });
    return;
  }
  window.lumenAPI.windowIsMaximized().then((isMax) => {
    const tx = isMax ? t('windowRestore') : t('windowMaximize');
    document.querySelectorAll('.win-btn-maximize').forEach((btn) => {
      btn.title = tx;
      btn.setAttribute('aria-label', tx);
    });
  }).catch(() => {
    const tx = t('windowMaximize');
    document.querySelectorAll('.win-btn-maximize').forEach((btn) => {
      btn.title = tx;
      btn.setAttribute('aria-label', tx);
    });
  });
}

function syncInboxToggleButton() {
  const btn = $('inbox-toggle-btn');
  if (!btn) return;
  if (state.inboxView) {
    btn.title = t('foldInbox');
    btn.setAttribute('aria-label', t('foldInbox'));
  } else {
    btn.title = t('expandInbox');
    btn.setAttribute('aria-label', t('expandInbox'));
  }
}

function applySidebarWidth() {
  const sidebar = $('sidebar');
  if (!sidebar) return;
  if (state.sidebarCollapsed) {
    sidebar.style.width = '0';
    sidebar.style.minWidth = '0';
  } else {
    sidebar.style.width = state.sidebarWidth + 'px';
    sidebar.style.minWidth = state.sidebarWidth + 'px';
  }
}

async function refreshProjects() {
  state.projects = await window.lumenAPI.listProjects();
  renderProjects();
}

async function renderProjects() {
  const list = $('projects-list');
  const empty = $('empty-state');
  list.innerHTML = '';
  if (state.projects.length === 0) {
    empty.classList.remove('hidden');
    empty.textContent = t('emptyHint');
    return;
  }
  empty.classList.add('hidden');
  for (const name of state.projects) {
    const notes = await window.lumenAPI.listNotes(name);
    if (state.expandedProjects[name] === undefined) state.expandedProjects[name] = true;
    const expanded = state.expandedProjects[name] !== false;
    const projectDiv = document.createElement('div');
    projectDiv.className = 'project-block';
    projectDiv.innerHTML = `
      <div class="project-row ${expanded ? 'expanded' : ''}" data-project="${escapeHtml(name)}">
        <span class="project-chevron">▶</span>
        <span class="project-name">${escapeHtml(name)}</span>
        <span class="project-actions">
          <button type="button" class="project-action-btn project-add" data-project="${escapeHtml(name)}" title="${t('newNote')}">+</button>
          <span class="project-delete" data-project="${escapeHtml(name)}" title="${t('deleteProject')}">×</span>
        </span>
      </div>
      <div class="project-notes ${expanded ? 'expanded' : ''}" data-project="${escapeHtml(name)}">
        ${notes.map(n => `
          <div class="note-item" data-project="${escapeHtml(name)}" data-note="${escapeHtml(n)}">
            <span class="note-name">${escapeHtml(n.replace('.md',''))}</span>
            <span class="note-delete" data-project="${escapeHtml(name)}" data-note="${escapeHtml(n)}" title="${t('deleteNote')}">×</span>
          </div>
        `).join('')}
      </div>
    `;
    list.appendChild(projectDiv);
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function restoreSession() {
  try {
    const saved = localStorage.getItem('lumen_session');
    if (saved) {
      const data = JSON.parse(saved);
      for (const tab of data.tabs || []) {
        if (state.tabs.length >= MAX_TABS) break;
        if (tab.project && tab.note && tab.id !== INBOX_ID) {
          await openNote(tab.project, tab.note, false);
        }
      }
      if (data.activeTabId && state.tabs.some(t => t.id === data.activeTabId)) {
        switchTab(data.activeTabId);
      }
      if (data.inboxView) await openInbox();
    }
  } catch (e) {
    console.warn('Session restore failed', e);
  }
}

function saveSession() {
  const data = {
    tabs: state.tabs.map(t => ({ id: t.id, project: t.project, note: t.note })),
    activeTabId: state.activeTabId,
    inboxView: state.inboxView
  };
  localStorage.setItem('lumen_session', JSON.stringify(data));
}

function tabId(project, note) {
  if (project === INBOX_ID) return INBOX_ID;
  return `${project}/${note}`;
}

async function openInbox() {
  await window.lumenAPI.ensureInbox();
  exitGuideMode();
  const prevTab = getTabById(state.activeTabId);
  if (prevTab) {
    const ed = (state.inboxView || state.dualPane) ? $('editor-left') : $('editor');
    if (ed) prevTab.content = ed.value;
  }
  state.inboxView = true;
  state.inboxCurrentDay = getTodayDateStr();
  document.body.classList.add('inbox-view');
  $('single-pane')?.classList.add('hidden');
  $('editor-area')?.classList.add('hidden');
  $('dual-inbox-layout')?.classList.remove('hidden');
  $('inbox-tab-container')?.classList.remove('hidden');
  const labelEl = document.querySelector('.inbox-tab-label');
  if (labelEl) labelEl.textContent = t('inbox');
  const editorLeft = $('dual-inbox-editor-left');
  const editorRight = $('dual-inbox-editor-right');
  // 把左右编辑区域挂到双栏容器中（不再移动顶部标签栏）
  const leftPane = document.querySelector('.dual-pane-container .left-pane');
  const rightPane = document.querySelector('.dual-pane-container .right-pane');
  if (editorLeft && leftPane) editorLeft.appendChild(leftPane);
  if (editorRight && rightPane) editorRight.appendChild(rightPane);
  applyDualInboxRatio();
  const leftContent = prevTab ? prevTab.content : '';
  $('editor-left').value = leftContent;
  $('editor-left').dataset.tabId = prevTab ? state.activeTabId : '';
  let content = await window.lumenAPI.readInboxDay(state.inboxCurrentDay);
  if (!content || !content.trim()) {
    content = `# ${t('inbox')}\n\n${t('inboxDefaultBody')}`;
  }
  $('editor-right').value = content;
  $('editor-right').dataset.pane = 'inbox';
  $('editor-right').dataset.inboxDay = state.inboxCurrentDay;
  $('editor-right').classList.toggle('inbox-default', isInboxDefaultContent(content));
  $('nav-inbox-btn')?.classList.add('active');
  renderTabs();
  $('editor-right').focus();
  syncInboxToggleButton();
  saveSession();
}

async function hideInboxView() {
  if (!state.inboxView) return;
  const ed = $('editor-right');
  if (ed && state.inboxCurrentDay) {
    if (state.inboxSaveTimeout) {
      clearTimeout(state.inboxSaveTimeout);
      state.inboxSaveTimeout = null;
    }
    try {
      await window.lumenAPI.writeInboxDay(state.inboxCurrentDay, ed.value);
    } catch (e) { console.error('Inbox save failed', e); }
    ed.value = '';
    ed.dataset.pane = '';
    ed.dataset.inboxDay = '';
  }
  const dualPane = $('dual-pane-container');
  const leftPane = document.querySelector('.dual-inbox-editor-left .left-pane');
  const rightPane = document.querySelector('.dual-inbox-editor-right .right-pane');
  const resizerPanes = $('resizer-panes');
  if (dualPane && leftPane && rightPane && resizerPanes) {
    dualPane.insertBefore(leftPane, resizerPanes);
    dualPane.appendChild(rightPane);
  }
  // 顶部标签栏保持不动，只隐藏灵感区标签容器本身
  state.inboxView = false;
  state.inboxCurrentDay = null;
  document.body.classList.remove('inbox-view');
  $('inbox-tab-container')?.classList.add('hidden');
  $('dual-inbox-layout')?.classList.add('hidden');
  $('editor-area')?.classList.remove('hidden');
  $('single-pane')?.classList.remove('hidden');
  $('nav-inbox-btn')?.classList.remove('active');
  const tab = getTabById(state.activeTabId);
  if (tab) {
    $('editor').value = tab.content;
    $('editor').dataset.tabId = state.activeTabId;
    $('editor-wrapper')?.classList.remove('hidden');
    $('placeholder')?.classList.add('hidden');
  } else {
    $('editor-wrapper')?.classList.add('hidden');
    $('placeholder')?.classList.remove('hidden');
  }
  renderTabs();
  syncInboxToggleButton();
  saveSession();
}

function scheduleInboxSave() {
  if (state.inboxSaveTimeout) clearTimeout(state.inboxSaveTimeout);
  const ed = $('editor-right');
  if (!ed || !state.inboxCurrentDay || ed.dataset.pane !== 'inbox') return;
  const content = ed.value;
  state.inboxSaveTimeout = setTimeout(async () => {
    try {
      await window.lumenAPI.writeInboxDay(state.inboxCurrentDay, content);
    } catch (e) { console.error('Inbox save failed', e); }
    state.inboxSaveTimeout = null;
  }, AUTO_SAVE_DEBOUNCE);
}

async function openNote(project, note, checkLimit = true) {
  if (checkLimit && state.tabs.length >= MAX_TABS) {
    showAlert(t('tabLimit'));
    return false;
  }
  const id = tabId(project, note);
  const existing = state.tabs.find(t => t.id === id);
  if (existing) {
    switchTab(id);
    return true;
  }
  const relPath = `Projects/${project}/${note}`;
  let content;
  try {
    content = await window.lumenAPI.readFile(relPath);
  } catch (e) {
    content = '';
  }
  const basePath = await window.lumenAPI.getKnowledgeBasePath();
  const path = `${basePath}/Projects/${project}/${note}`;
  state.tabs.push({ id, project, note, content, path });
  renderTabs();
  switchTab(id);
  saveSession();
  return true;
}

function getCurrentEditor() {
  if (state.inboxView || state.dualPane) return $('editor-left');
  return $('editor');
}

function getTabById(id) {
  return state.tabs.find(t => t.id === id);
}

function exitGuideMode() {
  const before = document.body.className;
  document.body.classList.remove('guide-mode');
  $('guide-panel')?.classList.add('hidden');
}

function isInboxDefaultContent(content) {
  const t1 = content.trim();
  const t2 = `# ${t('inbox')}\n\n${t('inboxDefaultBody')}`.trim();
  return t1 === t2;
}

function switchTab(id) {
  const tab = getTabById(id);
  if (!tab) return;
  exitGuideMode();
  const prevTab = getTabById(state.activeTabId);
  if (prevTab) {
    const ed = getCurrentEditor();
    if (ed && ed.dataset.tabId === state.activeTabId) {
      prevTab.content = ed.value;
    }
  }
  state.activeTabId = id;
  renderTabs();
  updateSidebarActiveState();
  const editor = getCurrentEditor();
  editor.value = tab.content;
  editor.dataset.tabId = id;
  editor.classList.toggle('inbox-default', tab.id === INBOX_ID && isInboxDefaultContent(tab.content));
  $('editor-wrapper').classList.remove('hidden');
  $('placeholder').classList.add('hidden');
  $('guide-panel').classList.add('hidden');
  editor.focus();
  saveSession();
}

function updateSidebarActiveState() {
  const tab = getTabById(state.activeTabId);
  document.querySelectorAll('.project-row').forEach(el => {
    el.classList.toggle('active', !!(tab && tab.project === el.dataset.project));
  });
  document.querySelectorAll('.note-item').forEach(el => {
    el.classList.toggle('active', !!(tab && tab.project === el.dataset.project && tab.note === el.dataset.note));
  });
}

function closeTab(id, ev) {
  if (ev && ev.button === 1) ev.preventDefault();
  const idx = state.tabs.findIndex(t => t.id === id);
  if (idx < 0) return;
  const tab = state.tabs[idx];
  const editor = getCurrentEditor();
  if (editor && editor.dataset.tabId === id) {
    tab.content = editor.value;
  }
  state.tabs.splice(idx, 1);
  if (state.activeTabId === id) {
    const next = state.tabs[Math.min(idx, state.tabs.length - 1)];
    state.activeTabId = next ? next.id : null;
    if (next) {
      switchTab(next.id);
    } else {
      if (state.inboxView) {
        $('editor-left').value = '';
        $('editor-left').dataset.tabId = '';
      } else {
        $('editor-wrapper').classList.add('hidden');
        $('placeholder').classList.remove('hidden');
        $('editor').value = '';
      }
      updateSidebarActiveState();
    }
  }
  renderTabs();
  saveSession();
}

function renderTabs() {
  const container = $('note-tabs-container');
  if (!container) return;
  container.innerHTML = '';
  state.tabs.forEach(tab => {
    const div = document.createElement('div');
    div.className = 'tab' + (tab.id === state.activeTabId ? ' active' : '');
    const label = tab.id === INBOX_ID ? t('inbox') : tab.note.replace('.md', '');
    div.innerHTML = `<span>${escapeHtml(label)}</span><span class="tab-close" data-tab-id="${escapeHtml(tab.id)}">×</span>`;
    if (tab.project && tab.note) {
      div.setAttribute('data-tooltip', `${t('projects') || '项目'}：${tab.project}`);
    }
    div.dataset.tabId = tab.id;
    container.appendChild(div);
  });
}

function scheduleSave(tabId) {
  if (state.saveTimeouts[tabId]) clearTimeout(state.saveTimeouts[tabId]);
  state.saveTimeouts[tabId] = setTimeout(async () => {
    const tab = getTabById(tabId);
    if (!tab) return;
    const editor = getCurrentEditor();
    if (editor && editor.dataset.tabId === tabId) {
      tab.content = editor.value;
      editor.classList.toggle('inbox-default', tab.id === INBOX_ID && isInboxDefaultContent(editor.value));
    }
    try {
      if (tab.id === INBOX_ID) {
        await window.lumenAPI.writeFile('Inbox.md', tab.content);
      } else {
        await window.lumenAPI.writeFile(`Projects/${tab.project}/${tab.note}`, tab.content);
      }
    } catch (e) {
      console.error('Save failed', e);
    }
    delete state.saveTimeouts[tabId];
  }, AUTO_SAVE_DEBOUNCE);
}

async function toggleDualPane() {
  const prevTab = getTabById(state.activeTabId);
  if (prevTab) {
    const ed = getCurrentEditor();
    if (ed) prevTab.content = ed.value;
  }
  state.dualPane = !state.dualPane;
  const single = $('single-pane');
  const dual = $('dual-pane-container');
  if (state.dualPane) {
    single.classList.add('hidden');
    dual.classList.remove('hidden');
    const leftContent = (prevTab && prevTab.id !== INBOX_ID) ? prevTab.content : '';
    $('editor-left').value = leftContent;
    $('editor-left').dataset.tabId = (prevTab && prevTab.id !== INBOX_ID) ? state.activeTabId : '';
    $('editor-right').value = '';
    await loadInboxInRightPane();
    applyPaneRatio();
  } else {
    const inboxContent = $('editor-right').value;
    const inboxTab = state.tabs.find(t => t.id === INBOX_ID);
    if (inboxTab) inboxTab.content = inboxContent;
    await saveRightPaneInbox();
    dual.classList.add('hidden');
    single.classList.remove('hidden');
    if (prevTab) {
      $('editor').value = prevTab.content;
      $('editor').dataset.tabId = state.activeTabId;
    }
  }
}

function applyPaneRatio() {
  const left = document.querySelector('.dual-pane-container .left-pane');
  const right = document.querySelector('.dual-pane-container .right-pane');
  if (left && right) {
    left.style.flex = state.paneRatio;
    right.style.flex = 1 - state.paneRatio;
  }
}

function applyTabsBarRatio() {
  // 顶部标签栏宽度固定由 CSS 控制，这里不再联动分割线
}

function applyDualInboxRatio() {
  const left = $('dual-inbox-left');
  const right = $('dual-inbox-right');
  if (left && right) {
    left.style.flex = '3';
    right.style.flex = '1';
  }
}

async function loadInboxInRightPane() {
  await window.lumenAPI.ensureInbox();
  const day = getTodayDateStr();
  const content = await window.lumenAPI.readInboxDay(day);
  $('editor-right').value = content;
  $('editor-right').dataset.pane = 'inbox';
  $('editor-right').dataset.inboxDay = day;
  $('editor-right').classList.toggle('inbox-default', isInboxDefaultContent(content));
}

async function saveRightPaneInbox() {
  const ed = $('editor-right');
  if (ed?.dataset.pane === 'inbox' && ed.dataset.inboxDay) {
    await window.lumenAPI.writeInboxDay(ed.dataset.inboxDay, ed.value);
  }
}

function bindEvents() {
  const sidebarToggle = $('tabs-bar-sidebar-toggle');
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    $('sidebar').classList.toggle('collapsed', state.sidebarCollapsed);
    document.body.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    applySidebarWidth();
  });

  const navProjects = $('nav-projects');
  if (navProjects) navProjects.addEventListener('click', async () => {
    setVerticalNavActive('projects');
    document.body.classList.remove('guide-mode');
    $('guide-panel')?.classList.add('hidden');

    // 从指南返回时，如果进入指南前暂存区是展开的，则恢复双栏；否则回到单栏编辑
    if (state.inboxWasOpenBeforeGuide) {
      state.inboxWasOpenBeforeGuide = false;
      await openInbox();
      return;
    }

    $('single-pane')?.classList.remove('hidden');
    $('dual-pane-container')?.classList.add('hidden');
    if (state.activeTabId) {
      const tab = getTabById(state.activeTabId);
      if (tab) $('editor').value = tab.content;
      $('editor-wrapper')?.classList.remove('hidden');
      $('placeholder')?.classList.add('hidden');
    } else {
      $('editor-wrapper')?.classList.add('hidden');
      $('placeholder')?.classList.remove('hidden');
    }
  });

  const navGuide = $('nav-guide');
  if (navGuide) navGuide.addEventListener('click', showGuide);
  const inboxToggleBtn = $('inbox-toggle-btn');
  if (inboxToggleBtn) inboxToggleBtn.addEventListener('click', async () => {
    if (state.inboxView) await hideInboxView();
    else await openInbox();
  });

  const bindWindowButtons = () => {
    if (!window.lumenAPI) return;
    document.querySelectorAll('.win-btn-minimize').forEach(el => {
      el.onclick = () => window.lumenAPI.windowMinimize();
    });
    document.querySelectorAll('.win-btn-maximize').forEach(el => {
      el.onclick = async () => {
        window.lumenAPI.windowMaximize();
        setTimeout(async () => {
          if (!window.lumenAPI.windowIsMaximized) return;
          const isMax = await window.lumenAPI.windowIsMaximized();
          const tx = isMax ? t('windowRestore') : t('windowMaximize');
          document.querySelectorAll('.win-btn-maximize').forEach(btn => {
            btn.title = tx;
            btn.setAttribute('aria-label', tx);
          });
        }, 150);
      };
    });
    document.querySelectorAll('.win-btn-close').forEach(el => {
      el.onclick = async () => {
        const ok = await showConfirm(t('confirmCloseWindow'));
        if (ok && window.lumenAPI) window.lumenAPI.windowClose();
      };
    });
  };
  bindWindowButtons();

  // language is now managed inside guide panel

  const projectsList = $('projects-list');
  if (projectsList) {
    projectsList.addEventListener('click', async (e) => {
      const row = e.target.closest('.project-row');
      const addBtn = e.target.closest('.project-add');
      const projectDel = e.target.closest('.project-delete');
      const noteItem = e.target.closest('.note-item');
      const noteDel = e.target.closest('.note-delete');
      if (addBtn) {
        e.stopPropagation();
        showNewNoteModal(addBtn.dataset.project);
        return;
      }
      if (projectDel) {
        e.stopPropagation();
        if (await showConfirm(t('deleteProject') + '?')) {
          try {
            await window.lumenAPI.deleteProject(projectDel.dataset.project);
            closeTabsForProject(projectDel.dataset.project);
            await refreshProjects();
          } catch (err) {
            showAlert(err.message);
          }
        }
        return;
      }
      if (noteDel) {
        e.stopPropagation();
        if (await showConfirm(t('deleteNote') + '?')) {
          try {
            await window.lumenAPI.deleteNote(noteDel.dataset.project, noteDel.dataset.note);
            closeTab(tabId(noteDel.dataset.project, noteDel.dataset.note));
            await refreshProjects();
          } catch (err) {
            showAlert(err.message);
          }
        }
        return;
      }
      if (noteItem && !e.target.closest('.note-delete')) {
        e.stopPropagation();
        await openNote(noteItem.dataset.project, noteItem.dataset.note);
        return;
      }
      if (row && !e.target.closest('.project-actions') && !e.target.closest('.note-delete') && !e.target.closest('.project-delete')) {
        const proj = row.dataset.project;
        state.expandedProjects[proj] = !state.expandedProjects[proj];
        row.classList.toggle('expanded', state.expandedProjects[proj]);
        const list = $('projects-list');
        const notesEl = list.querySelector(`.project-notes[data-project="${proj}"]`);
        if (notesEl) notesEl.classList.toggle('expanded', state.expandedProjects[proj]);
      }
    });
    projectsList.addEventListener('dragover', (e) => {
      const noteItem = e.target.closest('.note-item');
      if (!noteItem) return;
      const dt = e.dataTransfer;
      if (!dt) return;
      const hasFiles = dt.files && dt.files.length > 0;
      const hasText = dt.types && dt.types.includes('text/plain');
      if (hasFiles || hasText) e.preventDefault();
    });
    projectsList.addEventListener('drop', async (e) => {
      const noteItem = e.target.closest('.note-item');
      if (!noteItem) return;
      const dt = e.dataTransfer;
      if (!dt) return;
      e.preventDefault();
      const id = tabId(noteItem.dataset.project, noteItem.dataset.note);
      await handleDropToNoteTarget(e, id);
    });
  }

  const addProjectBtnEl = $('add-project-btn');
  if (addProjectBtnEl) addProjectBtnEl.addEventListener('click', showNewProjectModalAndConfirm);

  if (projectsList) projectsList.addEventListener('contextmenu', (e) => {
    const projectRow = e.target.closest('.project-row');
    const noteItem = e.target.closest('.note-item');
    if (projectRow && !e.target.closest('.project-delete')) {
      e.preventDefault();
      state.contextTarget = { type: 'project', name: projectRow.dataset.project };
      showContextMenu(e.clientX, e.clientY, ['copy', 'cut', 'paste', 'rename', 'new-note', 'export-project', 'delete-project'], 'project');
    } else if (noteItem) {
      e.preventDefault();
      state.contextTarget = { type: 'note', project: noteItem.dataset.project, note: noteItem.dataset.note };
      showContextMenu(e.clientX, e.clientY, ['copy', 'cut', 'paste', 'rename', 'export-note', 'delete-note'], 'note');
    }
  });

  const toolbar = document.querySelector('.sidebar-toolbar');
  if (toolbar) toolbar.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    state.contextTarget = { type: 'projects-header' };
    showContextMenu(e.clientX, e.clientY, ['new-project']);
  });

  const emptyEl = $('empty-state');
  if (emptyEl) {
    emptyEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      state.contextTarget = { type: 'projects-header' };
      showContextMenu(e.clientX, e.clientY, ['new-project']);
    });
  }

  const tabsContainer = $('note-tabs-container');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const tabEl = e.target.closest('.tab');
      const closeEl = e.target.closest('.tab-close');
      if (closeEl) {
        closeTab(closeEl.dataset.tabId);
        return;
      }
      if (tabEl) switchTab(tabEl.dataset.tabId);
    });
    tabsContainer.addEventListener('dblclick', (e) => {
      const tabEl = e.target.closest('.tab');
      if (tabEl && !e.target.closest('.tab-close')) closeTab(tabEl.dataset.tabId);
    });
    tabsContainer.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        const tabEl = e.target.closest('.tab');
        if (tabEl) closeTab(tabEl.dataset.tabId, e);
      }
    });
    tabsContainer.addEventListener('contextmenu', (e) => {
      const tabEl = e.target.closest('.tab');
      if (tabEl) {
        e.preventDefault();
        state.contextTarget = { type: 'tab', tabId: tabEl.dataset.tabId };
        showTabContextMenu(e.clientX, e.clientY, tabEl.dataset.tabId);
      } else {
        e.preventDefault();
        showTabsBarContextMenu(e.clientX, e.clientY);
      }
    });
    tabsContainer.addEventListener('dragover', (e) => {
      const tabEl = e.target.closest('.tab');
      if (!tabEl) return;
      const dt = e.dataTransfer;
      if (!dt) return;
      const hasFiles = dt.files && dt.files.length > 0;
      const hasText = dt.types && dt.types.includes('text/plain');
      if (hasFiles || hasText) e.preventDefault();
    });
    tabsContainer.addEventListener('drop', async (e) => {
      const tabEl = e.target.closest('.tab');
      if (!tabEl) return;
      const dt = e.dataTransfer;
      if (!dt) return;
      e.preventDefault();
      await handleDropToNoteTarget(e, tabEl.dataset.tabId);
    });
  }

  const setupEditor = (editorEl) => {
    editorEl.addEventListener('input', () => {
      const tid = editorEl.dataset.tabId;
      if (tid) scheduleSave(tid);
    });
    editorEl.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const tid = editorEl.dataset.tabId;
        if (tid) scheduleSave(tid);
      }
    });
    editorEl.addEventListener('input', handleEditorInput.bind(null, editorEl));
    editorEl.addEventListener('click', handleEditorClick.bind(null, editorEl));
    editorEl.addEventListener('contextmenu', (e) => showEditorContextMenu(e, editorEl));
  };

  [$('editor'), $('editor-left'), $('editor-right')].forEach(editorEl => {
    if (editorEl) setupEditor(editorEl);
  });

  const edRight = $('editor-right');
  if (edRight) {
    edRight.addEventListener('keydown', (e) => {
      if (!state.inboxView) return;
      if (!edRight.classList.contains('inbox-default')) return;
      if (!isInboxDefaultContent(edRight.value)) return;
      const key = e.key;
      const printable = key.length === 1 || key === 'Enter' || key === 'Backspace' || key === 'Delete';
      if (!printable) return;
      edRight.value = '';
      edRight.classList.remove('inbox-default');
    });
    edRight.addEventListener('input', () => {
      if (state.inboxView) {
        if (edRight.classList.contains('inbox-default') && !isInboxDefaultContent(edRight.value)) {
          edRight.classList.remove('inbox-default');
        }
        scheduleInboxSave();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && (e.key === 'i' || e.key === '1')) {
      e.preventDefault();
      if (state.inboxView) hideInboxView();
      else openInbox();
    }
  });

  const modalCancel = $('modal-cancel');
  if (modalCancel) modalCancel.addEventListener('click', hideNoteModal);
  const modalConfirm = $('modal-confirm');
  if (modalConfirm) modalConfirm.addEventListener('click', confirmNoteModal);
  const modalInput = $('modal-input');
  if (modalInput) modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmNoteModal();
    if (e.key === 'Escape') hideNoteModal();
  });
  const modalProjectCancel = $('modal-project-cancel');
  if (modalProjectCancel) modalProjectCancel.addEventListener('click', hideProjectModal);
  const modalProjectConfirm = $('modal-project-confirm');
  if (modalProjectConfirm) modalProjectConfirm.addEventListener('click', confirmProjectModal);
  const projectInput = $('modal-project-input');
  if (projectInput) projectInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmProjectModal();
    if (e.key === 'Escape') hideProjectModal();
  });

  const modalRenameCancel = $('modal-rename-cancel');
  if (modalRenameCancel) modalRenameCancel.addEventListener('click', hideRenameModal);
  const modalRenameConfirm = $('modal-rename-confirm');
  if (modalRenameConfirm) modalRenameConfirm.addEventListener('click', confirmRenameModal);
  const modalRenameInput = $('modal-rename-input');
  if (modalRenameInput) modalRenameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmRenameModal();
    if (e.key === 'Escape') hideRenameModal();
  });

  const modalAlertOk = $('modal-alert-ok');
  if (modalAlertOk) modalAlertOk.addEventListener('click', () => {
    $('modal-alert').classList.add('hidden');
    if (alertResolve) { alertResolve(); alertResolve = null; }
  });

  const modalConfirmOk = $('modal-confirm-ok');
  const modalConfirmCancel = $('modal-confirm-cancel');
  if (modalConfirmOk) modalConfirmOk.addEventListener('click', () => {
    $('modal-confirm-dlg').classList.add('hidden');
    if (confirmResolve) { confirmResolve(true); confirmResolve = null; }
  });
  if (modalConfirmCancel) modalConfirmCancel.addEventListener('click', () => {
    $('modal-confirm-dlg').classList.add('hidden');
    if (confirmResolve) { confirmResolve(false); confirmResolve = null; }
  });

  function setupEditorUndoRedo(undoBtn, redoBtn, editorEl) {
    if (undoBtn) undoBtn.addEventListener('click', () => {
      editorEl?.focus();
      document.execCommand('undo');
    });
    if (redoBtn) redoBtn.addEventListener('click', () => {
      editorEl?.focus();
      document.execCommand('redo');
    });
  }
  setupEditorUndoRedo($('editor-undo'), $('editor-redo'), $('editor'));
  setupEditorUndoRedo(document.querySelector('.editor-left-undo'), document.querySelector('.editor-left-redo'), $('editor-left'));
  setupEditorUndoRedo(document.querySelector('.editor-right-undo'), document.querySelector('.editor-right-redo'), $('editor-right'));
  setupEditorDragAndDrop($('editor'), () => getTabById(state.activeTabId));
  setupEditorDragAndDrop($('editor-left'), () => {
    const id = $('editor-left')?.dataset.tabId;
    return id ? getTabById(id) : null;
  });
  setupEditorDragAndDrop($('editor-right'), () => {
    const id = $('editor-right')?.dataset.tabId;
    return id ? getTabById(id) : null;
  });

  const guideSidebar = $('guide-sidebar');
  if (guideSidebar) guideSidebar.addEventListener('click', async (e) => {
    const item = e.target.closest('.guide-item');
    if (item && item.dataset.guide) {
      guideSidebar.querySelectorAll('.guide-item').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
      await renderGuideContent(item.dataset.guide);
    }
  });

  (function setupCustomTooltip() {
    const el = $('custom-tooltip');
    if (!el) return;
    let hideTimer = null;
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { el.classList.remove('visible'); }, 80);
        return;
      }
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      const text = target.getAttribute('data-tooltip');
      if (!text) return;
      el.textContent = text;
      const x = e.clientX;
      const y = e.clientY + 14;
      el.style.left = Math.min(x, window.innerWidth - 20) + 'px';
      el.style.top = y + 'px';
      el.classList.add('visible');
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth - 8) el.style.left = (window.innerWidth - rect.width - 8) + 'px';
        if (rect.bottom > window.innerHeight - 8) el.style.top = (y - rect.height - 8) + 'px';
      });
    });
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !e.target.closest('[data-tooltip]')) return;
      if (e.relatedTarget.closest('[data-tooltip]')) return;
      el.classList.remove('visible');
    });
  })();

  document.addEventListener('click', () => {
    hideContextMenu();
    $('tab-context-menu')?.classList.add('hidden');
    hideAutocomplete();
    hideMoveMenu();
    hideEditorContextMenu();
  });

  setupResizers();
}

function closeTabsForProject(projectName) {
  state.tabs = state.tabs.filter(t => t.project !== projectName);
  const hadActive = state.activeTabId && state.tabs.every(t => t.id !== state.activeTabId);
  state.activeTabId = state.tabs[0]?.id || null;
  renderTabs();
  saveSession();
  if (hadActive && state.tabs.length === 0) {
    if (state.dualPane) {
      state.dualPane = false;
      $('single-pane')?.classList.remove('hidden');
      $('dual-pane-container')?.classList.add('hidden');
    }
    $('editor-wrapper')?.classList.add('hidden');
    $('placeholder')?.classList.remove('hidden');
    $('editor').value = '';
    $('guide-panel')?.classList.add('hidden');
  } else if (hadActive && state.activeTabId) {
    switchTab(state.activeTabId);
  }
}

function mdToHtml(raw) {
  return raw
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

async function renderGuideContent(which) {
  const content = $('guide-content');
  if (!content) return;
  let html = '';
  if (which === 'readme') {
    const raw = t('readmeContent');
    html = mdToHtml(raw);
    content.innerHTML = html;
  } else if (which === 'license') {
    const raw = t('licenseContent') || 'MIT License';
    const v = (window.lumenAPI?.getAppVersion ? await window.lumenAPI.getAppVersion() : '1.0.0');
    content.innerHTML = `
      <h1>${escapeHtml(t('guideLicense'))}</h1>
      <p style="font-size:14px;margin-top:12px;color:var(--text-muted);line-height:1.6">${escapeHtml(t('licenseStorageHint') || '')}</p>
      <p style="font-size:16px;margin-top:16px;font-weight:600">${escapeHtml(t('guideVersion'))}：${escapeHtml(v)}</p>
      <p style="font-size:16px;margin-top:4px;font-weight:600">${escapeHtml(t('authorLabel') || '作者')}：${escapeHtml(t('authorName') || 'Sciely Siu')}</p>
      <div style="margin-top:16px">${mdToHtml(raw)}</div>
    `;
  } else if (which === 'lang') {
    const langs = [
      { code: 'en', label: 'English' },
      { code: 'zh', label: '中文' },
      { code: 'fr', label: 'Français' },
      { code: 'ja', label: '日本語' },
      { code: 'ko', label: '한국어' },
      { code: 'de', label: 'Deutsch' },
      { code: 'it', label: 'Italiano' },
    ];
    const current = getLang();
    content.innerHTML = `
      <h1>${t('languageSettings')}</h1>
      <div class="settings-lang-list">
        ${langs.map(l => `<button type="button" class="settings-lang-option${l.code === current ? ' active' : ''}" data-lang="${l.code}">${l.label}</button>`).join(' ')}
      </div>
      <p style="font-size:12px;color:var(--text-muted)">${t('storageReloadHint')}</p>
    `;
    content.querySelectorAll('.settings-lang-option').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.lang;
        if (window.setLang) window.setLang(code);
        updateUIText();
        await refreshProjects();
        renderTabs();
        if (state.inboxView) {
          const labelEl = document.querySelector('.inbox-tab-label');
          if (labelEl) labelEl.textContent = t('inbox');
        }
        syncInboxToggleButton();
        await renderGuideContent('lang');
      });
    });
  } else if (which === 'storage') {
    const pathStr = await window.lumenAPI.getKnowledgeBasePath();
    content.innerHTML = `
      <h1>${escapeHtml(t('storageTitle'))}</h1>
      <p>${escapeHtml(t('storagePathDesc') || '')}</p>
      <p><strong>${escapeHtml(t('storagePathLabel'))}</strong></p>
      <p style="word-break:break-all;font-family:var(--font-mono);font-size:13px;background:var(--bg-hover);padding:10px;border-radius:6px">${escapeHtml(pathStr)}</p>
      <p style="margin-top:16px">
        <button type="button" class="btn btn-primary" id="guide-storage-change">${escapeHtml(t('storageChangeBtn'))}</button>
      </p>
      <p style="font-size:12px;color:var(--text-muted);margin-top:12px">${escapeHtml(t('storageReloadHint'))}</p>
    `;
    const ch = $('guide-storage-change');
    if (ch) {
      ch.addEventListener('click', async () => {
        const picked = await window.lumenAPI.chooseKnowledgeBasePath();
        if (picked) {
          try {
            await window.lumenAPI.ensureKnowledgeBase();
          } catch (e) {
            console.error(e);
          }
          location.reload();
        }
      });
    }
  }
}

async function showGuide() {
  // 记录当前是否展开了暂存区，并暂时关闭双栏，进入指南视图
  state.inboxWasOpenBeforeGuide = state.inboxView;
  if (state.inboxView) {
    await hideInboxView();
  }
  setVerticalNavActive('guide');
  document.body.classList.add('guide-mode');
  if (state.dualPane) {
    state.dualPane = false;
    $('single-pane').classList.remove('hidden');
    $('dual-pane-container').classList.add('hidden');
    const prevTab = getTabById(state.activeTabId);
    if (prevTab) {
      $('editor').value = prevTab.content;
      $('editor').dataset.tabId = state.activeTabId;
    }
  }
  $('editor-wrapper')?.classList.add('hidden');
  $('placeholder')?.classList.add('hidden');
  $('guide-panel')?.classList.remove('hidden');
  const sidebar = $('guide-sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('.guide-item').forEach(x => x.classList.remove('active'));
    const active = sidebar.querySelector('.guide-item[data-guide="readme"]');
    if (active) active.classList.add('active');
  }
  renderGuideContent('readme');
}

function getEditorTabId(editorEl) {
  if (editorEl.dataset.pane === 'inbox') return INBOX_ID;
  return editorEl.dataset.tabId || null;
}

function doEditorCut(editorEl) {
  const start = editorEl.selectionStart, end = editorEl.selectionEnd;
  const sel = editorEl.value.slice(start, end);
  if (sel) {
    navigator.clipboard?.writeText(sel);
    const val = editorEl.value;
    editorEl.value = val.slice(0, start) + val.slice(end);
    editorEl.setSelectionRange(start, start);
    const tid = getEditorTabId(editorEl);
    if (editorEl.dataset.pane === 'inbox') {
      scheduleInboxSave();
    } else if (tid) { const tab = getTabById(tid); if (tab) tab.content = editorEl.value; scheduleSave(tid); }
  }
}

function doEditorCopy(editorEl) {
  const sel = editorEl.value.slice(editorEl.selectionStart, editorEl.selectionEnd);
  if (sel) navigator.clipboard?.writeText(sel);
}

async function doEditorPaste(editorEl) {
  const text = await navigator.clipboard?.readText();
  if (!text) return;
  const start = editorEl.selectionStart, end = editorEl.selectionEnd;
  const val = editorEl.value;
  editorEl.value = val.slice(0, start) + text + val.slice(end);
  editorEl.setSelectionRange(start + text.length, start + text.length);
  const tid = getEditorTabId(editorEl);
  if (editorEl.dataset.pane === 'inbox') {
    scheduleInboxSave();
  } else if (tid) { const tab = getTabById(tid); if (tab) tab.content = editorEl.value; scheduleSave(tid); }
}

function doEditorDelete(editorEl) {
  const start = editorEl.selectionStart, end = editorEl.selectionEnd;
  if (start !== end) {
    const val = editorEl.value;
    editorEl.value = val.slice(0, start) + val.slice(end);
    editorEl.setSelectionRange(start, start);
    const tid = getEditorTabId(editorEl);
    if (editorEl.dataset.pane === 'inbox') {
      scheduleInboxSave();
    } else if (tid) { const tab = getTabById(tid); if (tab) tab.content = editorEl.value; scheduleSave(tid); }
  }
}

function buildAttachmentMarkdown(attachments) {
  let md = '';
  for (const a of attachments) {
    const raw = a.path || a.name || '';
    const name = a.name || raw;
    const p = name.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(p)) {
      // 图片：缩略图模式（Markdown 图片语法），只显示文件名
      md += `![${name}]\n`;
    } else {
      // 其他附件：普通文本链接样式，只显示文件名
      md += `[${name}]\n`;
    }
  }
  return md;
}

async function insertAttachmentAtCursor(editorEl, projectName, noteName, kind, explicitPaths) {
  if (!window.lumenAPI?.insertAttachments) return;
  const attachments = await window.lumenAPI.insertAttachments(projectName, noteName, kind || 'file', explicitPaths);
  if (!attachments || attachments.length === 0) return;
  const md = buildAttachmentMarkdown(attachments);
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const val = editorEl.value;
  const prefix = val.slice(0, start);
  const suffix = val.slice(end);
  const needsLeadingNewline = prefix && !prefix.endsWith('\n');
  const insertText = (needsLeadingNewline ? '\n' : '') + md;
  editorEl.value = prefix + insertText + suffix;
  const pos = prefix.length + insertText.length;
  editorEl.setSelectionRange(pos, pos);
  const tid = getEditorTabId(editorEl);
  if (editorEl.dataset.pane === 'inbox') {
    scheduleInboxSave();
  } else if (tid) {
    const tab = getTabById(tid);
    if (tab) tab.content = editorEl.value;
    scheduleSave(tid);
  }
}

function getAttachmentPathAtCursor(editorEl) {
  const pos = editorEl.selectionStart;
  const val = editorEl.value;
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
  const nextNl = val.indexOf('\n', pos);
  const lineEnd = nextNl === -1 ? val.length : nextNl;
  const line = val.slice(lineStart, lineEnd);
  // 先尝试 [text](path) 形式
  const m = line.match(/\[[^\]]*]\(([^)]+)\)/);
  if (m) return m[1];
  // 再尝试 ![name] 或 [name] 形式，直接把名字当作文件名
  const m2 = line.match(/!?\[([^\]]+)]/);
  return m2 ? m2[1] : null;
}

function getAttachmentBlockLineAtSelection(editorEl) {
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const val = editorEl.value;
  const lineStart = val.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = val.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = val.length;
  const line = val.slice(lineStart, lineEnd);
  const isBlock = /!?\[[^\]]+]/.test(line);
  if (!isBlock) return null;
  const removeEnd = lineEnd + (val[lineEnd] === '\n' ? 1 : 0);
  return { lineStart, removeEnd, fullLine: val.slice(lineStart, removeEnd) };
}

async function showEditorContextMenu(e, editorEl) {
  const tid = editorEl.dataset.tabId;
  const tab = getTabById(tid);
  const isInbox = editorEl.dataset.pane === 'inbox' || tab?.id === INBOX_ID;
  const sel = editorEl.value.slice(editorEl.selectionStart, editorEl.selectionEnd);
  const hasSelection = sel.length > 0;
  const attachmentPath = getAttachmentPathAtCursor(editorEl);
  const menu = $('editor-context-menu');
  menu.innerHTML = '';
  let clipboardText = '';
  try {
    clipboardText = (await navigator.clipboard?.readText()) || '';
  } catch (err) {
    clipboardText = '';
  }
  const hasClipboard = !!clipboardText;
  const items = [
    { id: 'cut', label: t('cut'), exec: () => doEditorCut(editorEl), enabled: hasSelection },
    { id: 'copy', label: t('copy'), exec: () => doEditorCopy(editorEl), enabled: hasSelection },
    { id: 'paste', label: t('paste'), exec: () => doEditorPaste(editorEl), enabled: hasClipboard },
    { id: 'sep' },
    { id: 'delete', label: t('deleteSelection'), exec: () => doEditorDelete(editorEl), enabled: hasSelection },
    { id: 'sep2' },
    { id: 'selectAll', label: t('selectAll'), exec: () => { editorEl.select(); }, enabled: true }
  ];
  if (!isInbox && tab && tab.project && tab.note) {
    items.push({ id: 'sepAttach' });
    items.push({
      id: 'attachFile',
      label: t('insertFileAttachment'),
      exec: () => insertAttachmentAtCursor(editorEl, tab.project, tab.note, 'file')
    });
    if (attachmentPath) {
      items.push({
        id: 'openAttachment',
        label: t('openAttachment'),
        exec: () => {
          if (window.lumenAPI?.openAttachment) {
            window.lumenAPI.openAttachment(tab.project, tab.note, attachmentPath);
          }
        }
      });
    }
  }
  items.push({ id: 'sepMove' });
  items.push({
    id: 'move',
    label: t('moveToProject'),
    exec: () => {
      state.moveContext = { editorEl, tabId: tid || INBOX_ID, selectedText: sel };
      showMoveMenu(e.clientX, e.clientY);
    },
    enabled: isInbox && hasSelection
  });
  items.forEach(item => {
    if (item.id === 'sep' || item.id === 'sep2' || item.id === 'sepAttach' || item.id === 'sepMove') {
      menu.appendChild(document.createElement('hr'));
      return;
    }
    const div = document.createElement('div');
    const enabled = item.enabled !== false;
    div.className = 'context-item' + (enabled ? '' : ' disabled');
    div.textContent = item.label;
    if (enabled) {
      div.onclick = () => { item.exec(); hideEditorContextMenu(); };
    }
    menu.appendChild(div);
  });
  let x = e.clientX;
  let y = e.clientY;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');
  const rect = menu.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (rect.right > vw) x = Math.max(0, vw - rect.width - 8);
  if (rect.bottom > vh) y = Math.max(0, vh - rect.height - 8);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  e.preventDefault();
}

function setupEditorDragAndDrop(editorEl, getTab) {
  if (!editorEl) return;
  editorEl.addEventListener('dragstart', (e) => {
    const info = getAttachmentBlockLineAtSelection(editorEl);
    if (info) {
      e.dataTransfer.setData('text/plain', info.fullLine);
      e.dataTransfer.effectAllowed = 'copyMove';
      state.dragSourceBlock = { editor: editorEl, start: info.lineStart, end: info.removeEnd };
    }
  });
  editorEl.addEventListener('dragend', () => {
    state.dragSourceBlock = null;
  });
  editorEl.addEventListener('dragover', (e) => {
    const dt = e.dataTransfer;
    if (!dt) return;
    const hasFiles = dt.files && dt.files.length > 0;
    const hasText = dt.types && dt.types.includes('text/plain');
    if (hasFiles || hasText) e.preventDefault();
  });
  editorEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (!dt) return;
    const tab = getTab();
    if (!tab || !tab.project || !tab.note) return;
    const files = Array.from(dt.files || []);
    if (files.length > 0) {
      const paths = files.map(f => f.path).filter(Boolean);
      if (!paths.length) return;
      await insertAttachmentAtCursor(editorEl, tab.project, tab.note, 'file', paths);
      return;
    }
    const text = dt.getData('text/plain');
    if (text) {
      let val = editorEl.value;
      const dropStart = editorEl.selectionStart;
      const dropEnd = editorEl.selectionEnd;
      const src = state.dragSourceBlock;
      if (src && src.editor === editorEl && /!?\[[^\]]+]/.test(text)) {
        const removeStart = src.start;
        const removeEnd = src.end;
        if (dropStart >= removeStart && dropStart < removeEnd) {
          state.dragSourceBlock = null;
          return;
        }
        val = val.slice(0, removeStart) + val.slice(removeEnd);
        const adjust = removeEnd - removeStart;
        const insertAt = dropStart > removeStart ? dropStart - adjust : dropStart;
        editorEl.value = val.slice(0, insertAt) + text + val.slice(insertAt);
        editorEl.setSelectionRange(insertAt + text.length, insertAt + text.length);
      } else {
        editorEl.value = val.slice(0, dropStart) + text + val.slice(dropEnd);
        editorEl.setSelectionRange(dropStart + text.length, dropStart + text.length);
      }
      state.dragSourceBlock = null;
      const tid = getEditorTabId(editorEl);
      if (editorEl.dataset.pane === 'inbox') {
        scheduleInboxSave();
      } else if (tid) {
        const currentTab = getTabById(tid);
        if (currentTab) currentTab.content = editorEl.value;
        scheduleSave(tid);
      }
    }
  });
}

function getProjectAndNoteFromTabId(id) {
  if (!id || id === INBOX_ID) return null;
  const idx = id.indexOf('/');
  if (idx === -1) return null;
  const project = id.slice(0, idx);
  const note = id.slice(idx + 1);
  return { project, note };
}

async function handleDropToNoteTarget(e, targetTabId) {
  const dt = e.dataTransfer;
  if (!dt) return;
  const info = getProjectAndNoteFromTabId(targetTabId);
  if (!info) return;
  const { project, note } = info;
  const files = Array.from(dt.files || []);
  if (files.length > 0) {
    const paths = files.map(f => f.path).filter(Boolean);
    if (!paths.length) return;
    if (!window.lumenAPI?.insertAttachments) return;
    const attachments = await window.lumenAPI.insertAttachments(project, note, 'file', paths);
    if (!attachments || attachments.length === 0) return;
    const md = buildAttachmentMarkdown(attachments);
    if (window.lumenAPI.appendToNote) {
      await window.lumenAPI.appendToNote(project, note, md);
    }
    const id = tabId(project, note);
    const tab = getTabById(id);
    if (tab) {
      tab.content = (tab.content || '') + (tab.content && !tab.content.endsWith('\n') ? '\n' : '') + md;
      if (state.activeTabId === id) {
        const ed = getCurrentEditor();
        if (ed && ed.dataset.tabId === id) {
          ed.value = tab.content;
        }
      }
    }
    renderTabs();
    saveSession();
    return;
  }
  const text = dt.getData('text/plain');
  if (text && window.lumenAPI?.appendToNote) {
    await window.lumenAPI.appendToNote(project, note, text);
    const id = tabId(project, note);
    const tab = getTabById(id);
    if (tab) {
      tab.content = (tab.content || '') + (tab.content && !tab.content.endsWith('\n') ? '\n' : '') + text;
      if (state.activeTabId === id) {
        const ed = getCurrentEditor();
        if (ed && ed.dataset.tabId === id) {
          ed.value = tab.content;
        }
      }
    }
    if (state.dragSourceBlock && /<!-- @block:/.test(text)) {
      const src = state.dragSourceBlock;
      const val = src.editor.value;
      src.editor.value = val.slice(0, src.start) + val.slice(src.end);
      const sid = getEditorTabId(src.editor);
      if (sid) {
        const stab = getTabById(sid);
        if (stab) stab.content = src.editor.value;
        scheduleSave(sid);
      }
      state.dragSourceBlock = null;
    }
    renderTabs();
    saveSession();
  }
}

function hideEditorContextMenu() {
  const m = $('editor-context-menu');
  if (m) m.classList.add('hidden');
}

function setupResizers() {
  const sidebarResizer = $('resizer-sidebar');
  const paneResizer = $('resizer-panes');
  const tabsResizer = $('resizer-tabs');
  const inboxResizer = $('resizer-inbox');
  if (inboxResizer) {
    // 灵感区宽度固定为正文宽度的 1/4，不再通过分割线拖动调整
    inboxResizer.style.cursor = 'default';
  }
  if (tabsResizer) {
    let startX, startR;
    tabsResizer.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startR = state.paneRatio;
      const bar = $('tabs-bar');
      const w = bar ? bar.offsetWidth : 400;
      const onMove = (e2) => {
        const dx = (e2.clientX - startX) / w;
        state.paneRatio = Math.max(0.2, Math.min(0.8, startR + dx));
        applyTabsBarRatio();
        applyPaneRatio();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        localStorage.setItem('lumen_pane_ratio', String(state.paneRatio));
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
  if (sidebarResizer) {
    let startX, startW;
    sidebarResizer.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startW = state.sidebarWidth;
      const onMove = (e2) => {
        const delta = e2.clientX - startX;
        state.sidebarWidth = Math.max(120, Math.min(400, startW + delta));
        applySidebarWidth();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        localStorage.setItem('lumen_sidebar_width', String(state.sidebarWidth));
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
  if (paneResizer) {
    let startX, startR;
    paneResizer.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      startR = state.paneRatio;
      const onMove = (e2) => {
        const container = paneResizer.parentElement;
        const w = container.offsetWidth;
        const dx = (e2.clientX - startX) / w;
        state.paneRatio = Math.max(0.2, Math.min(0.8, startR + dx));
        applyPaneRatio();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        localStorage.setItem('lumen_pane_ratio', String(state.paneRatio));
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
}

async function exportProject(projectName) {
  try {
    const content = await window.lumenAPI.exportProjectContent(projectName);
    const basePath = await window.lumenAPI.getKnowledgeBasePath();
    const fp = await window.lumenAPI.showSaveDialog(`${basePath}/${projectName}.md`, [{ name: 'Markdown', extensions: ['md'] }]);
    if (fp) {
      await window.lumenAPI.writeExportFile(fp, content);
    }
  } catch (e) {
    showAlert(e.message);
  }
}

async function exportNote(projectName, noteName) {
  try {
    const tab = getTabById(tabId(projectName, noteName));
    const content = tab ? tab.content : await window.lumenAPI.exportNoteContent(projectName, noteName);
    const fp = await window.lumenAPI.showSaveDialog(noteName, [{ name: 'Markdown', extensions: ['md'] }]);
    if (fp) {
      await window.lumenAPI.writeExportFile(fp, content);
      if (window.lumenAPI.exportNoteAssets) {
        await window.lumenAPI.exportNoteAssets(projectName, noteName, fp);
      }
    }
  } catch (e) {
    showAlert(e.message);
  }
}

async function showMoveMenu(x, y) {
  if (!state.moveContext) return;
  const menu = $('move-menu');
  menu.innerHTML = `<div class="move-menu-title">${t('moveToProject')}</div>`;
  const projects = await window.lumenAPI.listProjects();
  if (projects.length === 0) {
    const div = document.createElement('div');
    div.className = 'move-menu-item disabled';
    div.textContent = t('noProjects');
    menu.appendChild(div);
  } else {
    for (const project of projects) {
      const notes = await window.lumenAPI.listNotes(project);
      for (const note of notes) {
        const div = document.createElement('div');
        div.className = 'move-menu-item';
        div.textContent = `${project} / ${note}`;
        div.dataset.project = project;
        div.dataset.note = note;
        div.onclick = async () => {
          await doMoveToNote(project, note);
          hideMoveMenu();
        };
        menu.appendChild(div);
      }
      if (notes.length === 0) {
        const div = document.createElement('div');
        div.className = 'move-menu-item';
        div.textContent = `${project} / (${t('newNote')})`;
        div.dataset.project = project;
        div.dataset.note = '';
        div.onclick = async () => {
          const noteName = getDateNoteName();
          const title = noteName.replace('.md', '');
          await window.lumenAPI.createNote(project, noteName, `# ${title}\n\n`);
          await doMoveToNote(project, noteName);
          hideMoveMenu();
        };
        menu.appendChild(div);
      }
    }
  }
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');
}

function hideMoveMenu() {
  $('move-menu').classList.add('hidden');
  state.moveContext = null;
}

async function doMoveToNote(project, note) {
  const ctx = state.moveContext;
  if (!ctx) return;
  const editorEl = ctx.editorEl;
  const sel = ctx.selectedText;
  const fullContent = editorEl.value;
  const start = editorEl.selectionStart;
  const end = editorEl.selectionEnd;
  const before = fullContent.slice(0, start);
  const after = fullContent.slice(end);
  let newContent = before + after;
  newContent = newContent.replace(/\n{3,}/g, '\n\n').trim();
  if (newContent && !newContent.endsWith('\n')) newContent += '\n';
  try {
    const inboxDateStr = editorEl.dataset.pane === 'inbox' ? state.inboxCurrentDay : null;
    await window.lumenAPI.moveToNote(project, note, sel, newContent, inboxDateStr);
    const tab = getTabById(ctx.tabId);
    if (tab) tab.content = newContent;
    editorEl.value = newContent;
    if (editorEl.dataset.pane === 'inbox') scheduleInboxSave();
    editorEl.setSelectionRange(start, start);
    await refreshProjects();
  } catch (e) {
    showAlert(e.message);
  }
}

let noteModalResolve = null;

async function getUniqueDateNoteName(projectName) {
  if (!projectName) return getDateNoteName();
  const base = getDateNoteName().replace('.md', '');
  const notes = await window.lumenAPI.listNotes(projectName).catch(() => []);
  const baseNote = base + '.md';
  if (!notes.includes(baseNote)) return baseNote;
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}.md`;
    if (!notes.includes(candidate)) return candidate;
  }
}

async function showNoteModal(projectName) {
  const defaultName = await getUniqueDateNoteName(projectName);
  $('modal-label').textContent = t('noteName');
  const input = $('modal-input');
  input.value = defaultName;
  input.placeholder = t('noteNamePlaceholder');
  $('modal-use-template').checked = false;
  $('modal-template-label').textContent = t('useTemplate');
  $('modal').classList.remove('hidden');
  input.focus();
  input.select();
  return new Promise(resolve => {
    noteModalResolve = { resolve, projectName };
  });
}

function hideNoteModal() {
  $('modal').classList.add('hidden');
  if (noteModalResolve) {
    noteModalResolve.resolve(null);
    noteModalResolve = null;
  }
}

function confirmNoteModal() {
  const val = $('modal-input').value.trim();
  const useTemplate = $('modal-use-template').checked;
  $('modal').classList.add('hidden');
  if (noteModalResolve) {
    noteModalResolve.resolve({ name: val, useTemplate, projectName: noteModalResolve.projectName });
    noteModalResolve = null;
  }
}

let projectModalResolve = null;

function showNewProjectModal(initialValue = '') {
  $('modal-project-label').textContent = t('projectNameLabel');
  $('modal-project-input').value = initialValue;
  const tplCheck = $('modal-project-use-template');
  if (tplCheck) tplCheck.checked = false;
  $('modal-project-template-label').textContent = t('useProjectTemplate');
  $('modal-project').classList.remove('hidden');
  $('modal-project-input').focus();
  return new Promise(resolve => { projectModalResolve = resolve; });
}

function hideProjectModal() {
  $('modal-project').classList.add('hidden');
  if (projectModalResolve) {
    projectModalResolve(null);
    projectModalResolve = null;
  }
}

function confirmProjectModal() {
  const val = $('modal-project-input').value.trim();
  const useTemplate = $('modal-project-use-template')?.checked ?? false;
  $('modal-project').classList.add('hidden');
  if (projectModalResolve) {
    projectModalResolve({ name: val, useTemplate });
    projectModalResolve = null;
  }
}

async function showNewProjectModalAndConfirm() {
  const result = await showNewProjectModal();
  if (!result || !result.name) return;
  const { name, useTemplate } = result;
  try {
    await window.lumenAPI.createProject(name);
    if (useTemplate) {
      const noteName = getDateNoteName();
      const title = noteName.replace('.md', '');
      const content = MD_TEMPLATE_PROJECT.replace('# 一级标题', `# ${title}`);
      await window.lumenAPI.createNote(name, noteName, content);
      await openNote(name, noteName);
      const tab = getTabById(tabId(name, noteName));
      if (tab) tab.content = content;
      const ed = getCurrentEditor();
      if (ed && ed.dataset.tabId === tabId(name, noteName)) ed.value = content;
    }
    await refreshProjects();
    state.expandedProjects[name] = true;
  } catch (e) {
    showAlert(e.message);
  }
}

async function showNewNoteModal(projectName) {
  const result = await showNoteModal(projectName);
  if (!result || !result.name) return;
  const noteName = result.name.endsWith('.md') ? result.name : result.name + '.md';
  const title = noteName.replace('.md', '');
  let initialContent = '';
  if (result.useTemplate) {
    initialContent = MD_TEMPLATE.replace('# 一级标题', `# ${title}`);
  } else {
    initialContent = `# ${title}\n\n`;
  }
  try {
    await window.lumenAPI.createNote(projectName, noteName, initialContent);
    await openNote(projectName, noteName);
    const tab = getTabById(tabId(projectName, noteName));
    if (tab) tab.content = initialContent;
    const ed = getCurrentEditor();
    if (ed && ed.dataset.tabId === tabId(projectName, noteName)) {
      ed.value = initialContent;
    }
    await refreshProjects();
  } catch (e) {
    showAlert(e.message);
  }
}

function addContextItem(menu, label, fn) {
  const el = document.createElement('div');
  el.className = 'context-item';
  el.textContent = label;
  el.onclick = async () => {
    menu.classList.add('hidden');
    await fn();
  };
  menu.appendChild(el);
}

function showContextMenu(x, y, items, contextType) {
  const menu = $('context-menu');
  menu.innerHTML = '';
  if (items.includes('copy') && state.contextTarget) {
    if (contextType === 'project') {
      addContextItem(menu, t('copy'), () => navigator.clipboard?.writeText(state.contextTarget.name));
    } else if (contextType === 'note') {
      addContextItem(menu, t('copy'), async () => {
        const tab = getTabById(tabId(state.contextTarget.project, state.contextTarget.note));
        const content = tab ? tab.content : await window.lumenAPI.readFile(`Projects/${state.contextTarget.project}/${state.contextTarget.note}`).catch(() => '');
        await navigator.clipboard?.writeText(content);
      });
    }
  }
  if (items.includes('cut') && state.contextTarget) {
    if (contextType === 'project') {
      addContextItem(menu, t('cut'), async () => {
        await navigator.clipboard?.writeText(state.contextTarget.name);
        if (await showConfirm(t('deleteProject') + '?')) {
          await window.lumenAPI.deleteProject(state.contextTarget.name);
          closeTabsForProject(state.contextTarget.name);
          await refreshProjects();
        }
      });
    } else if (contextType === 'note') {
      addContextItem(menu, t('cut'), async () => {
        const tab = getTabById(tabId(state.contextTarget.project, state.contextTarget.note));
        const content = tab ? tab.content : await window.lumenAPI.readFile(`Projects/${state.contextTarget.project}/${state.contextTarget.note}`).catch(() => '');
        await navigator.clipboard?.writeText(content);
        if (await showConfirm(t('deleteNote') + '?')) {
          await window.lumenAPI.deleteNote(state.contextTarget.project, state.contextTarget.note);
          closeTab(tabId(state.contextTarget.project, state.contextTarget.note));
          await refreshProjects();
        }
      });
    }
  }
  if (items.includes('paste') && contextType === 'note' && state.contextTarget?.project) {
    addContextItem(menu, t('paste'), async () => {
      const text = await navigator.clipboard?.readText();
      if (!text) return;
      const proj = state.contextTarget.project;
      const result = await showNoteModal(proj);
      if (!result?.name) return;
      const noteName = result.name.endsWith('.md') ? result.name : result.name + '.md';
      const title = noteName.replace('.md', '');
      const initialContent = result.useTemplate ? MD_TEMPLATE.replace('# 一级标题', `# ${title}`) : text;
      try {
        await window.lumenAPI.createNote(proj, noteName, initialContent);
        await openNote(proj, noteName);
        const tab = getTabById(tabId(proj, noteName));
        if (tab) tab.content = initialContent;
        const ed = getCurrentEditor();
        if (ed && ed.dataset.tabId === tabId(proj, noteName)) ed.value = initialContent;
        await refreshProjects();
      } catch (e) { showAlert(e.message); }
    });
  }
  if (items.includes('paste') && contextType === 'project') {
    addContextItem(menu, t('paste'), async () => {
      const text = (await navigator.clipboard?.readText())?.trim();
      if (text) {
        const result = await showNewProjectModal(text);
        if (result?.name) {
          try {
            await window.lumenAPI.createProject(result.name);
            await refreshProjects();
            state.expandedProjects[result.name] = true;
          } catch (e) { showAlert(e.message); }
        }
      }
    });
  }
  if (items.includes('rename') && state.contextTarget) {
    addContextItem(menu, t('rename'), () => showRenameModal(contextType));
  }
  if (items.includes('new-project')) {
    addContextItem(menu, t('newProject'), showNewProjectModalAndConfirm);
  }
  if (items.includes('new-note') && state.contextTarget?.name) {
    addContextItem(menu, t('newNote'), () => showNewNoteModal(state.contextTarget.name));
  }
  if (items.includes('export-project') && state.contextTarget?.name) {
    addContextItem(menu, t('exportProject'), () => exportProject(state.contextTarget.name));
  }
  if (items.includes('export-note') && state.contextTarget?.project) {
    addContextItem(menu, t('exportNote'), () => exportNote(state.contextTarget.project, state.contextTarget.note));
  }
  if (items.includes('delete-project') && state.contextTarget?.name) {
    addContextItem(menu, t('deleteProject'), async () => {
      if (await showConfirm(t('deleteProject') + '?')) {
        await window.lumenAPI.deleteProject(state.contextTarget.name);
        closeTabsForProject(state.contextTarget.name);
        await refreshProjects();
      }
    });
  }
  if (items.includes('delete-note') && state.contextTarget?.project) {
    addContextItem(menu, t('deleteNote'), async () => {
      if (await showConfirm(t('deleteNote') + '?')) {
        await window.lumenAPI.deleteNote(state.contextTarget.project, state.contextTarget.note);
        closeTab(tabId(state.contextTarget.project, state.contextTarget.note));
        await refreshProjects();
      }
    });
  }
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');
}

function showTabContextMenu(x, y, tabId) {
  const menu = $('tab-context-menu');
  menu.innerHTML = '';
  const tab = getTabById(tabId);
  if (!tab) return;
  addContextItem(menu, t('copy'), () => {
    navigator.clipboard?.writeText(tab.content);
    state.tabCopyContent = { content: tab.content, project: tab.project, isInbox: tab.id === INBOX_ID };
  });
  addContextItem(menu, t('paste'), async () => {
    const text = await navigator.clipboard?.readText();
    if (!text) return;
    const ed = (tabId === INBOX_ID && state.dualPane) ? $('editor-right') : (state.activeTabId === tabId ? getCurrentEditor() : null);
    const start = ed ? ed.selectionStart : 0, end = ed ? ed.selectionEnd : 0;
    const val = tab.content;
    tab.content = val.slice(0, start) + text + val.slice(end);
    if (ed && (ed.dataset.tabId === tabId || (tabId === INBOX_ID && ed.dataset.pane === 'inbox'))) {
      ed.value = tab.content;
      ed.setSelectionRange(start + text.length, start + text.length);
    }
    scheduleSave(tabId);
  });
  if (tab.id !== INBOX_ID) {
    addContextItem(menu, t('rename'), () => {
      state.contextTarget = { type: 'tab', tabId, project: tab.project, note: tab.note };
      showRenameModal('note', tab.note.replace('.md', ''));
    });
  }
  addContextItem(menu, t('exportNote'), async () => {
    if (tab.id === INBOX_ID) {
      const fp = await window.lumenAPI.showSaveDialog('Inbox.md', [{ name: 'Markdown', extensions: ['md'] }]);
      if (fp) await window.lumenAPI.writeExportFile(fp, tab.content);
    } else {
      await exportNote(tab.project, tab.note);
    }
  });
  if (tab.id !== INBOX_ID) {
    addContextItem(menu, t('deleteNote'), async () => {
      if (await showConfirm(t('deleteNote') + '?')) {
        await window.lumenAPI.deleteNote(tab.project, tab.note);
        closeTab(tabId);
        await refreshProjects();
      }
    });
  }
  addContextItem(menu, t('closeTab'), () => closeTab(tabId));
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.remove('hidden');
}

function showTabsBarContextMenu(x, y) {
  const menu = $('tab-context-menu');
  menu.innerHTML = '';
  if (state.tabCopyContent) {
    addContextItem(menu, t('paste'), async () => {
      const { content, project, isInbox } = state.tabCopyContent;
      if (isInbox) {
        if (state.projects.length === 0) {
          showAlert(t('noProjects'));
          return;
        }
        const proj = state.activeTabId ? (getTabById(state.activeTabId)?.project || state.projects[0]) : state.projects[0];
        const result = await showNoteModal(proj);
        if (result?.name) {
          const noteName = result.name.endsWith('.md') ? result.name : result.name + '.md';
          try {
            await window.lumenAPI.createNote(proj, noteName, content);
            await openNote(proj, noteName);
            const tab = getTabById(tabId(proj, noteName));
            if (tab) tab.content = content;
            const ed = getCurrentEditor();
            if (ed && ed.dataset.tabId === tabId(proj, noteName)) ed.value = content;
            await refreshProjects();
          } catch (e) { showAlert(e.message); }
        }
      } else {
        const result = await showNoteModal(project);
        if (result?.name) {
          const noteName = result.name.endsWith('.md') ? result.name : result.name + '.md';
          try {
            await window.lumenAPI.createNote(project, noteName, content);
            await openNote(project, noteName);
            const tab = getTabById(tabId(project, noteName));
            if (tab) tab.content = content;
            const ed = getCurrentEditor();
            if (ed && ed.dataset.tabId === tabId(project, noteName)) ed.value = content;
            await refreshProjects();
          } catch (e) { showAlert(e.message); }
        }
      }
    });
  }
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  if (menu.children.length) menu.classList.remove('hidden');
}

let renameModalResolve = null;

function showRenameModal(contextType, currentName) {
  state.renameContext = { type: contextType, ...state.contextTarget };
  $('modal-rename-label').textContent = t('rename');
  const def = contextType === 'project' ? (state.contextTarget?.name ?? '') : (state.contextTarget?.note?.replace('.md', '') ?? '');
  $('modal-rename-input').value = currentName ?? def;
  $('modal-rename').classList.remove('hidden');
  $('modal-rename-input').focus();
  $('modal-rename-input').select();
  return new Promise(r => { renameModalResolve = r; });
}

function hideRenameModal() {
  $('modal-rename').classList.add('hidden');
  if (renameModalResolve) {
    renameModalResolve(null);
    renameModalResolve = null;
  }
  state.renameContext = null;
}

async function confirmRenameModal() {
  const val = $('modal-rename-input').value.trim();
  $('modal-rename').classList.add('hidden');
  const ctx = state.renameContext;
  if (!renameModalResolve || !ctx || !val) {
    if (renameModalResolve) renameModalResolve(null);
    renameModalResolve = null;
    return;
  }
  try {
    if (ctx.type === 'project') {
      await window.lumenAPI.renameProject(ctx.name, val);
      const prevActive = getTabById(state.activeTabId);
      const keepActiveNote = prevActive?.project === ctx.name ? prevActive.note : null;
      state.tabs.forEach(t => {
        if (t.project === ctx.name) {
          t.project = val;
          t.id = tabId(val, t.note);
        }
      });
      if (keepActiveNote) state.activeTabId = tabId(val, keepActiveNote);
      renderTabs();
      updateSidebarActiveState();
    } else if (ctx.type === 'note' && ctx.project && ctx.note) {
      const newNote = val.endsWith('.md') ? val : val + '.md';
      await window.lumenAPI.renameNote(ctx.project, ctx.note, newNote);
      const oldId = tabId(ctx.project, ctx.note);
      const t = state.tabs.find(x => x.id === oldId);
      if (t) {
        t.note = newNote;
        t.id = tabId(ctx.project, newNote);
      }
      if (state.activeTabId === oldId) state.activeTabId = t?.id ?? null;
    } else if (ctx.type === 'tab' && ctx.project && ctx.note) {
      const newNote = val.endsWith('.md') ? val : val + '.md';
      await window.lumenAPI.renameNote(ctx.project, ctx.note, newNote);
      const oldId = tabId(ctx.project, ctx.note);
      const t = state.tabs.find(x => x.id === oldId);
      if (t) {
        t.note = newNote;
        t.id = tabId(ctx.project, newNote);
      }
      if (state.activeTabId === oldId) state.activeTabId = t?.id ?? null;
    }
    await refreshProjects();
    renderTabs();
    renameModalResolve(val);
  } catch (e) {
    showAlert(e.message);
    renameModalResolve(null);
  }
  renameModalResolve = null;
  state.renameContext = null;
}

function hideContextMenu() {
  $('context-menu').classList.add('hidden');
}

let alertResolve = null;
function showAlert(msg) {
  $('modal-alert-text').textContent = String(msg);
  $('modal-alert').classList.remove('hidden');
  return new Promise(r => { alertResolve = r; });
}

let confirmResolve = null;
function showConfirm(msg) {
  $('modal-confirm-text').textContent = String(msg);
  $('modal-confirm-dlg').classList.remove('hidden');
  return new Promise(r => { confirmResolve = r; });
}

async function handleEditorInput(editorEl) {
  const val = editorEl.value;
  const pos = editorEl.selectionStart;
  const before = val.slice(0, pos);
  if (before.endsWith('[[')) {
    await showAutocomplete(editorEl);
  } else {
    hideAutocomplete();
  }
}

async function showAutocomplete(editorEl) {
  const linkCache = await window.lumenAPI.getAllNotesForLink();
  const ac = $('autocomplete');
  ac.innerHTML = '';
  linkCache.slice(0, 20).forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item' + (i === 0 ? ' selected' : '');
    div.textContent = `${item.project}/${item.note}`;
    div.dataset.project = item.project;
    div.dataset.note = item.note;
    ac.appendChild(div);
  });
  if (linkCache.length === 0) {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.textContent = t('noProjects');
    ac.appendChild(div);
  }
  const rect = editorEl.getBoundingClientRect();
  ac.style.left = rect.left + 'px';
  ac.style.top = (rect.top + 60) + 'px';
  ac.classList.remove('hidden');
  ac.dataset.editorId = editorEl.id;
}

function hideAutocomplete() {
  $('autocomplete').classList.add('hidden');
}

$('autocomplete')?.addEventListener('click', async (e) => {
  const item = e.target.closest('.autocomplete-item');
  if (!item || !item.dataset.project) return;
  const project = item.dataset.project;
  const note = item.dataset.note;
  const editorEl = document.getElementById($('autocomplete').dataset.editorId);
  if (!editorEl) return;
  const pos = editorEl.selectionStart;
  const val = editorEl.value;
  const noteTitle = note.replace(/\.md$/i, '');
  const insert = `[[${project}/${noteTitle}]]`;
  const newVal = val.slice(0, pos - 2) + insert + val.slice(pos);
  editorEl.value = newVal;
  editorEl.setSelectionRange(pos - 2 + insert.length, pos - 2 + insert.length);
  hideAutocomplete();
});

function handleEditorClick(editorEl, e) {
  setTimeout(() => {
    const val = editorEl.value;
    const pos = editorEl.selectionStart;
    let start = pos - 1;
    while (start >= 0 && val[start] !== '[') start--;
    if (start < 0 || val[start] !== '[' || val[start + 1] !== '[') return;
    let end = start + 2;
    while (end < val.length - 1 && !(val[end] === ']' && val[end + 1] === ']')) end++;
    if (end >= val.length - 1) return;
    const link = val.slice(start + 2, end);
    const parts = link.split('/');
    const project = parts[0]?.trim();
    const notePart = parts.slice(1).join('/').trim() || '';
    const note = notePart && !notePart.endsWith('.md') ? notePart + '.md' : (notePart || '');
    if (project && pos >= start && pos <= end + 2) {
      openOrCreateLink(project, note || getDateNoteName(), editorEl);
    }
  }, 0);
}

async function openOrCreateLink(project, note, editorEl) {
  if (!project) return;
  if (!note.endsWith('.md')) note += '.md';
  const exists = await window.lumenAPI.noteExists(project, note);
  if (exists) {
    await openNote(project, note);
  } else {
    try {
      const title = note.replace('.md', '');
      await window.lumenAPI.createNote(project, note, `# ${title}\n\n`);
      await openNote(project, note);
    } catch (e) {
      showAlert(e.message);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init().catch(err => { console.error('Lumen init failed:', err); showAlert(t('startupFailed') + ': ' + err.message); }));
} else {
  init().catch(err => { console.error('Lumen init failed:', err); showAlert(t('startupFailed') + ': ' + err.message); });
}
