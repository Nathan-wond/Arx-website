import crypto from 'node:crypto';
import { CONFIG } from '../config/index.js';

export function createToken(payload)

{
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + CONFIG.TOKEN_EXPIRY_SECONDS;
  const fullPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto.
  createHmac('sha256', CONFIG.JWT_SECRET).
  update(`${encodedHeader}.${encodedPayload}`).
  digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto.
    createHmac('sha256', CONFIG.JWT_SECRET).
    update(`${encodedHeader}.${encodedPayload}`).
    digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadText = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadText);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; 
    }

    return payload;
  } catch {
    return null;
  }
}
