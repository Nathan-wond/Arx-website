import { spawn } from 'child_process';
import fs from 'fs';

let ngrokProcess = null;

async function getRunningTunnel() {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', { signal: AbortSignal.timeout(1000) });
    if (!res.ok) return null;
    const data = await res.json();
    const tunnel = data.tunnels?.find(t => t.proto === 'https') || data.tunnels?.[0];
    return tunnel?.public_url || null;
  } catch {
    return null;
  }
}

function findNgrokBinary() {
  const candidates = [
    'C:\\ngrok\\ngrok.exe',
    'ngrok'
  ];
  for (const bin of candidates) {
    if (bin.includes('\\')) {
      if (fs.existsSync(bin)) return bin;
    } else {
      return bin;
    }
  }
  return 'ngrok';
}

export async function startNgrokTunnel(port = 3000) {
  // 1. Check if ngrok is already running and providing a tunnel
  const existingUrl = await getRunningTunnel();
  if (existingUrl) {
    console.log(`\n🌍 [ngrok] Existing public tunnel detected:`);
    console.log(`   ➜  ${existingUrl}`);
    console.log(`💡 Vercel VITE_API_URL: ${existingUrl}\n`);
    return existingUrl;
  }

  // 2. Try to launch native ngrok binary
  try {
    const bin = findNgrokBinary();
    ngrokProcess = spawn(bin, ['http', String(port), '--log=stdout'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      windowsHide: true
    });

    ngrokProcess.on('error', (err) => {
      console.warn('[ngrok] Native CLI spawn failed:', err.message);
    });

    const cleanup = () => {
      if (ngrokProcess) {
        try { ngrokProcess.kill(); } catch {}
        ngrokProcess = null;
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Poll 127.0.0.1:4040 for up to 6 seconds for the tunnel to establish
    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 500));
      const url = await getRunningTunnel();
      if (url) {
        console.log(`\n🌍 [ngrok] Public tunnel active:`);
        console.log(`   ➜  ${url}`);
        console.log(`💡 Vercel VITE_API_URL: ${url}`);
        console.log(`💡 Telegram Webhook URL: ${url}/api/telegram/webhook\n`);
        return url;
      }
    }
  } catch (err) {
    console.warn('[ngrok] Failed to spawn ngrok CLI:', err.message);
  }

  // 3. Fallback: npm ngrok library if NGROK_AUTHTOKEN is configured
  const token = (process.env.NGROK_AUTHTOKEN || '').trim();
  if (token) {
    try {
      const ngrok = await import('ngrok');
      const connect = ngrok.connect || (ngrok.default && ngrok.default.connect);
      if (typeof connect === 'function') {
        const url = await connect.call(ngrok.default ?? ngrok, {
          addr: port,
          proto: 'http',
          authtoken: token
        });
        console.log(`\n🌍 [ngrok] Public tunnel active (via npm library):`);
        console.log(`   ➜  ${url}\n`);
        return url;
      }
    } catch (npmErr) {
      console.warn('[ngrok] npm library failed:', npmErr.message);
    }
  }

  console.log(
    '[ngrok] ℹ️  Could not start ngrok tunnel automatically. ' +
    'Run "C:\\ngrok\\ngrok.exe http 3000" in a terminal to expose your local backend.'
  );
  return null;
}
