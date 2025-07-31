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
    const checkVote = async () => {
      if (!user) {
        setCheckingVote(false)
        return
      }

      try {
        const { data } = await supabase
          .from('book_votes')
          .select('id')
          .eq('book_id', book.id)
          .eq('user_id', user.id)
          .single()

        setHasVoted(!!data)
      } catch (err) {
        // No vote found is expected
        setHasVoted(false)
      } finally {
        setCheckingVote(false)
      }
    }

    checkVote()
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

        // Decrement book votes
        const { error: updateError } = await supabase
          .from('books')
          .update({ votes: Math.max(0, voteCount - 1) })
          .eq('id', book.id)

        if (updateError) throw updateError

        setHasVoted(false)
        setVoteCount(prev => Math.max(0, prev - 1))
        onVoteChange(book.id, false)

      } else {
        // Check vote limit
        if (userVoteCount >= 5) {
          alert('You have reached the maximum of 5 votes')
          return
        }

        // Add vote
        const { error: insertError } = await supabase
          .from('book_votes')
          .insert([{ book_id: book.id, user_id: user.id }])

        if (insertError) throw insertError

        // Increment book votes
        const { error: updateError } = await supabase
          .from('books')
          .update({ votes: voteCount + 1 })
          .eq('id', book.id)

        if (updateError) throw updateError

        setHasVoted(true)
        setVoteCount(prev => prev + 1)
        onVoteChange(book.id, true)
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
      <div className="aspect-[2/3] w-full">
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
          <p className="text-sm text-gray-700 mb-3 line-clamp-3">{book.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {voteCount} vote{voteCount !== 1 ? 's' : ''}
          </div>
          
          {user ? (
            <button
              onClick={handleVote}
              disabled={loading || checkingVote || (!hasVoted && userVoteCount >= 5)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                hasVoted
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