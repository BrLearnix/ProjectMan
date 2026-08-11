import * as assert from 'assert';
import { Project } from '../project';
import { ProjectsProvider } from '../projectsTree';

suite('ProjectsProvider', () => {
	test('provides a tree item per project', async () => {
		const projects: Project[] = [
			{ id: 'a', name: 'Alpha', path: '/x/alpha', addedAt: 1 },
			{ id: 'b', name: 'Beta', path: '/x/beta', addedAt: 2 },
		];
		const provider = new ProjectsProvider(() => projects);
		const children = await provider.getChildren();
		assert.ok(children);
		assert.strictEqual(children.length, 2);
		assert.strictEqual(children[0].label, 'Alpha');
		assert.strictEqual(children[0].project.path, '/x/alpha');
	});

	test('does not show the path as description by default', async () => {
		const projects: Project[] = [{ id: 'a', name: 'Alpha', path: '/x/alpha', addedAt: 1 }];
		const provider = new ProjectsProvider(() => projects);
		const children = await provider.getChildren();
		assert.strictEqual(children![0].description, undefined);
	});

	test('root has no children when there are no projects', async () => {
		const provider = new ProjectsProvider(() => []);
		const children = await provider.getChildren();
		assert.ok(children);
		assert.strictEqual(children.length, 0);
	});
});
