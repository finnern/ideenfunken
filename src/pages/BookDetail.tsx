import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Book } from '../types'
import BookCover from '../components/BookCover'
import SimplifiedVoteButton from '../components/SimplifiedVoteButton'
import { toast } from 'sonner'

export default function BookDetail() {
  const { bookId } = useParams()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState<number>(0)

  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (!bookId) {
          setError('Ungültige Buch-ID')
          setLoading(false)
          return
        }
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .maybeSingle()
        if (error) throw error
        if (!data) {
          setError('Buch nicht gefunden')
        } else {
          setBook(data as Book)
          setVoteCount((data as Book).votes)
        }
      } catch (e: any) {
        setError(e.message || 'Fehler beim Laden des Buchs')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [bookId])

  useEffect(() => {
    if (!book) return
    const title = `${book.title} – Ideenfunken`
    document.title = title

    const description = `Schau dir dieses Buch an: ${book.title} von ${book.author}`
    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }
    ensureMeta('description', description)

    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!linkEl) {
      linkEl = document.createElement('link')
      linkEl.setAttribute('rel', 'canonical')
      document.head.appendChild(linkEl)
    }
    linkEl.setAttribute('href', window.location.href)
  }, [book])

  const handleShare = async () => {
    if (!book) return
    const url = `${window.location.origin}/books/${book.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `Schau dir dieses Buch an: ${book.title} von ${book.author}`,
          url
        })
      } catch {
        // ignore
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
    if (!book) return '#'
    const subject = `Bestellung: ${book.title}${book.isbn ? ` – ISBN ${book.isbn}` : ''}`
    const body = `Hallo,\n\nich interessiere mich für folgendes Buch:\n\nTitel: ${book.title}\nAutor/in: ${book.author ?? ''}\n${book.isbn ? `ISBN: ${book.isbn}\n` : ''}\n\nVielen Dank!`
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-2">Buch</h1>
        <p className="text-red-600">{error ?? 'Unbekannter Fehler'}</p>
        <div className="mt-4">
          <Link to="/" className="underline">Zurück zur Übersicht</Link>
        </div>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link to="/" className="underline">Start</Link>
        <span className="mx-2">/</span>
        <span>{book.title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-gray-700">von {book.author}</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="md:col-span-1">
          <div className="aspect-[2/3] w-full max-w-sm mx-auto">
            <BookCover
              coverUrl={book.cover_url || book.original_cover_url}
              title={book.title}
              author={book.author}
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">{voteCount} Stimmen</span>
            <SimplifiedVoteButton
              bookId={book.id}
              currentVotes={voteCount}
              onVoteChange={setVoteCount}
            />
          </div>

          {book.isbn && (
            <p className="text-sm text-gray-600 mb-4">ISBN: {book.isbn}</p>
          )}

          {book.inspiration_quote && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-r-lg shadow-sm">
              <p className="text-lg font-medium text-gray-800 mb-2">💡 Inspirations-Zitat</p>
              <p className="text-gray-700 italic leading-relaxed">&quot;{book.inspiration_quote}&quot;</p>
              {book.suggester_name && !book.is_anonymous && (
                <p className="text-sm text-gray-600 mt-3">— {book.suggester_name}</p>
              )}
            </div>
          )}

          {book.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Beschreibung</h2>
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">{book.description}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={generateEmailLink()}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              E‑Mail
            </a>
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Teilen
            </button>
          </div>
        </div>
      </section>
    </article>
  )
}
