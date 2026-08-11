import * as assert from 'assert';
import * as vscode from 'vscode';
import { Project } from '../project';
import { ProjectStorage } from '../storage';

function mockContext(): vscode.ExtensionContext {
	const store = new Map<string, unknown>();
	return {
		globalState: {
			get: (key: string, defaultValue: unknown) => (store.has(key) ? store.get(key) : defaultValue),
			update: async (key: string, value: unknown) => {
				store.set(key, value);
			},
		},
	} as unknown as vscode.ExtensionContext;
}

function makeProject(name: string, path: string): Project {
	return { id: `${path}-id`, name, path, addedAt: Date.now() };
}

suite('ProjectStorage', () => {
	test('starts empty', () => {
		const storage = new ProjectStorage(mockContext());
		assert.strictEqual(storage.all.length, 0);
	});

	test('adds and retrieves projects sorted by name', async () => {
		const storage = new ProjectStorage(mockContext());
		await storage.add(makeProject('Beta', '/x/beta'));
		await storage.add(makeProject('Alpha', '/x/alpha'));
		assert.deepStrictEqual(storage.all.map((p) => p.name), ['Alpha', 'Beta']);
	});

	test('detects duplicates by path', async () => {
		const storage = new ProjectStorage(mockContext());
		await storage.add(makeProject('Alpha', '/x/alpha'));
		assert.strictEqual(storage.has('/x/alpha'), true);
		assert.strictEqual(storage.has('/x/other'), false);
	});

	test('removes project by id', async () => {
		const storage = new ProjectStorage(mockContext());
		const project = makeProject('Alpha', '/x/alpha');
		await storage.add(project);
		await storage.removeById(project.id);
		assert.strictEqual(storage.all.length, 0);
	});
});
