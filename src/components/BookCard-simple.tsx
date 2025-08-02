import { useState, useEffect } from 'react'
import BookCover from './BookCover'
import { supabase } from '../lib/supabase'
import { Heart, Loader2 } from 'lucide-react'

interface BookCardProps {
  book: any
  user: any
  userVoteCount: number
  onVoteChange: (bookId: string, increment: boolean) => void
}

export default function BookCard({ book, user, userVoteCount, onVoteChange }: BookCardProps) {
  const [voteCount, setVoteCount] = useState(book.votes)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingVote, setCheckingVote] = useState(true)

  // Check if user has voted for this book
  useEffect(() => {
    let mounted = true

    const checkVote = async () => {
      if (!user) {
        if (mounted) setCheckingVote(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('book_votes')
          .select('id')
          .eq('book_id', book.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (mounted) {
          setHasVoted(!!data && !error)
        }
      } catch (err) {
        // No vote found is expected
        if (mounted) setHasVoted(false)
      } finally {
        if (mounted) setCheckingVote(false)
      }
    }

    checkVote()

    return () => {
      mounted = false
    }
  }, [book.id, user])

  const handleVote = async () => {
    if (!user || loading || checkingVote) return

    setLoading(true)

    try {
      if (hasVoted) {
        // Remove vote
        const { error: deleteError } = await supabase
          .from('book_votes')
          .delete()
          .eq('book_id', book.id)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        // Decrement book votes using SQL increment to prevent race conditions
        console.log('🔽 DECREMENTING votes with SQL:', {
          bookTitle: book.title,
          bookId: book.id,
          currentUIVotes: book.votes
        })

        // Direct database update - skip RPC for now
        console.log('🔄 Starting direct database vote decrement...')

        const bookUpdateResult = await supabase.rpc('decrement_vote', { book_id: book.id })

        if (bookUpdateResult.data?.[0]?.new_votes !== undefined) {
          book.votes = bookUpdateResult.data[0].new_votes;
          console.log('✅ Vote decremented - New count:', bookUpdateResult.data[0].new_votes)
        }

        if (bookUpdateResult.error) {
          console.error('❌ CRITICAL: Vote decrement failed!', bookUpdateResult.error)
          alert(`Database error: ${bookUpdateResult.error.message}`)
          throw bookUpdateResult.error
        }

        if (bookUpdateResult.data && bookUpdateResult.data.length > 0) {
          console.log('✅ Vote decremented successfully! New vote count:', bookUpdateResult.data[0].votes)
        } else {
          console.warn('⚠️ No data returned from update - this is suspicious!')
        }

        setHasVoted(false)
        setVoteCount((prev: number) => Math.max(0, prev - 1))
        onVoteChange(book.id, false)

        // No refresh needed - RPC functions return updated data

      } else {
        // Check vote limit
        if (userVoteCount >= 5) {
          console.warn('User has reached maximum vote limit')
          return
        }

        // Add vote with error handling for duplicates
        const { error: insertError } = await supabase
          .from('book_votes')
          .insert([{ book_id: book.id, user_id: user.id }])

        if (insertError) {
          // Handle duplicate vote error gracefully
          if (insertError.code === '23505') { // Unique constraint violation
            console.warn('User already voted for this book')
            setHasVoted(true) // Update local state
            return
          }
          throw insertError
        }

        // Increment book votes using SQL increment to prevent race conditions
        console.log('🔺 INCREMENTING votes with SQL:', {
          bookTitle: book.title,
          bookId: book.id,
          currentUIVotes: book.votes
        })

        // Direct database update - skip RPC for now
        console.log('🔄 Starting direct database vote increment...')

        const bookUpdateResult = await supabase.rpc('increment_vote', { book_id: book.id })
        if (bookUpdateResult.data?.[0]?.new_votes !== undefined) {
          book.votes = bookUpdateResult.data[0].new_votes;
          console.log('✅ Vote incremented - New count:', bookUpdateResult.data[0].new_votes)
        }

        if (bookUpdateResult.error) {
          console.error('❌ CRITICAL: Vote increment failed!', bookUpdateResult.error)
          alert(`Database error: ${bookUpdateResult.error.message}`)
          throw bookUpdateResult.error
        }

        if (bookUpdateResult.data && bookUpdateResult.data.length > 0) {
          console.log('✅ Vote incremented successfully! New vote count:', bookUpdateResult.data[0].votes)
        } else {
          console.warn('⚠️ No data returned from update - this is suspicious!')
        }

        setHasVoted(true)
        setVoteCount((prev: number) => prev + 1)
        onVoteChange(book.id, true)

        // No refresh needed - RPC functions return updated data
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to vote. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="aspect-[2/3] w-1/3 mx-auto">
        <BookCover
          coverUrl={book.cover_url || book.original_cover_url}
          title={book.title}
          author={book.author}
          className="w-full h-full"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-gray-600 mb-2">{book.author}</p>

        {book.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{book.description}</p>
        )}

        {book.suggester_name && (
          <div className="mb-3 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
            <p className="text-xs font-medium text-blue-800 mb-1">Recommended by: {book.suggester_name}</p>
            {book.inspiration_quote && (
              <p className="text-sm text-blue-700 line-clamp-3 italic">"{book.inspiration_quote}"</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {voteCount} vote{voteCount !== 1 ? 's' : ''}
          </div>

          {user ? (
            <button
              onClick={handleVote}
              disabled={loading || checkingVote || (!hasVoted && userVoteCount >= 5)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${hasVoted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : userVoteCount >= 5
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
              {loading || checkingVote ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
              )}
              <span className="text-xs">
                {loading || checkingVote ? '...' : hasVoted ? 'Remove' : 'Vote'}
              </span>
            </button>
          ) : (
            <span className="text-xs text-gray-400">Login to vote</span>
          )}
        </div>
      </div>
    </div>
  )
}