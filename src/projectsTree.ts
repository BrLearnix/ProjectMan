import * as vscode from 'vscode';
import { Project } from './project';

let showPaths = false;

export function toggleShowPaths(): boolean {
	showPaths = !showPaths;
	return showPaths;
}

export class ProjectsProvider implements vscode.TreeDataProvider<ProjectItem> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<ProjectItem | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(private readonly getProjects: () => Project[]) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ProjectItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ProjectItem): vscode.ProviderResult<ProjectItem[]> {
		if (element) {
			return [];
		}
		return this.getProjects().map((project) => new ProjectItem(project));
	}
}

export class ProjectItem extends vscode.TreeItem {
	constructor(public readonly project: Project) {
		super(project.name, vscode.TreeItemCollapsibleState.None);
		this.description = showPaths ? project.path : project.technology;
		this.tooltip = `${project.name}\n${project.path}`;
		this.iconPath = new vscode.ThemeIcon('folder');
		this.contextValue = 'project';
		this.command = {
			command: 'projectman.openProject',
			title: 'Abrir proyecto',
			arguments: [this],
		};
	}
}
