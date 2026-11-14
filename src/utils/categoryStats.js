// Per-category progress: { [category]: { total, done } } over the loaded
// (verified) words.
export function getCategoryStats(words, completedIds) {
  const stats = {}
  words.forEach((w) => {
    if (!w.category) return
    if (!stats[w.category]) stats[w.category] = { total: 0, done: 0 }
    stats[w.category].total++
    if (completedIds && completedIds.has(w.id)) stats[w.category].done++
  })
  return stats
}

const isInProgress = (s) => s && s.done > 0 && s.done < s.total

// The category to show in the Continue card, or null when nothing is in
// progress. completedIds keeps the order words were marked complete, so the
// newest completed word whose category is still in progress wins. Otherwise
// the highest percent complete, ties going to the larger category.
export function pickContinueCategory(stats, completedIds, words) {
  const categoryById = new Map(words.map((w) => [w.id, w.category]))
  const newestFirst = [...(completedIds ?? [])].reverse()
  for (const id of newestFirst) {
    const cat = categoryById.get(id)
    if (cat && isInProgress(stats[cat])) return cat
  }

  let best = null
  for (const [cat, s] of Object.entries(stats)) {
    if (!isInProgress(s)) continue
    if (!best) { best = cat; continue }
    const b = stats[best]
    const pct = s.done / s.total
    const bestPct = b.done / b.total
    if (pct > bestPct || (pct === bestPct && s.total > b.total)) best = cat
  }
  return best
}
