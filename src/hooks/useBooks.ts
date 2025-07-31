import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('votes', { ascending: false })

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
  }, [])

  return {
    books,
    loading,
    error,
    refetch: fetchBooks
  }
}