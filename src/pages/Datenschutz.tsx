import { Link } from 'react-router-dom';

export default function Datenschutz() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Datenschutzerklärung</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Datenschutz auf einen Blick</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Allgemeine Hinweise</h3>
              <p className="text-gray-700 mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
                passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
                persönlich identifiziert werden können.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Datenerfassung auf dieser Website</h3>
              <p className="text-gray-700">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Impressum dieser Website entnehmen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Hosting und Content Delivery Networks (CDN)</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Externes Hosting</h3>
              <p className="text-gray-700 mb-4">
                Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, 
                die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Supabase</h3>
              <p className="text-gray-700">
                Wir nutzen Supabase für die Bereitstellung unserer Datenbankdienste. Supabase verarbeitet Daten in 
                Übereinstimmung mit der DSGVO. Weitere Informationen finden Sie in der Datenschutzerklärung von 
                Supabase: <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Datenschutz</h3>
              <p className="text-gray-700 mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie 
                dieser Datenschutzerklärung.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Hinweis zur verantwortlichen Stelle</h3>
              <p className="text-gray-700 mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">Mark Finnern</p>
                <p className="text-gray-700">E-Mail: mark@finnern.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Datenerfassung auf dieser Website</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Registrierung auf dieser Website</h3>
              <p className="text-gray-700 mb-4">
                Sie können sich auf dieser Website registrieren, um zusätzliche Funktionen zu nutzen. Die dazu 
                eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, 
                für den Sie sich registriert haben.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Buchempfehlungen und Bewertungen</h3>
              <p className="text-gray-700 mb-4">
                Wenn Sie Bücher empfehlen oder bewerten, werden diese Daten zusammen mit Ihrem Namen (falls nicht 
                anonym gewählt) öffentlich auf der Website angezeigt. Sie können wählen, ob Ihre Empfehlung anonym 
                veröffentlicht werden soll.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Server-Log-Dateien</h3>
              <p className="text-gray-700">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
                die Ihr Browser automatisch an uns übermittelt. Dies sind: Browsertyp und Browserversion, verwendetes 
                Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage und IP-Adresse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Ihre Rechte</h2>
              <p className="text-gray-700 mb-4">
                Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
                gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, 
                Sperrung oder Löschung dieser Daten zu verlangen.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Recht auf Datenübertragbarkeit</h3>
              <p className="text-gray-700 mb-4">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags 
                automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format 
                aushändigen zu lassen.
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mb-2">Widerspruch gegen Werbe-E-Mails</h3>
              <p className="text-gray-700">
                Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von 
                nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Kontakt</h2>
              <p className="text-gray-700">
                Bei Fragen zum Datenschutz wenden Sie sich bitte an: 
                <a href="mailto:mark@finnern.com" className="text-blue-600 hover:underline ml-1">mark@finnern.com</a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium"
            >
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}