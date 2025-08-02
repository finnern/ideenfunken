import type { Book } from '../types/index'
import BookCover from './BookCover'
import SimplifiedVoteButton from './SimplifiedVoteButton'
import { useState } from 'react'

interface BookCardProps {
  book: Book
}

export default function BookCard({ book }: BookCardProps) {
  const [voteCount, setVoteCount] = useState(book.votes)

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