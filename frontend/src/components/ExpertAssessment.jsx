import { useState, useEffect, useRef } from 'react'
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?'
    const fontSize = 16
    const columns = canvas.width / fontSize
    const drops = []

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#1E90FF'
      ctx.shadowBlur = 10
      ctx.shadowColor = '#1E90FF'
      ctx.font = fontSize + 'px monospace'

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)]
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
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

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true)
      setError(null)

      const apiUrl = 'https://kappa-collect-or.onrender.com'
      const fullUrl = `${apiUrl}/api/projects/${projectId}`

      console.log('=== FETCHING PROJECT ===')
      console.log('URL:', fullUrl)
      console.log('Project ID:', projectId)

      try {
        const res = await fetch(fullUrl)
        console.log('Status:', res.status)

        if (res.ok) {
          const data = await res.json()
          console.log('Project loaded:', data.name)
          setProject(data)
        } else {
          setError(`Failed to load project (Status: ${res.status})`)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(`Network error: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const handleResponseChange = (itemIndex, criteriaId, value) => {
    const key = `item${itemIndex}_criteria${criteriaId}`
    setResponses(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!expertName || !expertEmail || !expertQualification || !expertYearsOfExperience) {
      toast.error('Please fill in all expert information fields')
      return
    }

    const totalResponses = project.translatedScaleItems.length * 10
    const filledResponses = Object.keys(responses).length

    if (filledResponses < totalResponses) {
      toast.error(`Please complete all evaluations (${filledResponses}/${totalResponses} completed)`)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`https://kappa-collect-or.onrender.com/api/expert-response/${projectId}`, {
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

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
        <div className="bg-black bg-opacity-80 border-2 border-red-500 rounded-lg p-8 max-w-2xl text-center" style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}>
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

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-black text-blue-400 flex items-center justify-center">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
        <div className="bg-black bg-opacity-80 border-2 border-green-500 rounded-lg p-8 max-w-2xl" style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' }}>
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

  return (
    <div className="min-h-screen bg-black text-blue-400 p-8">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-8 mb-8" style={{ boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' }}>
          <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #1E90FF' }}>
            KAPPA COLLECTOR
          </h1>
          <p className="text-center text-blue-300 mb-6" style={{ fontFamily: 'monospace' }}>
            Face Validity Expert Assessment
          </p>

          <div className="border-t border-blue-500 pt-6">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              {project.name}
            </h2>
            <p className="text-blue-300 mb-4" style={{ fontFamily: 'monospace' }}>
              {project.description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-8 mb-8" style={{ boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' }}>
            <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              Expert Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                  Full Name *
                </label>
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
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                  Email *
                </label>
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
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                  Qualification *
                </label>
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
                <label className="block text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                  Years of Experience *
                </label>
                <input
                  type="number"
                  value={expertYearsOfExperience}
                  onChange={(e) => setExpertYearsOfExperience(e.target.value)}
                  className="w-full bg-black border-2 border-blue-500 rounded px-4 py-2 text-blue-400 focus:outline-none focus:border-blue-300"
                  style={{ fontFamily: 'monospace' }}
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          {project.type === 'face-validity' && (
            <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-8 mb-8" style={{ boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' }}>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                Instructions
              </h3>
              <div className="text-blue-300 space-y-2" style={{ fontFamily: 'monospace' }}>
                <p>• Please review both the Original Scale (English) and Translated Scale items below.</p>
                <p>• Evaluate each translated item against the 10 Face Validity criteria.</p>
                <p>• Select YES if the item meets the criterion, NO if it does not.</p>
                <p>• All evaluations must be completed before submission.</p>
              </div>
            </div>
          )}

          <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-8 mb-8" style={{ boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' }}>
            <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              Scale Items
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold mb-4 text-green-400" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #22C55E' }}>
                  Original Scale (English)
                </h4>
                <div className="space-y-3">
                  {project.originalScaleItems && project.originalScaleItems.map((item, index) => (
                    <div key={item.id} className="bg-black border border-green-500 rounded p-3">
                      <span className="text-green-400 font-bold" style={{ fontFamily: 'monospace' }}>
                        Item {index + 1}:
                      </span>
                      <span className="text-green-300 ml-2" style={{ fontFamily: 'monospace' }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold mb-4 text-yellow-400" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FBBF24' }}>
                  Translated Scale
                </h4>
                <div className="space-y-3">
                  {project.translatedScaleItems && project.translatedScaleItems.map((item, index) => (
                    <div key={item.id} className="bg-black border border-yellow-500 rounded p-3">
                      <span className="text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                        Item {index + 1}:
                      </span>
                      <span className="text-yellow-300 ml-2" style={{ fontFamily: 'monospace' }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {project.type === 'face-validity' && (
            <div className="bg-black bg-opacity-80 border-2 border-blue-500 rounded-lg p-8 mb-8" style={{ boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' }}>
              <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                Face Validity Evaluation
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-2 border-blue-500 bg-blue-900 bg-opacity-50 p-3 text-left" style={{ fontFamily: 'monospace' }}>
                        Criteria
                      </th>
                      {project.translatedScaleItems && project.translatedScaleItems.map((_, index) => (
                        <th key={index} className="border-2 border-blue-500 bg-blue-900 bg-opacity-50 p-3 text-center" style={{ fontFamily: 'monospace' }}>
                          Item {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FACE_VALIDITY_CRITERIA.map((criteria) => (
                      <tr key={criteria.id}>
                        <td className="border-2 border-blue-500 p-3 text-blue-300" style={{ fontFamily: 'monospace' }}>
                          <span className="font-bold text-blue-400">C{criteria.id}:</span> {criteria.text}
                        </td>
                        {project.translatedScaleItems && project.translatedScaleItems.map((_, itemIndex) => (
                          <td key={itemIndex} className="border-2 border-blue-500 p-3 text-center">
                            <div className="flex justify-center gap-4">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name={`item${itemIndex}_criteria${criteria.id}`}
                                  value="1"
                                  checked={responses[`item${itemIndex}_criteria${criteria.id}`] === 1}
                                  onChange={() => handleResponseChange(itemIndex, criteria.id, 1)}
                                  className="mr-2"
                                />
                                <span className="text-green-400" style={{ fontFamily: 'monospace' }}>YES</span>
                              </label>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="radio"
                                  name={`item${itemIndex}_criteria${criteria.id}`}
                                  value="0"
                                  checked={responses[`item${itemIndex}_criteria${criteria.id}`] === 0}
                                  onChange={() => handleResponseChange(itemIndex, criteria.id, 0)}
                                  className="mr-2"
                                />
                                <span className="text-red-400" style={{ fontFamily: 'monospace' }}>NO</span>
                              </label>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded border-2 border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'monospace', textShadow: '0 0 10px #1E90FF', boxShadow: '0 0 20px rgba(30, 144, 255, 0.5)' }}
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