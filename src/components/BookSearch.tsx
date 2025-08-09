import { useState, useEffect } from 'react'
import { Search, Plus, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { searchBooks, extractIsbn, type GoogleBook } from '../services/googleBooksService'
import BookCover from './BookCover'

interface BookSearchProps {
  user: any
  onBookAdded?: () => void
}

export default function BookSearch({ user, onBookAdded }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GoogleBook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inspirationQuotes, setInspirationQuotes] = useState<{ [key: string]: string }>({})
  const [addingBooks, setAddingBooks] = useState<{ [key: string]: boolean }>({})
  const [userBookCount, setUserBookCount] = useState(0)

  // Check user's current book suggestion count
  useEffect(() => {
    const checkUserBookCount = async () => {
      if (!user) return

      try {
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

  // Search books with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSearchResults([])
        return
      }
      
      setIsLoading(true)
      try {
        const results = await searchBooks(searchQuery)
        setSearchResults(results)
      } catch (error: any) {
        console.error('Search error:', error)
        if (error?.status === 429) {
          toast.error('Zu viele Anfragen. Bitte einen Moment warten, bevor du weiter suchst.')
        } else {
          toast.error('Suche fehlgeschlagen. Bitte erneut versuchen.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleAddBook = async (book: GoogleBook) => {
    const quote = inspirationQuotes[book.id] || ''
    
    if (quote.trim().length < 30) {
      toast.error('Bitte gib ein aussagekräftiges Inspirations‑Zitat an (mind. 30 Zeichen)')
      return
    }

    if (userBookCount >= 3) {
      toast.error('Du hast bereits 3 Bücher vorgeschlagen (Maximalgrenze)')
      return
    }
    
    try {
      setAddingBooks(prev => ({ ...prev, [book.id]: true }))
      
      const isbn = extractIsbn(book)
      
      // Check if book already exists
      const { data: existingBooks } = await supabase
        .from('books')
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
        suggested_by: user.id,
        votes: 1 // Start with 1 vote
      }
      
      const { error } = await supabase
        .from('books')
        .insert(bookData)
      
      if (error) throw error
      
      toast.success('Buch erfolgreich vorgeschlagen!')
      
      // Clear the quote and update count
      setInspirationQuotes(prev => ({ ...prev, [book.id]: '' }))
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

  if (userBookCount >= 3) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Maximale Anzahl erreicht
        </h3>
        <p className="text-yellow-700">
          Du hast bereits 3 Bücher vorgeschlagen (Maximalgrenze). Du kannst weiterhin für vorhandene Bücher abstimmen!
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
      
      <p className="text-gray-600 mb-4">
        Suche nach inspirierenden Büchern für unsere Sammlung. 
        Du kannst bis zu 3 Bücher vorschlagen. ({userBookCount}/3 genutzt)
      </p>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Nach Büchern nach Titel oder Autor/in suchen..."
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
                        Warum ist dieses Buch inspirierend? (Pflichtfeld, mind. 30 Zeichen)
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