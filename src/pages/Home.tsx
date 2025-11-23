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
        
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 max-w-2xl mx-auto mb-4">
          <p className="text-gray-800 font-semibold mb-2">
            ✅ Das Abstimmen ist abgeschlossen!
          </p>
          <p className="text-gray-700 mb-2">
            Die Bücher werden am <strong>15. Dezember</strong> in der Mediathek übergeben. 
            Der genaue Zeitpunkt wird noch bekannt gegeben.
          </p>
          <p className="text-gray-600 text-sm">
            Danke an alle, die mitgemacht haben! 🎉
          </p>
        </div>

        <p className="text-gray-600 max-w-2xl mx-auto mb-2">
          Entdecken Sie inspirierende Bücher, die von unserer Community vorgeschlagen wurden.
        </p>
        <p className="text-gray-500 text-sm max-w-2xl mx-auto">
          Sie können weiterhin Bücher vorschlagen, diese werden jedoch nicht mehr für die Mediathek berücksichtigt.
        </p>
      </div>
      
      <BookList />
    </div>
  )
}