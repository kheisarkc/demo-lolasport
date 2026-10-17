import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createConnection } from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const api = join(root, 'apps/api');
const web = join(root, 'apps/web');
const runtime = join(root, '.runtime');
const windows = process.platform === 'win32';
mkdirSync(runtime, { recursive: true });
const local = existsSync(join(runtime, 'tools.json')) ? JSON.parse(readFileSync(join(runtime, 'tools.json'), 'utf8')) : {};
const php = process.env.LOLA_PHP || local.php || 'php';
const composer = process.env.LOLA_COMPOSER || local.composer;
const docker = local.docker || 'docker';
const npmCli = process.env.npm_execpath || local.npmCli;
const ini = join(runtime, 'php.ini');
const env = { ...process.env, COMPOSER_HOME: join(runtime, 'composer-home'), COMPOSER_CACHE_DIR: join(runtime, 'composer-cache'), npm_config_cache: join(runtime, 'npm-cache'), DOCKER_CONFIG: join(runtime, 'docker'), PLAYWRIGHT_BROWSERS_PATH: join(runtime, 'browsers') };
if (existsSync(ini)) env.PHPRC = ini;
// Windows treats Path/PATH equally, but a plain JavaScript object does not.
const inheritedPath = process.env.PATH || process.env.Path || '';
for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
env.PATH = windows ? `${dirname(php)};${dirname(process.execPath)};${inheritedPath}` : inheritedPath;
mkdirSync(env.DOCKER_CONFIG, { recursive: true });

function run(command, args = [], cwd = root, extra = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', windowsHide: true, ...extra });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with code ${result.status}`);
}
function npm(args, cwd = root) {
  if (npmCli) return run(process.execPath, [npmCli, ...args], cwd);
  return run(windows ? 'npm.cmd' : 'npm', args, cwd, { shell: windows });
}
function artisan(args) { return run(php, ['artisan', ...args], api); }
function compose(args) { return run(docker, ['compose', '--project-directory', root, ...args]); }
function readEnv(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/).filter(x => /^[A-Z_][A-Z_0-9]*=/.test(x)).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, '')]; }));
}
function fill(template, values) {
  let text = readFileSync(template, 'utf8');
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const regex = new RegExp(`^#? ?${key}=.*$`, 'm');
    text = regex.test(text) ? text.replace(regex, () => line) : `${text}\n${line}\n`;
  }
  return text;
}
function configure() {
  const rootEnv = join(root, '.env');
  if (!existsSync(rootEnv)) writeFileSync(rootEnv, fill(join(root, '.env.example'), { POSTGRES_PASSWORD: randomBytes(24).toString('hex') }));
  const config = readEnv(rootEnv);
  const apiEnv = join(api, '.env');
  if (!existsSync(apiEnv)) {
    writeFileSync(apiEnv, fill(join(api, '.env.example'), {
      APP_NAME: '"Lola Sport Demo"', APP_ENV: 'local', APP_DEBUG: 'true', APP_URL: 'http://127.0.0.1:8001', APP_LOCALE: 'id',
      DB_CONNECTION: 'pgsql', DB_HOST: '127.0.0.1', DB_PORT: config.POSTGRES_PORT || '55433', DB_DATABASE: config.POSTGRES_DB || 'lola_demo', DB_USERNAME: config.POSTGRES_USER || 'lola', DB_PASSWORD: config.POSTGRES_PASSWORD,
      SESSION_COOKIE: 'lola_demo_session', SESSION_DRIVER: 'file', CACHE_STORE: 'file', QUEUE_CONNECTION: 'sync', SANCTUM_STATEFUL_DOMAINS: '127.0.0.1:3001', FRONTEND_URL: 'http://127.0.0.1:3001',
    }));
  }
  const testing = join(api, '.env.testing');
  if (!existsSync(testing)) writeFileSync(testing, fill(apiEnv, { APP_ENV: 'testing', DB_DATABASE: 'lola_demo_test', CACHE_STORE: 'array', SESSION_DRIVER: 'array', MAIL_MAILER: 'array' }));
  const webEnv = join(web, '.env.local');
  if (!existsSync(webEnv)) writeFileSync(webEnv, 'LARAVEL_API_URL=http://127.0.0.1:8001\n');
  if (!readEnv(apiEnv).APP_KEY) artisan(['key:generate', '--no-interaction']);
  if (!readEnv(testing).APP_KEY) artisan(['key:generate', '--env=testing', '--no-interaction']);
}
async function waitHttp(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try { const result = await fetch(url, { signal: AbortSignal.timeout(3000) }); if (result.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Service did not become ready: ${url}`);
}
async function portIsFree(port) {
  return new Promise(resolvePort => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolvePort(false); });
    socket.once('error', () => resolvePort(true));
    socket.setTimeout(1000, () => { socket.destroy(); resolvePort(true); });
  });
}
async function dev() {
  configure();
  for (const port of [8001, 3001]) if (!(await portIsFree(port))) throw new Error(`Port ${port} is already occupied; refusing to stop another process.`);
  if (env.LOLA_DATABASE_EXTERNAL !== '1') compose(['up', '-d', '--wait']);
  artisan(['migrate', '--no-interaction']);
  artisan(['db:seed', '--no-interaction']);
  const children = [];
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    for (const child of children) {
      if (!child.pid || child.exitCode !== null) continue;
      if (windows) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      else child.kill();
    }
  };
  process.on('SIGINT', () => { stop(); process.exit(0); });
  process.on('SIGTERM', () => { stop(); process.exit(0); });
  const backend = spawn(php, ['artisan', 'serve', '--host=127.0.0.1', '--port=8001', '--no-reload'], { cwd: api, env, stdio: 'inherit', windowsHide: true });
  children.push(backend);
  backend.on('error', error => { console.error(error.message); stop(); process.exitCode = 1; });
  try { await waitHttp('http://127.0.0.1:8001/api/v1/health'); }
  catch (error) { stop(); throw error; }
  const frontend = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3001'], { cwd: web, env, stdio: 'inherit', windowsHide: true });
  children.push(frontend);
  frontend.on('error', error => { console.error(error.message); stop(); process.exitCode = 1; });
  for (const child of children) child.once('exit', code => { stop(); process.exitCode = code ?? 1; });
  console.log('Lola Sport: http://127.0.0.1:3001');
}
async function e2eServer() {
  configure();
  const webPort = Number(env.LOLA_E2E_WEB_PORT || 3002);
  const apiPort = Number(env.LOLA_E2E_API_PORT || 8002);
  for (const port of [webPort, apiPort]) if (!(await portIsFree(port))) throw new Error(`Test port ${port} is occupied; refusing to reuse or stop another process.`);
  if (env.LOLA_DATABASE_EXTERNAL !== '1') compose(['up', '-d', '--wait']);
  // The testing environment and Laravel guards verify the actual database before migrations/seed.
  artisan(['migrate:fresh', '--env=testing', '--seed', '--no-interaction']);
  const testEnv = join(api, '.env.e2e');
  const storage = join(runtime, 'e2e-storage');
  for (const folder of ['app/private', 'app/public', 'framework/sessions', 'framework/views', 'framework/cache/data', 'logs']) mkdirSync(join(storage, folder), { recursive: true });
  const existingKey = readEnv(testEnv).APP_KEY || `base64:${randomBytes(32).toString('base64')}`;
  writeFileSync(testEnv, fill(join(api, '.env.testing'), { APP_ENV: 'e2e', APP_KEY: existingKey, APP_URL: `http://127.0.0.1:${apiPort}`, FRONTEND_URL: `http://127.0.0.1:${webPort}`, SANCTUM_STATEFUL_DOMAINS: `127.0.0.1:${webPort}`, SESSION_DRIVER: 'file', SESSION_COOKIE: 'lola_demo_e2e_session', CACHE_STORE: 'file' }));
  mkdirSync(join(runtime, 'reports'), { recursive: true });
  const serviceLog = createWriteStream(join(runtime, 'reports/e2e-services.log'), { flags: 'w' });
  const log = message => serviceLog.write(`${new Date().toISOString()} ${message}\n`);
  const children = []; let stopping = false;
  const stop = () => { if (stopping) return; stopping = true; for (const child of children) { if (!child.pid || child.exitCode !== null) continue; if (windows) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); else child.kill(); } };
  process.on('SIGINT', () => { stop(); process.exit(0); }); process.on('SIGTERM', () => { stop(); process.exit(0); });
  const backend = spawn(php, ['artisan', 'serve', '--env=e2e', '--host=127.0.0.1', `--port=${apiPort}`, '--no-reload'], { cwd: api, env: { ...env, APP_ENV: 'e2e', LARAVEL_STORAGE_PATH: storage }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  log(`PHP parent ${backend.pid}`);
  backend.stdout.on('data', data => { serviceLog.write(data); process.stdout.write(data); });
  backend.stderr.on('data', data => { serviceLog.write(data); process.stderr.write(data); });
  children.push(backend);
  backend.on('error', error => { console.error(error.message); stop(); process.exitCode = 1; });
  try { await waitHttp(`http://127.0.0.1:${apiPort}/api/v1/health`); } catch (error) { stop(); throw error; }
  const browserEnv = { ...env, LOLA_E2E: '1', LARAVEL_API_URL: `http://127.0.0.1:${apiPort}` };
  try { run(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'build'], web, { env: browserEnv }); }
  catch (error) { stop(); throw error; }
  const frontend = spawn(process.execPath, [join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(webPort)], { cwd: web, env: browserEnv, stdio: 'inherit', windowsHide: true });
  children.push(frontend);
  frontend.on('error', error => { console.error(error.message); stop(); process.exitCode = 1; });
  for (const child of children) child.once('exit', (code, signal) => { log(`Child ${child.pid} exited: ${code} ${signal}`); stop(); process.exitCode = code ?? 1; });
  console.log(`Browser test services use lola_demo_test: http://127.0.0.1:${webPort}`);
}
function doctor() {
  run(php, ['-v']);
  run(php, ['-r', 'if (!extension_loaded("pdo_pgsql")) { fwrite(STDERR,"pdo_pgsql is missing\\n"); exit(1); } echo "pdo_pgsql ready\\n";']);
  console.log(`Node ${process.version}`);
  compose(['ps']);
  for (const file of ['AGENTS.md', '.codex/config.toml', '.agents/skills/speckit-implement/SKILL.md', 'apps/api/vendor/autoload.php', 'node_modules/next/package.json']) {
    if (!existsSync(join(root, file))) throw new Error(`Missing: ${file}`);
  }
  console.log('Project tools and workflow files are present.');
}
const [command = 'doctor', ...args] = process.argv.slice(2);
try {
  if (command === 'dev') await dev();
  else if (command === 'e2e:serve') await e2eServer();
  else if (command === 'doctor') doctor();
  else if (command === 'db:up') { configure(); compose(['up', '-d', '--wait']); }
  else if (command === 'db:stop') compose(['stop']);
  else if (command === 'artisan') artisan(args);
  else if (command === 'configure') configure();
  else if (command === 'test:e2e') run(process.execPath, [join(root, 'node_modules/@playwright/test/cli.js'), 'test', ...args]);
  else if (command === 'test:api') {
    configure();
    if (env.LOLA_DATABASE_EXTERNAL !== '1') compose(['up', '-d', '--wait']);
    artisan(['test', ...args]);
  }
  else if (command === 'setup') { configure(); compose(['up', '-d', '--wait']); artisan(['migrate', '--no-interaction']); artisan(['db:seed', '--no-interaction']); }
  else if (command === 'check') {
    configure();
    if (env.LOLA_DATABASE_EXTERNAL !== '1') compose(['up', '-d', '--wait']);
    run(php, ['vendor/bin/pint', '--test'], api);
    artisan(['test']);
    run(php, ['vendor/bin/phpstan', 'analyse', '--memory-limit=1G', '--no-progress'], api);
    npm(['run', 'lint', '--workspace', 'apps/web']);
    npm(['run', 'typecheck', '--workspace', 'apps/web']);
    run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--project', join(root, 'tsconfig.e2e.json')]);
    npm(['run', 'build', '--workspace', 'apps/web']);
  }
  else if (command === 'specify') run(windows ? join(runtime, 'specify/Scripts/specify.exe') : join(runtime, 'specify/bin/specify'), args);
  else if (command === 'agent:run') {
    const task = args.join(' ').trim();
    if (!task) throw new Error('Usage: npm run agent:run -- "Describe one bounded task"');
    mkdirSync(join(runtime, 'reports'), { recursive: true });
    const output = join(runtime, 'reports', `task-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    const prompt = `Read AGENTS.md and docs/START-HERE.md. Execute this authorized local development task end-to-end following docs/WORKFLOW.md. Persist plans and progress, run relevant checks, and report actual evidence. Do not deploy, access production, delete data, or invent unresolved business decisions. Task: ${task}`;
    run(local.codex || 'codex', ['exec', '--cd', root, '--sandbox', 'workspace-write', '--approve-for-me', '--output-last-message', output, prompt]);
  }
  else throw new Error(`Unknown command: ${command}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
