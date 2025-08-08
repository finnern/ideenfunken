import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, LogOut, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'
import makeItInSchrambergLogo from '../assets/images/make-it-in-schramberg-logo.jpg'
import kiImpactGroupLogo from '../assets/images/Ki-Impact-Group-Logo.png'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Error logging out')
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16 relative">
          {/* Left logo */}
          <div className="flex items-center">
            <img 
              src={makeItInSchrambergLogo}
              alt="Make it in Schramberg" 
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* Centered title */}
          <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
            <BookOpen className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-800">Ideenfunken</h1>
          </div>
          
          {/* Right side - logo and user info */}
          <div className="flex items-center space-x-4 ml-auto">
            <img 
              src={kiImpactGroupLogo}
              alt="KI Impact Group" 
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Not logged in</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}