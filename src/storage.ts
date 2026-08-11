import * as vscode from 'vscode';
import { Project } from './project';

const STORAGE_KEY = 'projectman.projects';

export class ProjectStorage {
	private readonly context: vscode.ExtensionContext;
	private projects: Project[];

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.projects = context.globalState.get<Project[]>(STORAGE_KEY, []);
	}

	get all(): Project[] {
		return [...this.projects].sort((a, b) => a.name.localeCompare(b.name));
	}

	has(path: string): boolean {
		return this.projects.some((project) => project.path === path);
	}

	async add(project: Project): Promise<void> {
		this.projects.push(project);
		await this.save();
	}

	async removeById(id: string): Promise<void> {
		this.projects = this.projects.filter((project) => project.id !== id);
		await this.save();
	}

	private async save(): Promise<void> {
		await this.context.globalState.update(STORAGE_KEY, this.projects);
	}
}
