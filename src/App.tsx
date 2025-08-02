import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import BookListVoting from './components/BookList-voting'
import BookSearchFixed from './components/BookSearch-fixed'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookCount, setBookCount] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Test database connection
    const testSupabase = async () => {
      try {
        const { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
        setBookCount(count)
      } catch (err) {
        console.error('Database error:', err)
      }
    }

    // Check authentication
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Auth check:', { user: session?.user?.email || 'no user', error })
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('Auth error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email || 'no user')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    testSupabase()
    checkAuth()

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Ideenfunken Clean - Step 2</h1>
      
      <div className="space-y-6">
        {/* Status indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-green-600">✅ React</h3>
            <p className="text-sm text-gray-600">Working</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-green-600">✅ Database</h3>
            <p className="text-sm text-gray-600">{bookCount} books</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-blue-600">🔐 Authentication</h3>
            <p className="text-sm text-gray-600">
              {user ? `Logged in: ${user.email}` : 'Not logged in'}
            </p>
          </div>
        </div>

        {/* Authentication section */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">🔐 Authentication Test</h2>
          
          {user ? (
            <div>
              <p className="text-green-600 mb-4">✅ You are logged in as: <strong>{user.email}</strong></p>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  console.log('Signed out')
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Please sign in to test the voting system:</p>
              <Auth onAuthSuccess={() => console.log('Auth success!')} />
            </div>
          )}
        </div>

        {/* Book Search - Add New Books */}
        {user && (
          <div className="mb-8">
            <BookSearchFixed 
              user={user} 
              onBookAdded={() => {
                // Refresh the book list when a new book is added
                setRefreshKey(prev => prev + 1)
              }} 
            />
          </div>
        )}

        {/* Book Voting Interface */}
        {user && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">📚 Book Voting Interface</h2>
            <p className="text-gray-600 mb-6">
              Vote for your favorite books! You have 5 votes total, maximum 1 vote per book.
              The top 10 books will be added to the local library.
            </p>
            <BookListVoting key={refreshKey} user={user} />
          </div>
        )}
      </div>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  )
}

export default App