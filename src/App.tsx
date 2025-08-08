import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { Plus, ChevronDown, ChevronUp, TrendingUp, Clock } from 'lucide-react'
import LoginButton from './components/LoginButton'
import BookListVoting from './components/BookList-voting'
import BookSearchFixed from './components/BookSearch-fixed'
import HeroSlim from './components/HeroSlim'
import { VoteCounterBadge } from './components/VoteCounterBadge'
import AboutIdeenfunken from './components/AboutIdeenfunken'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [userVoteCount, setUserVoteCount] = useState(0)
  const [showBookSuggestion, setShowBookSuggestion] = useState(false)
  const [sortBy, setSortBy] = useState<'votes' | 'latest'>('votes')

  useEffect(() => {
    console.log('🔍 Initializing auth...')
    
    // Check authentication
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking existing session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 Session found:', !!session?.user)
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('❌ Auth error:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 Auth state changed:', event, !!session?.user)
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
      {/* Slim Hero Section */}
      <HeroSlim 
        remainingVotes={5 - userVoteCount}
        onSuggestClick={() => {
          setShowBookSuggestion(true);
          // Scroll to suggestion section after a brief delay
          setTimeout(() => {
            const suggestSection = document.querySelector('[data-suggest-section]');
            if (suggestSection) {
              suggestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }}
      />

      {/* Auth Controls for Non-Logged Users */}
      {!user && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span>Anmelden zum Abstimmen und Vorschlagen:</span>
              <LoginButton onAuthSuccess={() => console.log('Auth success!')} />
            </div>
          </div>
        </div>
      )}

      {/* User Controls for Logged Users */}
      {user && (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="font-medium">{userVoteCount}/5 Stimmen verwendet</span>
              <span>|</span>
              <button
                onClick={async () => await supabase.auth.signOut()}
                className="underline hover:no-underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Book Suggestion Banner */}
      {user && (
        <div className="bg-yellow-100 border-b border-yellow-200" data-suggest-section>
          <div className="max-w-7xl mx-auto px-4">
            {/* Compact Banner */}
            <div className="text-center">
              <button
                onClick={() => setShowBookSuggestion(!showBookSuggestion)}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-800 hover:text-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Kreative Bücher vorschlagen</span>
                {showBookSuggestion ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {/* Purpose Explanation */}
              <p className="text-sm text-gray-600 pb-3 px-4">
                Warum wir das machen: Gemeinsam entdecken wir Bücher, die inspirieren und neue Perspektiven eröffnen
              </p>
            </div>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user && <VoteCounterBadge remaining={5 - userVoteCount} />}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('votes')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === 'votes'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Stimmen
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                sortBy === 'latest'
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Neueste
            </button>
          </div>
        </div>


        {/* Books Grid */}
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

      {/* About Section */}
      <AboutIdeenfunken />

      {/* Credits Section */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 leading-relaxed">
              Herzlichen Dank an <strong>Tobias Hilgert</strong> und die <strong>Mediathek</strong> sowie die <strong>Stadt Schramberg</strong> fürs Mitmachen und die Unterstützung dieser Initiative!
            </p>
          </div>
        </div>
      </footer>
      
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