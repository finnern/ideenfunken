import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Heart, Loader2 } from 'lucide-react'

interface SimplifiedVoteButtonProps {
  bookId: string
  currentVotes: number
  onVoteChange?: (newVoteCount: number) => void
}

export default function SimplifiedVoteButton({ 
  bookId, 
  currentVotes, 
  onVoteChange 
}: SimplifiedVoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userVoteCount, setUserVoteCount] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuthAndVotes = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Check if user has voted for this book
      const { data: existingVote } = await supabase
        .from('book_votes')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .single()

      setHasVoted(!!existingVote)

      // Count user's total votes
      const { count } = await supabase
        .from('book_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setUserVoteCount(count || 0)
    }

    checkAuthAndVotes()
  }, [bookId])

  const handleVote = async () => {
    if (!user) {
      toast.error('Please log in to vote')
      return
    }

    if (loading) return

    setLoading(true)

    try {
      if (hasVoted) {
        // Use secure remove vote function
        const { data, error } = await supabase.rpc('secure_remove_vote', {
          book_id_param: bookId
        })

        if (error) {
          throw new Error(error.message)
        }

        if (data) {
          setHasVoted(false)
          setUserVoteCount(prev => prev - 1)
          onVoteChange?.(currentVotes - 1)
          toast.success('Vote removed')
        }

      } else {
        // Use secure add vote function
        const { data, error } = await supabase.rpc('secure_add_vote', {
          book_id_param: bookId
        })

        if (error) {
          throw new Error(error.message)
        }

        if (data) {
          setHasVoted(true)
          setUserVoteCount(prev => prev + 1)
          onVoteChange?.(currentVotes + 1)
          toast.success('Vote added')
        }
      }
    } catch (error: any) {
      console.error('Error voting:', error)
      
      // Handle specific error messages from secure functions
      const errorMessage = error.message || 'Failed to vote. Please try again.'
      
      if (errorMessage.includes('No votes remaining')) {
        toast.error('You have no votes remaining')
      } else if (errorMessage.includes('Vote already exists')) {
        toast.error('You have already voted for this book')
      } else if (errorMessage.includes('Cannot vote on own suggestion')) {
        toast.error('You cannot vote on your own book suggestion')
      } else if (errorMessage.includes('Vote not found')) {
        toast.error('Vote not found to remove')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
      >
        <Heart className="w-4 h-4" />
        <span>Login to vote</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading || (!hasVoted && userVoteCount >= 10)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        hasVoted
          ? 'bg-red-500 text-white hover:bg-red-600'
          : userVoteCount >= 10
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
      )}
      <span>
        {loading ? 'Loading...' : hasVoted ? 'Remove Vote' : 'Vote'}
      </span>
      <span className="text-sm opacity-75">
        ({userVoteCount}/10)
      </span>
    </button>
  )
}