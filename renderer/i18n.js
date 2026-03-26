const LANGS = { zh: 'zh-CN', en: 'en', fr: 'fr', ko: 'ko', it: 'it', ja: 'ja', de: 'de' };
const DEFAULT_LANG = 'en';

const LANG_DETECTION_ORDER = ['zh', 'en', 'fr', 'ja', 'ko', 'de', 'it'];

const translations = {
  zh: {
    appTitle: '笔记本项目', inbox: '暂存区', projects: '项目', newProject: '新建项目', newNote: '新建笔记',
    deleteProject: '删除项目', deleteNote: '删除笔记', exportProject: '导出项目', exportNote: '导出笔记',
    copy: '复制', paste: '粘贴', cut: '剪切', selectAll: '全选', undo: '撤销', redo: '恢复',
    moveToProject: '移动到项目', noProjects: '暂无项目', chooseProject: '选择目标',
    deleteSelection: '删除',
    insertFileAttachment: '插入文件',
    openAttachment: '打开文件',
    toggleImageThumb: '缩略图模式',
    toggleImageMarkdown: 'Markdown 模式',
    noteName: '笔记名称', projectNameLabel: '项目名称', cancel: '取消', confirm: '确定', useTemplate: '使用 Markdown参考模板',
    useProjectTemplate: '使用 Markdown参考模板',
    templateStandard: 'Markdown参考模板', emptyHint: '点击上方+号新建笔记本项目，点击笔记本项目名称右侧+新建笔记页',
    tabLimit: '已达到上限，请关闭一个标签页', selectToStart: '选择项目或暂存区开始',
    guide: '操作指南', fold: '折叠', rename: '重命名', closeTab: '关闭', confirmCloseWindow: '确定要关闭窗口吗？',
    guideReadme: '操作指南', guideLicense: '开源协议', guideVersion: '版本号', languageSettings: '语言设置', guideStorage: '存储位置', guideAndLicense: '指南与协议',
    expandInbox: '展开暂存区', foldInbox: '折叠暂存区',
    storageTitle: '知识库存储位置', storagePathLabel: '当前路径', storagePathDesc: '以下路径为「知识库」根目录。项目笔记保存在其中的 Projects 文件夹；暂存区按日期保存在 Inbox 文件夹（每日一个 .md 文件）。更改路径后应用会重新加载，请事先备份数据。',
    storageChangeBtn: '更改…', storageReloadHint: '更改存储位置并确认后，界面将自动重新加载以载入新路径。',
    licenseStorageHint: '数据存储在本地知识库目录。您可在本页侧栏的「存储位置」中更改知识库根路径；具体目录结构说明见操作指南中的「存储位置」一节。',
    guideUninstall: '卸载程序', uninstallTitle: '卸载 LumNote', uninstallBtn: '卸载程序', uninstallHint: '将启动系统卸载向导，按提示完成卸载。', uninstallNotAvailable: '当前为开发/便携运行，卸载仅对通过安装包安装的版本可用。',
    windowMinimize: '最小化', windowMaximize: '最大化', windowRestore: '还原', windowClose: '关闭',
    sidebarFold: '折叠左栏',
    inboxDefaultBody: '在此记录临时想法，稍后整理到项目中',
    noteNamePlaceholder: '例如：2026-03-02.md',
    startupFailed: '启动失败',
    authorLabel: '作者',
    authorName: 'Sciely Siu',
    readmeContent: `# 操作指南

## 设计理念

- 本应用追求 **极简**：只保留写作和整理知识所必需的元素，避免干扰注意力的视觉噪音。
- 界面以 **纯文本** 为中心：所有内容都落在 Markdown 文本上，方便长期保存、搜索和迁移。
- 操作优先 **直觉与可预期**：右键菜单、快捷键和版式尽量贴近日常使用习惯，不额外制造新概念。
- 暂存区与项目笔记采用 **并列双栏**：左侧是结构化笔记，右侧是临时想法，方便在专注写作的同时快速收集点子。
- 所有数据默认存储在本地，强调 **可控性与隐私**，让你随时可以备份、同步或用其他编辑器打开。

## 项目与笔记

- **新建项目**：点击项目侧边栏顶部工具栏里的 **+** 按钮，在弹窗中输入名称并确认（可勾选使用 Markdown 参考模板）。
- **新建笔记**：
  - 鼠标悬停到项目行，点击右侧的 **+** 按钮，在弹窗中确认名称；
  - 或右键项目行，在菜单中选择「新建笔记」。
- **目录与标签**：侧边栏中的 **项目文件夹与笔记页数量不限**；顶部 **已打开笔记的标签页最多同时存在 6 个**。若标签较多无法一次看全，可在标签栏 **横向拖动滚动条**（或触控板横向滑动）查看其余标签。
- **重命名 / 删除 / 导出**：
  - 右键项目行：可复制名称、剪切（复制名称并删除项目）、粘贴（从剪贴板创建项目）、重命名、导出项目、删除项目。
  - 右键笔记行：可复制整篇内容、剪切（复制并删除）、粘贴为新笔记、重命名、导出笔记、删除笔记。

## 暂存区

- 暂存区用于快速记录临时想法；与笔记并排显示时，点击标签栏旁的 **箭头按钮** 可展开双栏，再次点击则 **折叠**（箭头方向会随展开/折叠切换）。
- 内容按 **自然日** 保存为 \`Inbox/YYYY-MM-DD.md\`；**文件名日期早于「今天往前数第 90 天」** 的暂存文件会在 **应用启动** 或 **打开暂存区** 时 **自动删除**（按日期文件名判断，与是否当天编辑无关）。请及时将重要内容整理进项目笔记。
- 空内容或默认提示为 **灰色占位**；开始输入后占位消失，正文为常规 **黑色**（随主题可能为深色模式下的浅色字）。

## 存储位置

- 在 **指南与协议** 中打开 **存储位置**，可查看当前知识库根目录，并通过「更改…」选择新的文件夹（应用会重新加载）。
- 典型结构：\`知识库根/Projects/项目名/笔记.md\`、\`知识库根/Inbox/日期.md\`。附件等资源与对应笔记保存在同一项目目录下。

## 文件导入与导出

- **导入到笔记**：在笔记编辑区使用右键菜单 **插入文件**（或拖入文件到编辑区），会在正文插入 Markdown 链接（图片可为 \`![](...)\` 形式）；文件会复制到当前笔记所在项目的资源目录，正文中表现为可点击的链接或内嵌图片。
- **导出笔记**：通过右键「导出笔记」可将 **当前 Markdown 正文** 存为文件；若笔记含附件/图片，可按提示 **一并导出资源**（与正文引用路径对应的文件会打包到目标位置，便于迁移）。
- **导出项目**：导出整个项目文件夹中的笔记与相关文件，便于备份或迁移。

## 指南、协议与语言

- 点击左侧 **「指南与协议」**：
  - **操作指南**：即本页；
  - **开源协议**：许可全文与版本信息；
  - **存储位置**：知识库路径设置（与语言设置并列）；
  - **语言设置**：切换界面语言。

## 链接与引用

- 在笔记或暂存区中输入 \`[[\` 会弹出 **自动补全**，用鼠标选择项目与笔记后，会插入完整 \`[[项目名/笔记名]]\` 形式的 **跨项目链接**（用于在文本中引用其他笔记标题路径）。
- 也可 **手动输入** \`[[项目名/笔记名]]\` 完成链接；请保证项目名、笔记名（不含 .md 后缀）与侧边栏一致。

## 快捷键

- **Ctrl+I / Ctrl+1**：展开 / 收起暂存区双栏。
- **Ctrl+S**：保存当前笔记。
- **Ctrl+Z / Ctrl+Y**：撤销 / 恢复。
- **Ctrl+F**（系统默认）：在当前编辑区搜索文本。`,
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`
  },
  en: {
    appTitle: 'LumNote', inbox: 'Inbox', projects: 'Projects', newProject: 'New Project', newNote: 'New Note',
    deleteProject: 'Delete Project', deleteNote: 'Delete Note', exportProject: 'Export Project', exportNote: 'Export Note',
    copy: 'Copy', paste: 'Paste', cut: 'Cut', selectAll: 'Select All', undo: 'Undo', redo: 'Redo',
    moveToProject: 'Move to Project', noProjects: 'No projects', chooseProject: 'Choose target',
    deleteSelection: 'Delete',
    insertFileAttachment: 'Insert file',
    openAttachment: 'Open file',
    toggleImageThumb: 'Thumbnail mode',
    toggleImageMarkdown: 'Markdown mode',
    noteName: 'Note name', projectNameLabel: 'Project name', cancel: 'Cancel', confirm: 'OK', useTemplate: 'Use Markdown reference template',
    useProjectTemplate: 'Use Markdown reference template',
    templateStandard: 'Markdown reference template', emptyHint: 'Click + above to create a project, click + next to project name to create a note',
    tabLimit: 'Tab limit reached. Close a tab first.', selectToStart: 'Select a project or inbox to start',
    guide: 'Guide', fold: 'Fold', rename: 'Rename', closeTab: 'Close', confirmCloseWindow: 'Close this window?',
    guideReadme: 'LumNote Guide', guideLicense: 'License', guideVersion: 'Version', guideStorage: 'Storage', guideAndLicense: 'Guide & License',
    expandInbox: 'Expand inbox', foldInbox: 'Collapse inbox',
    storageTitle: 'Knowledge Base Location', storagePathLabel: 'Current path',
    storagePathDesc: 'This folder is the knowledge base root: Projects holds your notebooks; Inbox holds one .md file per calendar day. After changing the path the app reloads—back up your data first.',
    storageChangeBtn: 'Change…', storageReloadHint: 'After you choose a new folder and confirm, the window will reload to use the new path.',
    licenseStorageHint: 'Your data stays on disk under the knowledge base folder. Use Guide → Storage in the sidebar to change the root path; see the main guide for the folder layout.',
    guideUninstall: 'Uninstall', uninstallTitle: 'Uninstall LumNote', uninstallBtn: 'Uninstall', uninstallHint: 'This will start the system uninstaller. Follow the wizard to remove the app.', uninstallNotAvailable: 'Uninstall is only available for the installed version (not when running in dev or portable).',
    windowMinimize: 'Minimize', windowMaximize: 'Maximize', windowRestore: 'Restore', windowClose: 'Close',
    sidebarFold: 'Collapse sidebar',
    inboxDefaultBody: 'Jot down quick ideas here; move them into project notes later.',
    noteNamePlaceholder: 'e.g. 2026-03-02.md',
    startupFailed: 'Startup failed',
    authorLabel: 'Author',
    authorName: 'Sciely Siu',
    readmeContent: `# LumNote Guide

## Basics
- **New project**: Sidebar + → enter name in the dialog (optional Markdown template).
- **New note**: Hover a project row and click +, or right-click the project → New Note.
- **Tabs vs tree**: Unlimited projects and notes in the sidebar; **at most 6 open note tabs**. If tabs overflow, **scroll the tab bar horizontally** (trackpad or scrollbar).
- **Inbox**: Open inbox for a dual pane; use the **chevron** on the tab bar to expand/collapse (direction flips when expanded).

## Inbox retention
- Daily files \`Inbox/YYYY-MM-DD.md\`. Files whose **date in the filename** is **older than 90 days** are removed when the app starts or when inbox is opened. Move important text into project notes.

## Storage
- **Guide → Storage**: view path and pick a new folder (app reloads). Typical: \`KB/Projects/…\`, \`KB/Inbox/…\`.

## Import / export
- **Import**: Right-click in the editor → Insert file, or drag files in → Markdown links; assets are copied next to the note.
- **Export note/project**: via context menu; exports Markdown and can include linked assets.

## Links
- Type \`[[\` for autocomplete; picking an item inserts a full \`[[Project/Note]]\` link. You can also type the wiki link manually.

## Guide panel
- **Guide**, **License**, **Storage** (path settings), **Language**.

## Shortcuts
- Ctrl+I / Ctrl+1: Inbox dual pane
- Ctrl+S: Save
- Ctrl+Z / Ctrl+Y: Undo / Redo`,
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0...`
  },
  fr: {
    appTitle: 'LumNote', inbox: 'Boîte de réception', projects: 'Projets', newProject: 'Nouveau projet', newNote: 'Nouvelle note',
    deleteProject: 'Supprimer le projet', deleteNote: 'Supprimer la note', exportProject: 'Exporter le projet', exportNote: 'Exporter la note',
    copy: 'Copier', paste: 'Coller', cut: 'Couper', selectAll: 'Tout sélectionner', undo: 'Annuler', redo: 'Rétablir',
    moveToProject: 'Déplacer vers le projet', noProjects: 'Aucun projet', chooseProject: 'Choisir la cible',
    deleteSelection: 'Supprimer',
    noteName: 'Nom de la note', projectNameLabel: 'Nom du projet', cancel: 'Annuler', confirm: 'OK', useTemplate: 'Utiliser le modèle MD',
    useProjectTemplate: 'Utiliser le modèle Markdown par défaut',
    templateStandard: 'Format standard', emptyHint: 'Créez un dossier dans Projects ou utilisez +',
    tabLimit: 'Limite atteinte. Fermez un onglet.', selectToStart: 'Sélectionnez un projet ou une boîte de réception',
    guide: 'Guide', fold: 'Replier', rename: 'Renommer', closeTab: 'Fermer', confirmCloseWindow: 'Fermer cette fenêtre ?',
    guideReadme: 'Guide LumNote', guideLicense: 'Licence', guideVersion: 'Version', languageSettings: 'Langue', guideStorage: 'Stockage', guideAndLicense: 'Guide et licence',
    expandInbox: 'Déplier la boîte de réception', foldInbox: 'Replier la boîte de réception',
    storageTitle: 'Emplacement de la base de connaissances', storagePathLabel: 'Chemin actuel',
    storagePathDesc: 'Racine : dossiers Projects et Inbox. Après changement de chemin, l’application se recharge ; sauvegardez vos données.',
    storageChangeBtn: 'Changer…', storageReloadHint: 'L’app se rechargera après modification.',
    licenseStorageHint: 'Données locales. Utilisez Guide → Stockage pour changer le dossier racine.',
    guideUninstall: 'Désinstaller', uninstallTitle: 'Désinstaller LumNote', uninstallBtn: 'Désinstaller', uninstallHint: 'Lance l’assistant de désinstallation.', uninstallNotAvailable: 'Disponible uniquement pour la version installée.',
    windowMinimize: 'Réduire', windowMaximize: 'Agrandir', windowRestore: 'Restaurer', windowClose: 'Fermer',
    sidebarFold: 'Replier la barre latérale',
    inboxDefaultBody: 'Notez vos idées ici ; classez-les ensuite dans un projet.',
    noteNamePlaceholder: 'ex. : 2026-03-02.md',
    startupFailed: 'Échec du démarrage',
    authorLabel: 'Auteur',
    authorName: 'Sciely Siu',
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    readmeContent: `# Guide LumNote

## Bases
- **Nouveau projet** : Cliquez sur + dans la barre latérale
- **Nouvelle note** : Clic droit sur le projet → Nouvelle note
- **Boîte de réception** : Cliquez sur le bouton pour capturer rapidement
- **Mode double** : Cliquez sur ⫿ pour afficher côte à côte`
  },
  ko: {
    appTitle: 'LumNote', inbox: '받은편지함', projects: '프로젝트', newProject: '새 프로젝트', newNote: '새 메모',
    deleteProject: '프로젝트 삭제', deleteNote: '메모 삭제', exportProject: '프로젝트 내보내기', exportNote: '메모 내보내기',
    copy: '복사', paste: '붙여넣기', cut: '잘라내기', selectAll: '전체 선택', undo: '실행 취소', redo: '다시 실행',
    moveToProject: '프로젝트로 이동', noProjects: '프로젝트 없음', chooseProject: '대상 선택',
    deleteSelection: '삭제',
    noteName: '메모 이름', projectNameLabel: '프로젝트 이름', cancel: '취소', confirm: '확인', useTemplate: 'MD 템플릿 사용',
    useProjectTemplate: '기본 Markdown 템플릿 사용',
    templateStandard: '표준 형식', emptyHint: 'Projects에 폴더를 만들거나 +를 사용하세요',
    tabLimit: '탭 한도 도달. 탭을 닫으세요.', selectToStart: '프로젝트 또는 받은편지함을 선택하세요',
    guide: '가이드', fold: '접기', rename: '이름 바꾸기', closeTab: '닫기', confirmCloseWindow: '창을 닫을까요?',
    guideReadme: 'LumNote 가이드', guideLicense: '라이선스', guideVersion: '버전', languageSettings: '언어', guideStorage: '저장 위치', guideAndLicense: '가이드 및 라이선스',
    expandInbox: '받은편지함 펼치기', foldInbox: '받은편지함 접기',
    storageTitle: '지식 베이스 위치', storagePathLabel: '현재 경로',
    storagePathDesc: '프로젝트는 Projects, 받은편지함은 Inbox 폴더에 저장됩니다. 경로 변경 후 앱이 다시 로드됩니다.',
    storageChangeBtn: '변경…', storageReloadHint: '변경 후 앱이 다시 로드됩니다.',
    licenseStorageHint: '데이터는 로컬에 저장됩니다. 가이드 → 저장 위치에서 루트 폴더를 변경할 수 있습니다.',
    guideUninstall: '제거', uninstallTitle: 'LumNote 제거', uninstallBtn: '제거', uninstallHint: '시스템 제거 마법사를 시작합니다.', uninstallNotAvailable: '설치된 버전에서만 사용할 수 있습니다.',
    windowMinimize: '최소화', windowMaximize: '최대화', windowRestore: '복원', windowClose: '닫기',
    sidebarFold: '사이드바 접기',
    inboxDefaultBody: '여기에 임시 아이디어를 적고, 나중에 프로젝트 메모로 옮기세요.',
    noteNamePlaceholder: '예: 2026-03-02.md',
    startupFailed: '시작 실패',
    authorLabel: '저자',
    authorName: 'Sciely Siu',
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    readmeContent: `# LumNote 가이드

## 기본
- **새 프로젝트**: 사이드바에서 + 클릭
- **새 메모**: 프로젝트 우클릭 → 새 메모
- **받은편지함**: 빠른 캡처용`
  },
  it: {
    appTitle: 'LumNote', inbox: 'Inbox', projects: 'Progetti', newProject: 'Nuovo progetto', newNote: 'Nuova nota',
    deleteProject: 'Elimina progetto', deleteNote: 'Elimina nota', exportProject: 'Esporta progetto', exportNote: 'Esporta nota',
    copy: 'Copia', paste: 'Incolla', cut: 'Taglia', selectAll: 'Seleziona tutto', undo: 'Annulla', redo: 'Ripeti',
    moveToProject: 'Sposta nel progetto', noProjects: 'Nessun progetto', chooseProject: 'Scegli destinazione',
    deleteSelection: 'Elimina',
    noteName: 'Nome nota', projectNameLabel: 'Nome progetto', cancel: 'Annulla', confirm: 'OK', useTemplate: 'Usa modello MD',
    useProjectTemplate: 'Usa modello Markdown predefinito',
    templateStandard: 'Formato standard', emptyHint: 'Crea cartella in Projects o usa +',
    tabLimit: 'Limite tab raggiunto. Chiudi un tab.', selectToStart: 'Seleziona un progetto o inbox',
    guide: 'Guida', fold: 'Comprimi', rename: 'Rinomina', closeTab: 'Chiudi', confirmCloseWindow: 'Chiudere la finestra?',
    guideReadme: 'Guida LumNote', guideLicense: 'Licenza', guideVersion: 'Versione', languageSettings: 'Lingua', guideStorage: 'Archiviazione', guideAndLicense: 'Guida e licenza',
    expandInbox: 'Espandi inbox', foldInbox: 'Comprimi inbox',
    storageTitle: 'Posizione base di conoscenza', storagePathLabel: 'Percorso attuale',
    storagePathDesc: 'Cartelle Projects e Inbox nella radice. Dopo il cambio percorso l\'app si ricarica.',
    storageChangeBtn: 'Cambia…', storageReloadHint: 'L\'app si ricaricherà dopo la modifica.',
    licenseStorageHint: 'Dati locali. Usa Guida → Archiviazione per cambiare la cartella radice.',
    guideUninstall: 'Disinstalla', uninstallTitle: 'Disinstalla LumNote', uninstallBtn: 'Disinstalla', uninstallHint: 'Si aprirà la disinstallazione di sistema.', uninstallNotAvailable: 'Solo per la versione installata.',
    windowMinimize: 'Riduci a icona', windowMaximize: 'Ingrandisci', windowRestore: 'Ripristina', windowClose: 'Chiudi',
    sidebarFold: 'Comprimi barra laterale',
    inboxDefaultBody: 'Annota qui idee veloci; spostale poi nelle note di progetto.',
    noteNamePlaceholder: 'es. 2026-03-02.md',
    startupFailed: 'Avvio non riuscito',
    authorLabel: 'Autore',
    authorName: 'Sciely Siu',
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    readmeContent: `# Guida LumNote

## Base
- **Nuovo progetto**: Clicca + nella barra laterale
- **Nuova nota**: Tasto destro sul progetto → Nuova nota
- **Inbox**: Clicca per acquisizione rapida`
  },
  ja: {
    appTitle: 'LumNote', inbox: '受信箱', projects: 'プロジェクト', newProject: '新規プロジェクト', newNote: '新規ノート',
    deleteProject: 'プロジェクトを削除', deleteNote: 'ノートを削除', exportProject: 'プロジェクトをエクスポート', exportNote: 'ノートをエクスポート',
    copy: 'コピー', paste: '貼り付け', cut: '切り取り', selectAll: 'すべて選択', undo: '元に戻す', redo: 'やり直す',
    moveToProject: 'プロジェクトに移動', noProjects: 'プロジェクトなし', chooseProject: 'ターゲットを選択',
    deleteSelection: '削除',
    noteName: 'ノート名', projectNameLabel: 'プロジェクト名', cancel: 'キャンセル', confirm: 'OK', useTemplate: 'MDテンプレートを使用',
    useProjectTemplate: 'デフォルトMarkdownテンプレートを使用',
    templateStandard: '標準形式', emptyHint: 'Projectsにフォルダを作成するか、+を使用',
    tabLimit: 'タブ上限です。タブを閉じてください。', selectToStart: 'プロジェクトまたは受信箱を選択',
    guide: 'ガイド', fold: '折りたたむ', rename: '名前を変更', closeTab: '閉じる', confirmCloseWindow: 'ウィンドウを閉じますか？',
    guideReadme: 'LumNote ガイド', guideLicense: 'ライセンス', guideVersion: 'バージョン', languageSettings: '言語', guideStorage: '保存場所', guideAndLicense: 'ガイドとライセンス',
    expandInbox: '受信箱を展開', foldInbox: '受信箱を折りたたむ',
    storageTitle: 'ナレッジベースの場所', storagePathLabel: '現在のパス',
    storagePathDesc: 'Projects と Inbox がルート直下にあります。パス変更後にアプリが再読み込みされます。',
    storageChangeBtn: '変更…', storageReloadHint: '変更後にアプリが再読み込みされます。',
    licenseStorageHint: 'データはローカルに保存されます。ガイド → 保存場所でルートを変更できます。',
    guideUninstall: 'アンインストール', uninstallTitle: 'LumNote をアンインストール', uninstallBtn: 'アンインストール', uninstallHint: 'システムのアンインストールが起動します。', uninstallNotAvailable: 'インストール版でのみ利用できます。',
    windowMinimize: '最小化', windowMaximize: '最大化', windowRestore: '元に戻す', windowClose: '閉じる',
    sidebarFold: 'サイドバーを折りたたむ',
    inboxDefaultBody: 'ここに思いつきをメモし、あとでプロジェクトノートへ移しましょう。',
    noteNamePlaceholder: '例: 2026-03-02.md',
    startupFailed: '起動に失敗しました',
    authorLabel: '作者',
    authorName: 'Sciely Siu',
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    readmeContent: `# LumNote ガイド

## 基本
- **新規プロジェクト**: サイドバーの + をクリック
- **新規ノート**: プロジェクトを右クリック → 新規ノート
- **受信箱**: クイックキャプチャ用`
  },
  de: {
    appTitle: 'LumNote', inbox: 'Eingang', projects: 'Projekte', newProject: 'Neues Projekt', newNote: 'Neue Notiz',
    deleteProject: 'Projekt löschen', deleteNote: 'Notiz löschen', exportProject: 'Projekt exportieren', exportNote: 'Notiz exportieren',
    copy: 'Kopieren', paste: 'Einfügen', cut: 'Ausschneiden', selectAll: 'Alles auswählen', undo: 'Rückgängig', redo: 'Wiederholen',
    moveToProject: 'In Projekt verschieben', noProjects: 'Keine Projekte', chooseProject: 'Ziel wählen',
    deleteSelection: 'Löschen',
    insertFileAttachment: 'Datei einfügen',
    openAttachment: 'Datei öffnen',
    toggleImageThumb: 'Vorschaumodus',
    toggleImageMarkdown: 'Markdown-Modus',
    noteName: 'Notizname', projectNameLabel: 'Projektname', cancel: 'Abbrechen', confirm: 'OK', useTemplate: 'Markdown-Vorlage verwenden',
    useProjectTemplate: 'Standard-Markdown-Vorlage verwenden',
    templateStandard: 'Markdown-Vorlage', emptyHint: 'Oben + für ein Projekt; + neben dem Projektnamen für eine Notiz',
    tabLimit: 'Tab-Limit erreicht. Schließen Sie einen Tab.', selectToStart: 'Projekt oder Eingang wählen',
    guide: 'Anleitung', fold: 'Einklappen', rename: 'Umbenennen', closeTab: 'Schließen', confirmCloseWindow: 'Fenster schließen?',
    guideReadme: 'LumNote-Anleitung', guideLicense: 'Lizenz', guideVersion: 'Version', languageSettings: 'Sprache', guideStorage: 'Speicherort', guideAndLicense: 'Anleitung & Lizenz',
    expandInbox: 'Eingang einblenden', foldInbox: 'Eingang ausblenden',
    storageTitle: 'Speicherort der Wissensdatenbank', storagePathLabel: 'Aktueller Pfad',
    storagePathDesc: 'Dieser Ordner ist die Wurzel: „Projects“ enthält Notizbücher; „Inbox“ eine .md-Datei pro Tag. Nach Pfadänderung startet die App neu — vorher sichern.',
    storageChangeBtn: 'Ändern…', storageReloadHint: 'Nach Auswahl eines neuen Ordners lädt die App neu.',
    licenseStorageHint: 'Daten liegen lokal. Anleitung → Speicherort zum Ändern des Stammordners.',
    guideUninstall: 'Deinstallieren', uninstallTitle: 'LumNote deinstallieren', uninstallBtn: 'Deinstallieren', uninstallHint: 'Startet den System-Deinstaller.', uninstallNotAvailable: 'Nur bei installierter Version verfügbar.',
    windowMinimize: 'Minimieren', windowMaximize: 'Maximieren', windowRestore: 'Wiederherstellen', windowClose: 'Schließen',
    sidebarFold: 'Seitenleiste einklappen',
    inboxDefaultBody: 'Hier kurz notieren; später in Projektnotizen übernehmen.',
    noteNamePlaceholder: 'z. B. 2026-03-02.md',
    startupFailed: 'Start fehlgeschlagen',
    authorLabel: 'Autor',
    authorName: 'Sciely Siu',
    licenseContent: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright (c) LumNote

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
    readmeContent: `# LumNote-Anleitung

## Grundlagen
- **Neues Projekt**: + in der Seitenleiste
- **Neue Notiz**: Rechtsklick auf Projekt → Neue Notiz
- **Eingang**: Schnelle Erfassung; **Zwei Spalten** über die Tab-Leiste

## Aufbewahrung
- Tägliche Dateien \`Inbox/YYYY-MM-DD.md\`; ältere als 90 Tage werden beim Start oder beim Öffnen des Eingangs gelöscht.

## Speicher
- **Anleitung → Speicherort**: Pfad anzeigen und ändern (App lädt neu).`
  }
};

function getLang() {
  const stored = localStorage.getItem('lumen_lang');
  if (stored && translations[stored]) return stored;
  const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
  for (const code of LANG_DETECTION_ORDER) {
    if (!translations[code]) continue;
    const bcp = (LANGS[code] || code).toLowerCase();
    if (nav === code || nav.startsWith(`${code}-`) || nav === bcp || nav.startsWith(`${bcp}-`)) return code;
  }
  return DEFAULT_LANG;
}

function syncDocumentLang() {
  const code = getLang();
  document.documentElement.lang = LANGS[code] || code || 'en';
}

function setLang(code) {
  if (translations[code]) {
    localStorage.setItem('lumen_lang', code);
    syncDocumentLang();
  }
}
window.setLang = setLang;
window.syncDocumentLang = syncDocumentLang;

function t(key) {
  const lang = getLang();
  const cur = translations[lang];
  if (cur && Object.prototype.hasOwnProperty.call(cur, key)) return cur[key];
  const def = translations[DEFAULT_LANG];
  if (def && Object.prototype.hasOwnProperty.call(def, key)) return def[key];
  return key;
}
window.t = t;
