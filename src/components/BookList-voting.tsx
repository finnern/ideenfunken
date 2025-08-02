import { useState, useEffect, useMemo } from 'react'
import { useBooks } from '../hooks/useBooks'
import BookCard from './BookCard-simple'
import { Loader2, ArrowUpDown, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface BookListVotingProps {
  user: any
}

export default function BookListVoting({ user }: BookListVotingProps) {
  const { books, loading, error } = useBooks()
  const [userVoteCount, setUserVoteCount] = useState(0)
  const [loadingVotes, setLoadingVotes] = useState(true)
  const [sortBy, setSortBy] = useState<'votes' | 'latest'>('votes')

  // Get user's current vote count
  useEffect(() => {
    let mounted = true

    const getUserVoteCount = async () => {
      if (!user) {
        if (mounted) setLoadingVotes(false)
        return
      }

      try {
        const { count, error } = await supabase
          .from('book_votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (mounted) {
          setUserVoteCount(error ? 0 : (count || 0))
        }
      } catch (err) {
        console.error('Error getting vote count:', err)
        if (mounted) setUserVoteCount(0)
      } finally {
        if (mounted) setLoadingVotes(false)
      }
    }

    getUserVoteCount()

    return () => {
      mounted = false
    }
  }, [user])

  // Force re-render when sortBy changes
  const [sortKey, setSortKey] = useState(0)
  
  // Sort books with explicit dependency tracking
  const sortedBooks = useMemo(() => {
    console.log('🔄 FORCED Sorting triggered', { 
      sortBy, 
      sortKey,
      booksLength: books.length,
      timestamp: new Date().toISOString()
    })
    
    if (!books.length) {
      console.log('❌ No books to sort')
      return []
    }

    console.log('📚 Raw books before sorting:', books.slice(0, 3).map(b => ({
      title: b.title,
      votes: b.votes,
      created_at: b.created_at
    })))

    const sorted = [...books].sort((a, b) => {
      if (sortBy === 'votes') {
        console.log('📊 VOTE COMPARISON:', {
          bookA: `${a.title}: ${a.votes} votes (${typeof a.votes})`,
          bookB: `${b.title}: ${b.votes} votes (${typeof b.votes})`,
          voteDiff: b.votes - a.votes,
          result: b.votes !== a.votes ? (b.votes - a.votes) : 'tie-breaker by date'
        })
        // Sort by votes (descending), then by created_at (descending) for ties
        if (b.votes !== a.votes) {
          return b.votes - a.votes
        }
        const dateResult = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        console.log('📅 DATE TIE-BREAKER:', {
          bookA: `${a.title}: ${a.created_at}`,
          bookB: `${b.title}: ${b.created_at}`,
          result: dateResult
        })
        return dateResult
      } else {
        const dateResult = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        console.log('📅 DATE COMPARISON:', {
          bookA: `${a.title}: ${a.created_at}`,
          bookB: `${b.title}: ${b.created_at}`,
          result: dateResult
        })
        return dateResult
      }
    })

    console.log('✅ Sorted books result:', sorted.slice(0, 3).map(b => ({
      title: b.title,
      votes: b.votes,
      created_at: b.created_at
    })))
    
    return sorted
  }, [books, sortBy, sortKey])

  const handleVoteChange = (_bookId: string, increment: boolean) => {
    setUserVoteCount((prev: number) => increment ? prev + 1 : Math.max(0, prev - 1))
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

      {/* Sorting Controls */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sort by: {sortBy}</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('Clicked Most Voted, current sortBy:', sortBy)
              setSortBy('votes')
              setSortKey(prev => prev + 1)
              console.log('Set sortBy to: votes, sortKey incremented')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'votes'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Most Voted
          </button>
          
          <button
            onClick={() => {
              console.log('Clicked Latest Added, current sortBy:', sortBy)
              setSortBy('latest')
              setSortKey(prev => prev + 1)
              console.log('Set sortBy to: latest, sortKey incremented')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'latest'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Latest Added
          </button>
        </div>
      </div>

      {/* Sorting Status - Clean Display */}
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">
          Showing {sortedBooks.length} books sorted by {sortBy === 'votes' ? 'vote count' : 'date added'}
        </p>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedBooks.map((book) => (
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