import Link from 'next/link'
import { AlertTriangle, MapPin, Phone, FileText, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bago Safe</h1>
                <p className="text-sm text-gray-600">Incident Reporting System</p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/track"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Track Report
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Staff Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Emergency Warning Banner */}
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">
              ⚠️ THIS IS NOT AN EMERGENCY SERVICE
            </p>
          </div>
          <p className="text-center text-sm mt-1">
            For life-threatening emergencies, call <strong>911</strong> or Bago City DRRMO immediately.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Report Non-Emergency Incidents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Help Bago City DRRMO respond to incidents in your community. 
            Submit reports of flooding, fallen trees, road obstructions, and other non-emergency situations.
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Report Incident Card */}
          <Link
            href="/report"
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500 group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200 transition-colors">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Submit Report</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Report flooding, fallen trees, road damage, or other incidents. No account required.
            </p>
            <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
              Start Report →
            </div>
          </Link>

          {/* Track Report Card */}
          <Link
            href="/track"
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500 group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-green-100 p-4 rounded-full group-hover:bg-green-200 transition-colors">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Track Status</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Check the status of your report using your reference number.
            </p>
            <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
              Track Report →
            </div>
          </Link>
        </div>

        {/* Information Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h4 className="font-bold text-lg mb-2">Easy Reporting</h4>
            <p className="text-gray-600 text-sm">
              Simple form, no account needed. Just describe the incident and add photos.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h4 className="font-bold text-lg mb-2">Track Progress</h4>
            <p className="text-gray-600 text-sm">
              Receive a reference number and check status updates anytime.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h4 className="font-bold text-lg mb-2">Secure & Private</h4>
            <p className="text-gray-600 text-sm">
              Your information is protected and only used for incident response.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-4">
            <Phone className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Contact DRRMO</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Emergency Hotline</p>
              <p className="text-xl font-bold text-gray-900">911</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Bago City DRRMO</p>
              <p className="text-xl font-bold text-gray-900">+63-xxx-xxx-xxxx</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Office Hours</p>
              <p className="font-semibold text-gray-900">Monday - Friday, 8:00 AM - 5:00 PM</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Location</p>
              <p className="font-semibold text-gray-900">Bago City Hall, Negros Occidental</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              © 2026 Bago City Disaster Risk Reduction and Management Office
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This system is for non-emergency incident reporting only. 
              For emergencies, always call 911 first.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
