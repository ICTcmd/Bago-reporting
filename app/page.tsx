import Link from 'next/link'
import { AlertTriangle, MapPin, Phone, FileText, Shield, Clock, CheckCircle, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Bago Safe
                </h1>
                <p className="text-xs text-gray-600 font-medium">Incident Reporting System</p>
              </div>
            </div>
            <nav className="flex items-center space-x-3">
              <Link
                href="/emergency-map"
                className="text-gray-700 hover:text-red-600 font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <span className="text-lg">🗺️</span>
                <span className="hidden sm:inline">Emergency Map</span>
              </Link>
              <Link
                href="/track"
                className="text-gray-700 hover:text-blue-600 font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                Track Report
              </Link>
              <Link
                href="/login"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2.5 rounded-xl hover:shadow-xl transition-all font-semibold"
              >
                Staff Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Emergency Warning Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-3">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            <p className="font-bold text-lg">
              ⚠️ THIS IS NOT AN EMERGENCY SERVICE
            </p>
          </div>
          <p className="text-center text-sm mt-2 font-medium">
            For life-threatening emergencies, call <strong className="text-xl">911</strong> or Bago City CDRRMC at <strong className="text-lg">(034) 473-0043</strong> immediately.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
            Report Non-Emergency Incidents
          </h2>
          <p className="text-xl text-white/95 max-w-3xl mx-auto font-medium drop-shadow">
            Help Bago City DRRMO respond to incidents in your community. 
            Submit reports of flooding, fallen trees, road obstructions, and other non-emergency situations.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Report Incident Card */}
          <Link
            href="/report"
            className="bg-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-blue-400 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-5 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900">Submit Report</h3>
              </div>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Report flooding, fallen trees, road damage, or other incidents. No account required.
              </p>
              <div className="flex items-center text-blue-600 font-bold text-lg group-hover:translate-x-3 transition-transform">
                Start Report →
              </div>
            </div>
          </Link>

          {/* Track Report Card */}
          <Link
            href="/track"
            className="bg-white rounded-3xl shadow-2xl p-10 hover:shadow-3xl hover:scale-105 transition-all duration-300 border-4 border-transparent hover:border-green-400 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-400 p-5 rounded-2xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                  <MapPin className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900">Track Status</h3>
              </div>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Check the status of your report using your reference number.
              </p>
              <div className="flex items-center text-green-600 font-bold text-lg group-hover:translate-x-3 transition-transform">
                Track Report →
              </div>
            </div>
          </Link>
        </div>

        {/* Information Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-bold text-xl mb-3 text-gray-900">Easy Reporting</h4>
            <p className="text-gray-600 leading-relaxed">
              Simple form, no account needed. Just describe the incident and add photos.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-br from-green-500 to-emerald-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-bold text-xl mb-3 text-gray-900">Track Progress</h4>
            <p className="text-gray-600 leading-relaxed">
              Receive a reference number and check status updates anytime.
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-br from-purple-500 to-pink-400 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-bold text-xl mb-3 text-gray-900">Secure & Private</h4>
            <p className="text-gray-600 leading-relaxed">
              Your information is protected and only used for incident response.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-3 rounded-xl shadow-lg">
              <Phone className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900">Contact DRRMO</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200">
              <p className="text-sm text-red-700 font-semibold mb-2">Emergency Hotline</p>
              <p className="text-4xl font-extrabold text-red-600">911</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
              <p className="text-sm text-blue-700 font-semibold mb-2">Bago City CDRRMC (24/7)</p>
              <p className="text-2xl font-bold text-blue-600">(034) 473-0043</p>
              <p className="text-lg font-semibold text-blue-600 mt-1">0933-693-6444</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
              <p className="text-sm text-green-700 font-semibold mb-2">Office Hours</p>
              <p className="font-bold text-gray-900">Monday - Friday</p>
              <p className="text-lg font-semibold text-green-600">8:00 AM - 5:00 PM</p>
              <p className="text-sm text-green-700 mt-2">(034) 431-5085</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
              <p className="text-sm text-purple-700 font-semibold mb-2">Location</p>
              <p className="font-bold text-gray-900">Bago City Hall</p>
              <p className="text-sm text-purple-600">Negros Occidental</p>
              <p className="text-sm text-purple-700 mt-2">bagodrrm@gmail.com</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Bago Safe</h3>
            </div>
            <p className="text-gray-400 mb-2">
              © 2026 Bago City Disaster Risk Reduction and Management Office
            </p>
            <p className="text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
              This system is for non-emergency incident reporting only. 
              For emergencies, always call 911 first.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
