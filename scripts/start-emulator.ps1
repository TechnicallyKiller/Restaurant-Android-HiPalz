# Start Android emulator with options that often fix "quit before opening" on Windows.
# Usage: .\scripts\start-emulator.ps1
# Or:    .\scripts\start-emulator.ps1 -AvdName "Pixel_9_Pro"

param([string]$AvdName = "Medium_Phone_API_36.1")

$emu = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
if (-not (Test-Path $emu)) {
    Write-Host "Emulator not found at $emu" -ForegroundColor Red
    exit 1
}

Write-Host "Available AVDs:"
& $emu -list-avds
Write-Host ""
Write-Host "Starting $AvdName with software GPU (more stable on some PCs)..." -ForegroundColor Yellow
Write-Host ""

# -gpu swiftshader_indirect = software rendering, often fixes crash on launch
# -no-snapshot-load = cold boot (avoids snapshot corruption)
& $emu -avd $AvdName -no-snapshot-load -gpu swiftshader_indirect
