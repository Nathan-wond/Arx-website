/**
 * ngrokHelper.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auto-starts an ngrok tunnel in development mode and logs the public URL.
 * Requires NGROK_AUTHTOKEN in .env (free at https://ngrok.com/signup).
 *
 * Usage in server.js:
 *   import { startNgrokTunnel } from './backend/src/utils/ngrokHelper.js';
 *   // Call inside startServer() after app.listen():
 *   await startNgrokTunnel(PORT);
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function startNgrokTunnel(port) {
  const token = (process.env.NGROK_AUTHTOKEN || '').trim();

  if (!token) {
    console.log(
      '[ngrok] ℹ️  NGROK_AUTHTOKEN not set. Skipping tunnel. ' +
      'Get a free token at https://ngrok.com/signup and add it to .env as NGROK_AUTHTOKEN.'
    );
    return null;
  }

  try {
    const ngrok = await import('ngrok');
    const connect = ngrok.connect || (ngrok.default && ngrok.default.connect);

    if (typeof connect !== 'function') {
      console.warn('[ngrok] ⚠️  Could not resolve ngrok.connect. Skipping tunnel.');
      return null;
    }

    await connect.call(ngrok.default ?? ngrok, { authtoken: token }); // set auth token

    const url = await connect.call(ngrok.default ?? ngrok, {
      addr:     port,
      proto:    'http',
      authtoken: token,
    });

    console.log(`\n🌍 [ngrok] Public tunnel active:`);
    console.log(`   ➜  ${url}`);
    console.log(`\n💡 Set Telegram webhook to: ${url}/api/telegram/webhook`);
    console.log(`   (POST to https://api.telegram.org/bot<TOKEN>/setWebhook?url=${url}/api/telegram/webhook)\n`);

    return url;
  } catch (err) {
    console.warn('[ngrok] ⚠️  Failed to start tunnel:', err?.message || err);
    return null;
  }
}
