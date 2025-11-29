import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const ORIGINAL_SCALE = [
  { id: 1, text: 'I feel mentally exhausted - I feel mentally exhausted' },
  { id: 2, text: 'I have difficulty regaining my energy- I find it hard to recover my energy' },
  { id: 3, text: 'My body is tired- I feel physically exhausted' },
  { id: 4, text: 'I get exhausted trying to find any enthusiasm for my duties.-I struggle to find any enthusiasm for my  work' },
  { id: 5, text: 'I feel very disgusted with my work- I feel a strong aversion towards my job' },
  { id: 6, text: 'I have a pessimistic view about what others think of my work.- I\'m cynical about what my work means to others' },
  { id: 7, text: 'I feel like I am unable to control my emotions- I feel unable to control my emotions' },
  { id: 8, text: 'I have difficulty understanding myself based on the way I respond to emotions.- I do not recognize myself in the way I react emotionally' },
  { id: 9, text: 'I may unintentionally react more than necessary.- I may overreact unintentionally' },
  { id: 10, text: 'I have difficulty maintaining my attention - I have trouble staying focused' },
  { id: 11, text: 'I have difficulty thinking clearly- I have trouble concentrating' },
  { id: 12, text: 'I make mistakes because my mind is focused on other things- I make mistakes because I have my mind on other things' }
]

const TRANSLATED_VERSION = [
  { id: 1, text: 'මට මානසිකව වෙහෙසක් දැනෙන්වා' },
  { id: 2, text: 'මගේ ශක්තිය නැවත ලබා ගැනීමට අපහසුයි' },
  { id: 3, text: 'මගේ ඇගට වෙහෙසයි' },
  { id: 4, text: 'මාගේ රාජකාරි උදෙසා කිසියම් හෝ උද්යෝගීමත් භාවයක් සොයා ගැනීමට මම වෙහෙසෙනවා' },
  { id: 5, text: 'මට රාජකාරිය ගැන දැඩි පිලිකුල් සහගත බවක් දැනෙන්වා' },
  { id: 6, text: 'මගේ රාජකාරිය ගැන අනෙක් අය හිතන විදිහ පිලිබදව මට අසුභවාදී අදහසක් පවතිනවා' },
  { id: 7, text: 'මට හැගීම් පාලනය කරගන්න බැරි බවක් දැනෙනවා' },
  { id: 8, text: 'මා හැගීම වලට ප්‍රතිචාර දක්වන විදිය අනුව මට මාව අදුරගන්න අමාරුයි.' },
  { id: 9, text: 'මම නොදැනුවත්ව ඕනෑවට වඩා ප්‍රතිචාර දක්වනවා වෙන්න පුලුවන්' },
  { id: 10, text: 'මට අවධානය පවත්වා ගැනීමට අපහසුයි' },
  { id: 11, text: 'මට නිසි කල්පනාවෙන් කටයුතු කිරීමට අපහසුයි' },
  { id: 12, text: 'මාගේ මනස වෙනත් දේවල් වලට යොමු වන නිසා මා අතපසුවිම් සිදුකරනවා' }
]

const EVALUATION_QUESTIONS = [
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

function Assessment({ user, onLogout }) {
  const [evaluationResponses, setEvaluationResponses] = useState({})
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [fontSize, setFontSize] = useState(16) // Base font size in pixels

  // Check if user already submitted evaluation
  useEffect(() => {
    const checkExistingEvaluation = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:4000/api/evaluation/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.responses) {
            setIsSubmitted(true)
            // Pre-fill responses if already submitted
            setEvaluationResponses(data.responses)
            if (data.remarks) {
              setRemarks(data.remarks)
            }
          }
        }
      } catch (err) {
        // User hasn't submitted yet, which is fine
        console.log('No existing evaluation found')
      }
    }

    if (user?.id) {
      checkExistingEvaluation()
    }
  }, [user?.id])

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24)) // Max font size of 24px
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12)) // Min font size of 12px
  }

  const resetFontSize = () => {
    setFontSize(16) // Reset to base font size
  }

  const handleEvaluationChange = (questionId, value) => {
    if (isSubmitted) return // Prevent changes if already submitted
    setEvaluationResponses(prev => ({
      ...prev,
      [questionId]: value === 'yes' ? 1 : 0
    }))
  }

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitted) {
      toast.error('You have already submitted your evaluation. Only one submission is allowed.')
      return
    }
    
    // Check if all questions are answered
    const unanswered = EVALUATION_QUESTIONS.filter(q => evaluationResponses[q.id] === undefined)
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. Missing: ${unanswered.map(q => q.id).join(', ')}`)
      return
    }

    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem('token')
      const responseData = {
        userId: user.id,
        responses: evaluationResponses,
        remarks: remarks.trim()
      }

      const response = await fetch('http://localhost:4000/api/evaluation/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(responseData)
      })

      const data = await response.json()
      
      if (data.error) {
        toast.error(data.error)
        setIsSubmitting(false)
        return
      }

      setIsSubmitted(true)
      setShowThankYou(true)
    } catch (err) {
      toast.error('Failed to submit evaluation. Please try again.')
      console.error(err)
      setIsSubmitting(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeThankYou = () => {
    setShowThankYou(false)
  }
    return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '2rem 0',
        fontSize: `${fontSize}px`
      }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#3a0ca3', margin: 0, marginBottom: '0.5rem' }}>
              BAT-12 – Face Validity Evaluation
            </h1>
            <p style={{ color: '#555', margin: 0 }}>
              කායිකව හා මානසිකව විඩාවට පත්වීමේ කෙටි ඇගයුම් මෙවලම -12
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Font Size Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f8f9fa',
              padding: '0.5rem',
              borderRadius: '5px'
            }}>
              <button
                type="button"
                onClick={decreaseFontSize}
                disabled={fontSize <= 12}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: fontSize <= 12 ? '#ccc' : '#4361ee',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: fontSize <= 12 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
                title="Decrease font size"
              >
                A-
              </button>
              <span style={{
                  fontSize: '0.9rem',
                  color: '#555',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={increaseFontSize}
                disabled={fontSize >= 24}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: fontSize >= 24 ? '#ccc' : '#4361ee',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: fontSize >= 24 ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
                title="Increase font size"
              >
                A+
              </button>
              {fontSize !== 16 && (
                <button
                  type="button"
                  onClick={resetFontSize}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: '#777',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    marginLeft: '0.3rem'
                  }}
                  title="Reset font size"
                >
                  Reset
                </button>
              )}
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: '0.6rem 1.5rem',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Side by Side Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Side - Original Scale */}
        <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ 
                color: '#3a0ca3', 
                marginBottom: '1.5rem',
                paddingBottom: '0.5rem',
              borderBottom: '2px solid #4361ee',
              fontSize: '1.5rem'
              }}>
              Original Scale
              </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ORIGINAL_SCALE.map((item) => {
                const parts = item.text.split('-')
                const firstPart = parts[0].trim()
                const secondPart = parts.length > 1 ? parts[1].trim() : null
                return (
                  <div key={item.id} style={{
                    padding: '1rem',
                  background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4361ee'
                }}>
                    <div style={{ 
                      color: '#333',
                      fontSize: '0.95rem',
                      lineHeight: '1.6'
                    }}>
                      {item.id}. <strong>{firstPart}</strong>
                      {secondPart && (
                        <span style={{ 
                          color: '#555',
                          marginLeft: '0.5rem'
                        }}>
                          - {secondPart}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
                          </div>
                        </div>

          {/* Right Side - Translated Version */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ 
              color: '#3a0ca3', 
              marginBottom: '1.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #4361ee',
              fontSize: '1.5rem'
            }}>
              Translated Version
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {TRANSLATED_VERSION.map((item) => (
                <div key={item.id} style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4361ee'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#333',
                    fontSize: '1rem',
                    lineHeight: '1.6'
                  }}>
                    {item.id}. {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evaluation Form */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '10px',
          marginTop: '2rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          opacity: isSubmitted ? 0.7 : 1,
          position: 'relative'
        }}>
          {isSubmitted && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(67, 97, 238, 0.95)',
              color: 'white',
              padding: '1.5rem 2.5rem',
              borderRadius: '10px',
              zIndex: 10,
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                ✓ Evaluation Submitted
              </div>
              <div style={{ fontSize: '1rem' }}>
                You have already submitted your evaluation.
              </div>
            </div>
          )}
          <h2 style={{ 
            color: '#3a0ca3', 
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid #4361ee',
            fontSize: '1.5rem'
          }}>
            Table 2: Illustration of Response Sheet
          </h2>
          
          <form onSubmit={handleEvaluationSubmit}>
            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '1.5rem'
              }}>
                <thead>
                  <tr style={{
                    background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
                    color: 'white'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      border: '1px solid #ddd',
                      fontWeight: 600
                    }}>
                      Sr. No.
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      border: '1px solid #ddd',
                      fontWeight: 600
                    }}>
                      Criteria to rate
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      fontWeight: 600,
                      width: '200px'
                    }}>
                      Answer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_QUESTIONS.map((question, index) => (
                    <tr 
                      key={question.id}
                      style={{
                        background: index % 2 === 0 ? '#f8f9fa' : '#ffffff'
                      }}
                    >
                      <td style={{
                        padding: '1rem',
                        border: '1px solid #ddd',
                        fontWeight: 600,
                        color: '#333'
                      }}>
                        Que.: {String(question.id).padStart(2, '0')}
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: '1px solid #ddd',
                        color: '#333'
                      }}>
                        {question.text}
                      </td>
                      <td style={{
                        padding: '1rem',
                        border: '1px solid #ddd',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '2rem'
                        }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            gap: '0.5rem'
                          }}>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value="yes"
                              checked={evaluationResponses[question.id] === 1}
                              onChange={(e) => handleEvaluationChange(question.id, e.target.value)}
                              disabled={isSubmitted}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: isSubmitted ? 'not-allowed' : 'pointer',
                                opacity: isSubmitted ? 0.6 : 1
                              }}
                            />
                            <span style={{ color: '#333', opacity: isSubmitted ? 0.6 : 1 }}>Yes</span>
                          </label>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: isSubmitted ? 'not-allowed' : 'pointer',
                            gap: '0.5rem'
                          }}>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value="no"
                              checked={evaluationResponses[question.id] === 0}
                              onChange={(e) => handleEvaluationChange(question.id, e.target.value)}
                              disabled={isSubmitted}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: isSubmitted ? 'not-allowed' : 'pointer',
                                opacity: isSubmitted ? 0.6 : 1
                              }}
                            />
                            <span style={{ color: '#333', opacity: isSubmitted ? 0.6 : 1 }}>No</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Remarks Section */}
            <div style={{
              marginTop: '2rem',
              marginBottom: '1.5rem'
            }}>
              <label style={{
                display: 'block',
                marginBottom: '0.8rem',
                fontWeight: 600,
                color: '#3a0ca3',
                fontSize: '1.1rem'
              }}>
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isSubmitted}
                placeholder="Enter any additional remarks or comments here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  opacity: isSubmitted ? 0.6 : 1,
                  cursor: isSubmitted ? 'not-allowed' : 'text',
                  background: isSubmitted ? '#f8f9fa' : 'white'
                }}
              />
              {isSubmitted && (
                <p style={{
                  marginTop: '0.5rem',
                  color: '#777',
                  fontSize: '0.9rem',
                  fontStyle: 'italic'
                }}>
                  Remarks are read-only after submission
                </p>
              )}
            </div>

          {/* Submit Button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              type="submit"
                disabled={isSubmitting || isSubmitted || Object.keys(evaluationResponses).length < EVALUATION_QUESTIONS.length}
              style={{
                  padding: '0.8rem 2.5rem',
                  background: isSubmitted || Object.keys(evaluationResponses).length < EVALUATION_QUESTIONS.length ? '#ccc' : '#4361ee',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                  fontSize: '1rem',
                fontWeight: 600,
                  cursor: isSubmitted || Object.keys(evaluationResponses).length < EVALUATION_QUESTIONS.length ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s'
              }}
            >
                {isSubmitting ? 'Submitting...' : isSubmitted ? 'Already Submitted' : 'Submit Evaluation'}
            </button>
            <div style={{ 
                marginTop: '0.8rem', 
              color: '#777',
              fontSize: '0.9rem'
            }}>
                {isSubmitted ? (
                  <span style={{ color: '#4361ee', fontWeight: 600 }}>Evaluation completed ✓</span>
                ) : (
                  `Answered: ${Object.keys(evaluationResponses).length} / ${EVALUATION_QUESTIONS.length}`
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Thank You Popup */}
        {showThankYou && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }} onClick={closeThankYou}>
            <div style={{
              background: 'white',
              padding: '3rem',
              borderRadius: '15px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
              animation: 'slideDown 0.3s ease-out'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{
                fontSize: '4rem',
                color: '#4361ee',
                marginBottom: '1rem'
              }}>
                ✓
              </div>
              <h2 style={{
                color: '#3a0ca3',
                marginBottom: '1rem',
                fontSize: '2rem'
              }}>
                Thank You!
              </h2>
              <p style={{
                color: '#555',
                fontSize: '1.1rem',
                marginBottom: '2rem',
                lineHeight: '1.6'
              }}>
                Your evaluation has been submitted successfully. 
                <br />
                <strong>Note: Only one submission is allowed per user.</strong>
              </p>
              <button
                onClick={closeThankYou}
                style={{
                  padding: '0.8rem 2rem',
                  background: '#4361ee',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#3a0ca3'}
                onMouseOut={(e) => e.target.style.background = '#4361ee'}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export default Assessment

