'use client'

import Link from 'next/link'
import { AlertTriangle, MapPin, Phone, FileText, Shield, Search, Map, Users, X } from 'lucide-react'
import { useState } from 'react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-page">
      {/* Header - Modern Clean Design */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-2xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Bago Safe
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wide">Incident Reporting System</p>
              </div>
            </Link>
            
            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="https://asenso-bago.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Main App
              </Link>
              <Link
                href="/track"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Search className="h-4 w-4" />
                Track Report
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-2.5 ml-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Staff Login
              </Link>
            </nav>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-3 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 md:hidden flex flex-col">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Bago Safe</h2>
                  <p className="text-xs text-gray-500">Menu</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                <Link
                  href="https://asenso-bago.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-semibold"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                  </svg>
                  <span>Main App</span>
                </Link>

                <Link
                  href="/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-semibold"
                >
                  <FileText className="h-5 w-5" />
                  <span>Submit Report</span>
                </Link>

                <Link
                  href="/track"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-semibold"
                >
                  <Search className="h-5 w-5" />
                  <span>Track Report</span>
                </Link>

                <Link
                  href="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-semibold"
                >
                  <Users className="h-5 w-5" />
                  <span>Community Feed</span>
                </Link>

                <Link
                  href="/emergency-map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-semibold"
                >
                  <Map className="h-5 w-5" />
                  <span>Emergency Services</span>
                </Link>

                <div className="my-4 border-t border-gray-200"></div>

                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all font-bold shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Staff Login</span>
                </Link>
              </div>
            </nav>

            {/* Menu Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-semibold mb-1">Emergency Hotline</p>
                <a href="tel:034-473-0043" className="text-lg font-bold text-red-600 hover:underline">
                  (034) 473-0043
                </a>
                <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
              </div>
            </div>
          </div>
        </>
      )}

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

        {/* Main Actions - 4 Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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
                Report flooding, fallen trees, road damage, or other incidents.
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

          {/* Community Dashboard Card */}
          <Link
            href="/community"
            className="card-surface p-8 hover:shadow-lg hover:border-purple-600 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 p-5 rounded-xl mb-4 group-hover:bg-purple-600 transition-colors">
                <Users className="h-10 w-10 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Feed</h3>
              <p className="text-gray-600 mb-4">
                See what incidents others in the community have reported.
              </p>
              <span className="text-purple-600 font-semibold group-hover:underline">
                View Dashboard →
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
