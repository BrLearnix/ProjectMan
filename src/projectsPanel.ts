import * as vscode from 'vscode';
import { Project } from './project';

export class ProjectsPanelProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'projectman.projectsGrid';

	private view?: vscode.WebviewView;
	private projects: Project[] = [];

	constructor(
		private readonly getProjects: () => Project[],
		private readonly onAdd: () => Promise<void>,
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
	#projects.grid.small .card .tech { display: none; }
	.name { font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
	#projects.grid.small .name { font-size: 11px; }
	.tech { font-size: 11px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-radius: 20px; padding: 1px 10px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
	<button id="btn-add" class="btn primary">+ Añadir</button>
	<div class="seg">
		<button id="btn-large" class="btn active">Grande</button>
		<button id="btn-small" class="btn">Pequeño</button>
		<button id="btn-list" class="btn">Lista</button>
	</div>
	<button id="btn-path" class="btn">Ver ruta</button>
	<div class="spacer"></div>
	<span id="count" class="count">0 proyectos</span>
</div>
<div id="empty" class="empty" style="display:none">
	No hay proyectos todavía.<br><br>
	<button id="btn-empty-add" class="btn primary">+ Añadir proyecto</button>
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
const btnAdd = document.getElementById('btn-add');
const btnPath = document.getElementById('btn-path');
const btnLarge = document.getElementById('btn-large');
const btnSmall = document.getElementById('btn-small');
const btnList = document.getElementById('btn-list');
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

function itemHtml(p) {
	const icon = folderSvg(hashHue(p.name));
	const tech = p.technology ? '<span class="tech">' + esc(p.technology) + '</span>' : '';
	const id = esc(p.id);
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
			'<div class="row-main"><span class="row-name">' + esc(p.name) + '</span>' + tech + pathHtml + '</div>' +
			menu +
		'</div>';
	}
	return '<div class="card" data-id="' + id + '" title="' + esc(p.path) + '">' +
		icon +
		'<div class="name">' + esc(p.name) + '</div>' +
		tech +
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
