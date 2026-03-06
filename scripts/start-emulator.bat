@echo off
REM Start Android emulator with options that often fix "quit before opening" on Windows.
REM Usage: scripts\start-emulator.bat
REM Or with a specific AVD: scripts\start-emulator.bat Pixel_9_Pro

set "AVD_NAME=%~1"
if "%AVD_NAME%"=="" set "AVD_NAME=Medium_Phone_API_36.1"

set "EMU=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"
set "AVD_LIST=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe -list-avds"

echo Available AVDs:
call "%AVD_LIST%"
echo.
echo Starting %AVD_NAME% with software GPU (more stable on some PCs)...
echo.

REM -gpu swiftshader_indirect = software rendering, often fixes crash on launch
REM -no-snapshot-load = cold boot (slower but avoids snapshot corruption)
REM -no-audio = disable audio (can help if audio driver causes crash)
"%EMU%" -avd %AVD_NAME% -no-snapshot-load -gpu swiftshader_indirect

pause
