import { useState, useEffect } from 'react'
import { Search, Plus, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import BookCover from './BookCover'
import { sanitizeTextInput, validateDescription, rateLimit } from '../lib/security'

// Simple Google Books interface
interface SimpleGoogleBook {
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
  }
}

interface BookSearchProps {
  user: any
  onBookAdded?: () => void
}

export default function BookSearchFixed({ user, onBookAdded }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SimpleGoogleBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inspirationQuotes, setInspirationQuotes] = useState<{ [key: string]: string }>({})
  const [addingBooks, setAddingBooks] = useState<{ [key: string]: boolean }>({})
  const [userBookCount, setUserBookCount] = useState(0)
  const [isAnonymous, setIsAnonymous] = useState(false)

  // Check user's current book suggestion count
  useEffect(() => {
    const checkUserBookCount = async () => {
      if (!user) return

      try {
        // Use the books table directly for counting user's own suggestions (user is authenticated)
        const { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('suggested_by', user.id)

        setUserBookCount(count || 0)
      } catch (error) {
        console.error('Error checking user book count:', error)
      }
    }

    checkUserBookCount()
  }, [user])

  // Google Books search with ISBN detection (ISBN-10/ISBN-13)
  const searchGoogleBooks = async (query: string): Promise<SimpleGoogleBook[]> => {
    try {
      const normalized = query.replace(/[-\s]/g, '').toUpperCase()
      const isIsbn13 = /^\d{13}$/.test(normalized)
      const isIsbn10 = /^[\dX]{10}$/.test(normalized)

      const q = isIsbn13 || isIsbn10 ? `isbn:${normalized}` : query
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8&printType=books`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Error searching books:', error)
      throw error
    }
  }

  // Search with debouncing and validation
  useEffect(() => {
    const performSearch = async () => {
      const sanitizedQuery = sanitizeTextInput(searchQuery, 100)
      
      if (!sanitizedQuery.trim() || sanitizedQuery.length < 3) {
        setSearchResults([])
        return
      }
      
      // Rate limiting for search requests
      const rateLimitKey = `search:${user?.id || 'anonymous'}`
      if (!rateLimit.isAllowed(rateLimitKey, 10, 60000)) { // 10 searches per minute
        toast.error('Zu viele Suchanfragen. Bitte einen Moment warten.')
        return
      }
      
      setIsLoading(true)
      try {
        const results = await searchGoogleBooks(sanitizedQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Suche fehlgeschlagen. Bitte erneut versuchen.')
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, user?.id])

  const extractIsbn = (book: SimpleGoogleBook): string | null => {
    return book.volumeInfo.industryIdentifiers?.find(
      id => id.type === "ISBN_13"
    )?.identifier || 
    book.volumeInfo.industryIdentifiers?.find(
      id => id.type === "ISBN_10"
    )?.identifier || null
  }

  const handleAddBook = async (book: SimpleGoogleBook) => {
    const quote = inspirationQuotes[book.id] || ''
    
    // Validate inspiration quote
    const quoteValidation = validateDescription(quote)
    if (!quoteValidation.isValid) {
      toast.error(quoteValidation.error)
      return
    }
    
    const sanitizedQuote = sanitizeTextInput(quote, 2000)
    if (sanitizedQuote.trim().length < 30) {
      toast.error('Bitte gib ein aussagekräftiges Inspirations‑Zitat an (mind. 30 Zeichen)')
      return
    }

    if (userBookCount >= 10) {
      toast.error('Du hast bereits 10 Bücher vorgeschlagen (Maximalgrenze)')
      return
    }
    
    try {
      setAddingBooks(prev => ({ ...prev, [book.id]: true }))
      
      const isbn = extractIsbn(book)
      
      // Check if book already exists using public view (doesn't expose user data)
      const { data: existingBooks } = await supabase
        .from('books_public')
        .select('id, title')
        .eq('isbn', isbn)
        
      if (existingBooks && existingBooks.length > 0) {
        toast.error(`Dieses Buch wurde bereits vorgeschlagen: "${existingBooks[0].title}"`)
        return
      }
      
      const bookData = {
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors ? book.volumeInfo.authors[0] : null,
        description: book.volumeInfo.description || null,
        cover_url: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        original_cover_url: book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        isbn: isbn,
        inspiration_quote: quote,
        is_anonymous: isAnonymous,
        suggested_by: user.id,
        votes: 1
      }
      
      const { error } = await supabase
        .from('books')
        .insert(bookData)
      
      if (error) throw error
      
      toast.success('Buch erfolgreich vorgeschlagen!')
      
      // Clear everything and close selection
      setSearchQuery('')
      setSearchResults([])
      setInspirationQuotes({})
      setUserBookCount(prev => prev + 1)
      
      if (onBookAdded) {
        onBookAdded()
      }
      
    } catch (error) {
      console.error('Error adding book:', error)
      toast.error('Buch konnte nicht hinzugefügt werden. Bitte erneut versuchen.')
    } finally {
      setAddingBooks(prev => ({ ...prev, [book.id]: false }))
    }
  }

  if (userBookCount >= 10) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Maximale Anzahl erreicht
        </h3>
        <p className="text-yellow-700">
          Du hast bereits 10 Bücher vorgeschlagen (Maximalgrenze). Du kannst weiterhin für vorhandene Bücher abstimmen!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Plus className="w-6 h-6 text-blue-600" />
        Buch vorschlagen
      </h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-sm mb-2">
          📚 Suche nach inspirierenden Büchern für unsere Sammlung. Du kannst bis zu 10 Bücher vorschlagen. ({userBookCount}/10 genutzt)
        </p>
        <p className="text-blue-700 text-sm font-medium">
          💡 Inspirations‑Zitat ist Pflicht – erkläre, warum dieses Buch unsere Community inspiriert!
        </p>
      </div>

      {/* Anonymous Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-700">Diesen Vorschlag anonym machen</span>
        </label>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nach Titel, Autor/in oder ISBN suchen..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Suche Bücher...</span>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Suchergebnisse</h3>
          <div className="grid gap-4">
            {searchResults.map((book) => (
              <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-24 flex-shrink-0">
                    <BookCover
                      coverUrl={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null}
                      title={book.volumeInfo.title}
                      author={book.volumeInfo.authors?.[0] || 'Unbekannt'}
                      className="w-full h-full rounded"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{book.volumeInfo.title}</h4>
                    <p className="text-gray-600 mb-2">
                      {book.volumeInfo.authors?.join(', ') || 'Unbekannte/r Autor/in'}
                    </p>
                    
                    {book.volumeInfo.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {book.volumeInfo.description}
                      </p>
                    )}

                    {/* Inspiration Quote Input */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Warum ist dieses Buch inspirierend? (Pflichtfeld, mind. 30 Zeichen) *
                      </label>
                      <textarea
                        value={inspirationQuotes[book.id] || ''}
                        onChange={(e) => setInspirationQuotes(prev => ({ 
                          ...prev, 
                          [book.id]: e.target.value 
                        }))}
                        placeholder="Erkläre, warum dieses Buch die Community inspirieren würde..."
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(inspirationQuotes[book.id] || '').length}/30 Zeichen Minimum
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleAddBook(book)}
                      disabled={
                        addingBooks[book.id] || 
                        !inspirationQuotes[book.id] || 
                        inspirationQuotes[book.id].length < 30
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                        addingBooks[book.id] || 
                        !inspirationQuotes[book.id] || 
                        inspirationQuotes[book.id].length < 30
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {addingBooks[book.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {addingBooks[book.id] ? 'Wird hinzugefügt...' : 'Buch hinzufügen'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery.length >= 3 && !isLoading && searchResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Bücher gefunden für "{searchQuery}". Bitte andere Suchbegriffe versuchen.</p>
        </div>
      )}
    </div>
  )
}