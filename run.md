# Run Guide

## Prerequisites

Before starting, ensure your Windows machine has the following installed:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **JDK** | 17 | Required for React Native 0.83 |
| **Android Studio** | Latest | Android development environment |
| **Android SDK Platform** | 34 (Android 14) | Target platform for the app |

---

## Installation Steps

### Step 1: Initial Project Setup

Navigate to the project root directory and install all dependencies:

```powershell
# Install JavaScript dependencies
npm install

# Clean any previous build cache
cd android
.\gradlew clean
cd ..
```

### Step 2: Environment Verification

Run the React Native diagnostics tool to verify your setup:

```powershell
npx react-native doctor
```

**Expected Output**: All items should show checkmarks (✓)

**If errors appear**:
- Press `f` to allow automatic fixes
- Ensure Android SDK version and JDK are properly configured

---

## Launching the Application

### Option A: Physical Android Device (Recommended)

**Best for**: Testing wireless features and real-world performance

#### Setup Steps:

1. **Enable Developer Mode** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Navigate to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect Device**:
   ```powershell
   # Connect phone via USB cable

   # Verify connection
   adb devices
   ```

   **Expected output**:
   ```
   List of devices attached
   ABC123XYZ    device
   ```

3. **Launch App**:
   ```powershell
   npx react-native run-android
   ```

### Option B: Android Emulator

**Best for**: Development without physical device

#### Setup Steps:

1. **Open Android Studio** → Device Manager

2. **Create/Start Virtual Device**:
   - Ensure API Level 34 (Android 14/15)
   - Recommended: Pixel 5 or similar device profile
   - Wait for emulator to fully boot

3. **Launch App**:
   ```powershell
   npx react-native run-android
   ```

---

## Local Network Configuration (Offline Testing)

For testing "Order to Kitchen" functionality without internet using local Socket.io server.

### Setup Process

#### 1. Find Host IP Address

On the computer running `server.js`:

```powershell
ipconfig
```

Look for **IPv4 Address** (e.g., `192.168.1.50`)

```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.50
```

#### 2. Update Configuration

Edit `src/config/env.js`:

```javascript
export const config = {
  SOCKET_URL: 'http://192.168.1.50:3000',  // Use your actual IP
  // ... other config
};
```

#### 3. Start Local Server

```powershell
node server.js
```

**Expected output**:
```
Socket.io server running on port 3000
```

#### 4. Network Requirements

-  Android device on **same Wi-Fi network** as computer
-  Windows Firewall allows port 3000 (see troubleshooting)
-  Computer and device can ping each other

### Network Verification

```powershell
# On computer, test if server is accessible
curl http://192.168.1.50:3000
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. "System cannot find the path specified"

**Cause**: Missing or incorrect environment variables

**Solution**:
```powershell
# Verify environment variables
echo %JAVA_HOME%
echo %ANDROID_HOME%
```

**Expected values**:
- `JAVA_HOME`: `C:\Program Files\Java\jdk-17`
- `ANDROID_HOME`: `C:\Users\YourName\AppData\Local\Android\Sdk`

**To set environment variables**:
1. Search "Environment Variables" in Windows
2. Click "Environment Variables" button
3. Add/Edit System Variables:
   - `JAVA_HOME` → JDK 17 installation path
   - `ANDROID_HOME` → Android SDK path

#### 2. Socket Not Connecting

**Symptoms**: App runs but doesn't receive kitchen alerts

**Solutions**:

**A. Check Windows Firewall**:
1. Windows Security → Firewall & network protection
2. Advanced settings → Inbound Rules
3. New Rule → Port → TCP → Port 3000 → Allow

**B. Verify server is running**:
```powershell
# Check if port 3000 is listening
netstat -ano | findstr :3000
```

**C. Test connection from device**:
- Use a browser on your phone
- Navigate to `http://192.168.1.50:3000`
- Should see server response or Socket.io message

#### 3. Build Failures After Code Changes

**Solution**: Clean build cache

```powershell
cd android
.\gradlew clean
cd ..
npx react-native run-android
```

#### 4. "adb devices" Shows No Devices

**Solutions**:
- Reconnect USB cable
- Revoke and re-enable USB debugging on phone
- Install phone manufacturer's USB drivers
- Try different USB port

#### 5. Metro Bundler Connection Issues

**Solution**: Reset Metro cache

```powershell
# Clear Metro bundler cache
npx react-native start --reset-cache
```

Then in a new terminal:
```powershell
npx react-native run-android
```

#### 6. Gradle Build Errors

**Common solutions**:
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleDebug

# If still failing, delete build folders
rmdir /s /q build
rmdir /s /q app\build
.\gradlew clean
cd ..
```

### Fast Refresh

- Code changes auto-reload without full rebuild
- Shake device or press `R` twice to manually reload
- Press `D` for developer menu

---

## 7. Production Build Commands (Android)

When your client is ready to move from testing to a real restaurant deployment, they need an APK (for direct install) or an AAB (for Google Play).

### Generate Debug APK (For Quick Testing on Other Phones)

This creates an installable file that doesn't require a computer connection.

```powershell
cd android
.\gradlew assembleDebug
cd ..
```

- **File Path**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Generate Release APK (For Production)

This version is optimized for performance and smaller file size.

```powershell
cd android
.\gradlew assembleRelease
cd ..
```

- **File Path**: `android/app/build/outputs/apk/release/app-release.apk`

### Generate Android App Bundle (AAB)

Required for uploading the app to the Google Play Store.

```powershell
cd android
.\gradlew bundleRelease
cd ..
```

- **File Path**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 8. iOS Setup & Commands (Mac Required)

While you are on Windows, your client may want to run this on iPhones.

> **Note**: iOS builds require a computer running macOS and Xcode.

### Prerequisites for iOS

| Requirement | Details |
|-------------|---------|
| **macOS** | Latest version |
| **Xcode** | Version 15+ |
| **CocoaPods** | Dependency manager for iOS |
| **Homebrew** | To install system tools |

### iOS Installation Steps

```bash
# 1. Install iOS dependencies (Run from project root)
npm install

# 2. Install Native Pods
cd ios
bundle install   # If Gemfile exists
pod install
cd ..
```

### Launching on iOS

```bash
# Launch on iPhone Simulator
npx react-native run-ios

# Launch on a specific simulator (e.g., iPhone 15)
npx react-native run-ios --simulator="iPhone 15"
```

---

## 9. Advanced Troubleshooting & Maintenance

### Deep Clean (The "Nuke" Option)

If the project becomes unstable or paths are corrupted, use this to reset everything.

```powershell
# Windows (PowerShell)
rmdir /s /q node_modules
rmdir /s /q android\app\build
rmdir /s /q android\build
npm install
cd android
.\gradlew clean
cd ..
```

### Updating Native Modules

If you add a new library (like a different camera or printer driver), you must rebuild the native code.

```powershell
# Rebuild and launch
npx react-native run-android
```

---

## 10. Summary of File Responsibilities

| File | Responsibility | Connection Type |
|------|---------------|-----------------|
| `server.js` | Wireless Hub: Manages all kitchen/waiter traffic. | Offline (Wi-Fi) |
| `env.js` | Config: Sets the IP for the local Hub and Cloud API. | Static Config |
| `SocketContext.js` | Live Engine: Maintains the wireless staff connection. | Real-time |
| `NotifService.js` | Alerts: Triggers physical phone sound and vibration. | Native UI |
| `apiClient.js` | Data: Syncs loyalty and billing with the cloud. | Online (HTTPS) |

---

## Quick Reference Commands

```powershell
# Verify setup
npx react-native doctor

# Install dependencies
npm install

# Clean Android build
cd android && .\gradlew clean && cd ..

# Launch app
npx react-native run-android

# Start server
node server.js

# Check connected devices
adb devices

# Find IP address
ipconfig

# Debug APK
cd android && .\gradlew assembleDebug && cd ..

# Release APK
cd android && .\gradlew assembleRelease && cd ..

# Release AAB (Play Store)
cd android && .\gradlew bundleRelease && cd ..
```

---

## Support & Resources

- **React Native Docs**: https://reactnative.dev/docs/environment-setup
- **Android Studio**: https://developer.android.com/studio
- **Socket.io**: https://socket.io/docs/v4/
