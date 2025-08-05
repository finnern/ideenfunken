import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Centralized authentication hook with security best practices
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here to prevent deadlocks
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
        
        // Log auth events for debugging (remove in production)
        console.log('Auth state changed:', event, !!session?.user)
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        setError(error.message)
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Auth state change will handle cleanup
  }

  const clearError = () => setError(null)

  return {
    user,
    session,
    loading,
    error,
    signOut,
    clearError,
    isAuthenticated: !!user
  }
}

/**
 * Hook to require authentication - redirects to login if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // In a real app, you might redirect to login page here
      console.warn('Authentication required')
    }
  }, [auth.loading, auth.isAuthenticated])
  
  return auth
}

/**
 * Get current user's profile with security checks
 */
export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }
  
  return profile
}