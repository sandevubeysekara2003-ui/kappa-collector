import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

const FACE_VALIDITY_CRITERIA = [
  { id: 1, text: 'Appropriateness of grammar.' },
  { id: 2, text: 'The clarity and unambiguity of items.' },
  { id: 3, text: 'The correct spelling of words.' },
  { id: 4, text: 'The correct structuring of the sentences.' },
  { id: 5, text: 'Appropriateness of font size and space.' },
  { id: 6, text: 'Legible printout.' },
  { id: 7, text: 'Adequacy of instruction on the instrument.' },
  { id: 8, text: 'The structure of the instrument in terms of construction and well-thought out format.' },
  { id: 9, text: 'Appropriateness of difficulty level of the instrument for the participants.' },
  { id: 10, text: 'Reasonableness of items in relation to the supposed purpose of the instrument.' }
]

function ExpertAssessment({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [expertName, setExpertName] = useState('')
  const [expertEmail, setExpertEmail] = useState('')
  const [expertQualification, setExpertQualification] = useState('')
  const [expertYearsOfExperience, setExpertYearsOfExperience] = useState('')
  const [responses, setResponses] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?'
    const fontSize = 16
    const columns = canvas.width / fontSize
    const drops = Array.from({ length: columns }, () => Math.random() * -100)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#1E90FF'
      ctx.shadowBlur = 10
      ctx.shadowColor = '#1E90FF'
      ctx.font = fontSize + 'px monospace'

      drops.forEach((y, i) => {
        const text = letters[Math.floor(Math.random() * letters.length)]
        ctx.fillText(text, i * fontSize, y * fontSize)
        drops[i] = (y * fontSize > canvas.height && Math.random() > 0.975) ? 0 : y + 1
      })
    }

    const interval = setInterval(draw, 33)
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Fetch project data
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3

    const fetchProject = async () => {
      if (!projectId) {
        console.error('❌ No project ID provided')
        setError('No project ID provided')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      const apiUrl = 'https://kappa-collector.onrender.com'
      const fullUrl = `${apiUrl}/api/projects/${projectId}`

      console.log('=== EXPERT ASSESSMENT FETCH ===')
      console.log('Project ID:', projectId)
      console.log('Full URL:', fullUrl)
      console.log('Timestamp:', new Date().toISOString())
      console.log('Retry attempt:', retryCount + 1, 'of', maxRetries)

      try {
        console.log('🔄 Starting fetch...')
        const res = await fetch(fullUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })

        console.log('📡 Response received')
        console.log('Status:', res.status)
        console.log('Status Text:', res.statusText)
        console.log('Headers:', Object.fromEntries(res.headers.entries()))

        if (res.ok) {
          const data = await res.json()
          console.log('✅ Project loaded successfully:', data.name)
          console.log('Original items:', data.originalScaleItems?.length)
          console.log('Translated items:', data.translatedScaleItems?.length)

          // Validate data
          if (!data.originalScaleItems || !data.translatedScaleItems) {
            throw new Error('Invalid project data: missing items')
          }

          setProject(data)
          setError(null)
        } else {
          const errorText = await res.text()
          console.error('❌ Failed to load project')
          console.error('Status:', res.status)
          console.error('Response:', errorText)

          // Retry on server errors
          if (res.status >= 500 && retryCount < maxRetries) {
            retryCount++
            console.log(`⏳ Retrying in 2 seconds... (attempt ${retryCount}/${maxRetries})`)
            setTimeout(fetchProject, 2000)
            return
          }

          setError(`Project not found (Status: ${res.status})`)
        }
      } catch (err) {
        console.error('❌ Network error:', err)
        console.error('Error name:', err.name)
        console.error('Error message:', err.message)
        console.error('Error stack:', err.stack)

        // Retry on network errors
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`⏳ Retrying in 2 seconds... (attempt ${retryCount}/${maxRetries})`)
          setTimeout(fetchProject, 2000)
          return
        }

        setError(`Network error: ${err.message}. Please check your internet connection.`)
      } finally {
        if (retryCount >= maxRetries || project || error) {
          setIsLoading(false)
          console.log('=== FETCH COMPLETE ===')
        }
      }
    }

    fetchProject()
  }, [projectId])

  // Handle radio change (store as string to match input value)
  const handleResponseChange = (itemIndex, criteriaId, value) => {
    const key = `item${itemIndex}_criteria${criteriaId}`
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!expertName || !expertEmail || !expertQualification || !expertYearsOfExperience) {
      toast.error('Please fill in all expert information fields')
      return
    }

    const totalResponses = project.translatedScaleItems.length * FACE_VALIDITY_CRITERIA.length
    const filledResponses = Object.keys(responses).length

    if (filledResponses < totalResponses) {
      toast.error(`Please complete all evaluations (${filledResponses}/${totalResponses} completed)`)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`https://kappa-collector.onrender.com/api/expert-response/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertName,
          expertEmail,
          expertQualification,
          expertYearsOfExperience: parseInt(expertYearsOfExperience),
          responses
        })
      })

      if (res.ok) {
        setHasSubmitted(true)
        toast.success('Response submitted successfully!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit response')
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-blue-400 flex items-center justify-center">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
            ⟳ LOADING PROJECT...
          </div>
          <p className="text-sm text-blue-300" style={{ fontFamily: 'monospace' }}>
            Project ID: {projectId}
          </p>
        </div>
      </div>
    )
  }

  // Error screen
  if (error || !project) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
        <div className="bg-black bg-opacity-80 border-2 border-red-500 rounded-lg p-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-red-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #EF4444' }}>
            ⚠ ERROR
          </h2>
          <p className="text-red-300 mb-4" style={{ fontFamily: 'monospace' }}>
            {error || 'Project not found'}
          </p>
          <p className="text-sm text-red-200" style={{ fontFamily: 'monospace' }}>
            Project ID: {projectId}
          </p>
        </div>
      </div>
    )
  }

  // Submission screen
  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-black text-blue-400 flex items-center justify-center">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
        <div className="bg-black bg-opacity-80 border-2 border-green-500 rounded-lg p-8 max-w-2xl">
          <h2 className="text-3xl font-bold text-green-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #22C55E' }}>
            ✓ RESPONSE SUBMITTED
          </h2>
          <p className="text-green-300" style={{ fontFamily: 'monospace' }}>
            Thank you for your valuable feedback!
          </p>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="min-h-screen bg-black text-blue-400 p-8">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
            EXPERT ASSESSMENT FORM
          </h1>
          <p className="text-blue-300" style={{ fontFamily: 'monospace' }}>
            Project: {project.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Expert Information */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              EXPERT INFORMATION
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>Name *</label>
                <input
                  type="text"
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-blue-400 focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>Email *</label>
                <input
                  type="email"
                  value={expertEmail}
                  onChange={(e) => setExpertEmail(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-blue-400 focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>Qualification *</label>
                <input
                  type="text"
                  value={expertQualification}
                  onChange={(e) => setExpertQualification(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-blue-400 focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>Years of Experience *</label>
                <input
                  type="number"
                  value={expertYearsOfExperience}
                  onChange={(e) => setExpertYearsOfExperience(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-blue-400 focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              INSTRUCTIONS
            </h2>
            <p className="text-blue-300 mb-4" style={{ fontFamily: 'monospace' }}>
              Please evaluate each translated item against the 10 face validity criteria listed below.
              For each item-criteria combination, select YES or NO.
            </p>
          </div>

          {/* Original Scale Items */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              ORIGINAL SCALE (English)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-blue-500">
                    <th className="text-left p-3 text-blue-300" style={{ fontFamily: 'monospace' }}>Item #</th>
                    <th className="text-left p-3 text-blue-300" style={{ fontFamily: 'monospace' }}>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {project.originalScaleItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-blue-700">
                      <td className="p-3 text-blue-400" style={{ fontFamily: 'monospace' }}>{idx + 1}</td>
                      <td className="p-3 text-blue-400" style={{ fontFamily: 'monospace' }}>{item.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Translated Scale Items */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              TRANSLATED SCALE (Sinhala)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-blue-500">
                    <th className="text-left p-3 text-blue-300" style={{ fontFamily: 'monospace' }}>Item #</th>
                    <th className="text-left p-3 text-blue-300" style={{ fontFamily: 'monospace' }}>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {project.translatedScaleItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-blue-700">
                      <td className="p-3 text-blue-400" style={{ fontFamily: 'monospace' }}>{idx + 1}</td>
                      <td className="p-3 text-blue-400" style={{ fontFamily: 'monospace' }}>{item.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evaluation Matrix */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              EVALUATION MATRIX
            </h2>
            <p className="text-blue-300 mb-4" style={{ fontFamily: 'monospace' }}>
              For each translated item, evaluate against all 10 criteria:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-blue-500">
                    <th className="p-2 text-left text-blue-300" style={{ fontFamily: 'monospace' }}>Item</th>
                    {FACE_VALIDITY_CRITERIA.map(criteria => (
                      <th key={criteria.id} className="p-2 text-center text-blue-300" style={{ fontFamily: 'monospace' }}>
                        C{criteria.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {project.translatedScaleItems.map((item, itemIdx) => (
                    <tr key={item.id} className="border-b border-blue-700">
                      <td className="p-2 text-blue-400" style={{ fontFamily: 'monospace' }}>
                        Item {itemIdx + 1}
                      </td>
                      {FACE_VALIDITY_CRITERIA.map(criteria => {
                        const key = `item${itemIdx}_criteria${criteria.id}`
                        return (
                          <td key={criteria.id} className="p-2 text-center">
                            <div className="flex justify-center gap-2">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={key}
                                  value="YES"
                                  checked={responses[key] === 'YES'}
                                  onChange={(e) => handleResponseChange(itemIdx, criteria.id, e.target.value)}
                                  className="cursor-pointer"
                                />
                                <span className="text-green-400 text-xs" style={{ fontFamily: 'monospace' }}>Y</span>
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={key}
                                  value="NO"
                                  checked={responses[key] === 'NO'}
                                  onChange={(e) => handleResponseChange(itemIdx, criteria.id, e.target.value)}
                                  className="cursor-pointer"
                                />
                                <span className="text-red-400 text-xs" style={{ fontFamily: 'monospace' }}>N</span>
                              </label>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Criteria Legend */}
            <div className="mt-6 space-y-2">
              <h3 className="text-xl font-bold text-blue-400 mb-3" style={{ fontFamily: 'monospace' }}>
                CRITERIA LEGEND:
              </h3>
              {FACE_VALIDITY_CRITERIA.map(criteria => (
                <div key={criteria.id} className="text-blue-300" style={{ fontFamily: 'monospace' }}>
                  <span className="text-blue-400 font-bold">C{criteria.id}:</span> {criteria.text}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg border-2 border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}
            >
              {isSubmitting ? '⟳ SUBMITTING...' : '✓ SUBMIT EVALUATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExpertAssessment
