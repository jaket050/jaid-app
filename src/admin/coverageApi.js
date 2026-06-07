// Wrapper around the /coverage Netlify function.
// Returns { categories: [...], totalWords } or throws with .status set.

const ENDPOINT = '/.netlify/functions/coverage'

export async function fetchCoverage(token) {
  if (!token) {
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    // non-JSON response — will throw below via !res.ok branch
  }
  if (!res.ok) {
    const detail = body && body.error ? body.error : res.statusText
    const err = new Error(detail || 'Request failed')
    err.status = res.status
    throw err
  }
  return body
}
