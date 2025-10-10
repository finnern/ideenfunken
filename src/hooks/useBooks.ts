import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBooks() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBooks = async () => {
    try {
      console.log('📚 Fetching books...')
      setLoading(true)
      setError(null)

      // Query 1: Get all books from secure public view (masks anonymous user data)
      const { data: books, error: booksError } = await supabase
        .from('books_public')
        .select('*')

      console.log('📚 Books query result:', { books: books?.length || 0, error: booksError })

      if (booksError) throw booksError

      // Query 2: Get profile names for non-anonymous books that need names
      const booksNeedingNames = (books || []).filter(book => 
        !book.suggester_name && !book.is_anonymous && book.suggested_by
      )

      let profilesMap = new Map()
      
      if (booksNeedingNames.length > 0) {
        const userIds = [...new Set(booksNeedingNames.map(book => book.suggested_by))]
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds)

        if (!profilesError && profiles) {
          profiles.forEach(profile => {
            // Create full name from first_name + last_name, fallback to email username
            let displayName = null
            
            if (profile.first_name && profile.last_name) {
              displayName = `${profile.first_name} ${profile.last_name}`
            } else if (profile.first_name) {
              displayName = profile.first_name
            } else if (profile.last_name) {
              displayName = profile.last_name
            } else if (profile.email) {
              displayName = profile.email.split('@')[0]
            }
            
            profilesMap.set(profile.id, displayName)
          })
        }
      }

      // Merge: Populate suggester_name from profiles
      const booksWithNames = (books || []).map(book => ({
        ...book,
        suggester_name: book.suggester_name || profilesMap.get(book.suggested_by) || null
      }))

      
      console.log('📚 Sample book data with available_in_mediathek:', booksWithNames.find(b => b.title?.includes('Kleine Prinz')))
      setBooks(booksWithNames)
    } catch (err) {
      console.error('Error fetching books:', err)
      setError('Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()

    // Set up real-time subscription for books table
    const channel = supabase
      .channel('books_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'books' }, 
        (payload) => {
          console.log('Books table changed:', payload)
          fetchBooks() // Refetch when books table changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    books,
    loading,
    error,
    refetch: fetchBooks
  }
}