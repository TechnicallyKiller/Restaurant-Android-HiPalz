import { NetworkInfo } from 'react-native-network-info';
import Zeroconf from 'react-native-zeroconf';

// connection.ts
// Utility to find the Hipalz server on the local network for your Android App.
// Features UDP Broadcast (fast) discovery and TCP scan fallback.

/**
 * Pings a specific IP to see if the server is running there.
 */
export async function pingIp(
  ip: string,
  port = 3333,
  timeoutMs = 1000,
  signal?: AbortSignal,
): Promise<{ ip: string; success: boolean }> {
  const url = `http://${ip}:${port}/ping`;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(id);
    if (response.ok) {
      const data = await response.json();
      if (data.message === 'pong') {
        return { ip: `${ip}:${port}`, success: true };
      }
    }
  } catch (err) {}
  return { ip: `${ip}:${port}`, success: false };
}

/**
 * Helper to compute broadcast address from device IP (Assumes /24 subnet)
 */
async function getSubnetBroadcast(): Promise<string | null> {
  try {
    const ip = await NetworkInfo.getIPV4Address();
    if (!ip) return null;
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.255`;
    }
  } catch (e) {}
  return null;
}

/**
 * TCP Subnet Scan (Last Resort)
 * Attempts to connect to http://{ip}:3333/ping for each IP in the /24 range.
 */
async function scanLocalSubnet(
  baseIp: string, // e.g., "192.168.1."
  port = 3333,
  timeoutMs = 500,
  signal?: AbortSignal,
): Promise<string | null> {
  console.log(`[TCP-Scan] Scanning subnet ${baseIp}0/24 on port ${port}...`);
  const promises = [];
  for (let i = 1; i <= 254; i++) {
    const ip = `${baseIp}${i}`;
    promises.push(
      pingIp(ip, port, timeoutMs, signal).then(result =>
        result.success ? result.ip : null,
      ),
    );
  }
  const results = await Promise.all(promises);
  const found = results.find(ip => ip !== null) || null;
  if (found) console.log(`[TCP-Scan] Found server at ${found}`);
  return found;
}

// `react-native-udp` is optional. If it's not installed, we fall back gracefully
// so release builds can still bundle.
let UdpSocket: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('react-native-udp');
  UdpSocket = m?.default ?? m;
} catch {
  UdpSocket = null;
}

/**
 * PRODUCTION SAFE UDP Discovery
 * Standard way to find local services without IP scanning.
 */
export async function discoverServerByUDP(
  port = 3334,
  timeoutMs = 5000,
): Promise<{ ip: string; success: boolean }> {
  console.log('[UDP-Discovery] Initializing...');
  if (!UdpSocket) {
    console.warn(
      '[UDP-Discovery] react-native-udp not installed; skipping UDP discovery',
    );
    return { ip: '', success: false };
  }

  // Get the actual subnet broadcast
  const subnetBroadcast = await getSubnetBroadcast();

  return new Promise(resolve => {
    let socket: any = null;
    let resolved = false;
    let socketClosed = false;
    let timer: any = null;

    const cleanup = () => {
      if (socketClosed) return;
      socketClosed = true;
      try {
        if (socket) {
          socket.removeAllListeners('message');
          socket.removeAllListeners('listening');
          socket.close();
        }
      } catch (e) {}
    };

    const finish = (result: { ip: string; success: boolean }) => {
      if (!resolved) {
        resolved = true;
        if (timer) clearTimeout(timer);
        cleanup();
        resolve(result);
      }
    };

    try {
      socket = UdpSocket.createSocket({ type: 'udp4' });

      timer = setTimeout(() => {
        console.log('[UDP-Discovery] Timeout reached');
        finish({ ip: '', success: false });
      }, timeoutMs);

      socket.on('error', (err: any) => {
        if (socketClosed || resolved) return;
        console.warn('[UDP-Discovery] Socket Error:', err?.message || err);
        finish({ ip: '', success: false });
      });

      socket.on('message', (msg: any, rinfo: any) => {
        if (socketClosed || resolved) return;
        try {
          const data = JSON.parse(msg.toString());
          console.log('[UDP-Discovery] Found server at:', rinfo.address, data);
          finish({
            ip: `${rinfo.address}:${data.port || 3333}`,
            success: true,
          });
        } catch (e) {
          console.warn(
            '[UDP-Discovery] Received invalid JSON:',
            msg.toString(),
          );
        }
      });

      socket.bind(0, (err: any) => {
        if (resolved || socketClosed || !socket) return;

        if (err) {
          console.error('[UDP-Discovery] Bind Error:', err);
          finish({ ip: '', success: false });
          return;
        }

        try {
          if (socketClosed || resolved || !socket) return;

          const message = 'DISCOVER_HIPALZ';

          try {
            if (typeof socket.setBroadcast === 'function') {
              socket.setBroadcast(true);
            }
          } catch (e) {}

          const targetSet = new Set(['255.255.255.255']);
          if (subnetBroadcast) {
            targetSet.add(subnetBroadcast);
            console.log(`[UDP-Discovery] Using dynamic broadcast: ${subnetBroadcast}`);
          }

          // Fallbacks for common subnets
          ['192.168.0.255', '192.168.1.255', '192.168.2.255',
           '192.168.43.255', '192.168.137.255', '10.0.0.255'].forEach(addr => targetSet.add(addr));

          const targetAddrs = Array.from(targetSet);
          console.log(`[UDP-Discovery] Spraying ${targetAddrs.length} targets:`, targetAddrs);

          targetAddrs.forEach(broadcastAddr => {
            try {
              if (socketClosed || resolved || !socket) return;
              socket.send(
                message,
                0,
                message.length,
                port,
                broadcastAddr,
                (sendErr: any) => {
                  if (!sendErr) {
                    console.log(`[UDP-Discovery] -> Sent to ${broadcastAddr}`);
                  }
                },
              );
            } catch (e) {}
          });
        } catch (e) {}
      });
    } catch (e: any) {
      console.error('[UDP-Discovery] Init Error:', e.message);
      finish({ ip: '', success: false });
    }
  });
}

// zeroconf import removed here, moved to top

/**
 * mDNS / Bonjour Discovery (Reliable Layer)
 */
export async function discoverServerByZeroconf(
  timeoutMs = 8000,
): Promise<{ ip: string; success: boolean }> {
  console.log('[mDNS-Discovery] Initializing...');
  return new Promise(resolve => {
    const zeroconf = new Zeroconf();
    let resolved = false;
    let timer: any = null;

    const finish = (result: { ip: string; success: boolean }) => {
      if (!resolved) {
        resolved = true;
        if (timer) clearTimeout(timer);
        try {
          zeroconf.stop();
          zeroconf.removeAllListeners();
        } catch (e) {}
        resolve(result);
      }
    };

    zeroconf.on('start', () => console.log('[mDNS-Discovery] Scanning...'));
    zeroconf.on('error', (err: any) => {
      console.warn('[mDNS-Discovery] Error:', err);
      finish({ ip: '', success: false });
    });

    // Logging help for debugging
    zeroconf.on('update', () => {
      const services = zeroconf.getServices();
      console.log(
        `[mDNS-Debug] Services seen: ${Object.keys(services).length}`,
      );
    });

    zeroconf.on('resolved', (service: any) => {
      console.log('[mDNS-Discovery] Resolved service:', service.name);
      // Look for our specific service hipalz-*
      if (service.name && service.name.toLowerCase().includes('hipalz')) {
        const ip = service.addresses?.[0];
        const port = service.port || 3333;
        if (ip) {
          console.log('🌟 [mDNS-Discovery] Found matching server!', ip, port);
          finish({ ip: `${ip}:${port}`, success: true });
        }
      }
    });

    // Start scanning for HTTP services (matches server's bonjour type)
    zeroconf.scan('http', 'tcp', 'local.');

    timer = setTimeout(() => {
      console.log('[mDNS-Discovery] Timeout reached');
      finish({ ip: '', success: false });
    }, timeoutMs);
  });
}

/**
 * Main function to find the server IP.
 * Runs UDP and mDNS in parallel for maximum speed and reliability.
 */
export async function findServerConnection(
  totalTimeoutMs = 12000,
): Promise<{ ip: string; success: boolean }> {
  console.log('[Discovery] Starting parallel search (UDP + mDNS)...');

  try {
    const results = await Promise.all([
      discoverServerByUDP(3334, 8000),
      discoverServerByZeroconf(8000),
    ]);

    const success = results.find(r => r.success);
    if (success) {
      console.log(`[Discovery] Server found: ${success.ip}`);
      return success;
    }
  } catch (e) {
    console.warn('[Discovery] Error during parallel search:', e);
  }

  // After UDP & mDNS both fail
  console.log('[Discovery] UDP & mDNS failed. Trying TCP subnet scan...');
  const deviceIp = await NetworkInfo.getIPV4Address();
  if (deviceIp) {
    const parts = deviceIp.split('.');
    const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.`;
    const foundIp = await scanLocalSubnet(subnet, 3333, 300);
    if (foundIp) {
      return { ip: foundIp, success: true };
    }
  }

  console.log(`[Discovery] All discovery layers failed.`);
  return { ip: '', success: false };
}
