// Curated learning sequence (Dr. Souder priority order). Single source of truth
// shared by StudyMode and QuizMode for the "Try next deck" suggestion.
export const LEARNING_PATH_ORDER = [
  'Greetings', 'Family', 'Values', 'Holidays and Religion', 'Baptism',
  'Food', 'Drinks', 'Anatomy', 'Home', 'School', 'Animals', 'Plants',
  'Water', 'Weather', 'Land', 'Places', 'Numbers', 'Colors', 'Shapes',
  'Days of the Week', 'Months of the Year', 'Time', 'Money', 'Genealogy',
  'Pronouns', 'Verbs', 'Adjectives', 'Directions', 'Objects', 'Emotions',
  'Nature', 'People', 'Questions', 'Culture',
]

// The next category after `category`, wrapping to / falling back on Greetings.
export function nextCategory(category) {
  const idx = LEARNING_PATH_ORDER.indexOf(category)
  if (idx === -1 || idx === LEARNING_PATH_ORDER.length - 1) return 'Greetings'
  return LEARNING_PATH_ORDER[idx + 1]
}
