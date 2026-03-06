// connection.ts
// Utility to find the Hipalz server on the local network for your Android App.
// Features UDP Broadcast (fast) discovery.

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
        return { ip: `${ip}:${port}`, success: true };
      }
    }
  } catch (err) {}
  return { ip: `${ip}:${port}`, success: false };
}

import UdpSocket from 'react-native-udp';

/**
 * PRODUCTION SAFE UDP Discovery
 * Standard way to find local services without IP scanning.
 */
export async function discoverServerByUDP(
  port = 3334,
  timeoutMs = 5000,
  deviceIp?: string,
): Promise<{ ip: string; success: boolean }> {
  console.log('[UDP-Discovery] Initializing...');
  return new Promise(resolve => {
    let socket: any = null;
    let resolved = false;
    let socketClosed = false; // Step 1: Flag
    let timer: any = null;

    // Step 2: Production Safe Cleanup
    const cleanup = () => {
      if (socketClosed) return;
      socketClosed = true;
      try {
        if (socket) {
          // Keep the error listener but make it a no-op to catch trailing events
          // and prevent "Unhandled error" crash.
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

      // Step 3: Fixed Error Handler
      socket.on('error', (err: any) => {
        if (socketClosed || resolved) return; // SWALLOW errors if already done
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

      // Step 4: Protected Bind & Broadcast
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

          // EXTRA GUARD: Wrap everything to prevent "Socket is closed" logs
          try {
            if (typeof socket.setBroadcast === 'function') {
              socket.setBroadcast(true);
            }
          } catch (e) {}

          // Optimization: Dynamic Broadcast Address + Common Fallbacks (Always try both)
          const targetSet = new Set(['255.255.255.255']);

          if (
            deviceIp &&
            !deviceIp.includes(':') &&
            deviceIp.split('.').length === 4
          ) {
            const parts = deviceIp.split('.');
            targetSet.add(`${parts[0]}.${parts[1]}.${parts[2]}.255`);
          }

          // ALWAYS try common subnets as fallback
          targetSet.add('192.168.0.255');
          targetSet.add('192.168.1.255');
          targetSet.add('192.168.43.255');
          targetSet.add('192.168.137.255');

          const targetAddrs = Array.from(targetSet);

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
                    console.log(
                      `[UDP-Discovery] Broadcast sent to ${broadcastAddr}`,
                    );
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

import Zeroconf from 'react-native-zeroconf';

/**
 * mDNS / Bonjour Discovery (Reliable Layer)
 */
export async function discoverServerByZeroconf(
  timeoutMs = 5000,
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

    zeroconf.on('resolved', (service: any) => {
      // Look for our specific service hipalz-*
      if (service.name && service.name.includes('hipalz')) {
        const ip = service.addresses?.[0];
        const port = service.port || 3333;
        if (ip) {
          console.log('[mDNS-Discovery] Found server:', ip, port);
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
  deviceIp?: string,
  totalTimeoutMs = 10000,
): Promise<{ ip: string; success: boolean }> {
  console.log(
    `[Discovery] Starting search (Current Device IP: ${
      deviceIp || 'Unknown'
    })...`,
  );

  try {
    // Run both discovery methods in parallel
    // We use Promise.race but wrapped to only resolve if SUCCESSful,
    // or wait for both if both fail.
    const results = await Promise.all([
      discoverServerByUDP(3334, 5000, deviceIp),
      discoverServerByZeroconf(5000),
    ]);

    const success = results.find(r => r.success);
    if (success) {
      console.log(`[Discovery] Server found: ${success.ip}`);
      return success;
    }
  } catch (e) {
    console.warn('[Discovery] Error during parallel search:', e);
  }

  console.log(`[Discovery] All discovery layers failed.`);
  return { ip: '', success: false };
}
