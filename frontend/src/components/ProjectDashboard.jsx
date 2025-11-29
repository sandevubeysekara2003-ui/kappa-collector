import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'

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

function ProjectDashboard({ project, user, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [activeSubTab, setActiveSubTab] = useState('scales') // 'scales' or 'evaluation'
  const [originalScaleItems, setOriginalScaleItems] = useState([])
  const [translatedScaleItems, setTranslatedScaleItems] = useState([])
  const [isUploadingOriginal, setIsUploadingOriginal] = useState(false)
  const [isUploadingTranslated, setIsUploadingTranslated] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [evaluationResponses, setEvaluationResponses] = useState({})
  const [expertResponses, setExpertResponses] = useState([]) // Expert responses from backend
  const canvasRef = useRef(null)

  // Load scale items from project
  useEffect(() => {
    console.log('Project data:', project)
    console.log('Project type:', project.type)

    if (project.originalScaleItems) {
      setOriginalScaleItems(project.originalScaleItems)
    }
    if (project.translatedScaleItems) {
      setTranslatedScaleItems(project.translatedScaleItems)
    }
  }, [project])

  // Fetch expert responses when evaluation tab is active
  useEffect(() => {
    if (activeSubTab === 'evaluation' && project.type === 'face-validity') {
      const fetchExpertResponses = async () => {
        try {
          const token = localStorage.getItem('token')
          const res = await fetch(`http://localhost:4000/api/projects/${project.id}/expert-responses`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (res.ok) {
            const data = await res.json()
            setExpertResponses(data.expertResponses || [])
          }
        } catch (err) {
          console.error('Failed to fetch expert responses:', err)
        }
      }
      fetchExpertResponses()
    }
  }, [activeSubTab, project.id, project.type])

  // Save scale items to backend whenever they change
  useEffect(() => {
    const saveItems = async () => {
      try {
        const token = localStorage.getItem('token')
        await fetch(`http://localhost:4000/api/projects/${project.id}/items`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            originalScaleItems,
            translatedScaleItems
          })
        })
      } catch (err) {
        console.error('Failed to save items:', err)
      }
    }

    // Only save if items exist (not on initial load)
    if (originalScaleItems.length > 0 || translatedScaleItems.length > 0) {
      saveItems()
    }
  }, [originalScaleItems, translatedScaleItems, project.id])

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

    // Scientists working on validation
    const scientists = [
      { x: 150, y: 200, phase: 0, speed: 0.02 },
      { x: canvas.width - 250, y: 300, phase: Math.PI, speed: 0.025 },
      { x: canvas.width / 2, y: 450, phase: Math.PI / 2, speed: 0.03 }
    ]

    const drawScientist = (x, y, phase) => {
      ctx.save()

      // Head
      ctx.beginPath()
      ctx.arc(x, y, 15, 0, Math.PI * 2)
      ctx.fillStyle = '#00BFFF'
      ctx.fill()
      ctx.strokeStyle = '#1E90FF'
      ctx.lineWidth = 2
      ctx.stroke()

      // Body
      ctx.beginPath()
      ctx.moveTo(x, y + 15)
      ctx.lineTo(x, y + 45)
      ctx.strokeStyle = '#00BFFF'
      ctx.lineWidth = 3
      ctx.stroke()

      // Arms (animated)
      const armAngle = Math.sin(phase) * 0.3
      ctx.beginPath()
      ctx.moveTo(x, y + 25)
      ctx.lineTo(x - 20 + Math.cos(armAngle) * 5, y + 35 + Math.sin(armAngle) * 5)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x, y + 25)
      ctx.lineTo(x + 20 - Math.cos(armAngle) * 5, y + 35 - Math.sin(armAngle) * 5)
      ctx.stroke()

      // Legs
      ctx.beginPath()
      ctx.moveTo(x, y + 45)
      ctx.lineTo(x - 10, y + 70)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x, y + 45)
      ctx.lineTo(x + 10, y + 70)
      ctx.stroke()

      // Clipboard/Document
      ctx.fillStyle = '#1E90FF'
      ctx.fillRect(x + 15, y + 30, 25, 35)
      ctx.strokeStyle = '#00BFFF'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 15, y + 30, 25, 35)

      // Document lines
      ctx.strokeStyle = '#0080FF'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(x + 18, y + 35 + i * 5)
        ctx.lineTo(x + 37, y + 35 + i * 5)
        ctx.stroke()
      }

      // Validation checkmarks
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 18, y + 58)
      ctx.lineTo(x + 22, y + 62)
      ctx.lineTo(x + 30, y + 52)
      ctx.stroke()

      ctx.restore()
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Matrix rain
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

      // Draw scientists
      ctx.shadowBlur = 15
      ctx.shadowColor = '#00BFFF'
      scientists.forEach(scientist => {
        drawScientist(scientist.x, scientist.y, scientist.phase)
        scientist.phase += scientist.speed
      })

      // Draw validation labels
      ctx.shadowBlur = 5
      ctx.fillStyle = '#00FF00'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('VALIDATING...', scientists[0].x - 30, scientists[0].y - 30)
      ctx.fillText('ANALYZING...', scientists[1].x - 30, scientists[1].y - 30)
      ctx.fillText('EVALUATING...', scientists[2].x - 35, scientists[2].y - 30)
    }

    const interval = setInterval(draw, 33)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Reposition scientists on resize
      scientists[0].x = 150
      scientists[1].x = canvas.width - 250
      scientists[2].x = canvas.width / 2
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Download APA formatted report as Word document
  const downloadAPAReport = async () => {
    // Calculate statistics
    const totalItems = translatedScaleItems.length
    const totalExperts = expertResponses.length
    const totalPossibleResponses = totalItems * totalExperts * FACE_VALIDITY_CRITERIA.length

    const totalYesResponses = translatedScaleItems.reduce((itemSum, _item, itemIndex) => {
      return itemSum + expertResponses.reduce((expertSum, expert) => {
        return expertSum + FACE_VALIDITY_CRITERIA.filter(criteria => {
          const key = `item${itemIndex}_criteria${criteria.id}`
          return expert.responses[key] === 1
        }).length
      }, 0)
    }, 0)

    const overallAgreementPercentage = totalPossibleResponses > 0
      ? ((totalYesResponses / totalPossibleResponses) * 100).toFixed(2)
      : 0

    // Calculate Cohen's Kappa
    let cohensKappa = 'N/A'
    let kappaInterpretation = ''

    if (totalExperts >= 2) {
      let totalKappa = 0
      let pairCount = 0

      for (let i = 0; i < totalExperts; i++) {
        for (let j = i + 1; j < totalExperts; j++) {
          const expert1 = expertResponses[i]
          const expert2 = expertResponses[j]

          let agreements = 0
          let totalComparisons = 0
          let yesYes = 0, noNo = 0, yesNo = 0, noYes = 0

          translatedScaleItems.forEach((_item, itemIndex) => {
            FACE_VALIDITY_CRITERIA.forEach(criteria => {
              const key = `item${itemIndex}_criteria${criteria.id}`
              const r1 = expert1.responses[key] === 1
              const r2 = expert2.responses[key] === 1

              if (r1 && r2) yesYes++
              else if (!r1 && !r2) noNo++
              else if (r1 && !r2) yesNo++
              else if (!r1 && r2) noYes++

              if (r1 === r2) agreements++
              totalComparisons++
            })
          })

          const Po = agreements / totalComparisons
          const pYes1 = (yesYes + yesNo) / totalComparisons
          const pNo1 = (noNo + noYes) / totalComparisons
          const pYes2 = (yesYes + noYes) / totalComparisons
          const pNo2 = (noNo + yesNo) / totalComparisons
          const Pe = (pYes1 * pYes2) + (pNo1 * pNo2)
          const kappa = Pe === 1 ? 1 : (Po - Pe) / (1 - Pe)

          totalKappa += kappa
          pairCount++
        }
      }

      const avgKappa = totalKappa / pairCount
      cohensKappa = avgKappa.toFixed(3)

      if (avgKappa < 0) kappaInterpretation = 'Poor agreement'
      else if (avgKappa < 0.20) kappaInterpretation = 'Slight agreement'
      else if (avgKappa < 0.40) kappaInterpretation = 'Fair agreement'
      else if (avgKappa < 0.60) kappaInterpretation = 'Moderate agreement'
      else if (avgKappa < 0.80) kappaInterpretation = 'Substantial agreement'
      else kappaInterpretation = 'Almost perfect agreement'
    }

    // Build Word document sections
    const docSections = []

    // Title
    docSections.push(
      new Paragraph({
        text: 'Face Validity Evaluation Report',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    )

    // Project info
    docSections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Project: ', bold: true }),
          new TextRun(project.name)
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Date: ', bold: true }),
          new TextRun(new Date().toLocaleDateString())
        ],
        spacing: { after: 400 }
      })
    )

    // Summary Statistics heading
    docSections.push(
      new Paragraph({
        text: 'Summary Statistics',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
      })
    )

    // Summary table
    const summaryTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: 'Metric', bold: true })], shading: { fill: 'D3D3D3' } }),
            new TableCell({ children: [new Paragraph({ text: 'Value', bold: true })], shading: { fill: 'D3D3D3' } })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Total Items Evaluated')] }),
            new TableCell({ children: [new Paragraph(totalItems.toString())] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Total Expert Raters')] }),
            new TableCell({ children: [new Paragraph(totalExperts.toString())] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Overall Agreement')] }),
            new TableCell({ children: [new Paragraph(`${overallAgreementPercentage}%`)] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Cohen\'s Kappa (κ)')] }),
            new TableCell({ children: [new Paragraph(`${cohensKappa} (${kappaInterpretation})`)] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Total YES Responses')] }),
            new TableCell({ children: [new Paragraph(`${totalYesResponses}/${totalPossibleResponses}`)] })
          ]
        })
      ]
    })
    docSections.push(summaryTable)

    // Expert Panel heading
    docSections.push(
      new Paragraph({
        text: 'Expert Panel',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    // Expert list
    expertResponses.forEach((expert, index) => {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Expert ${index + 1}: `, bold: true }),
            new TextRun(expert.expertName)
          ],
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `  Qualification: ${expert.expertQualification || 'N/A'}`,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `  Experience: ${expert.expertYearsOfExperience || 'N/A'} years`,
          spacing: { after: 50 }
        }),
        new Paragraph({
          text: `  Email: ${expert.expertEmail}`,
          spacing: { after: 200 }
        })
      )
    })

    // Detailed Item Evaluation heading
    docSections.push(
      new Paragraph({
        text: 'Detailed Item Evaluation',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    // Item-by-item tables
    translatedScaleItems.forEach((item, itemIndex) => {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Item ${itemIndex + 1}: `, bold: true }),
            new TextRun(item.text)
          ],
          spacing: { before: 200, after: 100 }
        })
      )

      // Create table header row
      const headerCells = [
        new TableCell({ children: [new Paragraph({ text: 'Expert', bold: true })], shading: { fill: 'D3D3D3' } })
      ]
      FACE_VALIDITY_CRITERIA.forEach(criteria => {
        headerCells.push(
          new TableCell({ children: [new Paragraph({ text: `C${criteria.id}`, bold: true })], shading: { fill: 'D3D3D3' } })
        )
      })
      headerCells.push(
        new TableCell({ children: [new Paragraph({ text: 'YES Count', bold: true })], shading: { fill: 'D3D3D3' } }),
        new TableCell({ children: [new Paragraph({ text: 'Status', bold: true })], shading: { fill: 'D3D3D3' } })
      )

      const tableRows = [new TableRow({ children: headerCells })]

      // Expert response rows
      expertResponses.forEach(expert => {
        const yesCount = FACE_VALIDITY_CRITERIA.filter(criteria => {
          const key = `item${itemIndex}_criteria${criteria.id}`
          return expert.responses[key] === 1
        }).length
        const isRetained = yesCount >= 8

        const rowCells = [
          new TableCell({ children: [new Paragraph(expert.expertName)] })
        ]

        FACE_VALIDITY_CRITERIA.forEach(criteria => {
          const key = `item${itemIndex}_criteria${criteria.id}`
          const response = expert.responses[key]
          rowCells.push(
            new TableCell({ children: [new Paragraph(response === 1 ? 'Y' : 'N')] })
          )
        })

        rowCells.push(
          new TableCell({ children: [new Paragraph(`${yesCount}/10`)] }),
          new TableCell({ children: [new Paragraph(isRetained ? 'RETAINED' : 'NOT RETAINED')] })
        )

        tableRows.push(new TableRow({ children: rowCells }))
      })

      const itemTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows
      })

      docSections.push(itemTable)

      // Item agreement
      const itemTotalResponses = expertResponses.length * FACE_VALIDITY_CRITERIA.length
      const itemYesResponses = expertResponses.reduce((sum, expert) => {
        return sum + FACE_VALIDITY_CRITERIA.filter(criteria => {
          const key = `item${itemIndex}_criteria${criteria.id}`
          return expert.responses[key] === 1
        }).length
      }, 0)
      const itemAgreement = ((itemYesResponses / itemTotalResponses) * 100).toFixed(2)

      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Item Agreement: ', bold: true }),
            new TextRun(`${itemAgreement}% (${itemYesResponses}/${itemTotalResponses} YES)`)
          ],
          spacing: { before: 100, after: 200 }
        })
      )
    })

    // Criteria Legend
    docSections.push(
      new Paragraph({
        text: 'Criteria Legend',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    FACE_VALIDITY_CRITERIA.forEach(criteria => {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `C${criteria.id}: `, bold: true }),
            new TextRun(criteria.text)
          ],
          spacing: { after: 100 }
        })
      )
    })

    docSections.push(
      new Paragraph({
        text: 'Note: Items with ≥8 YES responses (out of 10 criteria) from an expert are considered RETAINED by that expert.',
        italics: true,
        spacing: { before: 200 }
      })
    )

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: docSections
      }]
    })

    // Generate and download
    try {
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `Face_Validity_Report_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`)
      toast.success('Word document downloaded successfully!')
    } catch (error) {
      console.error('Error generating document:', error)
      toast.error('Failed to generate document')
    }
  }

  const addOriginalScaleItem = () => {
    setOriginalScaleItems([...originalScaleItems, { id: Date.now(), text: '' }])
  }

  const addTranslatedScaleItem = () => {
    setTranslatedScaleItems([...translatedScaleItems, { id: Date.now(), text: '' }])
  }

  const updateOriginalScaleItem = (id, text) => {
    setOriginalScaleItems(originalScaleItems.map(item =>
      item.id === id ? { ...item, text } : item
    ))
  }

  const updateTranslatedScaleItem = (id, text) => {
    setTranslatedScaleItems(translatedScaleItems.map(item =>
      item.id === id ? { ...item, text } : item
    ))
  }

  const removeOriginalScaleItem = (id) => {
    setOriginalScaleItems(originalScaleItems.filter(item => item.id !== id))
  }

  const removeTranslatedScaleItem = (id) => {
    setTranslatedScaleItems(translatedScaleItems.filter(item => item.id !== id))
  }

  const handleOriginalScaleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('document', file)

    setIsUploadingOriginal(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:4000/api/parse-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const extractedItems = data.items.map((text, index) => ({
          id: Date.now() + index,
          text: text
        }))
        setOriginalScaleItems([...originalScaleItems, ...extractedItems])
        toast.success(`${extractedItems.length} items extracted successfully!`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to parse document')
      }
    } catch (err) {
      toast.error('Failed to upload document')
    } finally {
      setIsUploadingOriginal(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleTranslatedScaleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('document', file)

    setIsUploadingTranslated(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:4000/api/parse-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        const extractedItems = data.items.map((text, index) => ({
          id: Date.now() + index,
          text: text
        }))
        setTranslatedScaleItems([...translatedScaleItems, ...extractedItems])
        toast.success(`${extractedItems.length} items extracted successfully!`)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to parse document')
      }
    } catch (err) {
      toast.error('Failed to upload document')
    } finally {
      setIsUploadingTranslated(false)
      e.target.value = '' // Reset file input
    }
  }

  const generateInviteLink = () => {
    // Generate unique invite link for this project
    const baseUrl = window.location.origin
    const link = `${baseUrl}/expert-assessment/${project.id}`
    setInviteLink(link)

    // Copy to clipboard
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Invite link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10">
        <div className="bg-black bg-opacity-80 border-b-2 border-blue-400 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 mb-2 font-bold border-2 border-blue-400 px-4 py-2 rounded"
              style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.3)' }}
            >
              ← BACK TO PROJECTS
            </button>
            <h1 className="text-3xl font-bold text-blue-400 tracking-wider" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              {project.name.toUpperCase()}
            </h1>
            <p className="text-sm text-blue-300 mt-1" style={{ fontFamily: 'monospace' }}>
              {project.description || 'NO DESCRIPTION'}
            </p>
          </div>
        </div>

        <div className="bg-black bg-opacity-80 border-b-2 border-blue-400 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'overview' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                style={{ fontFamily: 'monospace', textShadow: activeTab === 'overview' ? '0 0 5px #00BFFF' : 'none' }}
              >
                OVERVIEW
              </button>
              {project.type === 'face-validity' && (
                <button
                  onClick={() => setActiveTab('face-validity')}
                  className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'face-validity' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                  style={{ fontFamily: 'monospace', textShadow: activeTab === 'face-validity' ? '0 0 5px #00BFFF' : 'none' }}
                >
                  FACE VALIDITY
                </button>
              )}
              {project.type === 'delphi' && (
                <button
                  onClick={() => setActiveTab('delphi')}
                  className={`px-6 py-3 font-bold border-b-2 transition ${activeTab === 'delphi' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                  style={{ fontFamily: 'monospace', textShadow: activeTab === 'delphi' ? '0 0 5px #00BFFF' : 'none' }}
                >
                  DELPHI METHOD
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'overview' && (
            <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-8 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
              <h2 className="text-3xl font-bold text-blue-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                PROJECT OVERVIEW
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                    <span className="text-blue-400 font-bold">PROJECT NAME:</span> {project.name}
                  </p>
                  <p className="text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                    <span className="text-blue-400 font-bold">PROJECT TYPE:</span> {project.type === 'delphi' ? 'DELPHI STUDY' : 'FACE VALIDITY'}
                  </p>
                  <p className="text-blue-300 mb-2" style={{ fontFamily: 'monospace' }}>
                    <span className="text-blue-400 font-bold">DESCRIPTION:</span> {project.description || 'No description provided'}
                  </p>
                </div>
                <div className="border-t-2 border-blue-400 pt-4 mt-4">
                  <p className="text-blue-300" style={{ fontFamily: 'monospace' }}>
                    Use the tabs above to navigate to <span className="text-blue-400 font-bold">FACE VALIDITY</span> or <span className="text-blue-400 font-bold">DELPHI METHOD</span> to add and manage scale items.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'face-validity' && (
            <div className="space-y-6">
              {/* Sub-tabs for Face Validity */}
              <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-4 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                <div className="flex gap-4 border-b-2 border-blue-400">
                  <button
                    onClick={() => setActiveSubTab('scales')}
                    className={`px-6 py-3 font-bold border-b-2 transition ${activeSubTab === 'scales' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                    style={{ fontFamily: 'monospace', textShadow: activeSubTab === 'scales' ? '0 0 5px #00BFFF' : 'none' }}
                  >
                    SCALE ITEMS
                  </button>
                  <button
                    onClick={() => setActiveSubTab('evaluation')}
                    className={`px-6 py-3 font-bold border-b-2 transition ${activeSubTab === 'evaluation' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                    style={{ fontFamily: 'monospace', textShadow: activeSubTab === 'evaluation' ? '0 0 5px #00BFFF' : 'none' }}
                  >
                    ITEM EVALUATION
                  </button>
                </div>
              </div>

              {/* Scale Items Tab */}
              {activeSubTab === 'scales' && (
                <>
                  <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                          FACE VALIDITY ASSESSMENT
                        </h2>
                        <p className="text-blue-300" style={{ fontFamily: 'monospace' }}>
                          Upload Word/PDF documents to automatically extract items, or add them manually.
                        </p>
                      </div>
                      <button
                        onClick={generateInviteLink}
                        className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-500 transition border-2 border-green-600"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                      >
                        📧 INVITE EXPERTS
                      </button>
                    </div>
                {inviteLink && (
                  <div className="mt-4 p-4 bg-green-900 bg-opacity-30 border-2 border-green-500 rounded">
                    <p className="text-green-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                      ✓ INVITE LINK GENERATED:
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-4 py-2 bg-black border-2 border-green-500 rounded text-green-300 text-sm"
                        style={{ fontFamily: 'monospace' }}
                      />
                      <button
                        onClick={generateInviteLink}
                        className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 whitespace-nowrap"
                        style={{ fontFamily: 'monospace' }}
                      >
                        📋 COPY LINK
                      </button>
                    </div>
                    <p className="text-green-400 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                      Share this link with experts. Each expert can submit one response.
                    </p>
                  </div>
                )}
              </div>

              {/* Two Tables in Parallel Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Scale Table */}
                <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-blue-400 mb-3" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                      ORIGINAL SCALE
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={addOriginalScaleItem}
                        className="flex-1 bg-blue-400 text-black px-3 py-2 rounded font-bold hover:bg-blue-300 transition border-2 border-blue-400 text-sm"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
                      >
                        + ADD MANUALLY
                      </button>
                      <label className="flex-1 bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 text-sm text-center cursor-pointer" style={{ fontFamily: 'monospace' }}>
                        {isUploadingOriginal ? 'UPLOADING...' : '📄 UPLOAD DOC'}
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={handleOriginalScaleUpload}
                          className="hidden"
                          disabled={isUploadingOriginal}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {originalScaleItems.length === 0 ? (
                      <p className="text-blue-300 text-center py-8 text-sm" style={{ fontFamily: 'monospace' }}>
                        NO ITEMS YET
                      </p>
                    ) : (
                      originalScaleItems.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start">
                          <span className="text-blue-400 font-bold w-8 mt-2" style={{ fontFamily: 'monospace' }}>
                            {index + 1}.
                          </span>
                          <textarea
                            value={item.text}
                            onChange={(e) => updateOriginalScaleItem(item.id, e.target.value)}
                            className="flex-1 px-3 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700 text-sm resize-none"
                            placeholder="Enter item text"
                            rows={2}
                            style={{ fontFamily: 'monospace' }}
                          />
                          <button
                            onClick={() => removeOriginalScaleItem(item.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-500 transition border-2 border-red-600 text-xs mt-2"
                            style={{ fontFamily: 'monospace' }}
                          >
                            DEL
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Translated Scale Table */}
                <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-blue-400 mb-3" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                      TRANSLATED SCALE
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={addTranslatedScaleItem}
                        className="flex-1 bg-blue-400 text-black px-3 py-2 rounded font-bold hover:bg-blue-300 transition border-2 border-blue-400 text-sm"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
                      >
                        + ADD MANUALLY
                      </button>
                      <label className="flex-1 bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 text-sm text-center cursor-pointer" style={{ fontFamily: 'monospace' }}>
                        {isUploadingTranslated ? 'UPLOADING...' : '📄 UPLOAD DOC'}
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={handleTranslatedScaleUpload}
                          className="hidden"
                          disabled={isUploadingTranslated}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {translatedScaleItems.length === 0 ? (
                      <p className="text-blue-300 text-center py-8 text-sm" style={{ fontFamily: 'monospace' }}>
                        NO ITEMS YET
                      </p>
                    ) : (
                      translatedScaleItems.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start">
                          <span className="text-blue-400 font-bold w-8 mt-2" style={{ fontFamily: 'monospace' }}>
                            {index + 1}.
                          </span>
                          <textarea
                            value={item.text}
                            onChange={(e) => updateTranslatedScaleItem(item.id, e.target.value)}
                            className="flex-1 px-3 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700 text-sm resize-none"
                            placeholder="Enter translated item text"
                            rows={2}
                            style={{ fontFamily: 'monospace' }}
                          />
                          <button
                            onClick={() => removeTranslatedScaleItem(item.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-500 transition border-2 border-red-600 text-xs mt-2"
                            style={{ fontFamily: 'monospace' }}
                          >
                            DEL
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Face Validity Evaluation Criteria */}
              <div className="bg-black bg-opacity-80 border-2 border-green-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)' }}>
                <h2 className="text-2xl font-bold text-green-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #22C55E' }}>
                  FACE VALIDITY EVALUATION
                </h2>
                <p className="text-green-300 mb-6" style={{ fontFamily: 'monospace' }}>
                  Evaluate each criterion (C1-C10) for all scale items with YES/NO responses.
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
                              {originalScaleItems.map((_, index) => (
                                <th key={`orig-${index}`} className="border border-green-400 px-3 py-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                                  ITEM {index + 1}
                                </th>
                              ))}
                              {translatedScaleItems.map((_, index) => (
                                <th key={`trans-${index}`} className="border border-green-400 px-3 py-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                                  ITEM {originalScaleItems.length + index + 1}
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
                                {/* Original Scale Items */}
                                {originalScaleItems.map((item, itemIndex) => (
                                  <td key={`orig-${itemIndex}`} className="border border-green-400 px-2 py-2 text-center">
                                    <div className="flex justify-center gap-2">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`c${criteria.id}-orig-item${itemIndex}`}
                                          value="yes"
                                          onChange={() => {
                                            setEvaluationResponses(prev => ({
                                              ...prev,
                                              [`C${criteria.id}_ORIG_ITEM${itemIndex + 1}`]: 1
                                            }))
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-green-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>Y</span>
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`c${criteria.id}-orig-item${itemIndex}`}
                                          value="no"
                                          onChange={() => {
                                            setEvaluationResponses(prev => ({
                                              ...prev,
                                              [`C${criteria.id}_ORIG_ITEM${itemIndex + 1}`]: 0
                                            }))
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-red-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>N</span>
                                      </label>
                                    </div>
                                  </td>
                                ))}
                                {/* Translated Scale Items */}
                                {translatedScaleItems.map((item, itemIndex) => (
                                  <td key={`trans-${itemIndex}`} className="border border-green-400 px-2 py-2 text-center">
                                    <div className="flex justify-center gap-2">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`c${criteria.id}-trans-item${itemIndex}`}
                                          value="yes"
                                          onChange={() => {
                                            setEvaluationResponses(prev => ({
                                              ...prev,
                                              [`C${criteria.id}_TRANS_ITEM${itemIndex + 1}`]: 1
                                            }))
                                          }}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-green-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>Y</span>
                                      </label>
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`c${criteria.id}-trans-item${itemIndex}`}
                                          value="no"
                                          onChange={() => {
                                            setEvaluationResponses(prev => ({
                                              ...prev,
                                              [`C${criteria.id}_TRANS_ITEM${itemIndex + 1}`]: 0
                                            }))
                                          }}
                                          className="w-4 h-4"
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

                      <div className="mt-6 text-center">
                        <button
                          onClick={() => {
                            const totalItems = originalScaleItems.length + translatedScaleItems.length
                            const totalCells = FACE_VALIDITY_CRITERIA.length * totalItems
                            const answeredCount = Object.keys(evaluationResponses).length
                            if (answeredCount < totalCells) {
                              toast.error(`Please answer all cells. Answered: ${answeredCount}/${totalCells}`)
                            } else {
                              toast.success('Evaluation responses saved!')
                              console.log('Evaluation responses:', evaluationResponses)
                            }
                          }}
                          className="bg-green-600 text-white px-8 py-3 rounded font-bold hover:bg-green-500 transition border-2 border-green-600"
                          style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                        >
                          SAVE EVALUATION
                        </button>
                        <p className="text-green-400 text-sm mt-3" style={{ fontFamily: 'monospace' }}>
                          Answered: {Object.keys(evaluationResponses).length} / {FACE_VALIDITY_CRITERIA.length * (originalScaleItems.length + translatedScaleItems.length)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                </>
              )}

              {/* Item Evaluation Tab */}
              {activeSubTab === 'evaluation' && (
                <div className="bg-black bg-opacity-80 border-2 border-purple-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(192, 132, 252, 0.3)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-purple-400" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #C084FC' }}>
                        ITEM RETENTION EVALUATION
                      </h2>
                      <p className="text-purple-300 mt-2" style={{ fontFamily: 'monospace' }}>
                        Expert responses aggregated by item. Each expert evaluates items against 10 criteria. Items with ≥8 YES from an expert are RETAINED for that expert.
                      </p>
                    </div>
                    {expertResponses.length > 0 && (
                      <button
                        onClick={() => downloadAPAReport()}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg border-2 border-green-400 transition-all duration-300"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)' }}
                      >
                        📥 DOWNLOAD APA REPORT
                      </button>
                    )}
                  </div>

                  {translatedScaleItems.length > 0 ? (
                    expertResponses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-2 border-purple-400">
                        <thead>
                          <tr className="bg-purple-600">
                            <th className="border border-purple-400 px-4 py-3 text-white" style={{ fontFamily: 'monospace' }}>
                              EXPERT
                            </th>
                            {FACE_VALIDITY_CRITERIA.map((criteria) => (
                              <th key={criteria.id} className="border border-purple-400 px-3 py-3 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                                C{criteria.id}
                              </th>
                            ))}
                            <th className="border border-purple-400 px-4 py-3 text-center text-white" style={{ fontFamily: 'monospace' }}>
                              YES COUNT
                            </th>
                            <th className="border border-purple-400 px-4 py-3 text-center text-white" style={{ fontFamily: 'monospace' }}>
                              STATUS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Group by items, then show experts for each item */}
                          {translatedScaleItems.map((item, itemIndex) => (
                            <>
                              {/* Item Header Row */}
                              <tr key={`item-header-${itemIndex}`} className="bg-purple-700">
                                <td colSpan={FACE_VALIDITY_CRITERIA.length + 3} className="border border-purple-400 px-4 py-3 text-white font-bold" style={{ fontFamily: 'monospace' }}>
                                  ITEM {itemIndex + 1}: {item.text || 'No text'}
                                </td>
                              </tr>

                              {/* Expert Rows for this item */}
                              {expertResponses.map((expert, expertIndex) => {
                                // Calculate YES count for this expert and this item
                                const yesCount = FACE_VALIDITY_CRITERIA.filter(criteria => {
                                  const key = `item${itemIndex}_criteria${criteria.id}`
                                  return expert.responses[key] === 1
                                }).length
                                const isRetained = yesCount >= 8

                                return (
                                  <tr key={`item-${itemIndex}-expert-${expertIndex}`} className="bg-black bg-opacity-60">
                                    <td className="border border-purple-400 px-4 py-3 text-purple-300" style={{ fontFamily: 'monospace' }}>
                                      {expert.expertName}
                                    </td>
                                    {FACE_VALIDITY_CRITERIA.map((criteria) => {
                                      const key = `item${itemIndex}_criteria${criteria.id}`
                                      const response = expert.responses[key]
                                      return (
                                        <td key={criteria.id} className="border border-purple-400 px-2 py-2 text-center">
                                          <span className={response === 1 ? 'text-green-400 font-bold' : 'text-red-400'}>
                                            {response === 1 ? 'Y' : 'N'}
                                          </span>
                                        </td>
                                      )
                                    })}
                                    <td className="border border-purple-400 px-4 py-3 text-center text-purple-300 font-bold" style={{ fontFamily: 'monospace' }}>
                                      {yesCount}/10
                                    </td>
                                    <td className="border border-purple-400 px-4 py-3 text-center font-bold" style={{ fontFamily: 'monospace' }}>
                                      <span className={isRetained ? 'text-green-400' : 'text-red-400'}>
                                        {isRetained ? '✓ RETAINED' : '✗ NOT RETAINED'}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}

                              {/* Overall Agreement Row for this item */}
                              {(() => {
                                // Calculate overall agreement for this item
                                const totalResponses = expertResponses.length * FACE_VALIDITY_CRITERIA.length
                                const totalYes = expertResponses.reduce((sum, expert) => {
                                  return sum + FACE_VALIDITY_CRITERIA.filter(criteria => {
                                    const key = `item${itemIndex}_criteria${criteria.id}`
                                    return expert.responses[key] === 1
                                  }).length
                                }, 0)
                                const agreementPercentage = totalResponses > 0 ? ((totalYes / totalResponses) * 100).toFixed(2) : 0

                                return (
                                  <tr className="bg-purple-800 bg-opacity-60">
                                    <td className="border border-purple-400 px-4 py-3 text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>
                                      OVERALL AGREEMENT
                                    </td>
                                    <td colSpan={FACE_VALIDITY_CRITERIA.length + 2} className="border border-purple-400 px-4 py-3 text-center text-yellow-400 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                                      {agreementPercentage}% ({totalYes}/{totalResponses} YES responses)
                                    </td>
                                  </tr>
                                )
                              })()}
                            </>
                          ))}
                        </tbody>
                      </table>

                      {/* Overall Agreement for Entire Scale */}
                      {(() => {
                        // Calculate overall agreement for the entire scale
                        const totalItems = translatedScaleItems.length
                        const totalExperts = expertResponses.length
                        const totalPossibleResponses = totalItems * totalExperts * FACE_VALIDITY_CRITERIA.length

                        const totalYesResponses = translatedScaleItems.reduce((itemSum, item, itemIndex) => {
                          return itemSum + expertResponses.reduce((expertSum, expert) => {
                            return expertSum + FACE_VALIDITY_CRITERIA.filter(criteria => {
                              const key = `item${itemIndex}_criteria${criteria.id}`
                              return expert.responses[key] === 1
                            }).length
                          }, 0)
                        }, 0)

                        const overallAgreementPercentage = totalPossibleResponses > 0
                          ? ((totalYesResponses / totalPossibleResponses) * 100).toFixed(2)
                          : 0

                        // Calculate Cohen's Kappa (for pairs of raters)
                        let cohensKappa = 'N/A'
                        let kappaInterpretation = ''

                        if (totalExperts >= 2) {
                          // Calculate average pairwise Cohen's Kappa
                          let totalKappa = 0
                          let pairCount = 0

                          for (let i = 0; i < totalExperts; i++) {
                            for (let j = i + 1; j < totalExperts; j++) {
                              const expert1 = expertResponses[i]
                              const expert2 = expertResponses[j]

                              // Count agreements and disagreements
                              let agreements = 0
                              let totalComparisons = 0
                              let yesYes = 0, noNo = 0, yesNo = 0, noYes = 0

                              translatedScaleItems.forEach((item, itemIndex) => {
                                FACE_VALIDITY_CRITERIA.forEach(criteria => {
                                  const key = `item${itemIndex}_criteria${criteria.id}`
                                  const r1 = expert1.responses[key] === 1
                                  const r2 = expert2.responses[key] === 1

                                  if (r1 && r2) yesYes++
                                  else if (!r1 && !r2) noNo++
                                  else if (r1 && !r2) yesNo++
                                  else if (!r1 && r2) noYes++

                                  if (r1 === r2) agreements++
                                  totalComparisons++
                                })
                              })

                              // Calculate observed agreement (Po)
                              const Po = agreements / totalComparisons

                              // Calculate expected agreement (Pe)
                              const pYes1 = (yesYes + yesNo) / totalComparisons
                              const pNo1 = (noNo + noYes) / totalComparisons
                              const pYes2 = (yesYes + noYes) / totalComparisons
                              const pNo2 = (noNo + yesNo) / totalComparisons
                              const Pe = (pYes1 * pYes2) + (pNo1 * pNo2)

                              // Calculate Cohen's Kappa
                              const kappa = Pe === 1 ? 1 : (Po - Pe) / (1 - Pe)

                              totalKappa += kappa
                              pairCount++
                            }
                          }

                          const avgKappa = totalKappa / pairCount
                          cohensKappa = avgKappa.toFixed(3)

                          // Interpret Kappa value
                          if (avgKappa < 0) kappaInterpretation = 'Poor agreement'
                          else if (avgKappa < 0.20) kappaInterpretation = 'Slight agreement'
                          else if (avgKappa < 0.40) kappaInterpretation = 'Fair agreement'
                          else if (avgKappa < 0.60) kappaInterpretation = 'Moderate agreement'
                          else if (avgKappa < 0.80) kappaInterpretation = 'Substantial agreement'
                          else kappaInterpretation = 'Almost perfect agreement'
                        }

                        return (
                          <div className="mt-6 bg-gradient-to-r from-yellow-900 to-orange-900 bg-opacity-50 border-4 border-yellow-400 rounded-lg p-6" style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.5)' }}>
                            <h3 className="text-2xl font-bold text-yellow-400 mb-3 text-center" style={{ fontFamily: 'monospace', textShadow: '0 0 15px #FACC15' }}>
                              🎯 OVERALL SCALE AGREEMENT
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                              <div className="bg-black bg-opacity-50 border-2 border-yellow-500 rounded-lg p-4">
                                <p className="text-yellow-300 text-sm mb-2" style={{ fontFamily: 'monospace' }}>
                                  Total Items
                                </p>
                                <p className="text-yellow-400 text-3xl font-bold" style={{ fontFamily: 'monospace' }}>
                                  {totalItems}
                                </p>
                              </div>
                              <div className="bg-black bg-opacity-50 border-2 border-yellow-500 rounded-lg p-4">
                                <p className="text-yellow-300 text-sm mb-2" style={{ fontFamily: 'monospace' }}>
                                  Total Experts
                                </p>
                                <p className="text-yellow-400 text-3xl font-bold" style={{ fontFamily: 'monospace' }}>
                                  {totalExperts}
                                </p>
                              </div>
                              <div className="bg-black bg-opacity-50 border-2 border-yellow-500 rounded-lg p-4">
                                <p className="text-yellow-300 text-sm mb-2" style={{ fontFamily: 'monospace' }}>
                                  Agreement %
                                </p>
                                <p className="text-yellow-400 text-3xl font-bold" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FACC15' }}>
                                  {overallAgreementPercentage}%
                                </p>
                              </div>
                              <div className="bg-black bg-opacity-50 border-2 border-green-500 rounded-lg p-4">
                                <p className="text-green-300 text-sm mb-2" style={{ fontFamily: 'monospace' }}>
                                  Cohen's Kappa (κ)
                                </p>
                                <p className="text-green-400 text-3xl font-bold" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #22C55E' }}>
                                  {cohensKappa}
                                </p>
                                {kappaInterpretation && (
                                  <p className="text-green-300 text-xs mt-1" style={{ fontFamily: 'monospace' }}>
                                    {kappaInterpretation}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 text-center">
                              <p className="text-yellow-300 text-sm" style={{ fontFamily: 'monospace' }}>
                                Total YES Responses: <span className="text-yellow-400 font-bold">{totalYesResponses}</span> / {totalPossibleResponses}
                              </p>
                              <p className="text-yellow-300 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                                ({totalItems} items × {totalExperts} experts × 10 criteria = {totalPossibleResponses} total responses)
                              </p>
                              {totalExperts >= 2 && (
                                <p className="text-green-300 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                                  Cohen's Kappa: Average pairwise agreement across {(totalExperts * (totalExperts - 1)) / 2} expert pairs
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Criteria Legend */}
                      <div className="mt-6 bg-purple-900 bg-opacity-30 border-2 border-purple-500 rounded-lg p-4">
                        <h3 className="text-lg font-bold text-purple-400 mb-3" style={{ fontFamily: 'monospace' }}>
                          CRITERIA LEGEND
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {FACE_VALIDITY_CRITERIA.map((criteria) => (
                            <div key={criteria.id} className="text-purple-300" style={{ fontFamily: 'monospace' }}>
                              <span className="font-bold text-purple-400">C{criteria.id}:</span> {criteria.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-purple-400 text-lg" style={{ fontFamily: 'monospace' }}>
                          No expert responses yet. Invite experts to submit their evaluations.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-purple-400 text-lg" style={{ fontFamily: 'monospace' }}>
                        No items to evaluate. Please add items in the SCALE ITEMS tab first.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'delphi' && (
            <div className="space-y-6">
              <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-blue-400 mb-2" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                      DELPHI METHOD ASSESSMENT
                    </h2>
                    <p className="text-blue-300" style={{ fontFamily: 'monospace' }}>
                      Upload Word/PDF documents to automatically extract items, or add them manually.
                    </p>
                  </div>
                  <button
                    onClick={generateInviteLink}
                    className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-500 transition border-2 border-green-600"
                    style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                  >
                    📧 INVITE EXPERTS
                  </button>
                </div>
                {inviteLink && (
                  <div className="mt-4 p-4 bg-green-900 bg-opacity-30 border-2 border-green-500 rounded">
                    <p className="text-green-400 font-bold mb-2" style={{ fontFamily: 'monospace' }}>
                      ✓ INVITE LINK GENERATED:
                    </p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-4 py-2 bg-black border-2 border-green-500 rounded text-green-300 text-sm"
                        style={{ fontFamily: 'monospace' }}
                      />
                      <button
                        onClick={generateInviteLink}
                        className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 whitespace-nowrap"
                        style={{ fontFamily: 'monospace' }}
                      >
                        📋 COPY LINK
                      </button>
                    </div>
                    <p className="text-green-400 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                      Share this link with experts. Each expert can submit one response.
                    </p>
                  </div>
                )}
              </div>

              {/* Two Tables in Parallel Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Scale Table */}
                <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-blue-400 mb-3" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                      ORIGINAL SCALE
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={addOriginalScaleItem}
                        className="flex-1 bg-blue-400 text-black px-3 py-2 rounded font-bold hover:bg-blue-300 transition border-2 border-blue-400 text-sm"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
                      >
                        + ADD MANUALLY
                      </button>
                      <label className="flex-1 bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 text-sm text-center cursor-pointer" style={{ fontFamily: 'monospace' }}>
                        {isUploadingOriginal ? 'UPLOADING...' : '📄 UPLOAD DOC'}
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={handleOriginalScaleUpload}
                          className="hidden"
                          disabled={isUploadingOriginal}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {originalScaleItems.length === 0 ? (
                      <p className="text-blue-300 text-center py-8 text-sm" style={{ fontFamily: 'monospace' }}>
                        NO ITEMS YET
                      </p>
                    ) : (
                      originalScaleItems.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start">
                          <span className="text-blue-400 font-bold w-8 mt-2" style={{ fontFamily: 'monospace' }}>
                            {index + 1}.
                          </span>
                          <textarea
                            value={item.text}
                            onChange={(e) => updateOriginalScaleItem(item.id, e.target.value)}
                            className="flex-1 px-3 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700 text-sm resize-none"
                            placeholder="Enter item text"
                            rows={2}
                            style={{ fontFamily: 'monospace' }}
                          />
                          <button
                            onClick={() => removeOriginalScaleItem(item.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-500 transition border-2 border-red-600 text-xs mt-2"
                            style={{ fontFamily: 'monospace' }}
                          >
                            DEL
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Translated Scale Table */}
                <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-blue-400 mb-3" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                      TRANSLATED SCALE
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={addTranslatedScaleItem}
                        className="flex-1 bg-blue-400 text-black px-3 py-2 rounded font-bold hover:bg-blue-300 transition border-2 border-blue-400 text-sm"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
                      >
                        + ADD MANUALLY
                      </button>
                      <label className="flex-1 bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-500 transition border-2 border-green-600 text-sm text-center cursor-pointer" style={{ fontFamily: 'monospace' }}>
                        {isUploadingTranslated ? 'UPLOADING...' : '📄 UPLOAD DOC'}
                        <input
                          type="file"
                          accept=".doc,.docx,.pdf"
                          onChange={handleTranslatedScaleUpload}
                          className="hidden"
                          disabled={isUploadingTranslated}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {translatedScaleItems.length === 0 ? (
                      <p className="text-blue-300 text-center py-8 text-sm" style={{ fontFamily: 'monospace' }}>
                        NO ITEMS YET
                      </p>
                    ) : (
                      translatedScaleItems.map((item, index) => (
                        <div key={item.id} className="flex gap-2 items-start">
                          <span className="text-blue-400 font-bold w-8 mt-2" style={{ fontFamily: 'monospace' }}>
                            {index + 1}.
                          </span>
                          <textarea
                            value={item.text}
                            onChange={(e) => updateTranslatedScaleItem(item.id, e.target.value)}
                            className="flex-1 px-3 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700 text-sm resize-none"
                            placeholder="Enter translated item text"
                            rows={2}
                            style={{ fontFamily: 'monospace' }}
                          />
                          <button
                            onClick={() => removeTranslatedScaleItem(item.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-500 transition border-2 border-red-600 text-xs mt-2"
                            style={{ fontFamily: 'monospace' }}
                          >
                            DEL
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDashboard
