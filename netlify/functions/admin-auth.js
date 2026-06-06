// Netlify Function: admin-auth
// POST { password } → 200 { token } | 401 | 500
//
// Validates the supplied password against ADMIN_PASSWORD (server-only env var)
// and issues a 24h HMAC-signed token. The admin frontend stores the token in
// sessionStorage and sends it with subsequent /admin function calls.

import crypto from 'node:crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const HMAC_SECRET = process.env.HMAC_SECRET
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function signToken(payload) {
  const payloadB64 = b64url(JSON.stringify(payload))
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payloadB64)
    .digest()
  return `${payloadB64}.${b64url(signature)}`
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  if (!ADMIN_PASSWORD || !HMAC_SECRET) {
    return new Response('Server misconfigured: missing ADMIN_PASSWORD or HMAC_SECRET', { status: 500 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  // Constant-time compare to prevent timing oracle on short prefixes.
  const supplied = String(body.password ?? '')
  const a = Buffer.from(supplied)
  const b = Buffer.from(ADMIN_PASSWORD)
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const token = signToken({
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  })

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
