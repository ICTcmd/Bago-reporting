'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Copy, Home, Search } from 'lucide-react'
import { useState, Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const referenceNumber = searchParams.get('ref') || 'UNKNOWN'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          Report Submitted Successfully!
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Your incident report has been received by Bago City DRRMO.
        </p>

        {/* Reference Number Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-700 mb-2 text-center">Your Reference Number</p>
          <div className="flex items-center justify-center space-x-3">
            <code className="text-2xl md:text-3xl font-bold text-blue-600">
              {referenceNumber}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
              title="Copy reference number"
            >
              <Copy className={`h-5 w-5 ${copied ? 'text-green-600' : 'text-gray-600'}`} />
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 text-center mt-2">Copied!</p>
          )}
        </div>

        {/* Important Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">⚠️ Please Note:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Save your reference number to track your report status</li>
            <li>• DRRMO staff will review your report during office hours (M-F, 8 AM - 5 PM)</li>
            <li>• This is NOT an emergency response system</li>
            <li>• You will receive updates via the contact information you provided</li>
            <li>• For emergencies, call 911 immediately</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href={`/track?ref=${referenceNumber}`}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="h-5 w-5" />
            <span>Track This Report</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-gray-600">
            Questions about your report?
          </p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Call Bago City DRRMO: +63-xxx-xxx-xxxx
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
