@echo off
REM Wait for Android emulator to finish booting (sys.boot_completed = 1)
REM Usage: scripts\wait-for-emulator.bat
REM Then run: npm run android

set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
echo Waiting for device...
call "%ADB%" wait-for-device
echo Device connected. Waiting for boot to complete...
:loop
call "%ADB%" shell getprop sys.boot_completed 2>nul | findstr /r "^1$" >nul && goto :ready
timeout /t 3 /nobreak >nul
goto :loop
:ready
echo Emulator is ready.
exit /b 0
