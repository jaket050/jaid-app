// Typed-ish wrappers around the /admin Netlify function.
// Every call requires the session token from useAdminAuth.

const ENDPOINT = '/.netlify/functions/admin'

async function call(action, payload, token) {
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token, payload }),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    // non-JSON response (rare); will fall through to error if !res.ok
  }
  if (!res.ok) {
    const detail = body && body.error ? body.error : res.statusText
    const error = new Error(detail || 'Request failed')
    error.status = res.status
    throw error
  }
  return body
}

export const adminApi = {
  list: (token) => call('list', {}, token).then((r) => r.words),
  add: (data, token) => call('add', data, token).then((r) => r.word),
  update: (id, fields, token) =>
    call('update', { id, ...fields }, token).then((r) => r.word),
  remove: (id, token) => call('delete', { id }, token).then((r) => r.ok),
}
