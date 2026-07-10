param(
  [string]$Version = "",
  [string]$SourceRoot = "D:\changeBattleV2\changeBattleV2",
  [string]$ReleaseRoot = "D:\changeBattleV2\release",
  [string]$ElectronRuntimePath = "D:\changeBattleV2\electron-runtime\electron",
  [string]$ShowdownPath = "",
  [string]$ShowdownClientPath = "",
  [string]$Commit = "",
  [ValidateSet("stable", "beta")]
  [string]$Channel = "stable"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Version)) {
  $Version = Read-Host "Release version"
}

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
  throw "Version must look like X.Y.Z, got: $Version"
}

$DefaultUpdateManifestUrl = if ($Channel -eq "beta") {
  "https://65h26i.top/changebattle-beta/latest.json"
} else {
  "https://65h26i.top/changebattle/latest.json"
}

if (-not (Test-Path $SourceRoot)) {
  throw "Source root missing: $SourceRoot"
}

Set-Location $SourceRoot

$PackageVersion = node -p "require('./package.json').version"
if ($PackageVersion.Trim() -ne $Version) {
  throw "package.json version is $PackageVersion, expected $Version"
}

if (-not (Test-Path (Join-Path $ElectronRuntimePath "electron.exe"))) {
  throw "Electron runtime missing: $ElectronRuntimePath. Copy V1 runtime from D:\changeBattle\electron-runtime\electron or provide -ElectronRuntimePath."
}

if ([string]::IsNullOrWhiteSpace($ShowdownPath)) {
  $ShowdownPath = Join-Path $SourceRoot "packages\showdown-battle-core\vendor\showdown"
}

if ([string]::IsNullOrWhiteSpace($ShowdownClientPath)) {
  $ShowdownClientPath = Join-Path $SourceRoot "packages\showdown-battle-core\vendor\showdown-client"
}

if (-not (Test-Path (Join-Path $ShowdownPath "sim\index.js"))) {
  throw "Pokemon Showdown vendor missing: $ShowdownPath"
}

if (-not (Test-Path (Join-Path $ShowdownClientPath "js\battle.js"))) {
  throw "Pokemon Showdown client playback vendor missing: $ShowdownClientPath"
}

if ([string]::IsNullOrWhiteSpace($Commit)) {
  $CommitFile = Join-Path $SourceRoot ".changebattle-release-commit"
  if (Test-Path $CommitFile) {
    $Commit = (Get-Content $CommitFile -Raw).Trim()
  }
}

if ([string]::IsNullOrWhiteSpace($Commit)) {
  try {
    $Commit = (git rev-parse --short HEAD).Trim()
  } catch {
    $Commit = "unknown"
  }
}

New-Item -ItemType Directory -Force $ReleaseRoot | Out-Null

Write-Host "Installing dependencies..."
pnpm install

Write-Host "Running release checks..."
pnpm --filter @changebattle-v2/core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/api test:formal-game
pnpm typecheck

Write-Host "Building desktop..."
$env:CHANGEBATTLE_PROJECT_ROOT = $SourceRoot
$env:CHANGEBATTLE_RELEASE_CHANNEL = $Channel
$env:CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT = Join-Path $ShowdownClientPath "js"
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
pnpm --filter @changebattle-v2/desktop test:renderer-assets
pnpm --filter @changebattle-v2/desktop test:formal-worker

Write-Host "Packaging desktop release..."
$env:ELECTRON_RUNTIME_PATH = $ElectronRuntimePath
$env:CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT = $ShowdownPath
$env:CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT = $ShowdownClientPath
$env:CHANGEBATTLE_COMMIT = $Commit
if ([string]::IsNullOrWhiteSpace($env:CHANGEBATTLE_UPDATE_MANIFEST_URLS)) {
  $env:CHANGEBATTLE_UPDATE_MANIFEST_URLS = $DefaultUpdateManifestUrl
}
python tools\package_desktop_release.py --electron-runtime-path $ElectronRuntimePath --showdown-path $ShowdownPath --showdown-client-path $ShowdownClientPath

$PackageName = if ($Channel -eq "beta") {
  "ChangeBattle-V2-Desk-portable-debug-v$Version"
} else {
  "ChangeBattle-V2-Desk-portable-v$Version"
}
$ZipName = "$PackageName.zip"
$LocalZip = Join-Path $SourceRoot "release\$ZipName"
$ReleaseZip = Join-Path $ReleaseRoot $ZipName

if (-not (Test-Path $LocalZip)) {
  throw "Desktop zip was not produced: $LocalZip"
}

Copy-Item -Force $LocalZip $ReleaseZip

Write-Host "Validating desktop zip..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
$Zip = [IO.Compression.ZipFile]::OpenRead($ReleaseZip)
try {
  $Names = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($Entry in $Zip.Entries) {
    [void]$Names.Add($Entry.FullName)
  }
  $Prefix = $PackageName
  $Wanted = @(
    "$Prefix/ChangeBattle-V2-Desk.cmd",
    "$Prefix/RELEASE-README.md",
    "$Prefix/update-manifest.json",
    "$Prefix/apps/desktop/out/main/main.js",
    "$Prefix/apps/desktop/out/main/formalComputeWorker.js",
    "$Prefix/apps/desktop/out/preload/preload.cjs",
    "$Prefix/apps/desktop/out/renderer/index.html",
    "$Prefix/runtime/electron/electron.exe",
    "$Prefix/vendor/pokemon-showdown/sim/index.js",
    "$Prefix/vendor/pokemon-showdown/node_modules/ts-chacha20/package.json",
    "$Prefix/vendor/showdown-client/js/battle.js",
    "$Prefix/vendor/showdown-client/js/battle-scene-stub.js"
  )
  foreach ($Item in $Wanted) {
    if (-not $Names.Contains($Item)) {
      throw "Missing from zip: $Item"
    }
  }
  foreach ($Name in $Names) {
    if ($Name.Contains("/debug/") -or $Name.Contains("/.git/") -or $Name.StartsWith("$Prefix/changeBattle/")) {
      throw "Forbidden path in zip: $Name"
    }
  }
} finally {
  $Zip.Dispose()
}

Write-Host "Desktop release ready: $ReleaseZip"
Get-Item $ReleaseZip | Select-Object FullName, Length, LastWriteTime
