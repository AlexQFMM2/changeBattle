$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

if (-not $env:SHOWDOWN_PATH) {
  $env:SHOWDOWN_PATH = Join-Path $RootDir "vendor/pokemon-showdown"
}

$simIndex = Join-Path $env:SHOWDOWN_PATH "dist/sim/index.js"
if (-not (Test-Path $simIndex)) {
  Write-Host "找不到 Pokemon Showdown 构建产物:"
  Write-Host "  $simIndex"
  Write-Host ""
  Write-Host "如果你使用 Release zip，请确认 vendor/pokemon-showdown 已包含在压缩包内。"
  Write-Host "如果你自己拉取 Showdown，请设置 SHOWDOWN_PATH 后重新运行。"
  exit 1
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "找不到 python。请先安装 Python 3.10+，并勾选 Add python.exe to PATH。"
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "找不到 node。请先安装 Node.js 20+。"
  exit 1
}

python (Join-Path $RootDir "changeBattle-cli/play.py") @args
