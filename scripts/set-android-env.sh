# Run in Git Bash before npm run android if adb/java are not recognized.
# Usage: source scripts/set-android-env.sh   (or  . scripts/set-android-env.sh)

export JAVA_HOME="/c/Program Files/Microsoft/jdk-17.0.18.8-hotspot"
export ANDROID_HOME="${LOCALAPPDATA:-$HOME/AppData/Local}/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$JAVA_HOME/bin:$PATH"

echo "JAVA_HOME   = $JAVA_HOME"
echo "ANDROID_HOME = $ANDROID_HOME"
echo ""
echo "adb devices:"
adb devices
