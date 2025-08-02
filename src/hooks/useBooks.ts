import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBooks() {
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('books')
        .select('*')

      if (error) throw error

      setBooks(data || [])
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