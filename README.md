# LumNote

![Demo](./assets/demo.png)

---

## English

**Local-first, minimal Markdown notes — focus on what matters.**

### Introduction

LumNote is an Electron-based, local-first note app built around **project notes** and a daily **Inbox**. It supports split panes, autosave, wiki-style `[[Project/Note]]` links with autocomplete, and attachments — so you can capture ideas quickly and organize them without giving up control of your data.

### Features

- **Dual-track workflow**: structured projects + per-day Inbox files
- **Split view**: work on a note alongside the Inbox
- **Wiki links**: `[[Project/Note]]` with autocomplete and click-to-open/create
- **Local-first**: choose your knowledge-base folder; session restore
- **Attachments**: insert files/images; export with notes when needed

### Tech stack

- Electron, Node.js  
- JavaScript (renderer)  
- Optional AI SDK integration via environment variables  

### Quick start

Requires [Node.js](https://nodejs.org/) (v18+ recommended).

```bash
git clone <repo-url>
cd <repo-folder>
npm install
npm start
```

### Environment variables

No variables are required for the core app. If you add AI features, use a local `.env` (not committed) and read values with `process.env`, e.g. `OPENAI_API_KEY`.

### License

See [LICENSE](./LICENSE) (Apache License 2.0).

---

## 中文

**本地优先的极简 Markdown 笔记，专注内容本身。**

### 简介

LumNote 是基于 Electron 的本地笔记应用，以 **项目笔记** 与按日归档的 **暂存区（Inbox）** 为核心，支持双栏编辑、自动保存、`[[项目/笔记]]` 链接与附件，在快速记录与结构化整理之间取得平衡。

### 功能亮点

- **双轨**：Projects 项目笔记 + Inbox 按日 `.md` 文件  
- **双栏**：正文与暂存区同屏协作  
- **Wiki 链接**：`[[项目/笔记]]` 自动补全、点击打开或新建  
- **本地优先**：自选知识库目录、会话恢复  
- **附件**：插入图片/文件，导出时可携带资源  

### 技术栈

- Electron、Node.js  
- JavaScript  
- 可选 AI SDK（通过环境变量接入）  

### 快速开始

需安装 [Node.js](https://nodejs.org/)（建议 v18+）。

```bash
git clone <repo-url>
cd <仓库目录>
npm install
npm start
```

### 环境变量

核心功能不依赖环境变量。若接入 AI，请在本地 `.env` 中配置密钥，勿提交仓库，并通过 `process.env` 读取。

### 许可证

见仓库根目录 [LICENSE](./LICENSE)（Apache 2.0）。

---

## Français

**Notes Markdown locales et minimalistes — concentrez-vous sur l’essentiel.**

### Présentation

LumNote est une application Electron **local-first** centrée sur les **projets** et une **boîte de réception** (Inbox) quotidienne : volets partagés, enregistrement automatique, liens `[[Projet/Note]]` avec saisie semi-automatique et pièces jointes.

### Fonctionnalités

- Double flux : projets + Inbox par jour  
- Vue en deux colonnes  
- Liens wiki `[[Projet/Note]]`  
- Données locales, choix du dossier racine  
- Pièces jointes et export  

### Pile technique

Electron, Node.js, JavaScript ; intégration IA optionnelle via variables d’environnement.

### Démarrage rapide

Node.js v18+ recommandé.

```bash
git clone <repo-url>
cd <dossier>
npm install
npm start
```

### Licence

Voir [LICENSE](./LICENSE) (Apache 2.0).

---

## 日本語

**ローカル優先のミニマル Markdown メモ。内容に集中。**

### 概要

LumNote は Electron 製のローカル優先ノートアプリです。**プロジェクトノート** と日付ごとの **Inbox** を軸に、分割表示、自動保存、`[[プロジェクト/ノート]]` 形式のリンク（補完・クリックで開く/作成）、添付ファイルに対応します。

### 主な機能

- プロジェクト + 日次 Inbox の二系統  
- 分割ペイン  
- Wiki 風リンク  
- ナレッジベースフォルダの指定、セッション復元  
- 添付とエクスポート  

### 技術スタック

Electron、Node.js、JavaScript。AI は環境変数で任意接続。

### クイックスタート

Node.js（v18 以上推奨）が必要です。

```bash
git clone <repo-url>
cd <フォルダ>
npm install
npm start
```

### ライセンス

[LICENSE](./LICENSE)（Apache 2.0）を参照してください。

---

## 한국어

**로컬 우선의 미니멀 Markdown 노트 — 본질에 집중하세요.**

### 소개

LumNote는 Electron 기반의 로컬 우선 노트 앱입니다. **프로젝트 노트**와 날짜별 **받은편지함(Inbox)**을 중심으로 분할 편집, 자동 저장, `[[프로젝트/노트]]` 링크(자동 완성·클릭으로 열기/생성), 첨부를 지원합니다.

### 주요 기능

- 프로젝트 + 일별 Inbox  
- 분할 화면  
- 위키 스타일 링크  
- 지식 베이스 폴더 선택, 세션 복원  
- 첨부 및 보내기  

### 기술 스택

Electron, Node.js, JavaScript. AI는 환경 변수로 선택 연동.

### 빠른 시작

[Node.js](https://nodejs.org/) v18+ 권장.

```bash
git clone <repo-url>
cd <폴더>
npm install
npm start
```

### 라이선스

[LICENSE](./LICENSE) (Apache 2.0) 참고.

---

## Deutsch

**Lokal-first, schlanke Markdown-Notizen — Fokus auf den Inhalt.**

### Überblick

LumNote ist eine Electron-App für **lokale** Notizen: **Projektnotizen** plus tägliche **Inbox**-Dateien, geteilte Ansicht, Autospeichern, `[[Projekt/Notiz]]`-Links mit Vervollständigung sowie Anhänge.

### Funktionen

- Projekte + tägliche Inbox  
- Zwei Spalten  
- Wiki-Links  
- Wählbarer Wissensdatenbank-Ordner, Sitzungswiederherstellung  
- Anhänge und Export  

### Technik

Electron, Node.js, JavaScript. KI optional per Umgebungsvariablen.

### Schnellstart

Node.js (empfohlen v18+).

```bash
git clone <repo-url>
cd <ordner>
npm install
npm start
```

### Lizenz

Siehe [LICENSE](./LICENSE) (Apache 2.0).

---

## Italiano

**Note Markdown locali e minimali — concentrati sul contenuto.**

### Introduzione

LumNote è un’app Electron **local-first** basata su **progetti** e **Inbox** giornaliera: riquadri affiancati, salvataggio automatico, link `[[Progetto/Nota]]` con completamento e allegati.

### Funzionalità

- Progetti + Inbox per giorno  
- Vista a due pannelli  
- Link wiki  
- Cartella radice configurabile, ripristino sessione  
- Allegati ed esportazione  

### Stack

Electron, Node.js, JavaScript. Integrazione AI opzionale tramite variabili d’ambiente.

### Avvio rapido

Node.js v18+ consigliato.

```bash
git clone <repo-url>
cd <cartella>
npm install
npm start
```

### Licenza

Vedi [LICENSE](./LICENSE) (Apache 2.0).
