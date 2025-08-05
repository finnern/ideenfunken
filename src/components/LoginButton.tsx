import { useState } from 'react'
import Auth from './Auth'

interface LoginButtonProps {
  onAuthSuccess?: () => void
}

export default function LoginButton({ onAuthSuccess }: LoginButtonProps) {
  const [showAuth, setShowAuth] = useState(false)

  if (showAuth) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Anmelden</h2>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <Auth 
              onAuthSuccess={() => {
                onAuthSuccess?.()
                setShowAuth(false)
              }} 
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowAuth(true)}
      className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm font-medium hover:bg-opacity-30 transition-colors"
    >
      Login
    </button>
  )
}