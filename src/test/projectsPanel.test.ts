import * as assert from 'assert';
import { Project } from '../project';
import { ProjectsPanelProvider } from '../projectsPanel';

function makeProject(name: string, path: string): Project {
	return { id: `${path}-id`, name, path, addedAt: Date.now() };
}

interface MockWebviewView {
	view: any;
	posted: any[];
	messageHandler?: (m: any) => void;
}

function createMockWebviewView(): MockWebviewView {
	const mock: MockWebviewView = { view: undefined as any, posted: [] };
	const webview = {
		html: '',
		options: undefined as any,
		cspSource: 'https://example.invalid',
		onDidReceiveMessage: (handler: (m: any) => void) => {
			mock.messageHandler = handler;
			return { dispose() {} };
		},
		postMessage: (message: any) => {
			mock.posted.push(message);
			return Promise.resolve(true);
		},
	};
	mock.view = {
		webview,
		visible: true,
		onDidChangeVisibility: () => ({ dispose() {} }),
	};
	return mock;
}

function emptyProvider(): ProjectsPanelProvider {
	return new ProjectsPanelProvider(() => [], async () => {}, async () => {}, async () => {});
}

suite('ProjectsPanelProvider', () => {
	test('resolves the view with the visual panel script', () => {
		const mock = createMockWebviewView();
		const provider = emptyProvider();
		provider.resolveWebviewView(mock.view);
		assert.ok(mock.view.webview.html.includes('acquireVsCodeApi'));
		assert.ok(mock.view.webview.html.includes('btn-large'));
		assert.ok(mock.view.webview.html.includes('btn-list'));
	});

	test('generated HTML has balanced script tags', () => {
		const mock = createMockWebviewView();
		const provider = emptyProvider();
		provider.resolveWebviewView(mock.view);
		const html = mock.view.webview.html;
		assert.strictEqual(html.split('<script').length - 1, html.split('</script>').length - 1);
	});

	test('CSP nonce matches script nonce', () => {
		const mock = createMockWebviewView();
		const provider = emptyProvider();
		provider.resolveWebviewView(mock.view);
		const html = mock.view.webview.html;
		const cspMatch = html.match(/script-src 'nonce-([a-zA-Z0-9]+)'/);
		const scriptMatch = html.match(/<script nonce="([a-zA-Z0-9]+)">/);
		assert.ok(cspMatch && scriptMatch, 'nonce not found');
		assert.strictEqual(cspMatch[1], scriptMatch[1]);
	});

	test('webview script has no syntax errors', () => {
		const mock = createMockWebviewView();
		const provider = emptyProvider();
		provider.resolveWebviewView(mock.view);
		const html = mock.view.webview.html;
		const scriptStart = html.indexOf('<script nonce="');
		assert.ok(scriptStart >= 0, 'script tag not found');
		const bodyStart = html.indexOf('>', scriptStart) + 1;
		const scriptEnd = html.indexOf('</script>', bodyStart);
		const body = html.slice(bodyStart, scriptEnd);
		assert.doesNotThrow(() => new Function(body), 'webview script has syntax errors');
	});

	test('responding to getProjects posts the project list', async () => {
		const projects = [makeProject('Alpha', '/x/alpha'), makeProject('Beta', '/x/beta')];
		const mock = createMockWebviewView();
		const provider = new ProjectsPanelProvider(
			() => projects,
			async () => {},
			async () => {},
			async () => {}
		);
		provider.resolveWebviewView(mock.view);
		mock.messageHandler!({ type: 'getProjects' });
		await new Promise((resolve) => setTimeout(resolve, 10));
		const posted = mock.posted.filter((m) => m.type === 'projects');
		assert.strictEqual(posted.length, 1);
		assert.deepStrictEqual(
			posted[0].projects.map((p: Project) => p.name),
			['Alpha', 'Beta']
		);
	});

	test('add message triggers onAdd and refreshes', async () => {
		let added = 0;
		const projects = [makeProject('Alpha', '/x/alpha')];
		const mock = createMockWebviewView();
		const provider = new ProjectsPanelProvider(
			() => projects,
			async () => {
				added += 1;
			},
			async () => {},
			async () => {}
		);
		provider.resolveWebviewView(mock.view);
		mock.messageHandler!({ type: 'add' });
		await new Promise((resolve) => setTimeout(resolve, 10));
		assert.strictEqual(added, 1);
		assert.ok(mock.posted.some((m) => m.type === 'projects'));
	});
});
