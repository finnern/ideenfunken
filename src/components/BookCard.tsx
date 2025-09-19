import type { Book } from '../types/index'
import BookCover from './BookCover'
import SimplifiedVoteButton from './SimplifiedVoteButton'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

interface BookCardProps {
  book: Book
}

export default function BookCard({ book }: BookCardProps) {
  const [voteCount, setVoteCount] = useState(book.votes)

  const handleShare = async () => {
    const url = `${window.location.origin}/books/${book.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `Schau dir dieses Buch an: ${book.title} von ${book.author}`,
          url
        })
      } catch {
        // ignore cancel/errors
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link kopiert!')
      } catch {
        alert('Link kopiert!')
      }
    }
  }

  const generateEmailLink = () => {
    const subject = `Bestellung: ${book.title}${book.isbn ? ` – ISBN ${book.isbn}` : ''}`
    const body = `Hallo,\n\nich interessiere mich für folgendes Buch:\n\nTitel: ${book.title}\nAutor/in: ${book.author ?? ''}\n${book.isbn ? `ISBN: ${book.isbn}\n` : ''}\n\nVielen Dank!`
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border hover:shadow-lg transition-shadow ${
      book.available_in_mediathek 
        ? 'border-library-available border-2' 
        : 'border-gray-200'
    }`}>
      <Link to={`/books/${book.id}`} className="block">
        <div className="aspect-[2/3] w-full">
          <BookCover
            coverUrl={book.cover_url || book.original_cover_url}
            title={book.title}
            author={book.author}
            className="w-full h-full"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-gray-600 mb-2">{book.author}</p>
        
        {book.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-3">{book.description}</p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <a
            href={generateEmailLink()}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            E‑Mail
          </a>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Buch teilen"
          >
            Teilen
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {voteCount} vote{voteCount !== 1 ? 's' : ''}
          </div>
          
          <SimplifiedVoteButton
            bookId={book.id}
            currentVotes={voteCount}
            onVoteChange={setVoteCount}
          />
        </div>
      </div>
    </div>
  )
}