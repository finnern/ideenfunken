import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { Plus, ChevronDown, ChevronUp, TrendingUp, Clock } from 'lucide-react'
import LoginButton from './components/LoginButton'
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
      {/* Professional Header with Sponsor Logos */}
      <header className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-3">
        <div className="max-w-7xl mx-auto">
          {/* Main Header Row with Logos and Title */}
          <div className="flex items-center justify-between mb-2 gap-2 md:gap-4">
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
              <h1 className="text-xl md:text-3xl font-bold leading-tight">
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
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href="#about-section" className="underline hover:no-underline">Über Ideenfunken</a>
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
                <span>Anmelden zum Abstimmen und Vorschlagen:</span>
                <LoginButton onAuthSuccess={() => console.log('Auth success!')} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Welcome Invitation Text */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-gray-700 text-base md:text-lg font-medium">
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
        <div className="flex justify-end mb-4">
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

        {/* Login Prompt for Non-Logged Users */}
        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-center text-blue-800">
              <strong>Hinweis:</strong> Du kannst alle Bücher durchstöbern. 
              <span className="ml-2">
                <LoginButton onAuthSuccess={() => console.log('Auth success!')} />
              </span>
              {" "}zum Abstimmen und Bücher vorschlagen.
            </p>
          </div>
        )}

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
      <footer className="bg-yellow-100 border-t border-yellow-200 mt-8">
        <section id="about-section" className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-semibold mb-4">Über Ideenfunken</h2>

          <p className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 p-4"><strong>Herzlichen Dank</strong> an die Firma Simon, die Stadt Schramberg mit ihrer Mediathek sowie die Initiative „Make it in Schramberg” für die Unterstützung unserer Leseinitiative „Ideenfunken”.</p>

          <p className="mb-3">Diese Idee entstand aus einer inspirierenden Unterhaltung im Rahmen der <strong>KI-Impact Workshops</strong> – mit dem Ziel, den Blick auf Veränderung in unserer Region positiv zu gestalten.</p>

          <p className="mb-3">Mit den empfohlenen Büchern möchten wir Menschen erreichen, ihre Kreativität zu entfalten, innovativer zu denken, die Augen für neue Möglichkeiten zu öffnen – und sich die Erlaubnis zu geben, einfach mal etwas Neues auszuprobieren.</p>

          <p className="mb-8 rounded-md border border-yellow-200 bg-yellow-50 p-4"><strong>Ideenfunken</strong> möchte dazu beitragen, diesen Mut und diese Offenheit in Schramberg und den umliegenden Gemeinden zu stärken – und eine Bewegung zu fördern, in der Menschen ermutigt werden, Neues auszuprobieren und wissen, dass eine Gemeinschaft hinter ihnen steht, die ihnen hilft, erfolgreich zu sein.</p>

          <h3 className="text-xl font-semibold mb-2">Wie funktioniert es?</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Schramberger</strong> schlagen Bücher vor, die helfen, kreativer, innovativer und offener zu werden.</li>
            <li>Alle stimmen für ihre Favoriten ab – die <strong>Top 10</strong> werden von der Mediathek angeschafft.</li>
            <li>Wer nicht warten möchte: Klicke beim gewünschten Buch auf den <strong>E‑Mail</strong>-Button. Es wird automatisch eine E‑Mail mit den Buchdetails vorformuliert, die du nach Bedarf <strong>anpassen und senden</strong> kannst.</li>
          </ol>
        </section>
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