param([switch]$SkipBrowserDownload)
$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectPath
$runtimePath = Join-Path $projectPath '.runtime'
New-Item -ItemType Directory -Force -Path $runtimePath,(Join-Path $runtimePath 'docker') | Out-Null
$phpPath = if (Test-Path -LiteralPath 'C:\Tools\php84\php.exe') { 'C:\Tools\php84\php.exe' } else { (Get-Command php -ErrorAction Stop).Source }
& $phpPath -r 'exit(version_compare(PHP_VERSION, "8.4.0", ">=") ? 0 : 1);'
if ($LASTEXITCODE -ne 0) { throw 'PHP 8.4 or newer is required by the tested lockfile. Set up a compatible PHP runtime first.' }
$nodePath = (Get-Command node -ErrorAction Stop).Source
$dockerPath = (Get-Command docker -ErrorAction Stop).Source
$composerCommand = (Get-Command composer -ErrorAction Stop).Source
$composerPath = Join-Path (Split-Path -Parent $composerCommand) 'composer.phar'
if (-not (Test-Path -LiteralPath $composerPath)) { throw 'composer.phar was not found beside the Composer launcher.' }
$npmCli = Join-Path (Split-Path -Parent $nodePath) 'node_modules\npm\bin\npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) { throw 'Could not locate the npm CLI beside node.exe.' }
$tools = @{php=$phpPath;composer=$composerPath;npmCli=$npmCli;docker=$dockerPath}
$tools | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimePath 'tools.json') -Encoding utf8NoBOM
$iniPath = Join-Path $runtimePath 'php.ini'
if (-not (Test-Path -LiteralPath $iniPath)) {
    $phpFolder = Split-Path -Parent $phpPath
    $baseIni = Join-Path $phpFolder 'php.ini'
    if (-not (Test-Path -LiteralPath $baseIni)) { $baseIni = Join-Path $phpFolder 'php.ini-development' }
    $iniText = Get-Content -LiteralPath $baseIni -Raw
    $iniText += "`nextension_dir = `"$(Join-Path $phpFolder 'ext')`"`n"
    if ($iniText -notmatch '(?m)^\s*extension\s*=\s*pdo_pgsql\s*$') { $iniText += "`nextension=pdo_pgsql`n" }
    if ($iniText -notmatch '(?m)^\s*extension\s*=\s*pgsql\s*$') { $iniText += "`nextension=pgsql`n" }
    Set-Content -LiteralPath $iniPath -Value $iniText -Encoding utf8NoBOM
}
$env:PHPRC = $iniPath
$env:PATH = (Split-Path -Parent $phpPath) + ';' + (Split-Path -Parent $nodePath) + ';' + $env:PATH
$env:COMPOSER_HOME = Join-Path $runtimePath 'composer-home'
$env:COMPOSER_CACHE_DIR = Join-Path $runtimePath 'composer-cache'
$env:npm_config_cache = Join-Path $runtimePath 'npm-cache'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $runtimePath 'browsers'
Push-Location -LiteralPath (Join-Path $projectPath 'apps\api')
try {
    & $phpPath $composerPath install --no-interaction --prefer-dist
    if ($LASTEXITCODE -ne 0) { throw 'Composer install failed.' }
} finally { Pop-Location }
& $nodePath $npmCli ci --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
if (-not $SkipBrowserDownload) {
    & $nodePath 'node_modules/@playwright/test/cli.js' install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Playwright browser install failed.' }
}
& $nodePath 'scripts/project.mjs' setup
if ($LASTEXITCODE -ne 0) { throw 'Local environment setup failed. Ensure Docker Desktop is running.' }
Write-Output 'Setup selesai. Jalankan npm run doctor, lalu npm run dev untuk membuka aplikasi.'
