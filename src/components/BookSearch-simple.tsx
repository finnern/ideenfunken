import { useState } from 'react'
import { Plus, Search } from 'lucide-react'

interface BookSearchProps {
  user: any
  onBookAdded?: () => void
}

export default function BookSearchSimple({ user, onBookAdded }: BookSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Plus className="w-6 h-6 text-blue-600" />
        Suggest a New Book - Test
      </h2>
      
      <p className="text-gray-600 mb-4">
        Search feature coming soon. This is a test to verify the component works.
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books... (test mode)"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="p-4 bg-blue-50 rounded text-blue-700">
        ✅ BookSearch component is working! Search query: "{searchQuery}"
      </div>
    </div>
  )
}