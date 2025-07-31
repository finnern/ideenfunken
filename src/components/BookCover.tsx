import { useState } from 'react'

interface BookCoverProps {
  coverUrl: string | null
  title: string
  author: string
  className?: string
}

export default function BookCover({ coverUrl, title, author, className = "" }: BookCoverProps) {
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  if (!coverUrl || imageError) {
    return (
      <div className={`bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 flex flex-col justify-between ${className}`}>
        <div>
          <h3 className="font-bold text-sm leading-tight mb-2">{title}</h3>
          <p className="text-xs opacity-90">{author}</p>
        </div>
        <div className="text-xs opacity-75 text-right">
          📚
        </div>
      </div>
    )
  }

  return (
    <img
      src={coverUrl}
      alt={`Cover of ${title} by ${author}`}
      className={`object-cover ${className}`}
      onError={handleImageError}
    />
  )
}