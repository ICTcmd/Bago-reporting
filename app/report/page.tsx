'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, MapPin, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateReferenceNumber } from '@/lib/utils'

interface FormData {
  category: string
  severity: string
  title: string
  description: string
  location_lat: number
  location_lng: number
  address_text: string
  barangay: string
  reporter_name: string
  reporter_contact: string
}

const INCIDENT_CATEGORIES = [
  { value: 'flood', label: 'Flooding', emoji: '🌊' },
  { value: 'fire', label: 'Fire', emoji: '🔥' },
  { value: 'road_obstruction', label: 'Road Obstruction', emoji: '🚧' },
  { value: 'fallen_tree', label: 'Fallen Tree', emoji: '🌳' },
  { value: 'building_damage', label: 'Building Damage', emoji: '🏚️' },
  { value: 'medical', label: 'Medical Emergency', emoji: '🏥' },
  { value: 'crime', label: 'Crime/Security', emoji: '🚨' },
  { value: 'other', label: 'Other', emoji: '📋' },
]

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'critical', label: 'Critical', color: 'red' },
]

export default function ReportPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    category: '',
    severity: 'medium',
    title: '',
    description: '',
    location_lat: 10.5380,
    location_lng: 122.8424,
    address_text: '',
    barangay: '',
    reporter_name: '',
    reporter_contact: '',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (photos.length + validFiles.length > 3) {
      alert('Maximum 3 photos allowed')
      return
    }

    setPhotos((prev) => [...prev, ...validFiles].slice(0, 3))
  }

  const handlePhotoRemove = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.category) {
      setError('Please select an incident category')
      return
    }
    if (!formData.title.trim()) {
      setError('Please provide a title')
      return
    }
    if (!formData.description.trim()) {
      setError('Please provide a description')
      return
    }
    if (!formData.address_text.trim()) {
      setError('Please provide a location')
      return
    }
    if (!formData.reporter_contact.trim()) {
      setError('Please provide a contact method (phone or email)')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const referenceNumber = generateReferenceNumber()

      // Insert incident
      const { data: incident, error: insertError } = await supabase
        .from('incidents')
        .insert({
          category: formData.category,
          severity: formData.severity,
          title: formData.title,
          description: formData.description,
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          address_text: formData.address_text,
          barangay: formData.barangay || null,
          reporter_name: formData.reporter_name || null,
          reporter_contact: formData.reporter_contact,
          status: 'submitted',
          reference_number: referenceNumber,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload photos if any
      if (photos.length > 0) {
        for (const photo of photos) {
          const fileName = `${incident.id}/${Date.now()}-${photo.name}`
          const { error: uploadError } = await supabase.storage
            .from('incident-media')
            .upload(fileName, photo)

          if (!uploadError) {
            await supabase.from('incident_media').insert({
              incident_id: incident.id,
              file_path: fileName,
              file_type: 'image',
              file_size: photo.size,
            })
          }
        }
      }

      // Redirect to confirmation page
      router.push(`/report/success?ref=${referenceNumber}`)
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit report. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Emergency Warning */}
      <div className="bg-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="font-semibold text-sm">
              Important: This form is for non-emergency reports only. 
              If you are in danger, call 911 immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report an Incident
          </h1>
          <p className="text-gray-600 mb-8">
            Fill out this form to report a non-emergency incident to Bago City DRRMO.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Incident Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Incident Type <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {INCIDENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, category: cat.value }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.category === cat.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-1">{cat.emoji}</div>
                    <div className="text-sm font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Severity Level <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, severity: level.value }))
                    }
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.severity === level.value
                        ? `border-${level.color}-600 bg-${level.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Short Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Fallen tree blocking road"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Detailed Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe what happened, when it occurred, and any other relevant details..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="address_text"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                <MapPin className="h-4 w-4 inline mr-1" />
                Location <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="address_text"
                name="address_text"
                value={formData.address_text}
                onChange={handleInputChange}
                placeholder="e.g., Corner of Main St. and 2nd Ave, Poblacion"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>

            {/* Barangay */}
            <div>
              <label
                htmlFor="barangay"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                Barangay (Optional)
              </label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                placeholder="e.g., Poblacion"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Photos (Optional, max 3)
              </label>
              <div className="space-y-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700">{photo.name}</span>
                    <button
                      type="button"
                      onClick={() => handlePhotoRemove(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                    <Upload className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Add Photo (max 5MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoAdd}
                      className="hidden"
                      multiple
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Reporter Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Contact Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="reporter_name"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    id="reporter_name"
                    name="reporter_name"
                    value={formData.reporter_name}
                    onChange={handleInputChange}
                    placeholder="Optional - for follow-up purposes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reporter_contact"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Phone or Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="reporter_contact"
                    name="reporter_contact"
                    value={formData.reporter_contact}
                    onChange={handleInputChange}
                    placeholder="e.g., +63 9XX XXX XXXX or email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <p className="text-sm text-gray-600 text-center mt-3">
                By submitting, you agree that the information provided is accurate.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
