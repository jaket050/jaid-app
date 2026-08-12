// Netlify Function: admin
// POST { action, token, payload } → JSON
//
// Actions: 'list' | 'add' | 'update' | 'delete'
// Verifies the HMAC token from /admin-auth on every call, then performs
// the requested operation using the Supabase service role key.
//
// The service role key is server-only — never sent to the browser.

import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const HMAC_SECRET = process.env.HMAC_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ALLOWED_TYPES = ['word', 'phrase', 'saying']
const DEFAULT_SOURCE = "Kumision i Fino' CHamoru 2025"

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
  // Constant-time compare on the same-length signatures.
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

function sanitizeAdd(p) {
  if (!p.chamorro || !p.english) {
    return { __error: 'chamorro and english are required' }
  }
  const type = String(p.type || 'word').toLowerCase()
  if (!ALLOWED_TYPES.includes(type)) {
    return { __error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(', ')}` }
  }
  const difficulty = parseInt(p.difficulty, 10) || 1
  return {
    chamorro: String(p.chamorro).trim(),
    english: String(p.english).trim(),
    type,
    difficulty,
    category: p.category ? String(p.category).trim() : null,
    cultural_note: p.cultural_note ? String(p.cultural_note).trim() : null,
    source: p.source ? String(p.source).trim() : DEFAULT_SOURCE,
    verified: p.verified !== false, // default true unless explicitly false
  }
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  if (!HMAC_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Server misconfigured: missing HMAC_SECRET, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY' }, 500)
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

  const action = body.action
  const payload = body.payload || {}

  try {
    switch (action) {
      case 'list': {
        const { data, error } = await supabase
          .from('vocabulary')
          .select('id, chamorro, english, type, difficulty, category, cultural_note, source, verified, created_at')
          .order('id')
        if (error) throw error
        return json({ words: data ?? [] })
      }

      case 'add': {
        const fields = sanitizeAdd(payload)
        if (fields.__error) return json({ error: fields.__error }, 400)
        const { data, error } = await supabase
          .from('vocabulary')
          .insert(fields)
          .select()
          .single()
        if (error) throw error
        return json({ word: data })
      }

      case 'update': {
        const id = parseInt(payload.id, 10)
        if (!id) return json({ error: 'Missing id' }, 400)
        const fields = {}
        if ('chamorro' in payload) {
          const v = String(payload.chamorro || '').trim()
          if (!v) return json({ error: 'chamorro cannot be empty' }, 400)
          fields.chamorro = v
        }
        if ('english' in payload) {
          const v = String(payload.english || '').trim()
          if (!v) return json({ error: 'english cannot be empty' }, 400)
          fields.english = v
        }
        if ('type' in payload) {
          const v = String(payload.type || '').toLowerCase()
          if (!ALLOWED_TYPES.includes(v)) {
            return json({ error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(', ')}` }, 400)
          }
          fields.type = v
        }
        if ('difficulty' in payload) {
          const v = parseInt(payload.difficulty, 10)
          if (!v) return json({ error: 'Invalid difficulty' }, 400)
          fields.difficulty = v
        }
        if ('category' in payload) {
          fields.category = payload.category
            ? String(payload.category).trim()
            : null
        }
        if ('cultural_note' in payload) {
          fields.cultural_note = payload.cultural_note
            ? String(payload.cultural_note).trim()
            : null
        }
        if ('source' in payload) {
          fields.source = String(payload.source).trim() || DEFAULT_SOURCE
        }
        if ('verified' in payload) fields.verified = Boolean(payload.verified)
        if (Object.keys(fields).length === 0) {
          return json({ error: 'No editable fields supplied' }, 400)
        }
        const { data, error } = await supabase
          .from('vocabulary')
          .update(fields)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return json({ word: data })
      }

      case 'delete': {
        const id = parseInt(payload.id, 10)
        if (!id) return json({ error: 'Missing id' }, 400)
        const { error } = await supabase
          .from('vocabulary')
          .delete()
          .eq('id', id)
        if (error) throw error
        return json({ ok: true })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    return json({ error: err.message || 'Internal error' }, 500)
  }
}
