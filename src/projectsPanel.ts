import * as vscode from 'vscode';
import { Project } from './project';

export class ProjectsPanelProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'projectman.projectsGrid';

	private view?: vscode.WebviewView;
	private projects: Project[] = [];

	constructor(
		private readonly getProjects: () => Project[],
		private readonly onAdd: () => Promise<void>,
		private readonly onNew: () => Promise<void>,
		private readonly onOpen: (project: Project) => Promise<void>,
		private readonly onRemove: (project: Project) => Promise<void>
	) {}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		this.view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
		};
		webviewView.webview.html = this.getHtml(webviewView.webview);
		webviewView.webview.onDidReceiveMessage((message) => {
			void this.handleMessage(message);
		});
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				this.refresh();
			}
		});
	}

	refresh(): void {
		this.projects = this.getProjects();
		if (this.view) {
			void this.view.webview.postMessage({ type: 'projects', projects: this.projects });
		}
	}

	private async handleMessage(message: { type: string; id?: string; message?: string }): Promise<void> {
		switch (message.type) {
			case 'init':
			case 'getProjects':
				this.refresh();
				break;
			case 'error':
				console.error('[ProjectMan] error en el panel:', message.message);
				void vscode.window.showErrorMessage(`ProjectMan (panel): ${message.message ?? 'error desconocido'}`);
				break;
			case 'add':
				await this.onAdd();
				this.refresh();
				break;
			case 'new':
				await this.onNew();
				this.refresh();
				break;
			case 'open': {
				const project = this.projects.find((p) => p.id === message.id);
				if (project) {
					await this.onOpen(project);
				}
				break;
			}
			case 'remove': {
				const project = this.projects.find((p) => p.id === message.id);
				if (project) {
					await this.onRemove(project);
					this.refresh();
				}
				break;
			}
		}
	}

	private getHtml(webview: vscode.Webview): string {
		const nonce = getNonce();
		return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
	* { box-sizing: border-box; }
	body { margin: 0; padding: 0; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); }
	.toolbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; gap: 6px; padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-sideBar-background); flex-wrap: wrap; }
	.btn { font-size: 12px; padding: 5px 10px; border-radius: 6px; cursor: pointer; border: 1px solid transparent; background: transparent; color: var(--vscode-foreground); }
	.btn:hover { background: var(--vscode-toolbar-hoverBackground); }
	.btn.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
	.btn.primary:hover { background: var(--vscode-button-hoverBackground); }
	.seg { display: flex; border: 1px solid var(--vscode-panel-border); border-radius: 6px; overflow: hidden; }
	.seg .btn { border: none; border-radius: 0; }
	.seg .btn.active { background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground); }
	.btn.active { border-color: var(--vscode-focusBorder); }
	.spacer { flex: 1; }
	.count { font-size: 11px; color: var(--vscode-descriptionForeground); }
	.empty { padding: 24px 16px; text-align: center; color: var(--vscode-descriptionForeground); }
	.empty .btn { margin-top: 10px; }
	#projects { padding: 10px; }
	#projects.grid.large { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
	#projects.grid.small { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 10px; }
	#projects.list { display: flex; flex-direction: column; gap: 4px; }
	.card { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 16px 8px; background: var(--vscode-editorWidget-background); border: 1px solid var(--vscode-panel-border); border-radius: 10px; cursor: pointer; transition: transform .12s ease, border-color .12s ease, background .12s ease; }
	.card:hover { transform: translateY(-2px); border-color: var(--vscode-focusBorder); background: var(--vscode-list-hoverBackground); }
	#projects.grid.large .card svg.folder { width: 56px; height: 56px; }
	#projects.grid.small .card svg.folder { width: 34px; height: 34px; }
	.name { font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
	#projects.grid.small .name { font-size: 11px; }
	.tech-icons { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
	.row-main .tech-icons { justify-content: flex-start; }
	.t-ico { display: inline-flex; }
	.t-ico svg { width: 16px; height: 16px; }
	#projects.grid.small .t-ico svg { width: 13px; height: 13px; }
	.path { font-size: 11px; color: var(--vscode-descriptionForeground); word-break: break-all; max-width: 100%; }
	.menu-wrap { position: relative; display: flex; align-items: center; }
	.card .menu-wrap { position: absolute; top: 6px; right: 6px; }
	.row .menu-wrap { flex-shrink: 0; align-self: center; }
	.kebab { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 0; background: transparent; border: none; border-radius: 6px; color: var(--vscode-descriptionForeground); cursor: pointer; transition: background .12s ease, color .12s ease; }
	.kebab:hover { background: var(--vscode-toolbar-hoverBackground); color: var(--vscode-foreground); }
	.kebab svg { width: 16px; height: 16px; }
	.menu { position: absolute; top: 100%; right: 0; z-index: 9999; display: none; min-width: 175px; padding: 4px; background: var(--vscode-menu-background); border: 1px solid var(--vscode-menu-border); border-radius: 8px; box-shadow: 0 4px 14px rgba(0, 0, 0, .35); }
	.menu.open { display: block; }
	.card.menu-open, .row.menu-open { z-index: 1000; }
	.menu-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 10px; background: transparent; border: none; border-radius: 5px; color: var(--vscode-menu-foreground); font-size: 12px; font-family: inherit; cursor: pointer; text-align: left; }
	.menu-item:hover { background: var(--vscode-menu-selectionBackground); color: var(--vscode-menu-selectionForeground); }
	.menu-item svg { width: 14px; height: 14px; flex-shrink: 0; }
	.menu-item.danger { color: var(--vscode-errorForeground); }
	.menu-item.danger:hover { background: var(--vscode-errorForeground); color: var(--vscode-foreground); }
	.row { position: relative; display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
	.row:hover { background: var(--vscode-list-hoverBackground); }
	.row svg.folder { width: 28px; height: 28px; flex-shrink: 0; }
	.row-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
	.row-name { font-weight: 600; }
</style>
</head>
<body>
<div class="toolbar">
	<button id="btn-new" class="btn primary">Nuevo proyecto</button>
	<button id="btn-add" class="btn">Añadir carpeta</button>
	<div class="seg">
		<button id="btn-large" class="btn active">Grande</button>
		<button id="btn-small" class="btn">Pequeño</button>
		<button id="btn-list" class="btn">Lista</button>
	</div>
	<button id="btn-path" class="btn">Ver rutas</button>
	<div class="spacer"></div>
	<span id="count" class="count">0 proyectos</span>
</div>
<div id="empty" class="empty" style="display:none">
	No hay proyectos todavía.<br><br>
	<button id="btn-empty-new" class="btn primary">Nuevo proyecto</button><br>
	<button id="btn-empty-add" class="btn">Añadir carpeta existente</button>
</div>
<div id="projects" class="grid large"></div>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
window.addEventListener('error', function (event) {
	vscode.postMessage({ type: 'error', message: String(event.message) + ' (' + event.lineno + ')' });
});

const previous = vscode.getState();
const state = {
	mode: (previous && previous.mode) || 'large',
	shownPaths: (previous && previous.shownPaths) || [],
	projects: (previous && previous.projects) || []
};
const shownPaths = new Set(state.shownPaths);
let openMenuId = null;

const projectsEl = document.getElementById('projects');
const emptyEl = document.getElementById('empty');
const countEl = document.getElementById('count');
const btnNew = document.getElementById('btn-new');
const btnAdd = document.getElementById('btn-add');
const btnPath = document.getElementById('btn-path');
const btnLarge = document.getElementById('btn-large');
const btnSmall = document.getElementById('btn-small');
const btnList = document.getElementById('btn-list');
const btnEmptyNew = document.getElementById('btn-empty-new');
const btnEmptyAdd = document.getElementById('btn-empty-add');

function hashHue(str) {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (h * 31 + str.charCodeAt(i)) % 360;
	}
	return h;
}

function folderSvg(hue) {
	const main = 'hsl(' + hue + ', 55%, 42%)';
	const tab = 'hsl(' + hue + ', 55%, 30%)';
	return '<svg class="folder" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
		'<path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4.09c.53 0 1.04.21 1.41.59l1.09 1.09c.19.19.44.29.7.29H19.5A1.5 1.5 0 0 1 21 7.5V9H3V5.5z" fill="' + tab + '"/>' +
		'<path d="M3 9h18v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V9z" fill="' + main + '"/>' +
	'</svg>';
}

function esc(s) {
	return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function removeSvg() {
	return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M6.5 2h3v1h3.5v2H3V3h3.5V2zM4.2 5h7.6l-.7 8.3a1 1 0 0 1-1 .7H5.9a1 1 0 0 1-1-.7L4.2 5zm2.2 1.5h1v6.3h-1V6.5zm2 0h1v6.3h-1V6.5z"/></svg>';
}

function linkSvg() {
	return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M6.2 4.4l1.3-1.3c1.2-1.2 3.1-1.2 4.2 0 1.2 1.2 1.2 3.1 0 4.2l-1.3 1.3 1.4 1.4 1.3-1.3c2-2 2-5.2 0-7.1-2-2-5.2-2-7.1 0L4.8 3.1l1.4 1.3zm3.6 7.2l-1.3 1.3c-1.2 1.2-3.1 1.2-4.2 0-1.2-1.2-1.2-3.1 0-4.2l1.3-1.3L4.2 6 2.9 7.3c-2 2-2 5.2 0 7.1 2 2 5.2 2 7.1 0l1.3-1.3-1.5-1.5zM10 5.3c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0L5.3 9.3c-.2.2-.2.5 0 .7.2.2.5.2.7 0L10 5.3z"/></svg>';
}

function kebabSvg() {
	return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>';
}

function openSvg() {
	return '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M11 8v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4v1H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8h1zM12.5 2H9.6l1.6 1.6-5 5L7.4 10l5-5L14 6.6V3.5A1.5 1.5 0 0 0 12.5 2z"/></svg>';
}

function tile(bg, label, color, size) {
	return '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5" fill="' + bg + '"/><text x="12" y="16.3" font-size="' + (size || 8.5) + '" font-weight="700" text-anchor="middle" fill="' + (color || '#fff') + '" font-family="sans-serif">' + label + '</text></svg>';
}

const ICONS = {
	'javascript': tile('#f7df1e', 'JS', '#000'),
	'typescript': tile('#3178c6', 'TS'),
	'python': '<svg viewBox="0 0 24 24"><path fill="#3776ab" d="M9.85 2.2c-2.2 0-3.6.4-4.4 1.3-.9 1-.9 2.5-.9 4.2v3.3c0 1.1.4 2.2 1.8 2.2h6.1c1 0 2.2.9 2.2 2v3.9c0 .9-.5 1.8-1.4 1.9-1.9.3-3.2 0-4.1-.5-.6-.4-.7-1-.7-1.7H4.6c0 1.2.3 2.2 1.6 3 .9.6 2.1.8 3.4.8 1.3 0 3-.3 4.3-.9 1.3-.6 1.7-1.9 1.7-3.5v-9c0-1.1-.3-2.3-1.7-2.7-1.6-.5-3.3-.9-4.3-.9z"/><path fill="#ffd43b" d="M14.15 2.1h.1c1.5 0 2.9.2 3.7 1 .9.8 1.1 2 1.1 3.4v3c0 1.2-.6 2.2-1.8 2.2h-6.3c-1 0-2.2.8-2.2 2v4.1c0 .9.5 1.7 1.3 2 .8.3 2.4.4 3.5.3.9 0 1.9-.2 2.6-.6.5-.3.6-.7.6-1.3h2.4c0 1.3-.4 2.2-1.5 2.9-1 .7-2.4.9-3.9.9-1.9 0-3.9-.4-4.9-1.3-1.1-1-1.3-2.4-1.3-4v-5.6c0-1.2.3-2.3 1.5-2.7 1.5-.5 3.5-.5 3.9-1.2.6-.9.2-1.9 1.1-2.4 1.2-.7 1.6-.6 2.2-.5z"/><circle cx="7.4" cy="5.8" r="1" fill="#fff"/><circle cx="16.6" cy="5.8" r="1" fill="#fff"/></svg>',
	'react': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" fill="#61dafb"/><g fill="none" stroke="#61dafb" stroke-width="1.3"><ellipse cx="12" cy="12" rx="10.5" ry="4"/><ellipse cx="12" cy="12" rx="10.5" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="4" transform="rotate(120 12 12)"/></g></svg>',
	'vue': '<svg viewBox="0 0 24 24"><path d="M2 3h4.7L12 14.5 17.3 3H22L12 22 2 3z" fill="#41b883"/><path d="M6.7 3H10l2 4.5L14 3h3.3L12 13.2 6.7 3z" fill="#35495e"/></svg>',
	'angular': '<svg viewBox="0 0 24 24"><path d="M12 2l9.5 4.2-1.3 11.9L12 22l-8.2-3.9L2.5 6.2z" fill="#dd0031"/><path d="M12 2v20l8.2-3.9L21.5 6.2z" fill="#c3002f"/><text x="12" y="16" font-size="10" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">A</text></svg>',
	'svelte': '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="6" fill="#ff3e00"/><path d="M7.5 17.3c-.7-1.2-.3-2.6.8-3.4.9-.7 2-.8 3-.4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M16.5 6.7c.7 1.2.3 2.6-.8 3.4-.9.7-2 .8-3 .4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
	'next.js': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#000"/><text x="12" y="16.3" font-size="9" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">N</text></svg>',
	'nuxt': '<svg viewBox="0 0 24 24"><path d="M4 19.5L12 6.5l8 13h-4.5l-3.5-5.7L8.5 19.5z" fill="#00dc82"/><path d="M12 6.5l4 6.5 2.5 6.5h-4.5z" fill="#108775"/><path d="M12 6.5L7.5 19.5H5z" fill="#003329"/></svg>',
	'vite': '<svg viewBox="0 0 24 24"><path d="M12 2l-8 14h5l-2 6 9-14h-4l2-6z" fill="#ffc24b"/><path d="M12 2l-8 14h5l-2 6z" fill="#41d1ff"/></svg>',
	'tailwind css': '<svg viewBox="0 0 24 24"><path fill="#38bdf8" d="M12 5c-4.7 0-7.2 2.35-7.5 7 1.5-1.8 3.2-2.4 5.2-1.9 1.1.3 1.9 1.1 2.8 2 1.4 1.4 3 3 5.5 2.8 2.3-.2 3.9-1.5 4.5-3.9-2 1-3.7.8-5.2-.4-1.1-.9-1.9-1.7-3-2.4C13 5.4 12 5 12 5z"/></svg>',
	'ruby': '<svg viewBox="0 0 24 24"><path d="M12 2l10 10-10 10L2 12z" fill="#cc342d"/><path d="M12 4l8 8-8 8V4z" fill="#a01b1b"/></svg>',
	'elixir': '<svg viewBox="0 0 24 24"><path d="M12 2c3.6 5.6 6.6 8.9 6.6 12.6a6.6 6.6 0 0 1-13.2 0C5.4 10.9 8.4 7.6 12 2z" fill="#4b275f"/><path d="M12 5.5c2.2 3.4 4 5.3 4 9.1a4 4 0 0 1-8 0c0-3.8 1.8-5.7 4-9.1z" fill="#7a4d9b"/></svg>',
	'kotlin': '<svg viewBox="0 0 24 24"><path d="M2 2h20v20z" fill="#e2445f"/><path d="M22 2v20L2 2z" fill="#7f52ff"/></svg>',
	'flutter': '<svg viewBox="0 0 24 24"><path d="M8.5 2.5L14.5 8.5 6 17H1.5z" fill="#45d1fd"/><path d="M14.5 2.5l4 4-9 9H6z" fill="#02569b"/><path d="M18.5 6.5l4.5 4.5h-5l-4-4z" fill="#14b1fd"/></svg>',
	'electron': '<svg viewBox="0 0 24 24"><g fill="none" stroke="#47848f" stroke-width="1.4"><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/></g><circle cx="12" cy="12" r="2" fill="#47848f"/></svg>',
	'mongodb': '<svg viewBox="0 0 24 24"><path d="M12 2c.6 4.5-.2 8.4-1.2 10.3-.5 1-.8 1.6-.9 2.2.1-.6.4-1.2.9-2.2C12.8 10.4 12.6 6.5 12 2z" fill="#47a248"/><path d="M12 2c-.6 4.5.2 8.4 1.2 10.3.5 1 .8 1.6.9 2.2-.1-.6-.4-1.2-.9-2.2-1-1.9-1.9-5.8-1.2-10.3z" fill="#4faa41"/><path d="M11.1 14.5c-.3 1.7-.8 3.4-2 5.5 0 0 3-2.4 2.7-6.3z" fill="#3c8f36"/></svg>',
	'graphql': '<svg viewBox="0 0 24 24"><g fill="none" stroke="#e10098" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.5l8.5 4.9v9.2L12 22.5 3.5 17.6V8.4z"/><path d="M12 3.5v19M3.5 8.4l17 7.2M20.5 8.4l-17 7.2"/></g><circle cx="12" cy="12" r="1.4" fill="#e10098"/></svg>',
	'.net': '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" rx="1" fill="#512bd4"/><rect x="13" y="2" width="9" height="9" rx="1" fill="#512bd4" opacity=".55"/><rect x="2" y="13" width="9" height="9" rx="1" fill="#512bd4" opacity=".55"/><rect x="13" y="13" width="9" height="9" rx="1" fill="#2b1140"/></svg>',
	'webpack': '<svg viewBox="0 0 24 24"><path d="M12 2l9 5.2v9.6L12 22l-9-5.2V7.2z" fill="#8dd6f9"/><path d="M12 6.2l4.6 2.7v5.4L12 17l-4.6-2.7V8.9z" fill="#1c78c0"/></svg>',
	'fastapi': '<svg viewBox="0 0 24 24"><path d="M12 2l-8 14h5l-2 6 9-14h-5z" fill="#0c7c79"/></svg>',
	'c#': tile('#68217a', 'C#'),
	'c++': tile('#00599c', 'C++'),
	'c': tile('#00599c', 'C'),
	'f#': tile('#378bba', 'F#'),
	'vb.net': tile('#512bd4', 'VB'),
	'php': tile('#777bb4', 'PHP'),
	'go': tile('#00add8', 'Go'),
	'rust': tile('#000000', 'R', '#e8601c'),
	'java': tile('#f89820', 'Java', '#fff', 7.5),
	'dart': tile('#0175c2', 'Dart', '#fff', 8),
	'swift': tile('#f05138', 'Swift', '#fff', 7),
	'haskell': tile('#5e5086', 'Hs'),
	'scala': tile('#dc322f', 'Scala', '#fff', 7),
	'clojure': tile('#5881d8', 'Clj'),
	'zig': tile('#f7a41d', 'Zig', '#000'),
	'node.js': tile('#539e43', 'node', '#fff', 7),
	'express': tile('#000000', 'express', '#fff', 6.5),
	'nestjs': tile('#e0234e', 'Nest', '#fff', 7.5),
	'fastify': tile('#000000', 'Fastify', '#fff', 6.5),
	'django': tile('#092e20', 'Dj'),
	'flask': tile('#111111', 'Flask', '#fff', 7),
	'laravel': tile('#ff2d20', 'Laravel', '#fff', 6.5),
	'rails': tile('#cc0000', 'Rails', '#fff', 7),
	'symfony': tile('#000000', 'Sym'),
	'wordpress': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#21759b"/><text x="12" y="16" font-size="9" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">W</text></svg>',
	'spring boot': tile('#6db33f', 'Spring', '#fff', 6.5),
	'postgresql': tile('#336791', 'Pg'),
	'mysql': tile('#00758f', 'My'),
	'sqlite': tile('#003b57', 'SQL', '#fff', 8),
	'redis': tile('#dc382d', 'Redis', '#fff', 7),
	'prisma': tile('#2d3748', 'P'),
	'drizzle': tile('#c5f74f', 'Dz', '#000'),
	'typeorm': tile('#fe0902', 'T'),
	'sequelize': tile('#52b0e7', 'Seq'),
	'knex': tile('#d26b38', 'Knex', '#fff', 7),
	'mongoose': tile('#3f7e44', 'Mng', '#fff', 7),
	'redux': tile('#764abc', 'Redux', '#fff', 7),
	'zustand': tile('#4f5a67', 'Z'),
	'mobx': tile('#ff9955', 'MobX', '#000', 8),
	'jquery': tile('#0769ad', 'jq'),
	'axios': tile('#5a29e4', 'Ax'),
	'three.js': tile('#000000', '3js'),
	'd3.js': tile('#f9a03c', 'D3', '#000'),
	'p5.js': tile('#ed225d', 'p5'),
	'vitest': tile('#fcc72b', 'Vitest', '#000', 6.5),
	'jest': tile('#c21325', 'Jest', '#fff', 7),
	'mocha': tile('#8d6748', 'Mocha', '#fff', 7),
	'cypress': tile('#17202c', 'Cypress', '#fff', 6.5),
	'playwright': tile('#2ead33', 'PW'),
	'puppeteer': tile('#00acaf', 'Puppeteer', '#fff', 6),
	'bun': tile('#fbf0df', 'Bun', '#000'),
	'deno': tile('#70ffaf', 'Deno', '#000'),
	'tauri': tile('#24292f', 'Tauri', '#fff', 7),
	'expo': tile('#000000', 'Expo', '#fff', 7),
	'ionic': tile('#3880ff', 'Ionic', '#fff', 7),
	'capacitor': tile('#119eff', 'C'),
	'astro': tile('#ff5d01', 'Astro', '#fff', 7),
	'gatsby': tile('#663399', 'G'),
	'docusaurus': tile('#3ecc5f', 'D', '#000'),
	'remix': tile('#0f172a', 'Remix', '#fff', 7),
	'meteor': tile('#de4f4f', 'M'),
	'koa': tile('#333333', 'Koa', '#fff', 7),
	'hapi': tile('#d16a12', 'Hapi', '#fff', 7),
	'adonisjs': tile('#5a45ff', 'Adonis', '#fff', 6.5),
	'sails': tile('#2e72b8', 'Sails', '#fff', 7),
	'socket.io': tile('#010101', 'IO'),
	'apollo': tile('#311c87', 'Apollo', '#fff', 6.5),
	'rollup': tile('#ef3335', 'Rollup', '#fff', 6.5),
	'esbuild': tile('#ffcf00', 'esbuild', '#000', 6),
	'parcel': tile('#f7b825', 'Parcel', '#000', 6.5),
	'sass': tile('#cc6699', 'Sass', '#fff', 7),
	'less': tile('#1d365d', 'Less', '#fff', 7),
	'bootstrap': tile('#7952b3', 'B'),
	'material ui': tile('#007fff', 'MUI'),
	'emotion': tile('#d26ac2', 'E'),
	'styled components': tile('#db7093', 'SC'),
	'streamlit': tile('#ff4b4b', 'Streamlit', '#fff', 6),
	'tensorflow': tile('#ff6f00', 'TF'),
	'pytorch': tile('#ee4c2c', 'Py'),
	'scikit-learn': tile('#f7931e', 'sk', '#000'),
	'pandas': tile('#130654', 'pd'),
	'numpy': tile('#4dabcf', 'np'),
	'selenium': tile('#43b02a', 'Se'),
	'pytest': tile('#0a9edc', 'py'),
	'cakephp': tile('#d33c43', 'CakePHP', '#fff', 6.5),
	'codeigniter': tile('#dd4814', 'CI'),
	'slim': tile('#173b52', 'Slim', '#fff', 7),
	'laminas': tile('#336699', 'Lm'),
	'yii2': tile('#40b3d8', 'Yii'),
	'sinatra': tile('#800000', 'Sinatra', '#fff', 6.5),
	'jekyll': tile('#c81118', 'J'),
	'rspec': tile('#ec1d24', 'RSpec', '#fff', 7),
	'phoenix': tile('#fd4f00', 'Phoenix', '#fff', 6.5),
};
ICONS['react native'] = ICONS['react'];
ICONS['sveltekit'] = ICONS['svelte'];

function techIcon(name) {
	if (!name) {
		return '';
	}
	const svg = ICONS[name.toLowerCase()];
	return svg ? '<span class="t-ico" title="' + esc(name) + '">' + svg + '</span>' : '';
}

function itemHtml(p) {
	const icon = folderSvg(hashHue(p.name));
	const id = esc(p.id);
	let iconsHtml = '';
	if (p.language || p.technology) {
		iconsHtml = '<div class="tech-icons">' +
			techIcon(p.language) +
			(p.technology && p.technology !== p.language ? techIcon(p.technology) : '') +
		'</div>';
	}
	const shown = shownPaths.has(p.id);
	const pathHtml = shown ? '<div class="path">' + esc(p.path) + '</div>' : '';
	const menu = '<div class="menu-wrap">' +
		'<button class="kebab" title="Acciones">' + kebabSvg() + '</button>' +
		'<div class="menu">' +
			'<button class="menu-item" data-action="toggle-path">' + linkSvg() + '<span>' + (shown ? 'Ocultar ruta' : 'Ver ruta') + '</span></button>' +
			'<button class="menu-item" data-action="open">' + openSvg() + '<span>Abrir proyecto</span></button>' +
			'<button class="menu-item danger" data-action="remove">' + removeSvg() + '<span>Eliminar</span></button>' +
		'</div>' +
	'</div>';
	if (state.mode === 'list') {
		return '<div class="row" data-id="' + id + '" title="' + esc(p.path) + '">' +
			icon +
			'<div class="row-main"><span class="row-name">' + esc(p.name) + '</span>' + iconsHtml + pathHtml + '</div>' +
			menu +
		'</div>';
	}
	return '<div class="card" data-id="' + id + '" title="' + esc(p.path) + '">' +
		icon +
		'<div class="name">' + esc(p.name) + '</div>' +
		iconsHtml +
		pathHtml +
		menu +
	'</div>';
}

function render() {
	btnLarge.classList.toggle('active', state.mode === 'large');
	btnSmall.classList.toggle('active', state.mode === 'small');
	btnList.classList.toggle('active', state.mode === 'list');
	const allShown = state.projects.length > 0 && shownPaths.size === state.projects.length;
	btnPath.classList.toggle('active', allShown);
	btnPath.textContent = allShown ? 'Ocultar rutas' : 'Ver rutas';
	countEl.textContent = state.projects.length + ' proyecto' + (state.projects.length === 1 ? '' : 's');
	projectsEl.className = state.mode === 'list' ? 'list' : 'grid ' + state.mode;

	if (!state.projects.length) {
		projectsEl.innerHTML = '';
		emptyEl.style.display = 'block';
		return;
	}
	emptyEl.style.display = 'none';
	let html = '';
	for (let i = 0; i < state.projects.length; i++) {
		html += itemHtml(state.projects[i]);
	}
	projectsEl.innerHTML = html;
	if (openMenuId) {
		const items = projectsEl.querySelectorAll('.card, .row');
		for (let i = 0; i < items.length; i++) {
			if (items[i].getAttribute('data-id') === openMenuId) {
				const menu = items[i].querySelector('.menu');
				if (menu) {
					items[i].classList.add('menu-open');
					menu.classList.add('open');
				}
				break;
			}
		}
	}
}

function setMode(mode) {
	state.mode = mode;
	vscode.setState(state);
	render();
}

btnNew.addEventListener('click', function () {
	vscode.postMessage({ type: 'new' });
	setTimeout(function () { vscode.postMessage({ type: 'getProjects' }); }, 600);
});

btnEmptyNew.addEventListener('click', function () {
	vscode.postMessage({ type: 'new' });
	setTimeout(function () { vscode.postMessage({ type: 'getProjects' }); }, 600);
});

btnAdd.addEventListener('click', function () {
	vscode.postMessage({ type: 'add' });
	setTimeout(function () { vscode.postMessage({ type: 'getProjects' }); }, 500);
});

btnEmptyAdd.addEventListener('click', function () {
	vscode.postMessage({ type: 'add' });
	setTimeout(function () { vscode.postMessage({ type: 'getProjects' }); }, 500);
});

btnLarge.addEventListener('click', function () { setMode('large'); });
btnSmall.addEventListener('click', function () { setMode('small'); });
btnList.addEventListener('click', function () { setMode('list'); });

function togglePath(id) {
	if (shownPaths.has(id)) {
		shownPaths.delete(id);
	} else {
		shownPaths.add(id);
	}
	state.shownPaths = Array.from(shownPaths);
	vscode.setState(state);
	render();
}

btnPath.addEventListener('click', function () {
	if (state.projects.length > 0 && shownPaths.size === state.projects.length) {
		shownPaths.clear();
	} else {
		state.projects.forEach(function (p) { shownPaths.add(p.id); });
	}
	state.shownPaths = Array.from(shownPaths);
	vscode.setState(state);
	render();
});

function closeMenus() {
	openMenuId = null;
	document.querySelectorAll('.card.menu-open, .row.menu-open').forEach(function (el) {
		el.classList.remove('menu-open');
	});
	document.querySelectorAll('.menu.open').forEach(function (m) {
		m.classList.remove('open');
	});
}

document.addEventListener('click', function (event) {
	const t = event.target;
	const kebab = t.closest ? t.closest('.kebab') : null;
	if (kebab) {
		const wrap = kebab.closest('.menu-wrap');
		const item = wrap.closest('.card, .row');
		const menu = wrap.querySelector('.menu');
		if (menu.classList.contains('open')) {
			closeMenus();
		} else {
			closeMenus();
			openMenuId = item.getAttribute('data-id');
			item.classList.add('menu-open');
			menu.classList.add('open');
		}
		return;
	}
	const menuItem = t.closest ? t.closest('.menu-item') : null;
	if (menuItem) {
		const wrap = menuItem.closest('.menu-wrap');
		const item = wrap.closest('.card, .row');
		const id = item.getAttribute('data-id');
		const action = menuItem.getAttribute('data-action');
		closeMenus();
		if (action === 'toggle-path') {
			togglePath(id);
		} else if (action === 'open') {
			vscode.postMessage({ type: 'open', id: id });
		} else if (action === 'remove') {
			vscode.postMessage({ type: 'remove', id: id });
		}
		return;
	}
	closeMenus();
	const item = t.closest ? t.closest('.card, .row') : null;
	if (item) {
		vscode.postMessage({ type: 'open', id: item.getAttribute('data-id') });
	}
});

document.addEventListener('mouseout', function (event) {
	const t = event.target;
	if (t.closest && t.closest('.menu')) {
		const menu = t.closest('.menu');
		const related = event.relatedTarget;
		if (!related || !menu.contains(related)) {
			closeMenus();
		}
	}
});

window.addEventListener('message', function (event) {
	const m = event.data;
	if (m.type === 'projects') {
		state.projects = m.projects || [];
		const ids = {};
		state.projects.forEach(function (p) { ids[p.id] = true; });
		const stale = [];
		shownPaths.forEach(function (id) { if (!ids[id]) { stale.push(id); } });
		stale.forEach(function (id) { shownPaths.delete(id); });
		vscode.setState(state);
		render();
	}
});

vscode.postMessage({ type: 'init' });

setTimeout(function () { vscode.postMessage({ type: 'getProjects' }); }, 700);

setInterval(function () {
	if (document.visibilityState === 'visible') {
		vscode.postMessage({ type: 'getProjects' });
	}
}, 2000);

render();
</script>
</body>
</html>`;
	}
}

function getNonce(): string {
	const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 32; i++) {
		result += text.charAt(Math.floor(Math.random() * text.length));
	}
	return result;
}
