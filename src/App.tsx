import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import Auth from './components/Auth'
import BookListVoting from './components/BookList-voting'
import BookSearchFixed from './components/BookSearch-fixed'

// Logo component with fallback - responsive sizing for prominence
const LogoWithFallback = ({ src, alt, fallbackText }: { src: string, alt: string, fallbackText: string }) => {
  const [imageError, setImageError] = useState(false)
  
  if (imageError) {
    return (
      <div className="h-8 md:h-10 flex items-center px-2 md:px-3 bg-white bg-opacity-20 rounded text-xs md:text-sm font-medium">
        {fallbackText}
      </div>
    )
  }
  
  return (
    <img 
      src={src}
      alt={alt}
      className="h-8 md:h-10 object-contain opacity-90 bg-white rounded px-1"
      onError={() => setImageError(true)}
    />
  )
}

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
      {/* Professional Header with Sponsor Logos */}
      <header className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-2">
        <div className="max-w-7xl mx-auto">
          {/* Main Header Row with Logos and Title */}
          <div className="flex items-center justify-between mb-1 gap-2 md:gap-4">
            {/* Left Logo - KI Impact Group */}
            <div className="flex-shrink-0">
              <LogoWithFallback 
                src="/assets/images/KI-Impact-Group-Logo.png"
                alt="KI Impact Group"
                fallbackText="KI Impact"
              />
            </div>
            
            {/* Center - Main Title */}
            <div className="flex-1 text-center px-2">
              <h1 className="text-lg md:text-2xl font-bold leading-tight">
                IDEENFUNKEN | SCHRAMBERGS KREATIVE LESEWELT
              </h1>
            </div>
            
            {/* Right Logo - Make it in Schramberg */}
            <div className="flex-shrink-0">
              <LogoWithFallback 
                src="/assets/images/make-it-in-schramberg-logo.png"
                alt="Make it in Schramberg"
                fallbackText="Make it in Schramberg"
              />
            </div>
          </div>
          
          {/* Controls Row */}
          <div className="flex items-center justify-center gap-4 text-xs">
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
        </div>
      </header>

      {/* Welcome Invitation Text */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center">
          <p className="text-gray-700 text-sm md:text-base font-medium">
            Eine Einladung an Schramberg und Umgebung: Teilt innovative Bücher, die euer Leben verbessert haben!
          </p>
        </div>
      </div>

      {/* Collapsible Book Suggestion Banner */}
      {user && (
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4">
            {/* Compact Banner */}
            <div className="text-center">
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
              
              {/* Explanation Text */}
              <p className="text-xs text-gray-600 pb-2 px-4">
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

      {/* Thanks/Credits Section */}
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