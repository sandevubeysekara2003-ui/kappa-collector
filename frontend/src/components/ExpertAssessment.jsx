import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { API_URL } from '../config'

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

const DELPHI_CRITERIA = [
  { id: 1, category: 'content', text: 'Appropriateness of language used' },
  { id: 2, category: 'content', text: 'Assessment of the concept' },
  { id: 3, category: 'content', text: 'Retains the conceptual meaning' },
  { id: 4, category: 'consensual', text: 'Appropriateness with the individuals of 18 years and above' },
  { id: 5, category: 'consensual', text: 'Cultural relevance' }
]

function ExpertAssessment({ projectId }) {
  const [project, setProject] = useState(null)
  const [expertName, setExpertName] = useState('')
  const [expertEmail, setExpertEmail] = useState('')
  const [expertQualification, setExpertQualification] = useState('')
  const [expertYearsOfExperience, setExpertYearsOfExperience] = useState('')
  const [expertRemarks, setExpertRemarks] = useState('')
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
    const fetchProject = async () => {
      if (!projectId) {
        console.error('❌ No project ID provided')
        setError('No project ID provided')
        setIsLoading(false)
        return
      }

      try {
        console.log('=== EXPERT ASSESSMENT DEBUG ===')
        console.log('🔄 Fetching project:', projectId)
        console.log('API URL:', API_URL)
        console.log('Environment Mode:', import.meta.env.MODE)
        console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
        console.log('Full fetch URL:', `${API_URL}/api/projects/${projectId}`)

        const response = await fetch(`${API_URL}/api/projects/${projectId}`)

        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Response error:', errorText)
          throw new Error(`Failed to load project (Status: ${response.status})`)
        }

        const data = await response.json()
        console.log('✅ Project loaded successfully!')
        console.log('Project name:', data.name)
        console.log('Original items:', data.originalScaleItems?.length)
        console.log('Translated items:', data.translatedScaleItems?.length)

        setProject(data)
        setError(null)
      } catch (err) {
        console.error('❌ Error loading project:', err)
        console.error('Error message:', err.message)
        console.error('Error stack:', err.stack)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  // Handle radio change (store as string to match input value)
  const handleResponseChange = (itemIndex, criteriaId, value) => {
    const key = `item${itemIndex}_criteria${criteriaId}`
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  // Handle Delphi rating change (1-9 scale)
  const handleDelphiRatingChange = (itemIndex, criteriaId, value) => {
    const key = `item${itemIndex}_criteria${criteriaId}`
    setResponses(prev => ({ ...prev, [key]: parseInt(value) }))
  }

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!expertName || !expertEmail || !expertQualification || !expertYearsOfExperience) {
      toast.error('Please fill in all expert information fields')
      return
    }

    // Validate based on project type
    const criteriaCount = project.type === 'delphi' ? DELPHI_CRITERIA.length : FACE_VALIDITY_CRITERIA.length
    const totalResponses = project.translatedScaleItems.length * criteriaCount
    const filledResponses = Object.keys(responses).length

    if (filledResponses < totalResponses) {
      toast.error(`Please complete all evaluations (${filledResponses}/${totalResponses} completed)`)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`${API_URL}/api/expert-response/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertName,
          expertEmail,
          expertQualification,
          expertYearsOfExperience: parseInt(expertYearsOfExperience),
          expertRemarks,
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
    <div className="min-h-screen bg-black text-white p-8">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
            EXPERT ASSESSMENT FORM
          </h1>
          <p className="text-gray-300" style={{ fontFamily: 'monospace' }}>
            Project: {project.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Expert Information */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              EXPERT INFORMATION
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2" style={{ fontFamily: 'monospace' }}>Name *</label>
                <input
                  type="text"
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2" style={{ fontFamily: 'monospace' }}>Email *</label>
                <input
                  type="email"
                  value={expertEmail}
                  onChange={(e) => setExpertEmail(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2" style={{ fontFamily: 'monospace' }}>Qualification *</label>
                <input
                  type="text"
                  value={expertQualification}
                  onChange={(e) => setExpertQualification(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2" style={{ fontFamily: 'monospace' }}>Years of Experience *</label>
                <input
                  type="number"
                  value={expertYearsOfExperience}
                  onChange={(e) => setExpertYearsOfExperience(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              INSTRUCTIONS
            </h2>
            <div className="text-white space-y-3" style={{ fontFamily: 'monospace' }}>
              <p className="font-bold">Dear Expert,</p>
              <p>
                Thank you for participating in this {project.type === 'delphi' ? 'Delphi study' : 'face validation study'}. Your expertise is invaluable in ensuring the quality and validity of this translated instrument.
              </p>
              <p className="font-bold mt-4">Please follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Review the <strong>Original Scale Items</strong> (in English) to understand the intended meaning of each item.</li>
                <li>Review the <strong>Translated Scale Items</strong> (in Sinhala) to see how each item has been translated.</li>
                {project.type === 'delphi' ? (
                  <>
                    <li>Familiarize yourself with the <strong>5 Delphi Validation Criteria</strong> listed below.</li>
                    <li>In the <strong>Evaluation Matrix</strong>, rate each translated item on a scale of <strong>1-9</strong> for each criterion.</li>
                    <li>Ensure you complete ALL evaluations before submitting the form.</li>
                  </>
                ) : (
                  <>
                    <li>Familiarize yourself with the <strong>10 Face Validity Criteria</strong> listed below.</li>
                    <li>In the <strong>Evaluation Matrix</strong>, assess each translated item against ALL 10 criteria.</li>
                    <li>For each item-criterion combination, select <strong>YES</strong> if the criterion is met, or <strong>NO</strong> if it is not.</li>
                    <li>Ensure you complete ALL evaluations before submitting the form.</li>
                  </>
                )}
              </ol>
              <p className="mt-4 text-yellow-300">
                ⚠ Note: You must evaluate all {project.translatedScaleItems?.length || 0} items against all {project.type === 'delphi' ? '5' : '10'} criteria
                (total {(project.translatedScaleItems?.length || 0) * (project.type === 'delphi' ? 5 : 10)} evaluations required).
              </p>
            </div>
          </div>

          {/* Criteria Section - Conditional based on project type */}
          {project.type === 'face-validity' ? (
            <div className="bg-black bg-opacity-80 border-2 border-green-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #22C55E' }}>
                FACE VALIDITY CRITERIA
              </h2>
              <p className="text-white mb-4" style={{ fontFamily: 'monospace' }}>
                Please evaluate each item based on the following 10 criteria:
              </p>
              <div className="space-y-2">
                {FACE_VALIDITY_CRITERIA.map((criterion) => (
                  <div key={criterion.id} className="flex items-start gap-3 p-3 bg-black bg-opacity-50 border border-green-700 rounded">
                    <span className="text-green-400 font-bold min-w-[60px]" style={{ fontFamily: 'monospace' }}>
                      C{criterion.id}:
                    </span>
                    <span className="text-white" style={{ fontFamily: 'monospace' }}>
                      {criterion.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-black bg-opacity-80 border-2 border-orange-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-orange-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #F97316' }}>
                DELPHI VALIDATION CRITERIA
              </h2>
              <p className="text-white mb-4" style={{ fontFamily: 'monospace' }}>
                Please rate each item on a scale of 1-9 based on the following criteria:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black bg-opacity-50 border-2 border-purple-500 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-400 mb-3" style={{ fontFamily: 'monospace' }}>
                    Content-related validation
                  </h3>
                  <div className="space-y-2">
                    {DELPHI_CRITERIA.filter(c => c.category === 'content').map((criterion) => (
                      <div key={criterion.id} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold" style={{ fontFamily: 'monospace' }}>
                          C{criterion.id}:
                        </span>
                        <span className="text-white text-sm" style={{ fontFamily: 'monospace' }}>
                          {criterion.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-black bg-opacity-50 border-2 border-pink-500 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-pink-400 mb-3" style={{ fontFamily: 'monospace' }}>
                    Consensual-related validation
                  </h3>
                  <div className="space-y-2">
                    {DELPHI_CRITERIA.filter(c => c.category === 'consensual').map((criterion) => (
                      <div key={criterion.id} className="flex items-start gap-2">
                        <span className="text-pink-400 font-bold" style={{ fontFamily: 'monospace' }}>
                          C{criterion.id}:
                        </span>
                        <span className="text-white text-sm" style={{ fontFamily: 'monospace' }}>
                          {criterion.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scale Instructions (if provided) */}
          {project.scaleInstructions && (
            <div className="bg-black bg-opacity-80 border-2 border-green-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00FF00' }}>
                📋 SCALE INSTRUCTIONS
              </h2>
              <div className="text-white whitespace-pre-wrap" style={{ fontFamily: 'monospace', lineHeight: '1.8' }}>
                {project.scaleInstructions}
              </div>
            </div>
          )}

          {/* Scoring System (if provided) */}
          {project.scoringSystem && (
            <div className="bg-black bg-opacity-80 border-2 border-green-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00FF00' }}>
                📊 SCORING SYSTEM
              </h2>
              <div className="text-white whitespace-pre-wrap" style={{ fontFamily: 'monospace', lineHeight: '1.8' }}>
                {project.scoringSystem}
              </div>
            </div>
          )}

          {/* Original Scale Items */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              ORIGINAL SCALE (English)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-blue-500">
                    <th className="text-left p-3 text-white" style={{ fontFamily: 'monospace' }}>Item #</th>
                    <th className="text-left p-3 text-white" style={{ fontFamily: 'monospace' }}>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {project.originalScaleItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-blue-700">
                      <td className="p-3 text-white" style={{ fontFamily: 'monospace' }}>{idx + 1}</td>
                      <td className="p-3 text-white" style={{ fontFamily: 'monospace' }}>{item.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Translated Scale Items */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              TRANSLATED SCALE (Sinhala)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-blue-500">
                    <th className="text-left p-3 text-white" style={{ fontFamily: 'monospace' }}>Item #</th>
                    <th className="text-left p-3 text-white" style={{ fontFamily: 'monospace' }}>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {project.translatedScaleItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-blue-700">
                      <td className="p-3 text-white" style={{ fontFamily: 'monospace' }}>{idx + 1}</td>
                      <td className="p-3 text-white" style={{ fontFamily: 'monospace' }}>{item.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evaluation Matrix - Conditional based on project type */}
          {project.type === 'face-validity' ? (
            <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                EVALUATION MATRIX
              </h2>
              <p className="text-white mb-4" style={{ fontFamily: 'monospace' }}>
                For each translated item, evaluate against all 10 criteria:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-blue-500">
                      <th className="p-2 text-left text-white" style={{ fontFamily: 'monospace' }}>Item</th>
                      {FACE_VALIDITY_CRITERIA.map(criteria => (
                        <th key={criteria.id} className="p-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                          C{criteria.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {project.translatedScaleItems.map((item, itemIdx) => (
                      <tr key={item.id} className="border-b border-blue-700">
                        <td className="p-2 text-white" style={{ fontFamily: 'monospace' }}>
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
            </div>
          ) : (
            <div className="bg-black bg-opacity-80 border-2 border-orange-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-orange-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #F97316' }}>
                DELPHI EVALUATION MATRIX
              </h2>
              <p className="text-white mb-4" style={{ fontFamily: 'monospace' }}>
                Rate each item on a scale of 1-9 for each criterion (1 = Lowest, 9 = Highest):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border-2 border-orange-500 text-sm">
                  <thead>
                    <tr className="bg-orange-900 bg-opacity-50">
                      <th rowSpan="2" className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>
                        Items in HWIS E
                      </th>
                      <th colSpan="3" className="border-2 border-orange-500 p-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                        Content-related validation
                      </th>
                      <th colSpan="2" className="border-2 border-orange-500 p-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                        Consensual-related validation
                      </th>
                    </tr>
                    <tr className="bg-orange-900 bg-opacity-30">
                      <th className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                        Appropriateness of language used
                      </th>
                      <th className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                        Assessment of the concept
                      </th>
                      <th className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                        Retains the conceptual meaning
                      </th>
                      <th className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                        Appropriateness with the individuals of 18 years and above
                      </th>
                      <th className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                        Cultural relevance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.translatedScaleItems.map((item, itemIdx) => (
                      <tr key={item.id} className="border-b border-orange-700 bg-black bg-opacity-60">
                        <td className="border-2 border-orange-500 p-3 text-white font-bold" style={{ fontFamily: 'monospace' }}>
                          Item {itemIdx + 1}
                        </td>
                        {DELPHI_CRITERIA.map(criteria => {
                          const key = `item${itemIdx}_criteria${criteria.id}`
                          return (
                            <td key={criteria.id} className="border-2 border-orange-500 p-2 text-center">
                              <select
                                value={responses[key] || ''}
                                onChange={(e) => handleDelphiRatingChange(itemIdx, criteria.id, e.target.value)}
                                className="w-full bg-black border-2 border-orange-600 rounded px-2 py-1 text-white text-center focus:outline-none focus:border-orange-400"
                                style={{ fontFamily: 'monospace' }}
                                required
                              >
                                <option value="">-</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(rating => (
                                  <option key={rating} value={rating}>{rating}</option>
                                ))}
                              </select>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-orange-300 text-sm" style={{ fontFamily: 'monospace' }}>
                <p>📊 Rating Scale: 1 = Strongly Disagree / Not Appropriate, 9 = Strongly Agree / Highly Appropriate</p>
              </div>
            </div>
          )}

          {/* Expert Remarks */}
          <div className="bg-black bg-opacity-80 border-2 border-yellow-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FFD700' }}>
              💬 EXPERT REMARKS (OPTIONAL)
            </h2>
            <p className="text-yellow-300 mb-4" style={{ fontFamily: 'monospace' }}>
              Please provide any additional comments, suggestions, or observations about the scale, items, or translation quality.
            </p>
            <textarea
              value={expertRemarks}
              onChange={(e) => setExpertRemarks(e.target.value)}
              className="w-full px-4 py-3 bg-black border-2 border-yellow-500 rounded text-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 placeholder-yellow-700"
              placeholder="Enter your remarks here..."
              rows={6}
              style={{ fontFamily: 'monospace' }}
            />
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
