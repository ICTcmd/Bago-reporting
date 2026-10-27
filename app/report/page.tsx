'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, MapPin, Upload, X, CheckCircle, Image as ImageIcon } from 'lucide-react'
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

interface FieldErrors {
  [key: string]: string
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
  { value: 'low', label: 'Low', color: 'bg-green-100 border-green-600 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 border-yellow-600 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 border-orange-600 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 border-red-600 text-red-800' },
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
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'title':
        if (!value.trim()) return 'Title is required'
        if (value.trim().length < 5) return 'Title must be at least 5 characters'
        return ''
      case 'description':
        if (!value.trim()) return 'Description is required'
        if (value.trim().length < 20) return 'Please provide more detail (at least 20 characters)'
        return ''
      case 'address_text':
        if (!value.trim()) return 'Location is required'
        return ''
      case 'reporter_contact':
        if (!value.trim()) return 'Contact information is required'
        // Basic email or phone validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const phoneRegex = /^[\d\s\-\+\(\)]+$/
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          return 'Please enter a valid phone number or email'
        }
        return ''
      default:
        return ''
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error for this field if it was touched
    if (touchedFields.has(name)) {
      const error = validateField(name, value)
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[name] = error
        } else {
          delete newErrors[name]
        }
        return newErrors
      })
    }
  }

  const handleBlur = (name: string, value: any) => {
    setTouchedFields(prev => new Set(prev).add(name))
    const error = validateField(name, value)
    if (error) {
      setFieldErrors(prev => ({ ...prev, [name]: error }))
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const newPreviews: string[] = []

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`)
        continue
      }
      if (photos.length + validFiles.length >= 3) {
        alert('Maximum 3 photos allowed')
        break
      }
      
      validFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setPhotos((prev) => [...prev, ...validFiles])
    setPhotoPreview((prev) => [...prev, ...newPreviews])
    
    // Reset input
    e.target.value = ''
  }

  const handlePhotoRemove = (index: number) => {
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(photoPreview[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mark all fields as touched
    const allFields = new Set(['category', 'title', 'description', 'address_text', 'reporter_contact'])
    setTouchedFields(allFields)

    // Validate all fields
    const errors: FieldErrors = {}
    if (!formData.category) errors.category = 'Please select an incident category'
    
    allFields.forEach(field => {
      if (field !== 'category') {
        const error = validateField(field, formData[field as keyof FormData])
        if (error) errors[field] = error
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please fix the errors above before submitting')
      // Scroll to first error
      const firstErrorField = document.querySelector('.input-error')
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

      // Clean up object URLs
      photoPreview.forEach(url => URL.revokeObjectURL(url))

      // Redirect to confirmation page
      router.push(`/report/success?ref=${referenceNumber}`)
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || 'Failed to submit report. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 min-h-[44px]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Emergency Warning - Compact */}
      <div className="bg-emergency-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="font-semibold text-sm">
              For emergencies, call 911 immediately. This form is for non-emergency reports only.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-surface p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report an Incident
          </h1>
          <p className="text-gray-600 mb-8">
            Fill out this form to report a non-emergency incident to Bago City DRRMO. Fields marked with <span className="text-red-600">*</span> are required.
          </p>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Please fix the following errors:</p>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
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
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, category: cat.value }))
                      setTouchedFields(prev => new Set(prev).add('category'))
                      setFieldErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.category
                        return newErrors
                      })
                    }}
                    className={`p-4 rounded-lg border-2 transition-all min-h-[88px] flex flex-col items-center justify-center ${
                      formData.category === cat.value
                        ? 'border-action-600 bg-action-50'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${touchedFields.has('category') && !formData.category ? 'border-red-500' : ''}`}
                  >
                    <div className="text-3xl mb-1">{cat.emoji}</div>
                    <div className="text-sm font-medium text-center">{cat.label}</div>
                  </button>
                ))}
              </div>
              {touchedFields.has('category') && fieldErrors.category && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {fieldErrors.category}
                </p>
              )}
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
                    className={`p-3 rounded-lg border-2 transition-all min-h-[44px] ${
                      formData.severity === level.value
                        ? `${level.color} border-current`
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="text-sm font-semibold">{level.label}</div>
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
              <div className="relative">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur('title', e.target.value)}
                  placeholder="e.g., Fallen tree blocking road"
                  className={`input-field ${
                    touchedFields.has('title') && fieldErrors.title ? 'input-error' : ''
                  } ${touchedFields.has('title') && !fieldErrors.title && formData.title ? 'border-green-500' : ''}`}
                />
                {touchedFields.has('title') && !fieldErrors.title && formData.title && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                )}
              </div>
              {touchedFields.has('title') && fieldErrors.title && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {fieldErrors.title}
                </p>
              )}
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
                onBlur={(e) => handleBlur('description', e.target.value)}
                rows={4}
                placeholder="Describe what happened, when it occurred, and any other relevant details..."
                className={`input-field ${
                  touchedFields.has('description') && fieldErrors.description ? 'input-error' : ''
                } ${touchedFields.has('description') && !fieldErrors.description && formData.description ? 'border-green-500' : ''}`}
              />
              <div className="flex items-center justify-between mt-1">
                <div>
                  {touchedFields.has('description') && fieldErrors.description && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {fieldErrors.description}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">{formData.description.length} characters</p>
              </div>
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
              <div className="relative">
                <input
                  type="text"
                  id="address_text"
                  name="address_text"
                  value={formData.address_text}
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur('address_text', e.target.value)}
                  placeholder="e.g., Corner of Main St. and 2nd Ave, Poblacion"
                  className={`input-field ${
                    touchedFields.has('address_text') && fieldErrors.address_text ? 'input-error' : ''
                  } ${touchedFields.has('address_text') && !fieldErrors.address_text && formData.address_text ? 'border-green-500' : ''}`}
                />
                {touchedFields.has('address_text') && !fieldErrors.address_text && formData.address_text && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                )}
              </div>
              {touchedFields.has('address_text') && fieldErrors.address_text && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {fieldErrors.address_text}
                </p>
              )}
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
                className="input-field"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Photos (Optional, max 3)
              </label>
              
              {/* Photo Previews */}
              {photoPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photoPreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-lg"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded truncate">
                        {photos[index].name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {photos.length < 3 && (
                <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-action-600 hover:bg-action-50 transition-all min-h-[88px]">
                  <div className="text-center">
                    <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Click to add photo
                    </span>
                    <span className="text-xs text-gray-500 block mt-1">
                      Max 5MB per photo • {3 - photos.length} remaining
                    </span>
                  </div>
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

            {/* Reporter Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Contact Information
              </h3>

              <div className="space-y-6">
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
                    className="input-field"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You may remain anonymous. We'll only use your name if follow-up is needed.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reporter_contact"
                    className="block text-sm font-semibold text-gray-900 mb-2"
                  >
                    Phone or Email <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="reporter_contact"
                      name="reporter_contact"
                      value={formData.reporter_contact}
                      onChange={handleInputChange}
                      onBlur={(e) => handleBlur('reporter_contact', e.target.value)}
                      placeholder="e.g., +63 9XX XXX XXXX or email@example.com"
                      className={`input-field ${
                        touchedFields.has('reporter_contact') && fieldErrors.reporter_contact ? 'input-error' : ''
                      } ${touchedFields.has('reporter_contact') && !fieldErrors.reporter_contact && formData.reporter_contact ? 'border-green-500' : ''}`}
                    />
                    {touchedFields.has('reporter_contact') && !fieldErrors.reporter_contact && formData.reporter_contact && (
                      <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />
                    )}
                  </div>
                  {touchedFields.has('reporter_contact') && fieldErrors.reporter_contact && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {fieldErrors.reporter_contact}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    We'll use this to send your reference number and status updates.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Report...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
              <p className="text-sm text-gray-600 text-center mt-4">
                By submitting, you confirm that the information provided is accurate to the best of your knowledge.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
