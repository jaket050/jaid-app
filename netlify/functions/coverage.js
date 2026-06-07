// Netlify Function: coverage
// POST { token } → { categories: [...], totalWords }
//
// Verifies the HMAC token from /admin-auth (same scheme as admin.js),
// then reads vocabulary via the service role key, groups by category
// and verified status, and returns aggregate counts plus a percent.

import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const HMAC_SECRET = process.env.HMAC_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function b64urlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts
  const expectedSig = b64urlEncode(
    crypto.createHmac('sha256', HMAC_SECRET).update(payloadB64).digest()
  )
  const a = Buffer.from(expectedSig)
  const b = Buffer.from(sigB64)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let payload
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString())
  } catch {
    return null
  }
  if (!payload.exp || Date.now() > payload.exp) return null
  return payload
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  if (!HMAC_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  if (!verifyToken(body.token)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Group in JS — the JS client doesn't expose PG GROUP BY directly,
  // and the vocabulary table is small enough that aggregating client-side
  // (~hundreds of rows) is trivial.
  const { data, error } = await supabase
    .from('vocabulary')
    .select('category, verified')

  if (error) return json({ error: error.message }, 500)

  const groups = new Map()
  for (const row of data) {
    const key = row.category || '(no category)'
    const g = groups.get(key) || {
      category: key,
      total: 0,
      verified: 0,
      unverified: 0,
    }
    g.total++
    if (row.verified) g.verified++
    else g.unverified++
    groups.set(key, g)
  }

  const categories = [...groups.values()]
    .map((g) => ({
      ...g,
      percentVerified: g.total > 0 ? Math.round((g.verified / g.total) * 100) : 0,
    }))
    .sort(
      (a, b) =>
        a.percentVerified - b.percentVerified ||
        a.category.localeCompare(b.category)
    )

  return json({ categories, totalWords: data.length })
}
