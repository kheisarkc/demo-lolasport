$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$tools = Get-Content -LiteralPath (Join-Path $projectPath '.runtime\tools.json') -Raw | ConvertFrom-Json
$env:PHPRC = Join-Path $projectPath '.runtime\php.ini'
& $tools.php @args
exit $LASTEXITCODE
