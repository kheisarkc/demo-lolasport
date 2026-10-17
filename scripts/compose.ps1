$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$tools = Get-Content -LiteralPath (Join-Path $projectPath '.runtime\tools.json') -Raw | ConvertFrom-Json
$env:DOCKER_CONFIG = Join-Path $projectPath '.runtime\docker'
& $tools.docker compose --project-directory $projectPath @args
exit $LASTEXITCODE
