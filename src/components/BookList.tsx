import { useBooks } from '../hooks/useBooks'
import BookCard from './BookCard'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function BookList() {
  const { books, loading, error } = useBooks()
  const [searchParams] = useSearchParams()
  const isbn = searchParams.get('isbn')
  const bookRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading books...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No books found.</p>
        <p className="text-sm text-gray-500">Be the first to suggest a book!</p>
      </div>
    )
  }

  // Scroll to book with ISBN when available
  useEffect(() => {
    if (isbn && books.length > 0) {
      const book = books.find(b => b.isbn === isbn)
      if (book && bookRefs.current[book.id]) {
        setTimeout(() => {
          bookRefs.current[book.id]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }, 100)
      }
    }
  }, [isbn, books])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <div 
          key={book.id}
          ref={el => { bookRefs.current[book.id] = el }}
          className={isbn === book.isbn ? 'ring-2 ring-primary rounded-lg' : ''}
        >
          <BookCard book={book} />
        </div>
      ))}
    </div>
  )
}