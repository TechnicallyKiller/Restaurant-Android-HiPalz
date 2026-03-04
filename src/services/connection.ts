// connection.ts
// Utility to find the Hipalz server on the local network for your Android App.

/**
 * Pings a specific IP to see if the server is running there.
 */
export async function pingIp(
  ip: string,
  port = 3333,
  timeoutMs = 800,
  signal?: AbortSignal,
): Promise<{ ip: string; success: boolean }> {
  const url = `http://${ip}:${port}/ping`;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    // If external signal is aborted, abort our local fetch too
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(id);
    if (response.ok) {
      const data = await response.json();
      if (data.message === 'pong') {
        console.log(`[Discovery] SUCCESS: Found server at ${ip}:${port}`);
        return { ip: `${ip}:${port}`, success: true };
      }
    }
  } catch (err) {
    // Timeout or network error - ignore and let it fail
  }
  console.log(`[Discovery] FAILED: No response from ${ip}:${port}`);
  return { ip: `${ip}:${port}`, success: false };
}

/**
 * Sweeps an array of IPs using a "chunking/binary search" concurrent method.
 * We launch blocks of IPs in parallel and use Promise.any to immediately
 * resolve when we get the first successful ping, making it lightning fast.
 */
/**
 * Sweeps an array of IPs using a "Throttled Window" concurrent method.
 * Maintains a fixed pool of active pings, refills as they finish,
 * and immediately aborts all others when a server is found.
 */
async function throttledParallelScan(
  ips: string[],
  concurrency = 50,
): Promise<{ ip: string; success: boolean } | null> {
  const controller = new AbortController();
  let foundResult: { ip: string; success: boolean } | null = null;
  let currentIndex = 0;

  console.log(
    `[Discovery] Scanning ${ips.length} IPs with window size ${concurrency}...`,
  );

  const worker = async () => {
    while (
      currentIndex < ips.length &&
      !foundResult &&
      !controller.signal.aborted
    ) {
      const ip = ips[currentIndex++];
      if (!ip) break;

      try {
        const result = await pingIp(ip, 3333, 800, controller.signal);
        if (result.success && !foundResult) {
          foundResult = result;
          controller.abort(); // KILL all other "zombie" requests immediately
          return;
        }
      } catch (err) {
        // Skip errors/aborts
      }
    }
  };

  // Launch initial batch of workers
  const pool = Array.from(
    { length: Math.min(concurrency, ips.length) },
    worker,
  );
  await Promise.all(pool);

  return foundResult;
}

/**
 * Main function to find the server IP.
 * Works on Wi-Fi, Mobile Hotspot, and all IP configurations.
 *
 * @param deviceIp - Optional: If you pass the Android device's own IP, it scans its exact subnet first (fastest).
 * @param totalTimeoutMs - Default 15s. If the entire scan exceeds this, it aborts.
 */
export async function findServerConnection(
  deviceIp?: string,
  totalTimeoutMs = 15000,
): Promise<{ ip: string; success: boolean }> {
  const possibleIps: string[] = [];

  console.log(
    `[Discovery] Starting server scan (Timeout: ${totalTimeoutMs}ms)...`,
  );

  // Create a timeout promise
  const timeoutPromise = new Promise<null>(resolve =>
    setTimeout(() => {
      console.log(
        `[Discovery] Global scan timeout reached (${totalTimeoutMs}ms)`,
      );
      resolve(null);
    }, totalTimeoutMs),
  );

  // 1. If we have the device IP (e.g. 192.168.43.125 from Android Hotspot),
  // scan its local /24 subnet first, as the server is highly likely to be on it.
  if (deviceIp) {
    const parts = deviceIp.split('.');
    if (parts.length === 4) {
      const base = `${parts[0]}.${parts[1]}.${parts[2]}.`;
      for (let i = 1; i <= 254; i++) {
        possibleIps.push(`${base}${i}`);
      }
    }
  }

  // 2. Add common fallback network ranges if not in the list already.
  // Including 192.168.* and 10.* subnets for Wi-Fi and Hotspots.
  const commonPrefixes = [
    '192.168.1.', // Common Wi-Fi
    '192.168.0.', // Common Wi-Fi
    '192.168.43.', // Android Hotspot Default
    '192.168.137.', // Windows Hotspot Default
    '192.168.29.', // JioFiber / Local Hubs
    '10.0.2.', // Android Emulator loopback
    '10.0.0.', // Corporate internal subnets
  ];

  for (const prefix of commonPrefixes) {
    // Avoid strictly re-adding the subnet if it was already added by the deviceIP rule
    if (deviceIp && deviceIp.startsWith(prefix)) continue;

    for (let i = 1; i <= 254; i++) {
      possibleIps.push(`${prefix}${i}`);
    }
  }

  // You wanted a "binary search method to iterate over ip"
  // Instead of scanning sequentially which takes forever, we batch them in chunks of 50
  // Use Throttled Window to protect resources and kill zombies
  const result = await Promise.race([
    throttledParallelScan(possibleIps, 60),
    timeoutPromise,
  ]);

  if (result) {
    return result;
  }

  // If server is absolutely not found on any network or timeout reached
  console.log(`[Discovery] Scan ended. No server found.`);
  return { ip: '', success: false };
}
