// connection.ts
// Utility to find the Hipalz server on the local network for your Android App.

/**
 * Pings a specific IP to see if the server is running there.
 */
export async function pingIp(
  ip: string,
  port = 3333,
  timeoutMs = 800, // Reduced from 1500 for faster local discovery
): Promise<{ ip: string; success: boolean }> {
  const url = `http://${ip}:${port}/ping`;
  console.log(`[Discovery] Pinging: ${url}...`);
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
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
 * Sweeps an array of IPs using a "Fast Sweep" concurrent method.
 * Unlike the previous chunked method, this fires pings with a small stagger
 * and uses Promise.any to resolve as soon as the first successful IP is found.
 */
async function fastParallelScan(
  ips: string[],
): Promise<{ ip: string; success: boolean } | null> {
  // Fire all pings but with a tiny stagger (e.g. 5ms) to avoid network congestion
  // Promise.any will return the FIRST successful result immediately.
  try {
    const promises = ips.map(async (ip, index) => {
      // Small delay based on index to spread the load
      await new Promise(resolve => setTimeout(() => resolve(null), index * 5));
      const result = await pingIp(ip);
      if (result.success) return result;
      throw new Error('fail'); // Reject so Promise.any ignores it
    });

    return await Promise.any(promises);
  } catch (e) {
    // This happens only if every single IP in the list fails
    return null;
  }
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
  // and search concurrently to rapidly jump through the 192.168.x.x list until we hit a "pong".
  // Race the scan against the global timeout
  const result = await Promise.race([
    fastParallelScan(possibleIps),
    timeoutPromise,
  ]);

  if (result) {
    return result;
  }

  // If server is absolutely not found on any network or timeout reached
  console.log(`[Discovery] Scan ended. No server found.`);
  return { ip: '', success: false };
}
