@echo off
REM Run this in CMD before npm run android if adb/java are not recognized.

set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "Path=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%JAVA_HOME%\bin;%Path%"

echo JAVA_HOME  = %JAVA_HOME%
echo ANDROID_HOME = %ANDROID_HOME%
echo.
echo adb devices:
"%ANDROID_HOME%\platform-tools\adb.exe" devices
