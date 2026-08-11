import * as path from 'path';
import * as vscode from 'vscode';
import { Project } from './project';
import { ProjectsPanelProvider } from './projectsPanel';
import { ProjectStorage } from './storage';

export function activate(context: vscode.ExtensionContext) {
	const storage = new ProjectStorage(context);

	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBar.command = 'projectman.show';

	const updateStatusBar = (): void => {
		const count = storage.all.length;
		statusBar.text = count === 0 ? '$(folder) ProjectMan' : `$(folder) ProjectMan: ${count} proyecto${count === 1 ? '' : 's'}`;
		statusBar.tooltip = 'Haz clic para abrir la lista de proyectos de ProjectMan';
		statusBar.show();
	};

	const addProject = async (): Promise<void> => {
		const selected = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Añadir proyecto',
			title: 'ProjectMan: selecciona la carpeta del proyecto',
		});
		if (!selected || selected.length === 0) {
			return;
		}
		const uri = selected[0];
		const project: Project = {
			id: `${uri.fsPath}-${Date.now()}`,
			name: path.basename(uri.fsPath),
			path: uri.fsPath,
			addedAt: Date.now(),
		};
		if (storage.has(project.path)) {
			vscode.window.showInformationMessage(`El proyecto "${project.name}" ya está en ProjectMan.`);
			return;
		}
		await storage.add(project);
		vscode.window.showInformationMessage(`Proyecto "${project.name}" añadido.`);
	};

	const openProject = async (project?: Project): Promise<void> => {
		if (!project) {
			project = await pickProject(storage);
			if (!project) {
				return;
			}
		}
		await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(project.path));
	};

	const removeProject = async (project?: Project): Promise<void> => {
		if (!project) {
			project = await pickProject(storage);
			if (!project) {
				return;
			}
		}
		const confirm = await vscode.window.showWarningMessage(
			`¿Eliminar "${project.name}" de ProjectMan?`,
			{ modal: true },
			'Eliminar'
		);
		if (confirm !== 'Eliminar') {
			return;
		}
		await storage.removeById(project.id);
		vscode.window.showInformationMessage(`Proyecto "${project.name}" eliminado.`);
	};

	const gridProvider = new ProjectsPanelProvider(() => storage.all, addProject, openProject, removeProject);

	const refreshAll = (): void => {
		gridProvider.refresh();
		updateStatusBar();
	};

	context.subscriptions.push(statusBar);

	try {
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(ProjectsPanelProvider.viewType, gridProvider, {
				webviewOptions: { retainContextWhenHidden: true },
			})
		);
	} catch (err) {
		vscode.window.showErrorMessage(
			`ProjectMan: error al registrar la vista de iconos: ${String(err)}`
		);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('projectman.addProject', async () => {
			await addProject();
			refreshAll();
		}),
		vscode.commands.registerCommand('projectman.openProject', (project?: Project) => openProject(project)),
		vscode.commands.registerCommand('projectman.removeProject', async (project?: Project) => {
			await removeProject(project);
			refreshAll();
		}),
		vscode.commands.registerCommand('projectman.refresh', () => {
			refreshAll();
		}),
		vscode.commands.registerCommand('projectman.show', async () => {
			await vscode.commands.executeCommand('workbench.view.extension.projectman');
			await vscode.commands.executeCommand('projectman.projectsGrid.focus');
		})
	);

	updateStatusBar();
}

async function pickProject(storage: ProjectStorage): Promise<Project | undefined> {
	const projects = storage.all;
	if (projects.length === 0) {
		vscode.window.showInformationMessage('No hay proyectos en ProjectMan.');
		return undefined;
	}
	const picked = await vscode.window.showQuickPick(
		projects.map((project) => ({ label: project.name, description: project.path, project })),
		{ placeHolder: 'Selecciona un proyecto' }
	);
	return picked?.project;
}

export function deactivate() {}
