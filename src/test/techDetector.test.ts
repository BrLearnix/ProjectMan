import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectTech } from '../techDetector';

function makeProject(files: Record<string, string>): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'projectman-test-'));
	for (const [relative, content] of Object.entries(files)) {
		const filePath = path.join(dir, relative);
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, content);
	}
	return dir;
}

function npmPackage(deps: Record<string, string>, devDeps?: Record<string, string>): string {
	const packageJson: Record<string, unknown> = { name: 'test', version: '1.0.0', dependencies: deps };
	if (devDeps) {
		packageJson.devDependencies = devDeps;
	}
	return JSON.stringify(packageJson, null, 2);
}

suite('detectTech', () => {
	test('detecta TypeScript + React', () => {
		const dir = makeProject({
			'package.json': npmPackage({ react: '^18.0.0' }, { typescript: '^5.0.0' }),
			'tsconfig.json': '{}',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'TypeScript', technology: 'React' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta JavaScript + Vue', () => {
		const dir = makeProject({
			'package.json': npmPackage({ vue: '^3.0.0' }),
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'JavaScript', technology: 'Vue' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Next.js por encima de React', () => {
		const dir = makeProject({
			'package.json': npmPackage({ next: '^14.0.0', react: '^18.0.0' }),
			'tsconfig.json': '{}',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'TypeScript', technology: 'Next.js' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Go', () => {
		const dir = makeProject({
			'go.mod': 'module example.com/hello\n\ngo 1.22\n',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Go' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Rust', () => {
		const dir = makeProject({
			'Cargo.toml': '[package]\nname = "hello"\n',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Rust' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Python + Django', () => {
		const dir = makeProject({
			'requirements.txt': 'Django==5.0\nrequests\n',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Python', technology: 'Django' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Python + FastAPI con pyproject.toml', () => {
		const dir = makeProject({
			'pyproject.toml': '[project]\ndependencies = ["fastapi"]\n',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Python', technology: 'FastAPI' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta C# + .NET', () => {
		const dir = makeProject({
			'App.csproj': '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'C#', technology: '.NET' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Express sin typescript', () => {
		const dir = makeProject({
			'package.json': npmPackage({ express: '^4.0.0' }),
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'JavaScript', technology: 'Express' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('no detecta nada en carpeta vacía', () => {
		const dir = makeProject({});
		assert.deepStrictEqual(detectTech(dir), {});
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Flutter', () => {
		const dir = makeProject({
			'pubspec.yaml': 'name: app\ndependencies:\n  flutter:\n    sdk: flutter\n',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Dart', technology: 'Flutter' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Laravel', () => {
		const dir = makeProject({
			'composer.json': JSON.stringify({ require: { 'laravel/framework': '^11.0' } }),
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'PHP', technology: 'Laravel' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Java + Spring Boot', () => {
		const dir = makeProject({
			'pom.xml': '<project><dependencies><dependency><groupId>org.springframework.boot</groupId></dependency></dependencies></project>',
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Java', technology: 'Spring Boot' });
		fs.rmSync(dir, { recursive: true, force: true });
	});

	test('detecta Ruby + Rails', () => {
		const dir = makeProject({
			'Gemfile': "source 'https://rubygems.org'\ngem 'rails', '~> 7.0'\n",
		});
		assert.deepStrictEqual(detectTech(dir), { language: 'Ruby', technology: 'Rails' });
		fs.rmSync(dir, { recursive: true, force: true });
	});
});
