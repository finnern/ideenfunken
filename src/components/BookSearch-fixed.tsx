import { useState, useEffect } from 'react'
import { Search, Plus, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import BookCover from './BookCover'

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

  // Simple Google Books search
  const searchGoogleBooks = async (query: string): Promise<SimpleGoogleBook[]> => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&printType=books`
      )
      
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

  // Search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSearchResults([])
        return
      }
      
      setIsLoading(true)
      try {
        const results = await searchGoogleBooks(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        toast.error('Failed to search books. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(performSearch, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

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
    
    if (quote.trim().length < 30) {
      toast.error('Please provide a meaningful inspiration quote (at least 30 characters)')
      return
    }

    if (userBookCount >= 3) {
      toast.error('You have already suggested 3 books (maximum limit)')
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
        toast.error(`This book has already been suggested: "${existingBooks[0].title}"`)
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
      
      toast.success('Book added successfully!')
      
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
      toast.error('Failed to add book. Please try again.')
    } finally {
      setAddingBooks(prev => ({ ...prev, [book.id]: false }))
    }
  }

  if (userBookCount >= 3) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Maximum Books Reached
        </h3>
        <p className="text-yellow-700">
          You have already suggested 3 books (maximum limit). You can still vote on existing books!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Plus className="w-6 h-6 text-blue-600" />
        Suggest a New Book
      </h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-sm mb-2">
          📚 Search for inspiring books to add to our community collection. You can suggest up to 3 books. ({userBookCount}/3 used)
        </p>
        <p className="text-blue-700 text-sm font-medium">
          💡 Inspiration quote is mandatory - explain why this book would inspire our community!
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
          <span className="text-gray-700">Make this recommendation anonymous</span>
        </label>
      </div>

      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books by title or author..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Searching books...</span>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Search Results</h3>
          <div className="grid gap-4">
            {searchResults.map((book) => (
              <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-24 flex-shrink-0">
                    <BookCover
                      coverUrl={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null}
                      title={book.volumeInfo.title}
                      author={book.volumeInfo.authors?.[0] || 'Unknown'}
                      className="w-full h-full rounded"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{book.volumeInfo.title}</h4>
                    <p className="text-gray-600 mb-2">
                      {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                    </p>
                    
                    {book.volumeInfo.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {book.volumeInfo.description}
                      </p>
                    )}

                    {/* Inspiration Quote Input */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Why is this book inspiring? (Required, min 30 characters) *
                      </label>
                      <textarea
                        value={inspirationQuotes[book.id] || ''}
                        onChange={(e) => setInspirationQuotes(prev => ({ 
                          ...prev, 
                          [book.id]: e.target.value 
                        }))}
                        placeholder="Explain why this book would inspire the community..."
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(inspirationQuotes[book.id] || '').length}/30 characters minimum
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
                      {addingBooks[book.id] ? 'Adding...' : 'Add Book'}
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
          <p>No books found for "{searchQuery}". Try different search terms.</p>
        </div>
      )}
    </div>
  )
}