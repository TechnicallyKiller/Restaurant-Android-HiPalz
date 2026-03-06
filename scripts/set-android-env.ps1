# Run this in PowerShell before npm run android if adb/java are not recognized.
# Or set these permanently in Windows Environment Variables (recommended).

$JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

$env:JAVA_HOME = $JAVA_HOME
$env:ANDROID_HOME = $ANDROID_HOME
$env:Path = "$ANDROID_HOME\platform-tools;$ANDROID_HOME\emulator;$JAVA_HOME\bin;" + $env:Path

Write-Host "JAVA_HOME  = $env:JAVA_HOME"
Write-Host "ANDROID_HOME = $env:ANDROID_HOME"
Write-Host "`nadb devices:"
& "$ANDROID_HOME\platform-tools\adb.exe" devices
