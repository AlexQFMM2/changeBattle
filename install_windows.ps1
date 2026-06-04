$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "ChangeBattle install check"
Write-Host "This script uses the same launcher install logic."
Write-Host ""

& (Join-Path $RootDir "ChangeBattle.ps1")
exit $LASTEXITCODE
