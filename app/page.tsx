import Link from 'next/link'
import { AlertTriangle, MapPin, Phone, FileText, Shield, Search, Map } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-navy-600 shadow-md sticky top-0 z-50">
        <div className="page-container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg">
                <Shield className="h-7 w-7 text-navy-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Bago Safe
                </h1>
                <p className="text-xs text-white/80 font-medium">Incident Reporting System</p>
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              <Link
                href="/track"
                className="text-white/90 hover:text-white font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-white/10 min-h-[44px] flex items-center"
              >
                Track Report
              </Link>
              <Link
                href="/login"
                className="bg-white text-navy-600 px-6 py-2.5 rounded-lg hover:bg-white/90 transition-colors font-semibold min-h-[44px] flex items-center"
              >
                Staff Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Emergency Warning Banner - Compact */}
      <div className="bg-emergency-600 text-white shadow-md">
        <div className="page-container py-3">
          <div className="flex items-center justify-center gap-2 flex-wrap text-center">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="font-bold">
              For life-threatening emergencies, call <span className="text-lg">911</span> or CDRRMC at <span className="text-lg">(034) 473-0043</span>
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main className="page-container py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Report Non-Emergency Incidents
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help Bago City DRRMO respond to incidents in your community. Submit reports of flooding, fallen trees, road obstructions, and other non-emergency situations.
          </p>
        </div>

        {/* Main Actions - 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Report Incident Card */}
          <Link
            href="/report"
            className="card-surface p-8 hover:shadow-lg hover:border-action-600 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-action-100 p-5 rounded-xl mb-4 group-hover:bg-action-600 transition-colors">
                <FileText className="h-10 w-10 text-action-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Submit Report</h3>
              <p className="text-gray-600 mb-4">
                Report flooding, fallen trees, road damage, or other incidents. No account required.
              </p>
              <span className="text-action-600 font-semibold group-hover:underline">
                Start Report →
              </span>
            </div>
          </Link>

          {/* Track Report Card */}
          <Link
            href="/track"
            className="card-surface p-8 hover:shadow-lg hover:border-green-600 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-5 rounded-xl mb-4 group-hover:bg-green-600 transition-colors">
                <Search className="h-10 w-10 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Track Status</h3>
              <p className="text-gray-600 mb-4">
                Check the status of your report using your reference number.
              </p>
              <span className="text-green-600 font-semibold group-hover:underline">
                Track Report →
              </span>
            </div>
          </Link>

          {/* Emergency Services Map Card */}
          <Link
            href="/emergency-map"
            className="card-surface p-8 hover:shadow-lg hover:border-red-600 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-5 rounded-xl mb-4 group-hover:bg-red-600 transition-colors">
                <Map className="h-10 w-10 text-red-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Emergency Services</h3>
              <p className="text-gray-600 mb-4">
                Find fire stations, hospitals, police stations, and emergency contacts.
              </p>
              <span className="text-red-600 font-semibold group-hover:underline">
                View Map →
              </span>
            </div>
          </Link>
        </div>

        {/* Contact Information - Compact */}
        <div className="card-surface p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-navy-100 p-3 rounded-lg">
              <Phone className="h-6 w-6 text-navy-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Contact DRRMO</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-red-50 rounded-lg p-5 border border-red-200">
              <p className="text-sm text-red-700 font-semibold mb-2">Emergency Hotline</p>
              <a 
                href="tel:034-473-0043"
                className="text-3xl font-bold text-red-600 hover:underline block"
              >
                (034) 473-0043
              </a>
              <p className="text-sm text-red-600 font-semibold mt-2">
                Available 24/7
              </p>
              <p className="text-sm text-gray-600 mt-1">
                0933-693-6444 • 0927-022-4884
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <p className="text-sm text-blue-700 font-semibold mb-2">Office Hours</p>
              <p className="text-xl font-bold text-gray-900">Monday - Friday</p>
              <p className="text-lg font-semibold text-blue-600">8:00 AM - 5:00 PM</p>
              <a 
                href="tel:034-431-5085"
                className="text-sm text-blue-600 font-semibold mt-2 hover:underline block"
              >
                (034) 431-5085
              </a>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <p className="text-sm text-gray-700 font-semibold mb-2">Location</p>
              <p className="font-bold text-gray-900">Bago City Hall</p>
              <p className="text-sm text-gray-600">General Luna St</p>
              <p className="text-sm text-gray-600">Negros Occidental</p>
              <a 
                href="mailto:bagodrrm@gmail.com"
                className="text-sm text-blue-600 font-semibold mt-2 hover:underline block break-all"
              >
                bagodrrm@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy-600 text-white mt-16">
        <div className="page-container py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="bg-white p-2 rounded-lg">
                <Shield className="h-5 w-5 text-navy-600" />
              </div>
              <h3 className="text-lg font-bold">Bago Safe</h3>
            </div>
            <p className="text-white/80 mb-2 text-sm">
              © 2026 Bago City Disaster Risk Reduction and Management Office
            </p>
            <p className="text-xs text-white/60 max-w-2xl mx-auto">
              This system is for non-emergency incident reporting only. For emergencies, always call 911 first.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
