import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

function AdminDashboard({ user, onLogout }) {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(16)

  useEffect(() => {
    fetchEvaluations()
  }, [])

  const fetchEvaluations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:4000/api/admin/evaluations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch evaluations')
      }

      const data = await response.json()
      setEvaluations(data.evaluations || [])
    } catch (err) {
      toast.error('Failed to load evaluations')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24))
  }

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12))
  }

  const resetFontSize = () => {
    setFontSize(16)
  }

  // Calculate agreement percentage for each question
  const calculateQuestionAgreement = (questionNum) => {
    if (evaluations.length === 0) return 0
    
    const yesCount = evaluations.filter(evaluation => evaluation.responses[questionNum] === 1).length
    return Math.round((yesCount / evaluations.length) * 100)
  }

  // Calculate overall agreement percentage
  const calculateOverallAgreement = () => {
    if (evaluations.length === 0) return 0
    
    let totalAgreement = 0
    for (let q = 1; q <= 10; q++) {
      totalAgreement += calculateQuestionAgreement(q)
    }
    return Math.round(totalAgreement / 10)
  }

  const getAnswerText = (value) => {
    return value === 1 ? 'Yes' : value === 0 ? 'No' : '-'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', color: '#3a0ca3' }}>Loading...</div>
      </div>
    )
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
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 20px' }}>
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
                Admin Dashboard - Experts' Answer
              </h1>
              <p style={{ color: '#555', margin: 0 }}>
                View all expert evaluations and analytics
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

          {/* Statistics Summary */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            marginBottom: '2rem',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: '#4361ee' }}>
                {evaluations.length}
              </div>
              <div style={{ color: '#555', marginTop: '0.5rem' }}>Total Experts</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: '#4361ee' }}>
                {calculateOverallAgreement()}%
              </div>
              <div style={{ color: '#555', marginTop: '0.5rem' }}>Overall Agreement</div>
            </div>
          </div>

          {/* Expert Information Table */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            marginBottom: '2rem',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            overflowX: 'auto'
          }}>
            <h2 style={{
              color: '#3a0ca3',
              marginBottom: '1.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #4361ee',
              fontSize: '1.5rem'
            }}>
              Expert Information
            </h2>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '2px solid #333'
            }}>
              <thead>
                <tr style={{
                  background: '#ffa500',
                  color: '#333'
                }}>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Qualification
                  </th>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Total Experience (Years)
                  </th>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Profession
                  </th>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600
                  }}>
                    Remark(s)
                  </th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation, index) => (
                  <tr
                    key={evaluation.id}
                    style={{
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}
                  >
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      fontWeight: 600
                    }}>
                      {evaluation.userName || `C${index + 1}`}
                    </td>
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333'
                    }}>
                      {evaluation.userQualification || '-'}
                    </td>
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333'
                    }}>
                      {evaluation.userExperience || '-'}
                    </td>
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333'
                    }}>
                      {evaluation.userQualification || '-'}
                    </td>
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      maxWidth: '300px',
                      wordWrap: 'break-word'
                    }}>
                      {evaluation.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Main Table */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '2px solid #333'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
                  color: 'white'
                }}>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
                    zIndex: 10
                  }}>
                    Experts' Name
                  </th>
                  <th colSpan="10" style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    Experts' Answer
                  </th>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    Experts' Remarks
                  </th>
                  <th style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    Action taken for remark
                  </th>
                </tr>
                <tr style={{
                  background: '#e8e9ff',
                  color: '#3a0ca3'
                }}>
                  <th style={{
                    padding: '0.8rem',
                    border: '1px solid #333',
                    textAlign: 'left',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: '#e8e9ff',
                    zIndex: 10
                  }}></th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                    <th key={q} style={{
                      padding: '0.8rem',
                      border: '1px solid #333',
                      textAlign: 'center',
                      fontWeight: 600
                    }}>
                      Q{q}
                    </th>
                  ))}
                  <th style={{
                    padding: '0.8rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}></th>
                  <th style={{
                    padding: '0.8rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}></th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((evaluation, index) => (
                  <tr
                    key={evaluation.id}
                    style={{
                      background: index % 2 === 0 ? '#f8f9fa' : '#ffffff'
                    }}
                  >
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      fontWeight: 600,
                      position: 'sticky',
                      left: 0,
                      background: index % 2 === 0 ? '#f8f9fa' : '#ffffff',
                      zIndex: 5
                    }}>
                      C{index + 1} - {evaluation.userName}
                      {evaluation.userQualification && (
                        <div style={{ fontSize: '0.85em', color: '#777', fontWeight: 'normal', marginTop: '0.3rem' }}>
                          {evaluation.userQualification}
                        </div>
                      )}
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                      <td key={q} style={{
                        padding: '1rem',
                        border: '1px solid #333',
                        textAlign: 'center',
                        fontWeight: 600,
                        color: evaluation.responses[q] === 1 ? '#4bb543' : evaluation.responses[q] === 0 ? '#dc3545' : '#777'
                      }}>
                        {getAnswerText(evaluation.responses[q])}
                      </td>
                    ))}
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      maxWidth: '300px',
                      wordWrap: 'break-word'
                    }}>
                      {evaluation.remarks || '-'}
                    </td>
                    <td style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      textAlign: 'center'
                    }}>
                      -
                    </td>
                  </tr>
                ))}
                {/* Agreement Percentage Row */}
                <tr style={{
                  background: '#fff3cd',
                  fontWeight: 600
                }}>
                  <td style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: '#fff3cd',
                    zIndex: 5
                  }}>
                    % of per Question Agreement
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(q => (
                    <td key={q} style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#3a0ca3'
                    }}>
                      {calculateQuestionAgreement(q)}%
                    </td>
                  ))}
                  <td colSpan="2" style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}></td>
                </tr>
                {/* Overall Agreement Row */}
                <tr style={{
                  background: '#d1ecf1',
                  fontWeight: 600
                }}>
                  <td style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    fontWeight: 600,
                    position: 'sticky',
                    left: 0,
                    background: '#d1ecf1',
                    zIndex: 5
                  }}>
                    % of overall agreement
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(q => (
                    <td key={q} style={{
                      padding: '1rem',
                      border: '1px solid #333',
                      textAlign: 'center',
                      fontWeight: 600
                    }}></td>
                  ))}
                  <td style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#3a0ca3',
                    fontSize: '1.1em'
                  }}>
                    {calculateOverallAgreement()}%
                  </td>
                  <td colSpan="2" style={{
                    padding: '1rem',
                    border: '1px solid #333',
                    textAlign: 'center',
                    fontWeight: 600
                  }}></td>
                </tr>
              </tbody>
            </table>

            {/* Legend */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '5px',
              fontSize: '0.9em',
              color: '#555'
            }}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Legend:</div>
              <div>Y/N = Yes or No</div>
              <div>Action Taken for remark = Correction done or not for received remark(s).</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard

