$ErrorActionPreference = "Stop"

function Get-PythonVersion {
  $cmd = Get-Command python -ErrorAction SilentlyContinue
  if (-not $cmd) {
    $cmd = Get-Command py -ErrorAction SilentlyContinue
    if (-not $cmd) { return $null }
    $output = & py -3 --version 2>$null
  } else {
    $output = & python --version 2>$null
  }
  if ($LASTEXITCODE -ne 0 -or -not $output) { return $null }
  if ($output -match "Python\s+(\d+)\.(\d+)\.(\d+)") {
    return [version]"$($Matches[1]).$($Matches[2]).$($Matches[3])"
  }
  return $null
}

function Get-NodeVersion {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return $null }
  $output = & node --version 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $output) { return $null }
  if ($output -match "v(\d+)\.(\d+)\.(\d+)") {
    return [version]"$($Matches[1]).$($Matches[2]).$($Matches[3])"
  }
  return $null
}

function Refresh-Path {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Test-Winget {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    return $true
  }
  Write-Host "winget was not found. Automatic install is not available."
  Write-Host "Please install manually:"
  Write-Host "Python 3.12: https://www.python.org/downloads/windows/"
  Write-Host "Node.js 20 LTS: https://nodejs.org/"
  return $false
}

function Install-MissingDependencies {
  param($Missing)

  if ($Missing.Count -le 0) {
    return $true
  }
  if (-not (Test-Winget)) {
    return $false
  }

  foreach ($item in $Missing) {
    if ($item -eq "Python 3.10+") {
      Write-Host ""
      Write-Host "Installing Python 3.12..."
      winget install --id Python.Python.3.12 --source winget --accept-package-agreements --accept-source-agreements
      if ($LASTEXITCODE -ne 0) {
        Write-Host "Python install failed."
        return $false
      }
      Refresh-Path
    } elseif ($item -eq "Node.js 20+") {
      Write-Host ""
      Write-Host "Installing Node.js LTS..."
      winget install --id OpenJS.NodeJS.LTS --source winget --accept-package-agreements --accept-source-agreements
      if ($LASTEXITCODE -ne 0) {
        Write-Host "Node.js install failed."
        return $false
      }
      Refresh-Path
    }
  }
  return $true
}

function Test-Environment {
  $pythonVersion = Get-PythonVersion
  $nodeVersion = Get-NodeVersion
  $missing = @()
  if (-not $pythonVersion -or $pythonVersion -lt [version]"3.10.0") {
    $missing += "Python 3.10+"
  }
  if (-not $nodeVersion -or $nodeVersion.Major -lt 20) {
    $missing += "Node.js 20+"
  }
  return @{
    PythonVersion = $pythonVersion
    NodeVersion = $nodeVersion
    Missing = $missing
  }
}

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "ChangeBattle launcher"

$envInfo = Test-Environment
if ($envInfo.PythonVersion) {
  Write-Host "Python: $($envInfo.PythonVersion)"
} else {
  Write-Host "Python: not found"
}
if ($envInfo.NodeVersion) {
  Write-Host "Node.js: $($envInfo.NodeVersion)"
} else {
  Write-Host "Node.js: not found"
}

if ($envInfo.Missing.Count -gt 0) {
  Write-Host ""
  Write-Host "Missing required environment:"
  foreach ($item in $envInfo.Missing) {
    Write-Host "  - $item"
  }
  Write-Host ""
  $answer = Read-Host "Install missing dependencies now with winget? [Y/N]"
  if ($answer -notmatch "^[Yy]") {
    Write-Host "Canceled. You can run install_windows.cmd later."
    exit 1
  }

  $installed = Install-MissingDependencies $envInfo.Missing
  if (-not $installed) {
    Write-Host "Dependency installation failed."
    exit 1
  }
  Refresh-Path

  $envInfo = Test-Environment
  if ($envInfo.Missing.Count -gt 0) {
    Write-Host "Dependencies are still missing after install:"
    foreach ($item in $envInfo.Missing) {
      Write-Host "  - $item"
    }
    Write-Host "Please reopen this folder or restart Windows, then run ChangeBattle.cmd again."
    exit 1
  }
}

$showdownIndex = Join-Path $RootDir "vendor/pokemon-showdown/dist/sim/index.js"
if (-not (Test-Path $showdownIndex)) {
  Write-Host "Pokemon Showdown vendor is missing:"
  Write-Host "  $showdownIndex"
  exit 1
}

Write-Host ""
Write-Host "Environment ready. Starting ChangeBattle..."
Write-Host ""

& (Join-Path $RootDir "start_game_cli.cmd") @args
exit $LASTEXITCODE
