import { useState, useMemo, useEffect } from 'react'
import { useBooks } from '../hooks/useBooks'
import BookCard from './BookCard-simple'
import { Loader2 } from 'lucide-react'

interface BookListVotingProps {
  user: any | null
  sortBy: 'votes' | 'latest'
  userVoteCount: number
  onVoteChange: (increment: boolean) => void
}

export default function BookListVoting({ user, sortBy, userVoteCount, onVoteChange }: BookListVotingProps) {
  const { books, loading, error } = useBooks()
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null)

  useEffect(() => {
    if (!books.length) return;
    const url = new URL(window.location.href);
    const rawIsbn = url.searchParams.get('isbn');
    const rawId = url.searchParams.get('bookId') || url.searchParams.get('book') || url.searchParams.get('id');
    let target: any = null;
    const normalize = (v: string) => v.replace(/[-\s]/g, '');
    if (rawIsbn) {
      const norm = normalize(rawIsbn);
      target = books.find((b: any) => b.isbn && normalize(String(b.isbn)) === norm);
    }
    if (!target && rawId) {
      target = books.find((b: any) => b.id === rawId);
    }
    if (target) {
      setExpandedBookId(target.id);
      setTimeout(() => {
        const el = document.getElementById(`book-${target.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [books]);

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

  const handleVoteChange = (_bookId: string, increment: boolean) => {
    // Only call onVoteChange if user is logged in
    if (user) {
      onVoteChange(increment)
    }
  }

  const handleExpand = (bookId: string) => {
    const expanding = expandedBookId !== bookId
    setExpandedBookId(expanding ? bookId : null)

    const url = new URL(window.location.href)
    if (expanding) {
      const book = books.find((b: any) => b.id === bookId)
      const hasIsbn = book?.isbn && String(book.isbn).trim().length > 0
      if (hasIsbn) {
        const cleanIsbn = String(book!.isbn).replace(/[-\s]/g, '')
        url.searchParams.set('isbn', cleanIsbn)
        url.searchParams.delete('bookId')
        url.searchParams.delete('book')
        url.searchParams.delete('id')
      } else {
        url.searchParams.set('bookId', bookId)
        url.searchParams.delete('isbn')
      }
      window.history.pushState({}, '', url)
      setTimeout(() => {
        const el = document.getElementById(`book-${bookId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } else {
      url.searchParams.delete('isbn')
      url.searchParams.delete('bookId')
      url.searchParams.delete('book')
      url.searchParams.delete('id')
      window.history.replaceState({}, '', url)
    }
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
    <div className="space-y-6">
      {/* Books Grid - Better spacing and visual appeal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedBooks.map((book) => (
          <div id={`book-${book.id}`} key={book.id}>
            <BookCard 
              book={book} 
              user={user}
              userVoteCount={userVoteCount}
              onVoteChange={handleVoteChange}
              isExpanded={expandedBookId === book.id}
              onExpand={() => handleExpand(book.id)}
            />
          </div>
        ))}
      </div>
      
      {/* Status Line */}
      <div className="text-center">
        <p className="text-sm text-gray-600 bg-gray-50 inline-block px-4 py-2 rounded-full">
          {sortedBooks.length} Bücher • Die Top 10 kommen in die Mediathek
        </p>
      </div>
    </div>
  )
}