import React, { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { LogIn, LogOut, User as UserIcon, Mail } from 'lucide-react'

export const AuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailAuth, setShowEmailAuth] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
      setShowEmailAuth(false)
      setEmail('')
      setPassword('')
    } catch (error: any) {
      console.error('Auth error:', error)
      alert(error.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Google auth error:', error)
      // If Google OAuth is not configured, fall back to email auth
      if (error.message?.includes('provider') || error.message?.includes('not enabled')) {
        console.warn('Google OAuth not configured, using email authentication')
        setShowEmailAuth(true)
      } else {
        alert('Google sign-in failed. Please try email authentication.')
        setShowEmailAuth(true)
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
  }

  if (loading) {
    return (
      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    )
  }

  if (user) {
    return (
      <motion.div 
        className="flex items-center space-x-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-2">
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border-2 border-white/30"
            />
          ) : (
            <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="hidden md:block">
            <span className="text-sm font-medium text-gray-900">
              {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
            <p className="text-xs text-gray-600">Connected to Supabase</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span>Sign Out</span>
        </button>
      </motion.div>
    )
  }

  if (showEmailAuth) {
    return (
      <motion.div 
        className="flex items-center space-x-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-lg p-4 shadow-lg">
          <form onSubmit={signInWithEmail} className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEmailAuth(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
              minLength={6}
            />
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={authLoading}
                className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
              >
                {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="px-3 py-2 text-primary-600 text-sm border border-primary-300 rounded hover:bg-primary-50"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="flex items-center space-x-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-right hidden md:block">
        <span className="text-sm text-gray-600">Demo Mode</span>
        <p className="text-xs text-gray-500">Connect for real-time data</p>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => setShowEmailAuth(true)}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Mail className="w-3 h-3" />
          <span>Email</span>
        </button>
        
        <button
          onClick={signInWithGoogle}
          disabled={authLoading}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <LogIn className="w-3 h-3" />
          <span>{authLoading ? 'Loading...' : 'Google'}</span>
        </button>
      </div>
    </motion.div>
  )
}