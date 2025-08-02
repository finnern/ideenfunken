import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { TrendingUp, Clock, Search } from 'lucide-react'
import Auth from './components/Auth'
import BookListVoting from './components/BookList-voting'
import BookSearchFixed from './components/BookSearch-fixed'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sortBy, setSortBy] = useState<'votes' | 'latest'>('votes')
  const [userVoteCount, setUserVoteCount] = useState(0)

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
      {/* Ultra-Compact Header - Single Line */}
      <header className="bg-yellow-400 text-black px-4 py-1 text-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold">Ideenfunken</span>
            <span>|</span>
            <span>Schrambergs kreative Lesewelt</span>
          </div>

          {/* Center: Book Input (if logged in) */}
          {user && (
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4" />
              <div className="flex-1">
                <BookSearchFixed 
                  user={user} 
                  onBookAdded={() => setRefreshKey(prev => prev + 1)} 
                />
              </div>
            </div>
          )}

          {/* Right: Vote Count & Auth */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {user ? (
              <>
                <span className="font-medium">{userVoteCount}/5 Stimmen</span>
                <button
                  onClick={async () => await supabase.auth.signOut()}
                  className="underline hover:no-underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <Auth onAuthSuccess={() => console.log('Auth success!')} />
            )}
          </div>
        </div>
      </header>

      {/* Immediate Books Grid */}
      {user ? (
        <main className="max-w-7xl mx-auto px-4 py-2">
          {/* Sort Pills - Top Right */}
          <div className="flex justify-end mb-2">
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy('votes')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sortBy === 'votes'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <TrendingUp className="w-3 h-3 inline mr-1" />
                Stimmen
              </button>
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                Neueste
              </button>
            </div>
          </div>

          {/* Books Grid - Immediate Start */}
          <BookListVoting 
            key={refreshKey} 
            user={user} 
            sortBy={sortBy}
            userVoteCount={userVoteCount}
            onVoteChange={(increment) => {
              setUserVoteCount(prev => increment ? prev + 1 : Math.max(0, prev - 1))
            }}
          />
        </main>
      ) : (
        /* Login Prompt */
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