param(
  [string]$Version = "",
  [string]$SourceRoot = "D:\changeBattle\changeBattle",
  [string]$ReleaseRoot = "D:\changeBattle\release",
  [string]$AndroidHome = "G:\SDK",
  [string]$JavaHome = "D:\jdk-21.0.11",
  [string]$SigningProperties = "D:\changeBattle\signing\signing.properties"
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

if (-not (Test-Path $SigningProperties)) {
  throw "Android signing properties missing: $SigningProperties"
}

Set-Location $SourceRoot

$PackageVersion = node -p "require('./package.json').version"
if ($PackageVersion.Trim() -ne $Version) {
  throw "package.json version is $PackageVersion, expected $Version"
}

$BuildGradle = Get-Content "apps\mobile\android\app\build.gradle" -Raw
if ($BuildGradle -notmatch "versionName\s+`"$([regex]::Escape($Version))`"") {
  throw "Android versionName is not $Version"
}

New-Item -ItemType Directory -Force $ReleaseRoot | Out-Null

$env:ANDROID_HOME = $AndroidHome
$env:ANDROID_SDK_ROOT = $AndroidHome
$env:JAVA_HOME = $JavaHome
$env:PATH = "$JavaHome\bin;$AndroidHome\platform-tools;$env:PATH"
$env:CHANGEBATTLE_ANDROID_SIGNING_PROPERTIES = $SigningProperties

Write-Host "Installing dependencies..."
pnpm install

Write-Host "Building release APK..."
pnpm mobile:apk:release

$ApkName = "ChangeBattle-Mobile-v$Version.apk"
$LocalApk = Join-Path $SourceRoot "release\$ApkName"
$ReleaseApk = Join-Path $ReleaseRoot $ApkName

if (-not (Test-Path $LocalApk)) {
  throw "Release APK was not produced: $LocalApk"
}

Copy-Item -Force $LocalApk $ReleaseApk

Write-Host "Validating APK bundled resources..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
$ApkZip = [IO.Compression.ZipFile]::OpenRead($ReleaseApk)
try {
  $Names = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($Entry in $ApkZip.Entries) {
    [void]$Names.Add($Entry.FullName)
  }
  $Wanted = @(
    "assets/public/data/pokemon_resource_registry.json",
    "assets/public/data/item_resource_registry.json",
    "assets/public/data/sprite_index_map.json"
  )
  foreach ($Item in $Wanted) {
    if (-not $Names.Contains($Item)) {
      throw "Missing from APK: $Item"
    }
  }
  $RequiredPrefixes = @(
    "assets/public/assets/runtime/pokemon/",
    "assets/public/assets/runtime/items/"
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
      throw "Missing runtime assets in APK: $RequiredPrefix"
    }
  }
  $ForbiddenPrefixes = @(
    "assets/public/assets/pokemon-showdown/",
    "assets/public/assets/pokemon-pack/",
    "assets/public/assets/pokemon-custom/",
    "assets/public/assets/items-pack/",
    "assets/public/assets/items/"
  )
  foreach ($Name in $Names) {
    foreach ($ForbiddenPrefix in $ForbiddenPrefixes) {
      if ($Name.StartsWith($ForbiddenPrefix)) {
        throw "Reference asset directory should not be bundled in APK: $ForbiddenPrefix"
      }
    }
  }
} finally {
  $ApkZip.Dispose()
}

$ApkSigner = Get-ChildItem (Join-Path $AndroidHome "build-tools") -Directory |
  Sort-Object Name -Descending |
  ForEach-Object { Join-Path $_.FullName "apksigner.bat" } |
  Where-Object { Test-Path $_ } |
  Select-Object -First 1

if (-not $ApkSigner) {
  throw "apksigner.bat not found under $AndroidHome\build-tools"
}

Write-Host "Verifying APK signature with $ApkSigner..."
& $ApkSigner verify --verbose $ReleaseApk

Write-Host "Mobile release ready: $ReleaseApk"
Get-Item $ReleaseApk | Select-Object FullName, Length, LastWriteTime
