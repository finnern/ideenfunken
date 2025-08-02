import { useState, useEffect, useMemo } from 'react'
import { useBooks } from '../hooks/useBooks'
import BookCard from './BookCard-simple'
import { Loader2 } from 'lucide-react'

interface BookListVotingProps {
  user: any
  sortBy: 'votes' | 'latest'
  userVoteCount: number
  onVoteChange: (increment: boolean) => void
}

export default function BookListVoting({ user, sortBy, userVoteCount, onVoteChange }: BookListVotingProps) {
  const { books, loading, error } = useBooks()
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)

  // Sort books
  const sortedBooks = useMemo(() => {
    if (!books.length) return []

    const sorted = [...books].sort((a, b) => {
      if (sortBy === 'votes') {
        if (b.votes !== a.votes) {
          return b.votes - a.votes
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    
    return sorted
  }, [books, sortBy])

  const handleExpand = (bookId: string) => {
    setExpandedBookId(expandedBookId === bookId ? null : bookId)
  }

  const handleVoteChange = (_bookId: string, increment: boolean) => {
    onVoteChange(increment)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 text-sm">Keine Bücher gefunden.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Bigger Books Grid - Back to good size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedBooks.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            user={user}
            userVoteCount={userVoteCount}
            onVoteChange={handleVoteChange}
            isExpanded={expandedBookId === book.id}
            onExpand={() => handleExpand(book.id)}
          />
        ))}
      </div>
      
      {/* Status Line */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {sortedBooks.length} Bücher • Top 10 → Mediathek
        </p>
      </div>
    </div>
  )
}