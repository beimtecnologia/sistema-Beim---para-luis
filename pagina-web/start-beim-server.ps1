$ErrorActionPreference = "Stop"
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $projectPath "server.js"

$alreadyRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($alreadyRunning) {
  exit 0
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  exit 1
}

Start-Process `
  -FilePath $nodeCommand.Source `
  -ArgumentList $serverPath `
  -WorkingDirectory $projectPath `
  -WindowStyle Hidden
