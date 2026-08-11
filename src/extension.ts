import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Project } from './project';
import { ProjectsPanelProvider } from './projectsPanel';
import { ProjectStorage } from './storage';

export function activate(context: vscode.ExtensionContext) {
	const storage = new ProjectStorage(context);
	void storage.backfillTech();

	const openTerminalForProject = (projectPath: string): void => {
		const terminal = vscode.window.createTerminal({
			name: `ProjectMan: ${path.basename(projectPath)}`,
			cwd: projectPath,
		});
		terminal.show();
	};

	const pendingTerminalPath = context.globalState.get<string>('projectman.openWithTerminal');
	if (pendingTerminalPath) {
		const folder = vscode.workspace.workspaceFolders?.[0];
		if (folder && folder.uri.fsPath === pendingTerminalPath) {
			openTerminalForProject(pendingTerminalPath);
		}
		void context.globalState.update('projectman.openWithTerminal', undefined);
	}

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

	const newProjectBlank = async (): Promise<void> => {
		const name = await vscode.window.showInputBox({
			prompt: 'Nombre del nuevo proyecto',
			placeHolder: 'mi-proyecto',
			validateInput: (value) => {
				if (!value || !value.trim()) {
					return 'Escribe un nombre para el proyecto';
				}
				if (/[\\/:*?"<>|]/.test(value)) {
					return 'El nombre no puede contener \\ / : * ? " < > |';
				}
				return undefined;
			},
		});
		if (!name) {
			return;
		}
		const trimmed = name.trim();
		const dest = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Crear aquí',
			title: `ProjectMan: ¿dónde crear "${trimmed}"?`,
		});
		if (!dest || dest.length === 0) {
			return;
		}
		const folderPath = path.join(dest[0].fsPath, trimmed);
		try {
			if (fs.existsSync(folderPath)) {
				vscode.window.showErrorMessage(`Ya existe una carpeta llamada "${trimmed}" en esa ubicación.`);
				return;
			}
			fs.mkdirSync(folderPath, { recursive: true });
			fs.writeFileSync(path.join(folderPath, 'README.md'), `# ${trimmed}\n`);
			fs.writeFileSync(
				path.join(folderPath, '.gitignore'),
				'node_modules/\ndist/\nout/\n*.log\n.DS_Store\n'
			);
			await initGitBestEffort(folderPath);
		} catch (err) {
			vscode.window.showErrorMessage(`ProjectMan: no se pudo crear el proyecto: ${String(err)}`);
			return;
		}
		const project: Project = {
			id: `${folderPath}-${Date.now()}`,
			name: trimmed,
			path: folderPath,
			addedAt: Date.now(),
		};
		if (storage.has(project.path)) {
			vscode.window.showInformationMessage(`El proyecto "${trimmed}" ya está en ProjectMan.`);
			return;
		}
		await storage.add(project);
		const action = await vscode.window.showInformationMessage(
			`Proyecto "${trimmed}" creado.`,
			'Abrir'
		);
		if (action === 'Abrir') {
			await openProject(project);
		}
	};

	const newProjectWithCommand = async (): Promise<void> => {
		const dest = await vscode.window.showOpenDialog({
			canSelectFiles: false,
			canSelectFolders: true,
			canSelectMany: false,
			openLabel: 'Crear aquí',
			title: 'ProjectMan: ¿dónde crear el proyecto?',
		});
		if (!dest || dest.length === 0) {
			return;
		}
		const destPath = dest[0].fsPath;
		const terminal = vscode.window.createTerminal({
			name: 'ProjectMan: crear proyecto',
			cwd: destPath,
		});
		terminal.show();
		const before = new Set(listSubdirectories(destPath));
		const rawCommand = await vscode.window.showInputBox({
			prompt: 'Comando para crear el proyecto (incluye el nombre del proyecto)',
			placeHolder: 'npm create vite@latest mi-proyecto',
			validateInput: (value) => (value && value.trim() ? undefined : 'Escribe el comando'),
		});
		let hint: string | undefined;
		if (rawCommand) {
			const command = rawCommand.trim();
			hint = projectNameFromCommand(command);
			terminal.sendText(command);
		} else {
			vscode.window.showInformationMessage(
				'Terminal abierta en la carpeta elegida. Escribe el comando ahí y el proyecto aparecerá automáticamente.'
			);
		}
		void waitForProjectFolder(destPath, hint, before, storage, refreshAll);
	};

	const newProject = async (): Promise<void> => {
		const mode = await vscode.window.showQuickPick(
			[
				{
					label: '$(new-folder) Proyecto en blanco',
					description: 'README, .gitignore y git init',
					mode: 'blank',
				},
				{
					label: '$(terminal) Proyecto con comando',
					description: 'p. ej. npm create vite@latest mi-proyecto',
					mode: 'command',
				},
			],
			{ placeHolder: '¿Cómo quieres crear el proyecto?', title: 'ProjectMan: nuevo proyecto' }
		);
		if (!mode) {
			return;
		}
		if (mode.mode === 'command') {
			await newProjectWithCommand();
		} else {
			await newProjectBlank();
		}
	};

	const openProject = async (project?: Project): Promise<void> => {
		if (!project) {
			project = await pickProject(storage);
			if (!project) {
				return;
			}
		}
		await context.globalState.update('projectman.openWithTerminal', project.path);
		await vscode.commands.executeCommand(
			'vscode.openFolder',
			vscode.Uri.file(project.path),
			{ forceNewWindow: false }
		);
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

	const gridProvider = new ProjectsPanelProvider(
		() => storage.all,
		addProject,
		newProject,
		openProject,
		removeProject
	);

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
		vscode.commands.registerCommand('projectman.newProject', async () => {
			await newProject();
			refreshAll();
		}),
		vscode.commands.registerCommand('projectman.newProjectCommand', async () => {
			await newProjectWithCommand();
			refreshAll();
		}),
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

function projectNameFromCommand(command: string): string | undefined {
	const tokens = command
		.trim()
		.split(/\s+/)
		.filter((token) => token && !token.startsWith('-'));
	const lastToken = tokens[tokens.length - 1];
	if (!lastToken) {
		return undefined;
	}
	const unquoted = lastToken.replace(/^['"]|['"]$/g, '');
	const lastSegment = unquoted.split(/[\\/]/).pop() ?? unquoted;
	if (!lastSegment || lastSegment === '.' || lastSegment.includes('@')) {
		return undefined;
	}
	return lastSegment;
}

function initGitBestEffort(folderPath: string): Promise<void> {
	return new Promise((resolve) => {
		try {
			exec('git init', { cwd: folderPath }, () => resolve());
		} catch {
			resolve();
		}
	});
}

function listSubdirectories(folderPath: string): string[] {
	try {
		return fs
			.readdirSync(folderPath, { withFileTypes: true })
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
			.map((entry) => entry.name);
	} catch {
		return [];
	}
}

async function waitForProjectFolder(
	destPath: string,
	hint: string | undefined,
	before: Set<string>,
	storage: ProjectStorage,
	onAdded?: () => void
): Promise<void> {
	for (let attempt = 0; attempt < 60; attempt++) {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		let createdName: string | undefined;
		if (hint && !before.has(hint) && fs.existsSync(path.join(destPath, hint))) {
			createdName = hint;
		} else {
			createdName = listSubdirectories(destPath).find((name) => !before.has(name));
		}
		if (!createdName) {
			continue;
		}
		const folderPath = path.join(destPath, createdName);
		const project: Project = {
			id: `${folderPath}-${Date.now()}`,
			name: createdName,
			path: folderPath,
			addedAt: Date.now(),
		};
		if (!storage.has(project.path)) {
			await storage.add(project);
			onAdded?.();
			const action = await vscode.window.showInformationMessage(
				`Proyecto "${createdName}" creado con el comando.`,
				'Abrir'
			);
			if (action === 'Abrir') {
				await vscode.commands.executeCommand('projectman.openProject', project);
			}
		}
		return;
	}
	vscode.window.showInformationMessage(
		'No se detectó ninguna carpeta nueva. Cuando el comando termine, añádela con "Añadir carpeta".'
	);
}

export function deactivate() {}
