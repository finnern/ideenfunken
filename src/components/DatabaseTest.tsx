import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export default function DatabaseTest() {
  const [bookCount, setBookCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true)
        setError(null)

        // Test basic connection by counting books
        const { count, error } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })

        if (error) throw error

        setBookCount(count)
        toast.success('Database connection successful!')
      } catch (err: any) {
        console.error('Database test error:', err)
        setError(err.message)
        toast.error('Database connection failed')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-700">Testing database connection...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p className="text-red-700">Database Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <p className="text-green-700">
        ✅ Database connected successfully! Found {bookCount} books in the database.
      </p>
    </div>
  )
}