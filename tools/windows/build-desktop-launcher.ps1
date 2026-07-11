param(
  [string]$SourceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
  [string]$OutputDir = "",
  [string]$MingwBin = "E:\mingw64\bin"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $SourceRoot "release\desktop-launcher"
}

$LauncherRoot = Join-Path $SourceRoot "tools\windows\desktop-launcher"
$IconSource = Join-Path $SourceRoot "assets\runtime\soulmate-badges\kanto-medal.png"
$IconPng = Join-Path $OutputDir "app-icon.png"
$IconIco = Join-Path $OutputDir "app-icon.ico"
$ResourceObject = Join-Path $OutputDir "launcher.res.o"
$LauncherExe = Join-Path $OutputDir "ChangeBattle V2.exe"
$Gxx = Join-Path $MingwBin "x86_64-w64-mingw32-g++.exe"
$Windres = Join-Path $MingwBin "windres.exe"

if (-not (Test-Path $IconSource)) {
  throw "Launcher icon source missing: $IconSource"
}
if (-not (Test-Path $Gxx)) {
  throw "MinGW compiler missing: $Gxx"
}
if (-not (Test-Path $Windres)) {
  throw "windres missing: $Windres"
}

New-Item -ItemType Directory -Force $OutputDir | Out-Null

Add-Type -AssemblyName System.Drawing
$sourceImage = [System.Drawing.Image]::FromFile($IconSource)
try {
  $bitmap = New-Object System.Drawing.Bitmap 256, 256
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.DrawImage($sourceImage, 0, 0, 256, 256)
    } finally {
      $graphics.Dispose()
    }
    $bitmap.Save($IconPng, [System.Drawing.Imaging.ImageFormat]::Png)

    $iconHandle = $bitmap.GetHicon()
    try {
      $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
      try {
        $stream = [System.IO.File]::Open($IconIco, [System.IO.FileMode]::Create)
        try {
          $icon.Save($stream)
        } finally {
          $stream.Dispose()
        }
      } finally {
        $icon.Dispose()
      }
    } finally {
      Add-Type -Namespace NativeMethods -Name User32 -MemberDefinition '[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool DestroyIcon(System.IntPtr hIcon);' -ErrorAction SilentlyContinue
      [NativeMethods.User32]::DestroyIcon($iconHandle) | Out-Null
    }
  } finally {
    $bitmap.Dispose()
  }
} finally {
  $sourceImage.Dispose()
}

Copy-Item -Force $IconIco (Join-Path $LauncherRoot "app-icon.ico")
try {
  & $Windres (Join-Path $LauncherRoot "launcher.rc") -O coff -o $ResourceObject
  if ($LASTEXITCODE -ne 0) {
    throw "windres failed with exit code $LASTEXITCODE"
  }

  & $Gxx `
    -std=c++17 `
    -O2 `
    -static `
    -static-libgcc `
    -static-libstdc++ `
    -municode `
    -mwindows `
    (Join-Path $LauncherRoot "launcher.cpp") `
    $ResourceObject `
    -o $LauncherExe
  if ($LASTEXITCODE -ne 0) {
    throw "launcher compile failed with exit code $LASTEXITCODE"
  }
} finally {
  Remove-Item -Force (Join-Path $LauncherRoot "app-icon.ico") -ErrorAction SilentlyContinue
}

if (-not (Test-Path $LauncherExe)) {
  throw "Launcher exe was not produced: $LauncherExe"
}

Get-Item $LauncherExe, $IconIco, $IconPng | Select-Object FullName, Length, LastWriteTime
