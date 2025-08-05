import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Loader2, Mail, Lock } from 'lucide-react'
import { validateEmail, validatePassword, rateLimit } from '../lib/security'

interface AuthProps {
  onAuthSuccess?: () => void
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Rate limiting check
    const rateLimitKey = `auth:${email}`
    if (!rateLimit.isAllowed(rateLimitKey, 5, 300000)) { // 5 attempts per 5 minutes
      toast.error('Too many attempts. Please wait before trying again.')
      return
    }
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error)
      return
    }
    
    // Validate password for signup
    if (!isLogin) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.error)
        return
      }
    }
    
    // For login, just check if password exists
    if (isLogin && !password) {
      toast.error('Password is required')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        toast.success('Logged in successfully!')
        // Reset rate limit on successful login
        rateLimit.reset(rateLimitKey)
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        })
        if (error) throw error
        toast.success('Account created! Please check your email to verify.')
        // Reset rate limit on successful signup
        rateLimit.reset(rateLimitKey)
      }
      
      onAuthSuccess?.()
    } catch (error: any) {
      console.error('Auth error:', error)
      
      // Handle specific error messages
      let errorMessage = 'Authentication failed'
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account'
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists'
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'Password must be at least 6 characters long'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isLogin ? 'Login' : 'Sign Up'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      
      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-500 hover:underline text-sm"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  )
}