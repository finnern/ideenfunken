import BookList from '../components/BookList'
import DatabaseTest from '../components/DatabaseTest'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DatabaseTest />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Community Book Recommendations
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover inspiring books suggested by our community. Vote for your favorites 
          and help select the top 10 books that will be made available at the local library.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Each member gets 10 votes • Maximum 3 votes per book</p>
        </div>
      </div>
      
      <BookList />
    </div>
  )
}