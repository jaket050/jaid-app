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
 * @param {string} eventType  e.g. 'search_success', 'answer_submitted'
 * @param {object} [payload]  any of: search_term, category, result_count,
 *                            word_id, pair_matched, mode, correct, item_key
 *
 * Only fields that are provided (not undefined) are sent, so an event never
 * names a column it does not use. mode, correct and item_key need
 * supabase/migrations/0002_learner_events_answers.sql.
 */
export function logEvent(eventType, payload = {}) {
  try {
    const sessionId = getOrCreateSessionId()
    if (!sessionId) return
    const fields = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined))
    supabase
      .from('learner_events')
      .insert({ session_id: sessionId, event_type: eventType, ...fields })
      .then(() => {}, () => {})
  } catch {
    // Never let analytics break the learner experience.
  }
}
