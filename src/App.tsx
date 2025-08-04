import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import Auth from './components/Auth'
import BookListVoting from './components/BookList-voting'
import BookSearchFixed from './components/BookSearch-fixed'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [userVoteCount, setUserVoteCount] = useState(0)
  const [showBookSuggestion, setShowBookSuggestion] = useState(false)

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
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
      setUser(session?.user ?? null)
      setLoading(false)
    })

    checkAuth()

    return () => subscription.unsubscribe()
  }, [])

  // Get user vote count
  useEffect(() => {
    const getUserVoteCount = async () => {
      if (!user) return

      try {
        const { count, error } = await supabase
          .from('book_votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        setUserVoteCount(error ? 0 : (count || 0))
      } catch (err) {
        console.error('Error getting vote count:', err)
        setUserVoteCount(0)
      }
    }

    getUserVoteCount()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Compact Yellow Header - 3 Lines (~80px max) */}
      <header className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-1" style={{maxHeight: '80px'}}>
        <div className="max-w-7xl mx-auto">
          {/* Line 1: Brand */}
          <div className="text-center mb-0.5">
            <h1 className="text-lg font-bold">Ideenfunken | Schrambergs kreative Lesewelt</h1>
          </div>
          
          {/* Line 2: Controls */}
          <div className="flex items-center justify-center gap-4 mb-1 text-xs">
            {user ? (
              <>
                <span className="font-medium">{userVoteCount}/5 Stimmen</span>
                <span>|</span>
                <button
                  onClick={async () => await supabase.auth.signOut()}
                  className="underline hover:no-underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span>Anmelden zum Abstimmen:</span>
                <Auth onAuthSuccess={() => console.log('Auth success!')} />
              </div>
            )}
          </div>
          
          {/* Line 3: Logos */}
          <div className="flex items-center justify-center gap-4">
            <img 
              src="/src/assets/images/make-it-in-schramberg-logo.jpg" 
              alt="Make it in Schramberg" 
              className="h-5 object-contain"
            />
            <img 
              src="/src/assets/images/KI-Impact-Group-Logo.png" 
              alt="KI Impact Group" 
              className="h-5 object-contain"
            />
          </div>
        </div>
      </header>

      {/* Collapsible Book Suggestion Banner */}
      {user && (
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4">
            {/* Compact Banner */}
            <button
              onClick={() => setShowBookSuggestion(!showBookSuggestion)}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-800 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Kreative Bücher vorschlagen</span>
              {showBookSuggestion ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Expandable Form */}
            {showBookSuggestion && (
              <div className="pb-4">
                <BookSearchFixed 
                  user={user} 
                  onBookAdded={() => {
                    setRefreshKey(prev => prev + 1)
                    setShowBookSuggestion(false) // Auto-collapse after adding
                  }} 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Start Books Immediately */}
      {user ? (
        <main className="max-w-7xl mx-auto px-4 py-2">
          <BookListVoting key={refreshKey} user={user} />
        </main>
      ) : (
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <h2 className="text-xl font-bold mb-4">Login erforderlich</h2>
          <p className="text-gray-600 mb-6">Melde dich an, um für Bücher zu stimmen.</p>
          <Auth onAuthSuccess={() => console.log('Auth success!')} />
        </div>
      )}
      
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