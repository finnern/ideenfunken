import { useNavigate } from 'react-router-dom'
import Auth from '../components/Auth'

export default function Login() {
  const navigate = useNavigate()

  const handleAuthSuccess = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Ideenfunken
          </h2>
          <p className="text-gray-600">
            Join our community to vote on inspiring books
          </p>
        </div>
        
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    </div>
  )
}