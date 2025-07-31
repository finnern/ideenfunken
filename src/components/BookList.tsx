import { useBooks } from '../hooks/useBooks'
import BookCard from './BookCard'
import { Loader2 } from 'lucide-react'

export default function BookList() {
  const { books, loading, error } = useBooks()

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}