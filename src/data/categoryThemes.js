// Theme groups for the All Categories library and the home Start here list.
// Keyed by the category values stored in vocabulary.category (not display
// labels). Any category not listed here falls into MORE_THEME, so a new
// category never disappears.

export const CATEGORY_THEMES = [
  { name: 'Everyday Basics', categories: ['Greetings', 'Questions', 'Emotions', 'Colors', 'Objects', 'Directions', 'Shapes'] },
  { name: 'People and Family', categories: ['Family', 'People', 'Genealogy', 'Anatomy'] },
  { name: 'Home and Daily Life', categories: ['Home', 'Food', 'Drinks', 'School', 'Money', 'Technology', 'Vehicles'] },
  { name: 'Land and Nature', categories: ['Land', 'Islands', 'Places', 'Animals', 'Plants', 'Nature', 'Weather', 'Water'] },
  { name: 'Time and Numbers', categories: ['Time', 'Days of the Week', 'Months of the Year', 'Numbers Prisente', 'Numbers Ansiånu', 'Years and Centuries'] },
  { name: 'Faith and Culture', categories: ['Holidays and Religion', 'Baptism', 'Culture', 'Values', 'Self Determination'] },
  { name: 'Civic Life', categories: ['Government', 'Legal'] },
  { name: 'Language Building Blocks', categories: ['Verbs', 'Adjectives', 'Pronouns'] },
]

export const MORE_THEME = 'More'

export const START_HERE = ['Greetings', 'Family', 'Holidays and Religion', 'Baptism']

// [{ name, categories: [key] }] for the categories present in `stats`, in
// config order, with empty themes dropped and unlisted categories in More.
export function groupByTheme(stats) {
  const placed = new Set()
  const groups = []
  for (const theme of CATEGORY_THEMES) {
    const categories = theme.categories.filter((cat) => stats[cat])
    categories.forEach((cat) => placed.add(cat))
    if (categories.length > 0) groups.push({ name: theme.name, categories })
  }
  const rest = Object.keys(stats).filter((cat) => !placed.has(cat)).sort()
  if (rest.length > 0) groups.push({ name: MORE_THEME, categories: rest })
  return groups
}
