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

function ExpertAssessment({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [expertName, setExpertName] = useState('')
  const [expertEmail, setExpertEmail] = useState('')
  const [expertQualification, setExpertQualification] = useState('')
  const [expertYearsOfExperience, setExpertYearsOfExperience] = useState('')
  const [responses, setResponses] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    // Matrix rain effect
    const canvas = canvasRef.current
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
    // Fetch project details
    const fetchProject = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          console.log('=== FETCHED PROJECT DATA ===')
          console.log('Full data:', data)
          console.log('translatedScaleItems length:', data.translatedScaleItems?.length)
          console.log('originalScaleItems:', data.originalScaleItems)
          console.log('Has originalScaleItems?', 'originalScaleItems' in data)
          setProject(data)
        } else {
          toast.error('Project not found')
        }
      } catch (err) {
        toast.error('Failed to load project')
      }
    }

    fetchProject()
  }, [projectId])

  const handleResponseChange = (itemIndex, criteriaId, value) => {
    const key = `item${itemIndex}_criteria${criteriaId}`
    setResponses(prev => ({
      ...prev,
      [key]: value === 'yes' ? 1 : 0
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!expertName || !expertEmail || !expertQualification || !expertYearsOfExperience) {
      toast.error('Please fill in all expert details')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/expert-response/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expertName,
          expertEmail,
          expertQualification,
          expertYearsOfExperience: parseInt(expertYearsOfExperience),
          responses
        })
      })

      if (res.ok) {
        toast.success('Response submitted successfully!')
        setHasSubmitted(true)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit response')
      }
    } catch (err) {
      toast.error('Failed to submit response')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-blue-400 flex items-center justify-center">
        <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />
        <p style={{ fontFamily: 'monospace' }}>LOADING...</p>
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
    <div className="min-h-screen bg-black text-blue-400">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />

      <div className="relative z-10">
        {/* Header */}
        <div className="bg-black bg-opacity-80 border-b-2 border-blue-400 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold text-blue-400" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              KAPPA Collector
            </h1>
            <p className="text-blue-300 mt-2" style={{ fontFamily: 'monospace' }}>
              {project.type === 'delphi' ? 'DELPHI METHOD ASSESSMENT' : 'FACE VALIDITY ASSESSMENT'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Expert Info Form */}
          <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 mb-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
            <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              EXPERT INFORMATION
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-blue-400 mb-2 font-bold" style={{ fontFamily: 'monospace' }}>
                  NAME:
                </label>
                <input
                  type="text"
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter your name"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-blue-400 mb-2 font-bold" style={{ fontFamily: 'monospace' }}>
                  EMAIL:
                </label>
                <input
                  type="email"
                  value={expertEmail}
                  onChange={(e) => setExpertEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter your email"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-blue-400 mb-2 font-bold" style={{ fontFamily: 'monospace' }}>
                  QUALIFICATION:
                </label>
                <input
                  type="text"
                  value={expertQualification}
                  onChange={(e) => setExpertQualification(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="e.g., PhD in Psychology"
                  style={{ fontFamily: 'monospace' }}
                  required
                />
              </div>
              <div>
                <label className="block text-blue-400 mb-2 font-bold" style={{ fontFamily: 'monospace' }}>
                  YEARS OF EXPERIENCE:
                </label>
                <input
                  type="number"
                  value={expertYearsOfExperience}
                  onChange={(e) => setExpertYearsOfExperience(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="Enter years of experience"
                  style={{ fontFamily: 'monospace' }}
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Instructions for Experts */}
          {project.type === 'face-validity' && (
            <div className="bg-gradient-to-r from-orange-900 to-red-900 bg-opacity-60 border-4 border-orange-400 rounded-lg p-6 mb-6 backdrop-blur-sm" style={{ boxShadow: '0 0 30px rgba(251, 146, 60, 0.5)' }}>
              <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center" style={{ fontFamily: 'monospace', textShadow: '0 0 15px #FB923C' }}>
                ⚠️ INSTRUCTIONS FOR EXPERTS
              </h2>
              <div className="bg-black bg-opacity-50 border-2 border-orange-500 rounded-lg p-5">
                <div className="space-y-3 text-orange-200" style={{ fontFamily: 'monospace' }}>
                  <p className="text-lg font-bold text-orange-300">
                    📋 Please read carefully before proceeding:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li className="text-orange-100">
                      <span className="font-bold text-orange-300">Review Both Scales:</span> Carefully examine the <span className="text-blue-400 font-bold">Original Scale</span> and the <span className="text-purple-400 font-bold">Translated Scale (Sinhala)</span> provided below.
                    </li>
                    <li className="text-orange-100">
                      <span className="font-bold text-orange-300">Evaluate Translation Quality:</span> Compare each item in the <span className="text-purple-400 font-bold">Translated Scale</span> against the corresponding item in the <span className="text-blue-400 font-bold">Original Scale</span>.
                    </li>
                    <li className="text-orange-100">
                      <span className="font-bold text-orange-300">Use 10 Criteria:</span> Evaluate each translated item based on the <span className="text-green-400 font-bold">10 Face Validity Criteria (C1-C10)</span> listed on the left side of the evaluation table.
                    </li>
                    <li className="text-orange-100">
                      <span className="font-bold text-orange-300">Mark Your Agreement:</span> For each item and criterion combination, mark <span className="text-green-400 font-bold">YES</span> if you agree the translation meets the criterion, or <span className="text-red-400 font-bold">NO</span> if it does not.
                    </li>
                    <li className="text-orange-100">
                      <span className="font-bold text-orange-300">Complete All Responses:</span> You must answer <span className="text-yellow-400 font-bold">ALL 120 responses</span> (12 items × 10 criteria) before submitting.
                    </li>
                    <li className="text-orange-100">
                      <span className="font-bold text-orange-300">One Submission Only:</span> You can only submit your evaluation <span className="text-red-400 font-bold">ONCE</span>. Please review all your responses before submitting.
                    </li>
                  </ol>
                  <div className="mt-4 pt-4 border-t-2 border-orange-500">
                    <p className="text-center text-orange-300 font-bold text-lg">
                      ✅ Take your time and evaluate each item carefully!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Form - Face Validity */}
          {project.type === 'face-validity' && (
            <form onSubmit={handleSubmit}>
              {project.translatedScaleItems?.length > 0 && (
                <>
                  {/* Two Scale Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Original Scale Table */}
                    <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
                      <h3 className="text-xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #3B82F6' }}>
                        ORIGINAL SCALE ({project.originalScaleItems?.length || 0} items)
                      </h3>
                      <div className="overflow-y-auto max-h-96">
                        {project.originalScaleItems?.length > 0 ? (
                          <table className="w-full border-2 border-blue-400">
                            <thead className="sticky top-0 bg-blue-600">
                              <tr>
                                <th className="border border-blue-400 px-3 py-2 text-white text-center" style={{ fontFamily: 'monospace' }}>
                                  #
                                </th>
                                <th className="border border-blue-400 px-3 py-2 text-white text-left" style={{ fontFamily: 'monospace' }}>
                                  ITEM TEXT
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {project.originalScaleItems.map((item, index) => (
                                <tr key={item.id} className="bg-black bg-opacity-60">
                                  <td className="border border-blue-400 px-3 py-2 text-blue-400 font-bold text-center" style={{ fontFamily: 'monospace' }}>
                                    {index + 1}
                                  </td>
                                  <td className="border border-blue-400 px-3 py-2 text-blue-200" style={{ fontFamily: 'monospace' }}>
                                    {item.text}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-blue-300 text-center py-4" style={{ fontFamily: 'monospace' }}>
                            No original scale items available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Translated Scale Table */}
                    <div className="bg-black bg-opacity-80 border-2 border-purple-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' }}>
                      <h3 className="text-xl font-bold text-purple-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #A855F7' }}>
                        TRANSLATED SCALE
                      </h3>
                      <div className="overflow-y-auto max-h-96">
                        <table className="w-full border-2 border-purple-400">
                          <thead className="sticky top-0 bg-purple-600">
                            <tr>
                              <th className="border border-purple-400 px-3 py-2 text-white text-center" style={{ fontFamily: 'monospace' }}>
                                #
                              </th>
                              <th className="border border-purple-400 px-3 py-2 text-white text-left" style={{ fontFamily: 'monospace' }}>
                                ITEM TEXT
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {project.translatedScaleItems?.map((item, index) => (
                              <tr key={item.id} className="bg-black bg-opacity-60">
                                <td className="border border-purple-400 px-3 py-2 text-purple-400 font-bold text-center" style={{ fontFamily: 'monospace' }}>
                                  {index + 1}
                                </td>
                                <td className="border border-purple-400 px-3 py-2 text-purple-200" style={{ fontFamily: 'monospace' }}>
                                  {item.text}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Evaluation Form */}
                  <div className="bg-black bg-opacity-80 border-2 border-green-400 rounded-lg p-6 backdrop-blur-sm mb-6" style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}>
                    <h2 className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #22C55E' }}>
                      FACE VALIDITY EVALUATION
                    </h2>
                    <p className="text-green-300 mb-6" style={{ fontFamily: 'monospace' }}>
                      Evaluate each criterion (C1-C10) for all translated scale items with YES/NO responses.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Criteria Descriptions */}
                    <div className="lg:col-span-1">
                      <div className="bg-green-900 bg-opacity-30 border-2 border-green-500 rounded-lg p-4 sticky top-4">
                        <h3 className="text-lg font-bold text-green-400 mb-3" style={{ fontFamily: 'monospace' }}>
                          CRITERIA DESCRIPTIONS
                        </h3>
                        <div className="space-y-2 text-sm">
                          {FACE_VALIDITY_CRITERIA.map((criteria) => (
                            <div key={criteria.id} className="text-green-300" style={{ fontFamily: 'monospace' }}>
                              <span className="font-bold text-green-400">C{criteria.id}:</span> {criteria.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Table */}
                    <div className="lg:col-span-2">
                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-green-400">
                          <thead>
                            <tr className="bg-green-600">
                              <th className="border border-green-400 px-3 py-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                                CRITERIA
                              </th>
                              {project.translatedScaleItems?.map((_, index) => (
                                <th key={`item-${index}`} className="border border-green-400 px-3 py-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                                  ITEM {index + 1}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {FACE_VALIDITY_CRITERIA.map((criteria) => (
                              <tr key={criteria.id} className="bg-black bg-opacity-60">
                                <td className="border border-green-400 px-3 py-2 text-center text-green-400 font-bold" style={{ fontFamily: 'monospace' }}>
                                  C{criteria.id}
                                </td>
                                {/* Translated Scale Items Only */}
                                {project.translatedScaleItems?.map((_, itemIndex) => (
                                  <td key={`item-${itemIndex}`} className="border border-green-400 px-2 py-2 text-center">
                                    <div className="flex justify-center gap-2">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`c${criteria.id}-item${itemIndex}`}
                                          value="yes"
                                          onChange={() => {
                                            setResponses(prev => ({
                                              ...prev,
                                              [`item${itemIndex}_criteria${criteria.id}`]: 1
                                            }))
                                          }}
                                          className="w-4 h-4"
                                          disabled={hasSubmitted}
                                        />
                                        <span className="text-green-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>Y</span>
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`c${criteria.id}-item${itemIndex}`}
                                          value="no"
                                          onChange={() => {
                                            setResponses(prev => ({
                                              ...prev,
                                              [`item${itemIndex}_criteria${criteria.id}`]: 0
                                            }))
                                          }}
                                          className="w-4 h-4"
                                          disabled={hasSubmitted}
                                        />
                                        <span className="text-red-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>N</span>
                                      </label>
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 text-center">
                        <p className="text-green-400 text-sm" style={{ fontFamily: 'monospace' }}>
                          Answered: {Object.keys(responses).length} / 120
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || hasSubmitted}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                  >
                    {hasSubmitted ? 'ALREADY SUBMITTED' : isSubmitting ? 'SUBMITTING...' : 'SUBMIT RESPONSE'}
                  </button>
                </>
              )}
            </form>
          )}

          {/* Assessment Form - Delphi Method */}
          {project.type === 'delphi' && (
            <form onSubmit={handleSubmit}>
              <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 mb-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                <h2 className="text-2xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                  DELPHI METHOD EVALUATION
                </h2>
                <p className="text-blue-300 mb-6" style={{ fontFamily: 'monospace' }}>
                  Please provide your expert opinion on each item.
                </p>

                {/* Items will be loaded from project data */}
                <div className="space-y-4">
                  <p className="text-blue-400" style={{ fontFamily: 'monospace' }}>
                    Assessment items will be displayed here...
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-500 transition border-2 border-green-600"
                style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT RESPONSE'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExpertAssessment

