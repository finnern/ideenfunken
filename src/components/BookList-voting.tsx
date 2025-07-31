import { useState, useEffect } from 'react'
import { useBooks } from '../hooks/useBooks'
import BookCard from './BookCard-simple'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface BookListVotingProps {
  user: any
}

export default function BookListVoting({ user }: BookListVotingProps) {
  const { books, loading, error } = useBooks()
  const [userVoteCount, setUserVoteCount] = useState(0)
  const [loadingVotes, setLoadingVotes] = useState(true)

  // Get user's current vote count
  useEffect(() => {
    const getUserVoteCount = async () => {
      if (!user) {
        setLoadingVotes(false)
        return
      }

      try {
        const { count } = await supabase
          .from('book_votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setUserVoteCount(count || 0)
      } catch (err) {
        console.error('Error getting vote count:', err)
        setUserVoteCount(0)
      } finally {
        setLoadingVotes(false)
      }
    }

    getUserVoteCount()
  }, [user])

  const handleVoteChange = (bookId: string, increment: boolean) => {
    setUserVoteCount(prev => increment ? prev + 1 : Math.max(0, prev - 1))
  }

  if (loading || loadingVotes) {
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
    <div>
      {/* Vote Counter */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">Your Votes</h3>
            <p className="text-sm text-blue-600">Click hearts to vote for books you want in the library</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-800">
              {userVoteCount}/5
            </div>
            <div className="text-xs text-blue-600">
              {5 - userVoteCount} remaining
            </div>
          </div>
        </div>
        
        {userVoteCount >= 5 && (
          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
            🎯 You've used all 5 votes! Remove votes to vote for different books.
          </div>
        )}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            user={user}
            userVoteCount={userVoteCount}
            onVoteChange={handleVoteChange}
          />
        ))}
      </div>
    </div>
  )
}