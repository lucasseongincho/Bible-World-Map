const BIBLE_API_BASE = 'https://bible-api.com'

// In-memory cache — scripture text never changes, no expiry needed
const scriptureCache = new Map()

export const fetchScripture = async (book, chapter, verseStart, verseEnd, signal) => {
  const bookSafe = book.replace(/\s+/g, '+')
  const ref = verseEnd && verseEnd !== verseStart
    ? `${bookSafe}+${chapter}:${verseStart}-${verseEnd}`
    : `${bookSafe}+${chapter}:${verseStart}`

  if (scriptureCache.has(ref)) return scriptureCache.get(ref)

  try {
    const url = `${BIBLE_API_BASE}/${ref}`
    const response = await fetch(url, { signal })
    if (!response.ok) throw new Error('Failed to fetch scripture')
    const data = await response.json()
    scriptureCache.set(ref, data)
    return data
  } catch (error) {
    if (error.name === 'AbortError') return null
    console.error('Scripture fetch error:', error)
    return null
  }
}
