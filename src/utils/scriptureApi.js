const BIBLE_API_BASE = 'https://bible-api.com'

export const fetchScripture = async (book, chapter, verseStart, verseEnd, signal) => {
  try {
    // bible-api.com uses + as word separator (e.g. "1+Kings+5:1")
    // Do NOT use encodeURIComponent — it encodes + to %2B and : to %3A, breaking the API format
    const bookSafe = book.replace(/\s+/g, '+')
    const ref = verseEnd && verseEnd !== verseStart
      ? `${bookSafe}+${chapter}:${verseStart}-${verseEnd}`
      : `${bookSafe}+${chapter}:${verseStart}`
    const url = `${BIBLE_API_BASE}/${ref}`
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error('Failed to fetch scripture')
    const data = await response.json()
    return data
  } catch (error) {
    // Ignore AbortError — this is expected when the user selects a new event
    if (error.name === 'AbortError') return null
    console.error('Scripture fetch error:', error)
    return null
  }
}
