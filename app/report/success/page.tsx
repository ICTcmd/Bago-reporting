'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Copy, Home, Search, Check } from 'lucide-react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const referenceNumber = searchParams.get('ref') || ''
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referenceNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = referenceNumber
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card-surface p-8 text-center">
          {/* Success icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Report Submitted Successfully
          </h1>
          <p className="text-gray-600 mb-8">
            Your incident report has been received by Bago City DRRMO. We'll review it and take appropriate action.
          </p>

          {/* Reference number - prominent */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Your Reference Number</p>
            <p className="text-2xl md:text-3xl font-mono font-bold text-navy-600 mb-4 break-all">
              {referenceNumber}
            </p>
            <button
              onClick={handleCopy}
              className="btn-secondary w-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>

          {/* Important note */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-900">
              <strong className="font-bold">⚠️ Important:</strong> Save this reference number! You'll need it to track your report status.
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-gray-900 mb-2">What happens next?</p>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">1.</span>
                <span>DRRMO staff will review your report</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">2.</span>
                <span>We'll verify the incident details</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">3.</span>
                <span>Appropriate response will be coordinated</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">4.</span>
                <span>Track status updates using your reference number</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href={`/track?ref=${referenceNumber}`} className="btn-primary w-full">
              <Search className="h-5 w-5 mr-2" />
              Track This Report
            </Link>
            <Link href="/" className="btn-secondary w-full">
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>

          {/* Contact info */}
          <div className="mt-6 pt-6 border-t text-sm text-gray-600">
            <p>Questions about your report?</p>
            <a 
              href="tel:034-473-0043" 
              className="text-action-600 hover:text-action-700 font-semibold hover:underline"
            >
              Call CDRRMC: (034) 473-0043
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-page flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
