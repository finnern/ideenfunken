import { useState, useEffect } from 'react'
import BookCover from './BookCover'
import { supabase } from '../lib/supabase'
import { Heart, Loader2, ChevronDown, ChevronUp, Mail, Share2 } from 'lucide-react'
import { toast } from 'sonner'

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
    // Don't expand if clicking on vote, email or share buttons
    const target = e.target as HTMLElement
    if (
      target.closest('button[data-vote-button]') ||
      target.closest('a[data-email-button]') ||
      target.closest('button[data-share-button]')
    ) {
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

  const buildShareUrl = () => {
    const base = `${window.location.origin}${window.location.pathname}`
    const params = new URLSearchParams()
    if (book.isbn && String(book.isbn).trim().length > 0) {
      params.set('isbn', String(book.isbn).replace(/[-\s]/g, ''))
    } else {
      params.set('bookId', book.id)
    }
    return `${base}?${params.toString()}`
  }

  const handleShare = async () => {
    const url = buildShareUrl()
    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: `Schau dir dieses Buch an: ${book.title} von ${book.author}`,
          url
        })
        return
      }
    } catch {
      // ignore share cancellation
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link kopiert!')
    } catch {
      alert('Link kopiert!')
    }
  }

  return (
    <div 
      className={`rounded-lg shadow-md overflow-hidden border transition-all duration-300 ease-in-out cursor-pointer ${
        isExpanded 
          ? 'bg-yellow-50 border-yellow-300 shadow-lg' 
          : 'bg-white border-gray-200 hover:shadow-lg hover:border-yellow-300'
      }`}
      onClick={handleCardClick}
    >
      {/* Book Cover - Better aspect ratio */}
      <div className="aspect-[2/3] w-1/3 mx-auto">
        <BookCover
          coverUrl={book.cover_url || book.original_cover_url}
          title={book.title}
          author={book.author}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2 min-h-[3.5rem]">{book.title}</h3>
            <p className="text-gray-600">{book.author}</p>
          </div>
          {(book.description || book.inspiration_quote) && (
            <div className="ml-2 text-yellow-500">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        <div className="transition-all duration-300 ease-in-out">
          {book.description && (
            <p className={`text-sm text-gray-700 mb-3 transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {book.description}
            </p>
          )}

          {book.suggester_name && (
            <div className="mb-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-200 transition-all duration-300">
              <p className="font-bold text-yellow-900 mb-1" style={{fontSize: '1.1rem'}}>
                Empfohlen von: {book.suggester_name}
              </p>
              {book.inspiration_quote && (
                <p className={`text-sm text-yellow-700 italic transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                  "{book.inspiration_quote}"
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {voteCount} {voteCount !== 1 ? 'Stimmen' : 'Stimme'}
          </div>

          <div className="flex items-center gap-2">
            {/* Email Button */}
            <a
              data-email-button
              href={generateEmailLink()}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500 text-white hover:bg-green-600 transition-colors"
              title="Buch per Email bestellen"
            >
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </a>

            {/* Share Button (only when expanded) */}
            {isExpanded && (
              <button
                data-share-button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                title="Buch-Link teilen"
              >
                <Share2 className="w-3 h-3" />
                <span>Teilen</span>
              </button>
            )}

            {/* Vote Button */}
            {user ? (
              <button
                data-vote-button
                onClick={handleVote}
                disabled={loading || checkingVote || (!hasVoted && userVoteCount >= 5)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${hasVoted
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : userVoteCount >= 5
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600'
                  }`}
              >
                {loading || checkingVote ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Heart className={`w-3 h-3 ${hasVoted ? 'fill-current' : ''}`} />
                )}
                <span className="text-xs">
                  {loading || checkingVote ? '...' : hasVoted ? 'Entfernen' : 'Stimmen'}
                </span>
              </button>
            ) : (
              <span className="text-xs text-gray-400">Anmelden zum Stimmen</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}