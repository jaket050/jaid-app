import { supabase } from '../lib/supabase'
import { getOrCreateSessionId } from '../hooks/useSessionId'

/**
 * Fire-and-forget anonymous event logger.
 *
 * Inserts a single row into `learner_events`. It is never awaited and never
 * throws — logging must not block the UI or surface an error to the learner.
 * The insert promise is intentionally not returned, and both its resolution
 * and rejection are swallowed.
 *
 * @param {string} eventType  e.g. 'search_success', 'word_of_day_viewed'
 * @param {object} [payload]  any of: search_term, category, result_count,
 *                            word_id, pair_matched
 */
export function logEvent(eventType, payload = {}) {
  try {
    const sessionId = getOrCreateSessionId()
    if (!sessionId) return
    supabase
      .from('learner_events')
      .insert({ session_id: sessionId, event_type: eventType, ...payload })
      .then(() => {}, () => {})
  } catch {
    // Never let analytics break the learner experience.
  }
}
