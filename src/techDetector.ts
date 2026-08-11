import * as fs from 'fs';
import * as path from 'path';

export interface TechInfo {
	language?: string;
	technology?: string;
}

type NpmTechEntry = [candidate: string, display: string];

const NPM_TECH_TIERS: NpmTechEntry[][] = [
	[
		['next', 'Next.js'],
		['nuxt', 'Nuxt'],
		['@nuxt', 'Nuxt'],
		['remix', 'Remix'],
		['@remix-run', 'Remix'],
		['astro', 'Astro'],
		['gatsby', 'Gatsby'],
		['@docusaurus', 'Docusaurus'],
		['@sveltejs', 'SvelteKit'],
		['react-native', 'React Native'],
		['expo', 'Expo'],
		['react', 'React'],
		['@angular', 'Angular'],
		['vue', 'Vue'],
		['svelte', 'Svelte'],
		['ionic', 'Ionic'],
		['@capacitor', 'Capacitor'],
	],
	[
		['@nestjs', 'NestJS'],
		['express', 'Express'],
		['fastify', 'Fastify'],
		['koa', 'Koa'],
		['@hapi', 'Hapi'],
		['adonis', 'AdonisJS'],
		['sails', 'Sails'],
		['meteor', 'Meteor'],
	],
	[
		['electron', 'Electron'],
		['tauri', 'Tauri'],
	],
	[
		['vite', 'Vite'],
		['webpack', 'Webpack'],
		['rollup', 'Rollup'],
		['esbuild', 'esbuild'],
		['parcel', 'Parcel'],
	],
	[
		['tailwindcss', 'Tailwind CSS'],
		['@mui', 'Material UI'],
		['material-ui', 'Material UI'],
		['@emotion', 'Emotion'],
		['styled-components', 'Styled Components'],
		['bootstrap', 'Bootstrap'],
		['sass', 'Sass'],
		['less', 'Less'],
	],
	[
		['prisma', 'Prisma'],
		['drizzle-orm', 'Drizzle'],
		['typeorm', 'TypeORM'],
		['sequelize', 'Sequelize'],
		['knex', 'Knex'],
		['mongoose', 'Mongoose'],
		['mongodb', 'MongoDB'],
		['pg', 'PostgreSQL'],
		['mysql', 'MySQL'],
		['mysql2', 'MySQL'],
		['sqlite3', 'SQLite'],
		['better-sqlite3', 'SQLite'],
		['redis', 'Redis'],
	],
	[
		['@apollo', 'Apollo'],
		['graphql', 'GraphQL'],
		['socket.io', 'Socket.IO'],
		['axios', 'Axios'],
		['three', 'Three.js'],
		['d3', 'D3.js'],
		['p5', 'p5.js'],
		['jquery', 'jQuery'],
		['redux', 'Redux'],
		['zustand', 'Zustand'],
		['mobx', 'MobX'],
	],
	[
		['vitest', 'Vitest'],
		['jest', 'Jest'],
		['mocha', 'Mocha'],
		['cypress', 'Cypress'],
		['playwright', 'Playwright'],
		['puppeteer', 'Puppeteer'],
	],
];

function matchesKey(candidate: string, key: string): boolean {
	if (!key.startsWith(candidate)) {
		return false;
	}
	if (key.length === candidate.length) {
		return true;
	}
	const next = key[candidate.length];
	return next === '/' || next === '-' || next === '.';
}

function findNpmTech(depKeys: string[]): string | undefined {
	const keys = depKeys.map((key) => key.toLowerCase());
	for (const tier of NPM_TECH_TIERS) {
		for (const [candidate, display] of tier) {
			if (keys.some((key) => matchesKey(candidate, key))) {
				return display;
			}
		}
	}
	return undefined;
}

function readJson(filePath: string): Record<string, any> | null {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return null;
	}
}

function firstExisting(folderPath: string, names: string[]): string | undefined {
	return names.find((name) => fs.existsSync(path.join(folderPath, name)));
}

function listTopLevel(folderPath: string): string[] {
	try {
		return fs.readdirSync(folderPath);
	} catch {
		return [];
	}
}

function findFile(folderPath: string, ext: string): string | undefined {
	return listTopLevel(folderPath).find((name) => name.toLowerCase().endsWith(ext));
}

function findDir(folderPath: string, suffix: string): string | undefined {
	return listTopLevel(folderPath).find((name) => name.toLowerCase().endsWith(suffix));
}

function pythonTech(content: string): string | undefined {
	const matchers: Array<[RegExp, string]> = [
		[/django/i, 'Django'],
		[/fastapi/i, 'FastAPI'],
		[/flask/i, 'Flask'],
		[/streamlit/i, 'Streamlit'],
		[/tensorflow/i, 'TensorFlow'],
		[/pytorch/i, 'PyTorch'],
		[/scikit-learn/i, 'scikit-learn'],
		[/pandas/i, 'pandas'],
		[/numpy/i, 'NumPy'],
		[/selenium/i, 'Selenium'],
		[/pytest/i, 'pytest'],
	];
	for (const [regex, display] of matchers) {
		if (regex.test(content)) {
			return display;
		}
	}
	return undefined;
}

function phpTech(content: string): string | undefined {
	const matchers: Array<[RegExp, string]> = [
		[/laravel/i, 'Laravel'],
		[/symfony/i, 'Symfony'],
		[/cakephp/i, 'CakePHP'],
		[/codeigniter/i, 'CodeIgniter'],
		[/slim/i, 'Slim'],
		[/laminas/i, 'Laminas'],
		[/yiisoft/i, 'Yii2'],
		[/wordpress/i, 'WordPress'],
	];
	for (const [regex, display] of matchers) {
		if (regex.test(content)) {
			return display;
		}
	}
	return undefined;
}

function rubyTech(content: string): string | undefined {
	const matchers: Array<[RegExp, string]> = [
		[/rails/i, 'Rails'],
		[/sinatra/i, 'Sinatra'],
		[/jekyll/i, 'Jekyll'],
		[/hanami/i, 'Hanami'],
		[/grape/i, 'Grape'],
		[/rspec/i, 'RSpec'],
	];
	for (const [regex, display] of matchers) {
		if (regex.test(content)) {
			return display;
		}
	}
	return undefined;
}

function dartTech(content: string): string | undefined {
	if (/flutter/i.test(content)) {
		return 'Flutter';
	}
	return undefined;
}

export function detectTech(folderPath: string): TechInfo {
	const info: TechInfo = {};
	try {
		const packageJsonPath = path.join(folderPath, 'package.json');
		if (fs.existsSync(packageJsonPath)) {
			const pkg = readJson(packageJsonPath);
			const deps: Record<string, string> = pkg
				? { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
				: {};
			const keys = Object.keys(deps);
			const hasTs =
				fs.existsSync(path.join(folderPath, 'tsconfig.json')) ||
				keys.includes('typescript') ||
				keys.some((key) => key.startsWith('@types/'));
			info.language = hasTs ? 'TypeScript' : 'JavaScript';
			if (
				fs.existsSync(path.join(folderPath, 'bun.lockb')) ||
				fs.existsSync(path.join(folderPath, 'bun.lock'))
			) {
				info.technology = 'Bun';
			}
			const tech = findNpmTech(keys);
			if (tech) {
				info.technology = tech;
			}
			return info;
		}

		if (
			fs.existsSync(path.join(folderPath, 'deno.json')) ||
			fs.existsSync(path.join(folderPath, 'deno.jsonc'))
		) {
			info.language = 'TypeScript';
			info.technology = 'Deno';
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'Cargo.toml'))) {
			info.language = 'Rust';
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'go.mod'))) {
			info.language = 'Go';
			return info;
		}

		const pyProject = firstExisting(folderPath, ['pyproject.toml', 'requirements.txt', 'setup.py', 'Pipfile']);
		if (pyProject) {
			info.language = 'Python';
			const content = fs.readFileSync(path.join(folderPath, pyProject), 'utf8');
			const tech = pythonTech(content);
			if (tech) {
				info.technology = tech;
			}
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'composer.json'))) {
			info.language = 'PHP';
			const tech = phpTech(fs.readFileSync(path.join(folderPath, 'composer.json'), 'utf8'));
			if (tech) {
				info.technology = tech;
			}
			return info;
		}

		const gemfile = firstExisting(folderPath, ['Gemfile', 'Gemfile.lock']);
		if (gemfile) {
			info.language = 'Ruby';
			const tech = rubyTech(fs.readFileSync(path.join(folderPath, gemfile), 'utf8'));
			if (tech) {
				info.technology = tech;
			}
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'pubspec.yaml'))) {
			info.language = 'Dart';
			const tech = dartTech(fs.readFileSync(path.join(folderPath, 'pubspec.yaml'), 'utf8'));
			if (tech) {
				info.technology = tech;
			}
			return info;
		}

		const fsproj = findFile(folderPath, '.fsproj');
		if (fsproj) {
			info.language = 'F#';
			info.technology = '.NET';
			return info;
		}

		const vbproj = findFile(folderPath, '.vbproj');
		if (vbproj) {
			info.language = 'VB.NET';
			info.technology = '.NET';
			return info;
		}

		const csproj = findFile(folderPath, '.csproj');
		if (csproj) {
			info.language = 'C#';
			info.technology = '.NET';
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'pom.xml'))) {
			info.language = 'Java';
			if (/spring/i.test(fs.readFileSync(path.join(folderPath, 'pom.xml'), 'utf8'))) {
				info.technology = 'Spring Boot';
			}
			return info;
		}

		const gradle = firstExisting(folderPath, ['build.gradle.kts', 'build.gradle']);
		if (gradle) {
			const buildContent = fs.readFileSync(path.join(folderPath, gradle), 'utf8');
			info.language = /org\.jetbrains\.kotlin/i.test(buildContent) ? 'Kotlin' : 'Java';
			const settingsGradle = firstExisting(folderPath, ['settings.gradle.kts', 'settings.gradle']);
			const settingsContent = settingsGradle
				? fs.readFileSync(path.join(folderPath, settingsGradle), 'utf8')
				: '';
			if (/spring/i.test(buildContent) || /spring/i.test(settingsContent)) {
				info.technology = 'Spring Boot';
			}
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'mix.exs'))) {
			info.language = 'Elixir';
			if (/phoenix/i.test(fs.readFileSync(path.join(folderPath, 'mix.exs'), 'utf8'))) {
				info.technology = 'Phoenix';
			}
			return info;
		}

		if (
			fs.existsSync(path.join(folderPath, 'project.clj')) ||
			fs.existsSync(path.join(folderPath, 'deps.edn'))
		) {
			info.language = 'Clojure';
			return info;
		}

		if (
			firstExisting(folderPath, ['stack.yaml', 'package.yaml']) ||
			findFile(folderPath, '.cabal')
		) {
			info.language = 'Haskell';
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'build.sbt'))) {
			info.language = 'Scala';
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'Package.swift')) || findDir(folderPath, '.xcodeproj')) {
			info.language = 'Swift';
			return info;
		}

		if (fs.existsSync(path.join(folderPath, 'build.zig'))) {
			info.language = 'Zig';
			return info;
		}

		if (
			fs.existsSync(path.join(folderPath, 'CMakeLists.txt')) ||
			fs.existsSync(path.join(folderPath, 'meson.build'))
		) {
			info.language = 'C++';
			return info;
		}
	} catch {
		// no se pudo detectar: ignorar
	}
	return info;
}
