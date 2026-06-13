param(
  [string]$Version = "",
  [string]$SourceRoot = "D:\changeBattle\changeBattle",
  [string]$ReleaseRoot = "D:\changeBattle\release",
  [string]$ElectronRuntimePath = "D:\changeBattle\electron-runtime\electron",
  [string]$ShowdownPath = "D:\changeBattle\vendor\pokemon-showdown",
  [string]$Commit = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Version)) {
  $Version = Read-Host "Release version"
}

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
  throw "Version must look like X.Y.Z, got: $Version"
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
  throw "Electron runtime missing: $ElectronRuntimePath"
}

if (-not (Test-Path (Join-Path $ShowdownPath "dist\sim\index.js"))) {
  throw "Pokemon Showdown runtime missing: $ShowdownPath"
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

Write-Host "Building desktop..."
pnpm desktop:build

Write-Host "Packaging desktop release..."
$env:ELECTRON_RUNTIME_PATH = $ElectronRuntimePath
$env:SHOWDOWN_PATH = $ShowdownPath
$env:CHANGEBATTLE_COMMIT = $Commit
python tools\package_desktop_release.py --showdown-path $ShowdownPath

$ZipName = "ChangeBattle-Desk-portable-v$Version.zip"
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
  $Prefix = "ChangeBattle-Desk-portable-v$Version"
  $Wanted = @(
    "$Prefix/ChangeBattle-Desk.cmd",
    "$Prefix/RELEASE-README.md",
    "$Prefix/apps/desktop/out/main/main.js",
    "$Prefix/data/pokemon_resource_registry.json",
    "$Prefix/data/item_resource_registry.json",
    "$Prefix/data/sprite_index_map.json",
    "$Prefix/runtime/electron/electron.exe",
    "$Prefix/vendor/pokemon-showdown/dist/sim/index.js"
  )
  foreach ($Item in $Wanted) {
    if (-not $Names.Contains($Item)) {
      throw "Missing from zip: $Item"
    }
  }
  $RequiredPrefixes = @(
    "$Prefix/assets/runtime/pokemon/",
    "$Prefix/assets/runtime/items/"
  )
  foreach ($RequiredPrefix in $RequiredPrefixes) {
    $Found = $false
    foreach ($Name in $Names) {
      if ($Name.StartsWith($RequiredPrefix)) {
        $Found = $true
        break
      }
    }
    if (-not $Found) {
      throw "Missing runtime assets in zip: $RequiredPrefix"
    }
  }
  $ForbiddenPrefixes = @(
    "$Prefix/assets/pokemon-showdown/",
    "$Prefix/assets/pokemon-pack/",
    "$Prefix/assets/pokemon-custom/",
    "$Prefix/assets/items-pack/",
    "$Prefix/assets/items/"
  )
  foreach ($Name in $Names) {
    if ($Name.StartsWith("$Prefix/docs/")) {
      throw "docs/ should not be bundled in desktop release"
    }
    foreach ($ForbiddenPrefix in $ForbiddenPrefixes) {
      if ($Name.StartsWith($ForbiddenPrefix)) {
        throw "Reference asset directory should not be bundled: $ForbiddenPrefix"
      }
    }
  }
} finally {
  $Zip.Dispose()
}

Write-Host "Desktop release ready: $ReleaseZip"
Get-Item $ReleaseZip | Select-Object FullName, Length, LastWriteTime
