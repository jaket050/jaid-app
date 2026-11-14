// Strips CHamoru diacritics (a, n, e, etc.) and the glota (') so search can
// match plain-ASCII input like "hafa" or "chelu" against the accented forms.
export function normalizeChamorro(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/'/g, '')
    .toLowerCase()
}
