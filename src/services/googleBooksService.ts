interface GoogleBook {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    description?: string
    imageLinks?: {
      thumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    infoLink?: string
  }
}

const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const searchCache = new Map<string, { data: GoogleBook[], timestamp: number }>()

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const searchBooks = async (searchQuery: string): Promise<GoogleBook[]> => {
  // Check cache first
  const cacheEntry = searchCache.get(searchQuery)
  if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION) {
    return cacheEntry.data
  }

  try {
    console.log('Searching for:', searchQuery)
    
    const response = await fetch(
      `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(searchQuery)}&maxResults=20&printType=books`
    )
    
    if (response.status === 429) {
      // Rate limit hit, wait and retry once
      await delay(2000)
      const retryResponse = await fetch(
        `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(searchQuery)}&maxResults=20&printType=books`
      )
      if (!retryResponse.ok) {
        throw { status: retryResponse.status, message: 'Rate limit exceeded' }
      }
      const data = await retryResponse.json()
      const results = processSearchResults(data.items || [], searchQuery)
      
      searchCache.set(searchQuery, { data: results, timestamp: Date.now() })
      return results
    }
    
    if (!response.ok) {
      throw { status: response.status, message: 'Search failed' }
    }
    
    const data = await response.json()
    const results = processSearchResults(data.items || [], searchQuery)
    
    searchCache.set(searchQuery, { data: results, timestamp: Date.now() })
    return results
  } catch (error) {
    console.error('Error searching books:', error)
    throw error
  }
}

const processSearchResults = (items: GoogleBook[], searchQuery: string): GoogleBook[] => {
  if (!items.length) return []
  
  // Remove duplicates
  const uniqueBooks = Array.from(
    new Map(items.map(item => [item.id, item])).values()
  ) as GoogleBook[]
  
  return uniqueBooks
    .filter(book => {
      // Only include books with ISBN
      const hasIsbn = book.volumeInfo.industryIdentifiers?.some(
        id => id.type === "ISBN_10" || id.type === "ISBN_13"
      )
      
      if (!hasIsbn) return false

      const bookTitle = book.volumeInfo.title?.toLowerCase() || ''
      const bookAuthors = book.volumeInfo.authors?.map(author => 
        author.toLowerCase()
      ) || []
      const searchTerms = searchQuery.toLowerCase().split(' ')
      
      // Check if search terms match title or author
      return searchTerms.some(term => 
        bookTitle.includes(term) || 
        bookAuthors.some(author => author.includes(term))
      )
    })
    .sort((a, b) => {
      const searchLower = searchQuery.toLowerCase()
      
      const scoreBook = (book: GoogleBook): number => {
        let score = 0
        
        if (book.volumeInfo.title?.toLowerCase() === searchLower) {
          score += 100
        }
        
        if (book.volumeInfo.title?.toLowerCase().includes(searchLower)) {
          score += 50
        }
        
        const authors = book.volumeInfo.authors || []
        if (authors.some(author => author.toLowerCase() === searchLower)) {
          score += 75
        }
        
        if (book.volumeInfo.industryIdentifiers?.some(
          id => id.type === "ISBN_13"
        )) {
          score += 10
        }
        
        return score
      }
      
      return scoreBook(b) - scoreBook(a)
    })
    .slice(0, 8) // Limit to top 8 results
}

export const extractIsbn = (book: GoogleBook): string | null => {
  return book.volumeInfo.industryIdentifiers?.find(
    id => id.type === "ISBN_13"
  )?.identifier || 
  book.volumeInfo.industryIdentifiers?.find(
    id => id.type === "ISBN_10"
  )?.identifier || null
}

export type { GoogleBook }