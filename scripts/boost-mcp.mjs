import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const toolsPath = join(root, '.runtime/tools.json');
const tools = existsSync(toolsPath) ? JSON.parse(readFileSync(toolsPath, 'utf8')) : {};
const ini = join(root, '.runtime/php.ini');
const env = { ...process.env };
if (existsSync(ini)) env.PHPRC = ini;
const child = spawn(tools.php || 'php', ['artisan', 'boost:mcp'], { cwd: join(root, 'apps/api'), env, stdio: 'inherit', windowsHide: true });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
