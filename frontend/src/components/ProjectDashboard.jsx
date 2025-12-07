import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
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
    if (activeSubTab === 'evaluation') {
      const fetchExpertResponses = async () => {
        try {
          const token = localStorage.getItem('token')
          const res = await fetch(`${API_URL}/api/projects/${project.id}/expert-responses`, {
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
  }, [activeSubTab, project.id])

  // Save scale items to backend whenever they change
  useEffect(() => {
    const saveItems = async () => {
      try {
        const token = localStorage.getItem('token')
        await fetch(`${API_URL}/api/projects/${project.id}/items`, {
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

  // Download Delphi Evaluation Report
  const downloadDelphiReport = async () => {
    const DELPHI_CRITERIA = [
      { id: 1, category: 'content', text: 'Appropriateness of language used' },
      { id: 2, category: 'content', text: 'Assessment of the concept' },
      { id: 3, category: 'content', text: 'Retains the conceptual meaning' },
      { id: 4, category: 'consensual', text: 'Appropriateness with the individuals of 18 years and above' },
      { id: 5, category: 'consensual', text: 'Cultural relevance' }
    ]

    const docSections = []

    // Title
    docSections.push(
      new Paragraph({
        text: 'Delphi Method Evaluation Report',
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

    // Methodology explanation
    docSections.push(
      new Paragraph({
        text: 'Delphi Methodology - Aggregated Consensus',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
      }),
      new Paragraph({
        text: `This evaluation database records individual assessments from ${expertResponses.length} expert${expertResponses.length !== 1 ? 's' : ''} during the Delphi process. The table displays aggregated percentage scores from all experts for each item, providing a consolidated view of expert consensus. Values update automatically as additional expert evaluations are added.`,
        spacing: { after: 400 }
      })
    )

    // Summary Statistics
    docSections.push(
      new Paragraph({
        text: 'Consensus Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 }
      })
    )

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
            new TableCell({ children: [new Paragraph('Total Experts')] }),
            new TableCell({ children: [new Paragraph(expertResponses.length.toString())] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Total Items')] }),
            new TableCell({ children: [new Paragraph(translatedScaleItems.length.toString())] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Total Evaluations')] }),
            new TableCell({ children: [new Paragraph((expertResponses.length * translatedScaleItems.length * 5).toString())] })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('Criteria Assessed')] }),
            new TableCell({ children: [new Paragraph('5')] })
          ]
        })
      ]
    })
    docSections.push(summaryTable)

    // Expert Panel
    docSections.push(
      new Paragraph({
        text: 'Expert Panel',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

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

    // Aggregated Ratings Table
    docSections.push(
      new Paragraph({
        text: 'Aggregated Expert Ratings',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Percentages by Rating Categories (0-3: Low, 4-6: Medium, 7-9: High)',
        italics: true,
        spacing: { after: 200 }
      })
    )

    // Create main evaluation table
    const headerRow1Cells = [new TableCell({ children: [new Paragraph('')], shading: { fill: 'D3D3D3' } })]
    const headerRow2Cells = [new TableCell({ children: [new Paragraph('')], shading: { fill: 'D3D3D3' } })]
    const headerRow3Cells = [new TableCell({ children: [new Paragraph({ text: 'Item', bold: true })], shading: { fill: 'D3D3D3' } })]

    // Build 3-row header
    DELPHI_CRITERIA.forEach(criteria => {
      headerRow1Cells.push(new TableCell({
        children: [new Paragraph({ text: criteria.category === 'content' ? 'Content-related' : 'Consensual-related', bold: true })],
        shading: { fill: 'FFA500' },
        columnSpan: 3
      }))
      headerRow2Cells.push(new TableCell({
        children: [new Paragraph({ text: `C${criteria.id}`, bold: true })],
        shading: { fill: 'FFB84D' },
        columnSpan: 3
      }))
      headerRow3Cells.push(
        new TableCell({ children: [new Paragraph({ text: '0-3', bold: true })], shading: { fill: 'FFD699' } }),
        new TableCell({ children: [new Paragraph({ text: '4-6', bold: true })], shading: { fill: 'FFD699' } }),
        new TableCell({ children: [new Paragraph({ text: '7-9', bold: true })], shading: { fill: 'FFD699' } })
      )
    })

    const tableRows = [
      new TableRow({ children: headerRow1Cells }),
      new TableRow({ children: headerRow2Cells }),
      new TableRow({ children: headerRow3Cells })
    ]

    // Add item rows with statistics
    translatedScaleItems.forEach((item, itemIdx) => {
      // Item row
      const itemCells = [new TableCell({ children: [new Paragraph({ text: `Item ${itemIdx + 1}`, bold: true })] })]

      DELPHI_CRITERIA.forEach(criteria => {
        const key = `item${itemIdx}_criteria${criteria.id}`
        const totalExperts = expertResponses.length

        let lowCount = 0, mediumCount = 0, highCount = 0
        expertResponses.forEach(expert => {
          const rating = expert.responses[key] || 0
          if (rating >= 0 && rating <= 3) lowCount++
          else if (rating >= 4 && rating <= 6) mediumCount++
          else if (rating >= 7 && rating <= 9) highCount++
        })

        const lowPercent = ((lowCount / totalExperts) * 100).toFixed(1)
        const mediumPercent = ((mediumCount / totalExperts) * 100).toFixed(1)
        const highPercent = ((highCount / totalExperts) * 100).toFixed(1)

        itemCells.push(
          new TableCell({ children: [new Paragraph(`${lowPercent}%`)] }),
          new TableCell({ children: [new Paragraph(`${mediumPercent}%`)] }),
          new TableCell({ children: [new Paragraph(`${highPercent}%`)] })
        )
      })

      tableRows.push(new TableRow({ children: itemCells }))

      // I-CVI row
      const icviCells = [new TableCell({ children: [new Paragraph({ text: 'I-CVI', bold: true })], shading: { fill: 'E6F2FF' } })]
      DELPHI_CRITERIA.forEach(criteria => {
        const key = `item${itemIdx}_criteria${criteria.id}`
        const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)
        const highRatings = ratings.filter(r => r >= 7).length
        const icvi = (highRatings / expertResponses.length).toFixed(2)
        icviCells.push(new TableCell({ children: [new Paragraph(icvi)], columnSpan: 3 }))
      })
      tableRows.push(new TableRow({ children: icviCells }))

      // Median row
      const medianCells = [new TableCell({ children: [new Paragraph({ text: 'Median', bold: true })], shading: { fill: 'F0E6FF' } })]
      DELPHI_CRITERIA.forEach(criteria => {
        const key = `item${itemIdx}_criteria${criteria.id}`
        const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)
        const sortedRatings = [...ratings].sort((a, b) => a - b)
        const mid = Math.floor(sortedRatings.length / 2)
        const median = sortedRatings.length % 2 === 0
          ? ((sortedRatings[mid - 1] + sortedRatings[mid]) / 2).toFixed(2)
          : sortedRatings[mid].toFixed(2)
        medianCells.push(new TableCell({ children: [new Paragraph(median)], columnSpan: 3 }))
      })
      tableRows.push(new TableRow({ children: medianCells }))

      // SD row
      const sdCells = [new TableCell({ children: [new Paragraph({ text: 'SD', bold: true })], shading: { fill: 'E6FFE6' } })]
      DELPHI_CRITERIA.forEach(criteria => {
        const key = `item${itemIdx}_criteria${criteria.id}`
        const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)
        const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
        const sd = Math.sqrt(variance).toFixed(2)
        sdCells.push(new TableCell({ children: [new Paragraph(sd)], columnSpan: 3 }))
      })
      tableRows.push(new TableRow({ children: sdCells }))

      // CV row
      const cvCells = [new TableCell({ children: [new Paragraph({ text: 'CV', bold: true })], shading: { fill: 'FFFFE6' } })]
      DELPHI_CRITERIA.forEach(criteria => {
        const key = `item${itemIdx}_criteria${criteria.id}`
        const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)
        const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
        const cv = mean !== 0 ? (Math.sqrt(variance) / mean).toFixed(2) : '0.00'
        cvCells.push(new TableCell({ children: [new Paragraph(cv)], columnSpan: 3 }))
      })
      tableRows.push(new TableRow({ children: cvCells }))
    })

    // S-CVI/UA row
    const scviuaCells = [new TableCell({ children: [new Paragraph({ text: 'S-CVI/UA', bold: true })], shading: { fill: 'E0FFFF' } })]
    DELPHI_CRITERIA.forEach(criteria => {
      let perfectItems = 0
      translatedScaleItems.forEach((_, itemIdx) => {
        const key = `item${itemIdx}_criteria${criteria.id}`
        const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)
        const highRatings = ratings.filter(r => r >= 7).length
        const icvi = highRatings / expertResponses.length
        if (icvi === 1.00) perfectItems++
      })
      const scviua = (perfectItems / translatedScaleItems.length).toFixed(2)
      scviuaCells.push(new TableCell({ children: [new Paragraph(scviua)], columnSpan: 3 }))
    })
    tableRows.push(new TableRow({ children: scviuaCells }))

    const evaluationTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows
    })
    docSections.push(evaluationTable)

    // Statistical Metrics Explanation
    docSections.push(
      new Paragraph({
        text: 'Statistical Metrics Explained',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'I-CVI (Item Content Validity Index): ', bold: true }),
          new TextRun('Proportion of experts rating ≥7 for each item-criterion. Formula: (Count of ratings ≥7) / Total experts. Acceptable: ≥0.78 (Lynn, 1986)')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Median: ', bold: true }),
          new TextRun('Middle value of all expert ratings. Ideal: ≥7.0 indicates strong agreement.')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'SD (Standard Deviation): ', bold: true }),
          new TextRun('Measure of rating variability. Formula: √[Σ(rating - mean)² / n]. Lower is better: <1.5 shows good consensus.')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'CV (Coefficient of Variation): ', bold: true }),
          new TextRun('Relative variability (SD / Mean). Lower is better: <0.20 indicates stability.')
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'S-CVI/UA (Scale Content Validity Index / Universal Agreement): ', bold: true }),
          new TextRun('Proportion of items with perfect agreement (I-CVI = 1.00) per criterion. Formula: (Count of items with I-CVI = 1.00) / Total items. Acceptable: ≥0.80 (Polit & Beck, 2006)')
        ],
        spacing: { after: 400 }
      })
    )

    // Criteria Legend
    docSections.push(
      new Paragraph({
        text: 'Delphi Validation Criteria',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    DELPHI_CRITERIA.forEach(criteria => {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `C${criteria.id}: `, bold: true }),
            new TextRun(criteria.text),
            new TextRun({ text: ` (${criteria.category === 'content' ? 'Content-related' : 'Consensual-related'})`, italics: true })
          ],
          spacing: { after: 100 }
        })
      )
    })

    // Expert Remarks
    if (expertResponses.some(expert => expert.expertRemarks)) {
      docSections.push(
        new Paragraph({
          text: 'Expert Remarks',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      expertResponses.forEach((expert, idx) => {
        if (expert.expertRemarks) {
          docSections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${expert.expertName}: `, bold: true }),
                new TextRun(expert.expertRemarks)
              ],
              spacing: { after: 200 }
            })
          )
        }
      })
    }

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
      saveAs(blob, `Delphi_Evaluation_Report_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`)
      toast.success('Delphi report downloaded successfully!')
    } catch (error) {
      console.error('Error generating document:', error)
      toast.error('Failed to generate document')
    }
  }

  // Download APA formatted report as Word document (Face Validity)
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
      const res = await fetch(`${API_URL}/api/parse-document`, {
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
      const res = await fetch(`${API_URL}/api/parse-document`, {
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
                              EXPERT NAME
                            </th>
                            <th className="border border-purple-400 px-3 py-3 text-white text-xs" style={{ fontFamily: 'monospace' }}>
                              EMAIL
                            </th>
                            <th className="border border-purple-400 px-3 py-3 text-white text-xs" style={{ fontFamily: 'monospace' }}>
                              QUALIFICATION
                            </th>
                            <th className="border border-purple-400 px-3 py-3 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                              YEARS EXP
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
                                <td colSpan={FACE_VALIDITY_CRITERIA.length + 7} className="border border-purple-400 px-4 py-3 text-white font-bold" style={{ fontFamily: 'monospace' }}>
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
                                    <td className="border border-purple-400 px-3 py-3 text-purple-300 text-xs" style={{ fontFamily: 'monospace' }}>
                                      {expert.expertEmail}
                                    </td>
                                    <td className="border border-purple-400 px-3 py-3 text-purple-300 text-xs" style={{ fontFamily: 'monospace' }}>
                                      {expert.expertQualification}
                                    </td>
                                    <td className="border border-purple-400 px-3 py-3 text-center text-purple-300 text-xs" style={{ fontFamily: 'monospace' }}>
                                      {expert.expertYearsOfExperience}
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
                                    <td colSpan={FACE_VALIDITY_CRITERIA.length + 6} className="border border-purple-400 px-4 py-3 text-center text-yellow-400 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
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

                      {/* Expert Remarks Section */}
                      {expertResponses.some(expert => expert.expertRemarks) && (
                        <div className="mt-6 bg-yellow-900 bg-opacity-20 border-2 border-yellow-500 rounded-lg p-6">
                          <h3 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FFD700' }}>
                            💬 EXPERT REMARKS
                          </h3>
                          <div className="space-y-4">
                            {expertResponses.map((expert, idx) => (
                              expert.expertRemarks && (
                                <div key={idx} className="bg-black bg-opacity-60 border-2 border-yellow-600 rounded-lg p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ fontFamily: 'monospace' }}>
                                        {expert.expertName.charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-yellow-300 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                                          {expert.expertName}
                                        </h4>
                                        <span className="text-yellow-500 text-xs" style={{ fontFamily: 'monospace' }}>
                                          {expert.expertQualification}
                                        </span>
                                        <span className="text-yellow-600 text-xs" style={{ fontFamily: 'monospace' }}>
                                          {expert.expertYearsOfExperience} years exp.
                                        </span>
                                      </div>
                                      <p className="text-yellow-100 whitespace-pre-wrap" style={{ fontFamily: 'monospace', lineHeight: '1.6' }}>
                                        {expert.expertRemarks}
                                      </p>
                                      <p className="text-yellow-600 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                                        Submitted: {new Date(expert.submittedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
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
              {/* Sub-tabs for Delphi */}
              <div className="bg-black bg-opacity-80 border-b-2 border-blue-400 backdrop-blur-sm">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveSubTab('scales')}
                    className={`px-6 py-3 font-bold border-b-2 transition ${activeSubTab === 'scales' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                    style={{ fontFamily: 'monospace', textShadow: activeSubTab === 'scales' ? '0 0 5px #00BFFF' : 'none' }}
                  >
                    SCALES
                  </button>
                  <button
                    onClick={() => setActiveSubTab('evaluation')}
                    className={`px-6 py-3 font-bold border-b-2 transition ${activeSubTab === 'evaluation' ? 'border-blue-400 text-blue-400' : 'border-transparent text-blue-600 hover:text-blue-400'}`}
                    style={{ fontFamily: 'monospace', textShadow: activeSubTab === 'evaluation' ? '0 0 5px #00BFFF' : 'none' }}
                  >
                    DELPHI EVALUATION
                  </button>
                </div>
              </div>

              {/* Scales Sub-tab */}
              {activeSubTab === 'scales' && (
                <>
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

              {/* Delphi Evaluation Table Preview */}
              <div className="bg-black bg-opacity-80 border-2 border-orange-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(251, 146, 60, 0.3)' }}>
                <h3 className="text-2xl font-bold text-orange-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FB923C' }}>
                  DELPHI EVALUATION TABLE PREVIEW
                </h3>
                <p className="text-orange-300 mb-4" style={{ fontFamily: 'monospace' }}>
                  This is how experts will rate each item on a scale of 1-9:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full border-2 border-orange-500 text-sm">
                    <thead>
                      <tr className="bg-orange-900 bg-opacity-50">
                        <th rowSpan="2" className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>
                          Item
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
                      {translatedScaleItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="border-2 border-orange-500 p-8 text-center text-orange-300" style={{ fontFamily: 'monospace' }}>
                            Add translated scale items above to see the evaluation table
                          </td>
                        </tr>
                      ) : (
                        translatedScaleItems.map((item, itemIdx) => (
                          <tr key={item.id} className="border-b border-orange-700 bg-black bg-opacity-60">
                            <td className="border-2 border-orange-500 p-3 text-white font-bold" style={{ fontFamily: 'monospace' }}>
                              Item {itemIdx + 1}
                            </td>
                            {[1, 2, 3, 4, 5].map(criteriaId => (
                              <td key={criteriaId} className="border-2 border-orange-500 p-2 text-center">
                                <div className="text-orange-400 text-xs" style={{ fontFamily: 'monospace' }}>
                                  1-9
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-orange-300 text-sm" style={{ fontFamily: 'monospace' }}>
                  <p>📊 Rating Scale: 1 = Strongly Disagree / Not Appropriate, 9 = Strongly Agree / Highly Appropriate</p>
                </div>
              </div>
                </>
              )}

              {/* Delphi Evaluation Sub-tab */}
              {activeSubTab === 'evaluation' && (
                <div className="bg-black bg-opacity-80 border-2 border-orange-400 rounded-lg p-6 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(251, 146, 60, 0.3)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-orange-400" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FB923C' }}>
                        DELPHI EVALUATION RESULTS
                      </h2>
                      <p className="text-orange-300 mt-2" style={{ fontFamily: 'monospace' }}>
                        View expert ratings (1-9 scale) for each validation criterion
                      </p>
                    </div>
                    {expertResponses.length > 0 && (
                      <button
                        onClick={downloadDelphiReport}
                        className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-500 transition border-2 border-green-600"
                        style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
                      >
                        📥 DOWNLOAD DELPHI REPORT
                      </button>
                    )}
                  </div>

                  {expertResponses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-orange-400 text-lg" style={{ fontFamily: 'monospace' }}>
                        No expert responses yet. Invite experts to submit their Delphi evaluations.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Expert Information Table */}
                      <div className="overflow-x-auto">
                        <h3 className="text-xl font-bold text-orange-400 mb-3" style={{ fontFamily: 'monospace' }}>
                          EXPERT PANEL
                        </h3>
                        <table className="w-full border-2 border-orange-500">
                          <thead>
                            <tr className="bg-orange-900 bg-opacity-50">
                              <th className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>Name</th>
                              <th className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>Email</th>
                              <th className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>Qualification</th>
                              <th className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>Years Exp</th>
                              <th className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expertResponses.map((expert, idx) => (
                              <tr key={idx} className="bg-black bg-opacity-60">
                                <td className="border-2 border-orange-500 p-3 text-white" style={{ fontFamily: 'monospace' }}>{expert.expertName}</td>
                                <td className="border-2 border-orange-500 p-3 text-white" style={{ fontFamily: 'monospace' }}>{expert.expertEmail}</td>
                                <td className="border-2 border-orange-500 p-3 text-white" style={{ fontFamily: 'monospace' }}>{expert.expertQualification}</td>
                                <td className="border-2 border-orange-500 p-3 text-white" style={{ fontFamily: 'monospace' }}>{expert.expertYearsOfExperience}</td>
                                <td className="border-2 border-orange-500 p-3 text-white" style={{ fontFamily: 'monospace' }}>
                                  {new Date(expert.submittedAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Delphi Criteria Legend */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-purple-900 bg-opacity-20 border-2 border-purple-500 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-purple-400 mb-2" style={{ fontFamily: 'monospace' }}>
                            Content-related validation
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-white" style={{ fontFamily: 'monospace' }}><span className="text-purple-400 font-bold">C1:</span> Appropriateness of language used</p>
                            <p className="text-white" style={{ fontFamily: 'monospace' }}><span className="text-purple-400 font-bold">C2:</span> Assessment of the concept</p>
                            <p className="text-white" style={{ fontFamily: 'monospace' }}><span className="text-purple-400 font-bold">C3:</span> Retains the conceptual meaning</p>
                          </div>
                        </div>
                        <div className="bg-pink-900 bg-opacity-20 border-2 border-pink-500 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-pink-400 mb-2" style={{ fontFamily: 'monospace' }}>
                            Consensual-related validation
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-white" style={{ fontFamily: 'monospace' }}><span className="text-pink-400 font-bold">C4:</span> Appropriateness with individuals 18+ years</p>
                            <p className="text-white" style={{ fontFamily: 'monospace' }}><span className="text-pink-400 font-bold">C5:</span> Cultural relevance</p>
                          </div>
                        </div>
                      </div>

                      {/* Delphi Ratings Table - Aggregated Percentages by Rating Categories */}
                      <div className="overflow-x-auto">
                        <div className="mb-4 bg-blue-900 bg-opacity-20 border-2 border-blue-500 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-blue-400 mb-2" style={{ fontFamily: 'monospace' }}>
                            📊 DELPHI METHODOLOGY - AGGREGATED CONSENSUS
                          </h4>
                          <p className="text-blue-200 text-sm" style={{ fontFamily: 'monospace', lineHeight: '1.6' }}>
                            This evaluation database records individual assessments from <span className="text-blue-400 font-bold">{expertResponses.length} expert{expertResponses.length !== 1 ? 's' : ''}</span> during the Delphi process.
                            The table below displays <span className="text-blue-400 font-bold">aggregated percentage scores</span> from all experts for each item,
                            providing a consolidated view of expert consensus. The structure mirrors the Assessment Form, and values
                            <span className="text-green-400 font-bold"> update automatically</span> as additional expert evaluations are added.
                          </p>
                        </div>
                        <h3 className="text-xl font-bold text-orange-400 mb-3" style={{ fontFamily: 'monospace' }}>
                          AGGREGATED EXPERT RATINGS (Percentages by Rating Categories)
                        </h3>
                        <table className="w-full border-2 border-orange-500 text-sm">
                          <thead>
                            <tr className="bg-orange-900 bg-opacity-50">
                              <th rowSpan="3" className="border-2 border-orange-500 p-3 text-white text-left" style={{ fontFamily: 'monospace' }}>
                                Item
                              </th>
                              <th colSpan="9" className="border-2 border-orange-500 p-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                                Content-related validation
                              </th>
                              <th colSpan="6" className="border-2 border-orange-500 p-2 text-center text-white" style={{ fontFamily: 'monospace' }}>
                                Consensual-related validation
                              </th>
                            </tr>
                            <tr className="bg-orange-900 bg-opacity-40">
                              <th colSpan="3" className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                                Appropriateness of language used
                              </th>
                              <th colSpan="3" className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                                Assessment of the concept
                              </th>
                              <th colSpan="3" className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                                Retains the conceptual meaning
                              </th>
                              <th colSpan="3" className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                                Appropriateness with individuals 18+
                              </th>
                              <th colSpan="3" className="border-2 border-orange-500 p-2 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>
                                Cultural relevance
                              </th>
                            </tr>
                            <tr className="bg-orange-900 bg-opacity-30">
                              {/* C1 */}
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>0-3</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>4-6</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>7-9</th>
                              {/* C2 */}
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>0-3</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>4-6</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>7-9</th>
                              {/* C3 */}
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>0-3</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>4-6</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>7-9</th>
                              {/* C4 */}
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>0-3</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>4-6</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>7-9</th>
                              {/* C5 */}
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>0-3</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>4-6</th>
                              <th className="border-2 border-orange-500 p-1 text-center text-white text-xs" style={{ fontFamily: 'monospace' }}>7-9</th>
                            </tr>
                          </thead>
                          <tbody>
                            {translatedScaleItems.map((item, itemIdx) => {
                              // Calculate percentages by rating categories for this item
                              const calculateCategoryPercentages = (criteriaId) => {
                                const key = `item${itemIdx}_criteria${criteriaId}`
                                const totalExperts = expertResponses.length
                                if (totalExperts === 0) return { low: '0%', medium: '0%', high: '0%' }

                                // Count ratings in each category
                                let lowCount = 0    // 0-3
                                let mediumCount = 0 // 4-6
                                let highCount = 0   // 7-9

                                expertResponses.forEach(expert => {
                                  const rating = expert.responses[key] || 0
                                  if (rating >= 0 && rating <= 3) {
                                    lowCount++
                                  } else if (rating >= 4 && rating <= 6) {
                                    mediumCount++
                                  } else if (rating >= 7 && rating <= 9) {
                                    highCount++
                                  }
                                })

                                // Calculate percentages
                                const lowPercent = ((lowCount / totalExperts) * 100).toFixed(1)
                                const mediumPercent = ((mediumCount / totalExperts) * 100).toFixed(1)
                                const highPercent = ((highCount / totalExperts) * 100).toFixed(1)

                                return {
                                  low: `${lowPercent}%`,
                                  medium: `${mediumPercent}%`,
                                  high: `${highPercent}%`
                                }
                              }

                              // Calculate I-CVI and descriptive statistics for this item
                              const calculateItemStatistics = (criteriaId) => {
                                const key = `item${itemIdx}_criteria${criteriaId}`
                                const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)

                                if (ratings.length === 0) return { icvi: '0.00', median: '0.00', sd: '0.00', cv: '0.00' }

                                // I-CVI: Count ratings >= 7, divide by total experts
                                const highRatings = ratings.filter(r => r >= 7).length
                                const icvi = (highRatings / expertResponses.length).toFixed(2)

                                // Median
                                const sortedRatings = [...ratings].sort((a, b) => a - b)
                                const mid = Math.floor(sortedRatings.length / 2)
                                const median = sortedRatings.length % 2 === 0
                                  ? ((sortedRatings[mid - 1] + sortedRatings[mid]) / 2).toFixed(2)
                                  : sortedRatings[mid].toFixed(2)

                                // Mean
                                const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

                                // Standard Deviation
                                const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
                                const sd = Math.sqrt(variance).toFixed(2)

                                // Coefficient of Variation
                                const cv = mean !== 0 ? (Math.sqrt(variance) / mean).toFixed(2) : '0.00'

                                return { icvi, median, sd, cv }
                              }

                              return (
                                <>
                                  {/* Item Row */}
                                  <tr key={itemIdx} className="border-b border-orange-700 bg-black bg-opacity-60">
                                    <td className="border-2 border-orange-500 p-3 text-white font-bold" style={{ fontFamily: 'monospace' }}>
                                      Item {itemIdx + 1}
                                    </td>
                                    {[1, 2, 3, 4, 5].map(criteriaId => {
                                      const percentages = calculateCategoryPercentages(criteriaId)
                                      return (
                                        <>
                                          <td key={`${criteriaId}-low`} className="border-2 border-orange-500 p-2 text-center">
                                            <div className="text-red-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                              {percentages.low}
                                            </div>
                                          </td>
                                          <td key={`${criteriaId}-medium`} className="border-2 border-orange-500 p-2 text-center">
                                            <div className="text-yellow-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                              {percentages.medium}
                                            </div>
                                          </td>
                                          <td key={`${criteriaId}-high`} className="border-2 border-orange-500 p-2 text-center">
                                            <div className="text-green-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                              {percentages.high}
                                            </div>
                                          </td>
                                        </>
                                      )
                                    })}
                                  </tr>

                                  {/* I-CVI Row */}
                                  <tr className="bg-blue-900 bg-opacity-40">
                                    <td className="border-2 border-orange-500 p-2 text-blue-300 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                      I-CVI
                                    </td>
                                    {[1, 2, 3, 4, 5].map(criteriaId => {
                                      const stats = calculateItemStatistics(criteriaId)
                                      return (
                                        <td key={`icvi-${criteriaId}`} colSpan={3} className="border-2 border-orange-500 p-2 text-center">
                                          <div className="text-blue-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                            {stats.icvi}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>

                                  {/* Median Row */}
                                  <tr className="bg-purple-900 bg-opacity-40">
                                    <td className="border-2 border-orange-500 p-2 text-purple-300 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                      Median
                                    </td>
                                    {[1, 2, 3, 4, 5].map(criteriaId => {
                                      const stats = calculateItemStatistics(criteriaId)
                                      return (
                                        <td key={`median-${criteriaId}`} colSpan={3} className="border-2 border-orange-500 p-2 text-center">
                                          <div className="text-purple-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                            {stats.median}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>

                                  {/* SD Row */}
                                  <tr className="bg-green-900 bg-opacity-40">
                                    <td className="border-2 border-orange-500 p-2 text-green-300 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                      SD
                                    </td>
                                    {[1, 2, 3, 4, 5].map(criteriaId => {
                                      const stats = calculateItemStatistics(criteriaId)
                                      return (
                                        <td key={`sd-${criteriaId}`} colSpan={3} className="border-2 border-orange-500 p-2 text-center">
                                          <div className="text-green-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                            {stats.sd}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>

                                  {/* CV Row */}
                                  <tr className="bg-yellow-900 bg-opacity-40 border-b-4 border-orange-600">
                                    <td className="border-2 border-orange-500 p-2 text-yellow-300 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                      CV
                                    </td>
                                    {[1, 2, 3, 4, 5].map(criteriaId => {
                                      const stats = calculateItemStatistics(criteriaId)
                                      return (
                                        <td key={`cv-${criteriaId}`} colSpan={3} className="border-2 border-orange-500 p-2 text-center">
                                          <div className="text-yellow-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                                            {stats.cv}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                </>
                              )
                            })}

                            {/* S-CVI/UA Row - Scale Content Validity Index / Universal Agreement */}
                            {translatedScaleItems.length > 0 && (
                              <tr className="bg-gradient-to-r from-cyan-900 to-blue-900 bg-opacity-60 border-t-4 border-cyan-400">
                                <td className="border-2 border-orange-500 p-3 text-cyan-300 font-bold" style={{ fontFamily: 'monospace' }}>
                                  S-CVI/UA
                                </td>
                                {[1, 2, 3, 4, 5].map(criteriaId => {
                                  // Calculate S-CVI/UA: Count items with I-CVI = 1.00, divide by total items
                                  let perfectItems = 0
                                  translatedScaleItems.forEach((_, itemIdx) => {
                                    const key = `item${itemIdx}_criteria${criteriaId}`
                                    const ratings = expertResponses.map(expert => expert.responses[key] || 0).filter(r => r > 0)
                                    const highRatings = ratings.filter(r => r >= 7).length
                                    const icvi = highRatings / expertResponses.length
                                    if (icvi === 1.00) perfectItems++
                                  })
                                  const scviua = (perfectItems / translatedScaleItems.length).toFixed(2)

                                  return (
                                    <td key={`scviua-${criteriaId}`} colSpan={3} className="border-2 border-orange-500 p-3 text-center">
                                      <div className="text-cyan-400 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                                        {scviua}
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <div className="mt-4 bg-gray-900 bg-opacity-50 border-2 border-gray-600 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-gray-300 mb-3" style={{ fontFamily: 'monospace' }}>
                            📈 INTERPRETATION GUIDE
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded p-3">
                              <div className="text-red-400 font-bold text-sm mb-1" style={{ fontFamily: 'monospace' }}>🔴 LOW (0-3)</div>
                              <p className="text-red-200 text-xs" style={{ fontFamily: 'monospace' }}>Indicates disagreement or low appropriateness</p>
                            </div>
                            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded p-3">
                              <div className="text-yellow-400 font-bold text-sm mb-1" style={{ fontFamily: 'monospace' }}>🟡 MEDIUM (4-6)</div>
                              <p className="text-yellow-200 text-xs" style={{ fontFamily: 'monospace' }}>Indicates moderate agreement or neutral stance</p>
                            </div>
                            <div className="bg-green-900 bg-opacity-20 border border-green-500 rounded p-3">
                              <div className="text-green-400 font-bold text-sm mb-1" style={{ fontFamily: 'monospace' }}>🟢 HIGH (7-9)</div>
                              <p className="text-green-200 text-xs" style={{ fontFamily: 'monospace' }}>Indicates strong agreement or high appropriateness</p>
                            </div>
                          </div>
                          <div className="text-orange-300 text-sm space-y-1" style={{ fontFamily: 'monospace' }}>
                            <p><span className="text-orange-400 font-bold">Formula:</span> Percentage = (Number of experts in category / Total experts) × 100</p>
                            <p><span className="text-orange-400 font-bold">Example:</span> If 10 experts rate an item - 1 gives 2, 3 give 5, 6 give 8 → Low: 10%, Medium: 30%, High: 60%</p>
                            <p className="text-green-400"><span className="font-bold">✓ Auto-Update:</span> Percentages recalculate automatically when new expert responses are submitted</p>
                          </div>
                        </div>

                        {/* Statistical Metrics Explanation */}
                        <div className="mt-4 bg-gradient-to-r from-indigo-900 to-purple-900 bg-opacity-40 border-2 border-indigo-500 rounded-lg p-4">
                          <h4 className="text-lg font-bold text-indigo-300 mb-3" style={{ fontFamily: 'monospace' }}>
                            📐 STATISTICAL METRICS EXPLAINED
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ fontFamily: 'monospace' }}>
                            <div className="bg-black bg-opacity-40 border border-blue-500 rounded p-3">
                              <div className="text-blue-400 font-bold mb-1">I-CVI (Item Content Validity Index)</div>
                              <p className="text-blue-200 text-xs mb-1">Proportion of experts rating ≥7 for each item-criterion</p>
                              <p className="text-blue-300 text-xs"><span className="font-bold">Formula:</span> (Count of ratings ≥7) / Total experts</p>
                              <p className="text-green-400 text-xs mt-1"><span className="font-bold">Acceptable:</span> ≥0.78 (Lynn, 1986)</p>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-purple-500 rounded p-3">
                              <div className="text-purple-400 font-bold mb-1">Median</div>
                              <p className="text-purple-200 text-xs mb-1">Middle value of all expert ratings</p>
                              <p className="text-purple-300 text-xs"><span className="font-bold">Interpretation:</span> Central tendency of expert consensus</p>
                              <p className="text-green-400 text-xs mt-1"><span className="font-bold">Ideal:</span> ≥7.0 indicates strong agreement</p>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-green-500 rounded p-3">
                              <div className="text-green-400 font-bold mb-1">SD (Standard Deviation)</div>
                              <p className="text-green-200 text-xs mb-1">Measure of rating variability/dispersion</p>
                              <p className="text-green-300 text-xs"><span className="font-bold">Formula:</span> √[Σ(rating - mean)² / n]</p>
                              <p className="text-green-400 text-xs mt-1"><span className="font-bold">Lower is better:</span> &lt;1.5 shows good consensus</p>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-yellow-500 rounded p-3">
                              <div className="text-yellow-400 font-bold mb-1">CV (Coefficient of Variation)</div>
                              <p className="text-yellow-200 text-xs mb-1">Relative variability (SD / Mean)</p>
                              <p className="text-yellow-300 text-xs"><span className="font-bold">Formula:</span> SD / Mean</p>
                              <p className="text-green-400 text-xs mt-1"><span className="font-bold">Lower is better:</span> &lt;0.20 indicates stability</p>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-cyan-500 rounded p-3 md:col-span-2">
                              <div className="text-cyan-400 font-bold mb-1">S-CVI/UA (Scale Content Validity Index / Universal Agreement)</div>
                              <p className="text-cyan-200 text-xs mb-1">Proportion of items with perfect agreement (I-CVI = 1.00) per criterion</p>
                              <p className="text-cyan-300 text-xs"><span className="font-bold">Formula:</span> (Count of items with I-CVI = 1.00) / Total items</p>
                              <p className="text-green-400 text-xs mt-1"><span className="font-bold">Acceptable:</span> ≥0.80 (Polit & Beck, 2006)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Consensus Summary Statistics */}
                      {expertResponses.length > 0 && translatedScaleItems.length > 0 && (
                        <div className="mt-6 bg-gradient-to-r from-blue-900 to-purple-900 bg-opacity-30 border-2 border-blue-400 rounded-lg p-5">
                          <h3 className="text-xl font-bold text-blue-300 mb-4" style={{ fontFamily: 'monospace' }}>
                            📊 CONSENSUS SUMMARY
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-black bg-opacity-40 border border-blue-500 rounded-lg p-4">
                              <div className="text-blue-400 text-sm mb-1" style={{ fontFamily: 'monospace' }}>Total Experts</div>
                              <div className="text-white text-3xl font-bold" style={{ fontFamily: 'monospace' }}>{expertResponses.length}</div>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-orange-500 rounded-lg p-4">
                              <div className="text-orange-400 text-sm mb-1" style={{ fontFamily: 'monospace' }}>Total Items</div>
                              <div className="text-white text-3xl font-bold" style={{ fontFamily: 'monospace' }}>{translatedScaleItems.length}</div>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-green-500 rounded-lg p-4">
                              <div className="text-green-400 text-sm mb-1" style={{ fontFamily: 'monospace' }}>Total Evaluations</div>
                              <div className="text-white text-3xl font-bold" style={{ fontFamily: 'monospace' }}>
                                {expertResponses.length * translatedScaleItems.length * 5}
                              </div>
                            </div>
                            <div className="bg-black bg-opacity-40 border border-purple-500 rounded-lg p-4">
                              <div className="text-purple-400 text-sm mb-1" style={{ fontFamily: 'monospace' }}>Criteria Assessed</div>
                              <div className="text-white text-3xl font-bold" style={{ fontFamily: 'monospace' }}>5</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expert Remarks Section */}
                      {expertResponses.some(expert => expert.expertRemarks) && (
                        <div className="mt-6 bg-yellow-900 bg-opacity-20 border-2 border-yellow-500 rounded-lg p-6">
                          <h3 className="text-2xl font-bold text-yellow-400 mb-4" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #FFD700' }}>
                            💬 EXPERT REMARKS
                          </h3>
                          <div className="space-y-4">
                            {expertResponses.map((expert, idx) => (
                              expert.expertRemarks && (
                                <div key={idx} className="bg-black bg-opacity-60 border-2 border-yellow-600 rounded-lg p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ fontFamily: 'monospace' }}>
                                        {expert.expertName.charAt(0).toUpperCase()}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-yellow-300 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                                          {expert.expertName}
                                        </h4>
                                        <span className="text-yellow-500 text-xs" style={{ fontFamily: 'monospace' }}>
                                          {expert.expertQualification}
                                        </span>
                                        <span className="text-yellow-600 text-xs" style={{ fontFamily: 'monospace' }}>
                                          {expert.expertYearsOfExperience} years exp.
                                        </span>
                                      </div>
                                      <p className="text-yellow-100 whitespace-pre-wrap" style={{ fontFamily: 'monospace', lineHeight: '1.6' }}>
                                        {expert.expertRemarks}
                                      </p>
                                      <p className="text-yellow-600 text-xs mt-2" style={{ fontFamily: 'monospace' }}>
                                        Submitted: {new Date(expert.submittedAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDashboard
