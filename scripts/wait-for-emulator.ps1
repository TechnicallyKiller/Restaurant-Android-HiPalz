# Wait for Android emulator to finish booting (sys.boot_completed = 1)
# Usage: .\scripts\wait-for-emulator.ps1
# Then run: npm run android

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) {
    Write-Host "adb not found. Set ANDROID_HOME or use default path." -ForegroundColor Red
    exit 1
}
Write-Host "Waiting for device..."
& $adb wait-for-device
Write-Host "Device connected. Waiting for boot to complete..."
do {
    Start-Sleep -Seconds 3
    $boot = & $adb shell getprop sys.boot_completed 2>$null
} while ($boot -ne "1")
Write-Host "Emulator is ready." -ForegroundColor Green
exit 0
