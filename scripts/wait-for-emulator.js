#!/usr/bin/env node
/**
 * Wait for Android emulator/device to finish booting (sys.boot_completed = 1).
 * Usage: node scripts/wait-for-emulator.js
 * Then run: npm run android
 */

const { execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  path.join(process.env.LOCALAPPDATA || process.env.HOME, 'Android', 'Sdk');
const adb = path.join(sdkRoot, 'platform-tools', isWindows ? 'adb.exe' : 'adb');

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 60000, ...opts });
  } catch (e) {
    return null;
  }
}

console.log('Waiting for device...');
run(`${adb} wait-for-device`, { stdio: 'inherit' });
console.log('Device connected. Waiting for boot to complete...');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  let booted = false;
  const start = Date.now();
  const maxWait = 120000; // 2 min

  while (!booted && Date.now() - start < maxWait) {
    const out = run(`"${adb}" shell getprop sys.boot_completed`);
    if (out && out.trim() === '1') {
      booted = true;
      break;
    }
    process.stdout.write('.');
    await sleep(3000);
  }

  if (!booted) {
    console.error('\nTimed out waiting for emulator to boot.');
    process.exit(1);
  }
  console.log('\nEmulator is ready.');
})();
