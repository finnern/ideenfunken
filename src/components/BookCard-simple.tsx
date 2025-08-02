import { useState, useEffect } from 'react'
import BookCover from './BookCover'
import { supabase } from '../lib/supabase'
import { Heart, Loader2, ChevronDown, ChevronUp, Mail } from 'lucide-react'

interface BookCardProps {
  book: any
  user: any
  userVoteCount: number
  onVoteChange: (bookId: string, increment: boolean) => void
  isExpanded: boolean
  onExpand: () => void
}

export default function BookCard({ book, user, userVoteCount, onVoteChange, isExpanded, onExpand }: BookCardProps) {
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

        const bookUpdateResult = await supabase.rpc('decrement_vote', { book_id: book.id })

        if (bookUpdateResult.data?.[0]?.new_votes !== undefined) {
          book.votes = bookUpdateResult.data[0].new_votes;
        }

        if (bookUpdateResult.error) {
          throw bookUpdateResult.error
        }

        setHasVoted(false)
        setVoteCount((prev: number) => Math.max(0, prev - 1))
        onVoteChange(book.id, false)

      } else {
        // Check vote limit
        if (userVoteCount >= 5) {
          return
        }

        // Add vote
        const { error: insertError } = await supabase
          .from('book_votes')
          .insert([{ book_id: book.id, user_id: user.id }])

        if (insertError) {
          if (insertError.code === '23505') {
            setHasVoted(true)
            return
          }
          throw insertError
        }

        const bookUpdateResult = await supabase.rpc('increment_vote', { book_id: book.id })
        if (bookUpdateResult.data?.[0]?.new_votes !== undefined) {
          book.votes = bookUpdateResult.data[0].new_votes;
        }

        if (bookUpdateResult.error) {
          throw bookUpdateResult.error
        }

        setHasVoted(true)
        setVoteCount((prev: number) => prev + 1)
        onVoteChange(book.id, true)
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on vote button or email button
    if ((e.target as HTMLElement).closest('button[data-vote-button]') || 
        (e.target as HTMLElement).closest('a[data-email-button]')) {
      return
    }
    onExpand()
  }

  const generateEmailLink = () => {
    const subject = `Buchbestellung über Ideenschmiede App: ${book.title} by ${book.author}`
    const body = `Liebe Buchlese Schramberg,

Ich möchte gerne folgendes Buch bestellen:
Titel: ${book.title}
Autor: ${book.author}${book.isbn ? `\nISBN: ${book.isbn}` : ''}

Vielen Dank und beste Grüße`

    return `mailto:schramberg@buchlese.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div 
      className={`rounded border transition-all duration-300 cursor-pointer ${
        isExpanded 
          ? 'bg-yellow-50 border-yellow-300 shadow-md' 
          : 'bg-white border-gray-200 hover:border-yellow-300'
      }`}
      onClick={handleCardClick}
      style={{ maxHeight: isExpanded ? 'none' : '200px' }}
    >
      {/* Compact Cover - 80x120px */}
      <div className="w-20 h-28 mx-auto pt-2">
        <BookCover
          coverUrl={book.cover_url || book.original_cover_url}
          title={book.title}
          author={book.author}
          className="w-full h-full object-cover rounded-sm"
        />
      </div>

      {/* Compact Content */}
      <div className="p-2">
        {/* Title & Author - Minimal */}
        <div className="mb-2">
          <h3 className="text-xs font-semibold line-clamp-2 leading-tight mb-1">{book.title}</h3>
          <p className="text-xs text-gray-600 line-clamp-1">{book.author}</p>
          
          {/* Expand Indicator */}
          {(book.description || book.inspiration_quote) && (
            <div className="text-center mt-1">
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 mx-auto text-yellow-600" />
              ) : (
                <ChevronDown className="w-3 h-3 mx-auto text-yellow-600" />
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 pt-2 mt-2">
            {book.description && (
              <p className="text-xs text-gray-700 mb-2 line-clamp-3">{book.description}</p>
            )}

            {book.suggester_name && (
              <div className="mb-2 p-2 bg-yellow-50 rounded text-xs">
                <p className="font-medium text-yellow-800 mb-1">
                  Empfohlen von: {book.suggester_name}
                </p>
                {book.inspiration_quote && (
                  <p className="text-yellow-700 italic line-clamp-2">
                    "{book.inspiration_quote}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-2">
          {/* Vote Count */}
          <span className="text-xs text-gray-500">{voteCount}</span>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Email Button */}
            <a
              data-email-button
              href={generateEmailLink()}
              className="p-1 text-green-600 hover:text-green-700"
              title="Email bestellen"
            >
              <Mail className="w-3 h-3" />
            </a>

            {/* Vote Button */}
            {user && (
              <button
                data-vote-button
                onClick={handleVote}
                disabled={loading || checkingVote || (!hasVoted && userVoteCount >= 5)}
                className={`p-1 rounded transition-colors ${hasVoted
                    ? 'text-red-500 hover:text-red-600'
                    : userVoteCount >= 5
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-yellow-500 hover:text-yellow-600'
                  }`}
                title={hasVoted ? 'Stimme entfernen' : 'Stimmen'}
              >
                {loading || checkingVote ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}