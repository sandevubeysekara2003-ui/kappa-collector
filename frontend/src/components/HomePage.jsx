import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

function HomePage({ user, onLogout, onProjectSelect }) {
  const [projects, setProjects] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectType, setProjectType] = useState('delphi') // 'delphi' or 'face-validity'
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
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:4000/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()

    if (!projectName) {
      toast.error('Please enter a project name')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:4000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          type: projectType
        })
      })

      if (res.ok) {
        toast.success(`${projectType === 'delphi' ? 'Delphi Study' : 'Face Validity'} project created successfully!`)
        setShowCreateModal(false)
        setProjectName('')
        setProjectDescription('')
        setProjectType('delphi')
        fetchProjects()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create project')
      }
    } catch (err) {
      toast.error('Connection error')
    }
  }

  const handleDeleteProject = async (e, projectId, projectName) => {
    e.stopPropagation() // Prevent opening the project when clicking delete

    if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        toast.success('Project deleted successfully!')
        fetchProjects()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete project')
      }
    } catch (err) {
      toast.error('Failed to delete project')
    }
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
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-400 tracking-wider" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
                KAPPA Collector
              </h1>
              <p className="text-sm text-blue-300 mt-1" style={{ fontFamily: 'monospace' }}>
                AGENT: {user.name.toUpperCase()}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-6 py-2 bg-red-500 text-white rounded border-2 border-red-400 hover:bg-red-600 transition font-bold"
              style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-blue-400" style={{ fontFamily: 'monospace', textShadow: '0 0 5px #00BFFF' }}>
              ACTIVE PROJECTS
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-400 text-black rounded border-2 border-blue-400 hover:bg-blue-300 transition font-bold"
              style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
            >
              + NEW PROJECT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg p-6 hover:border-blue-300 transition cursor-pointer backdrop-blur-sm relative"
                onClick={() => onProjectSelect(project)}
                style={{ boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)' }}
              >
                <button
                  onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                  className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded font-bold hover:bg-red-500 transition border-2 border-red-600 text-xs"
                  style={{ fontFamily: 'monospace' }}
                >
                  🗑️ DELETE
                </button>
                <h3 className="text-lg font-semibold text-blue-400 mb-2 pr-20" style={{ fontFamily: 'monospace' }}>
                  {project.name.toUpperCase()}
                </h3>
                <p className="text-sm text-blue-300 mb-4" style={{ fontFamily: 'monospace' }}>
                  {project.description || 'NO DESCRIPTION'}
                </p>
                <div className="flex gap-2 text-xs text-blue-500" style={{ fontFamily: 'monospace' }}>
                  <span>TYPE: {project.type === 'delphi' ? 'DELPHI' : 'FACE VALIDITY'}</span>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12 text-blue-400" style={{ fontFamily: 'monospace' }}>
              <p>NO PROJECTS FOUND. CREATE YOUR FIRST PROJECT!</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-black border-2 border-blue-400 rounded-lg p-6 w-full max-w-md" style={{ boxShadow: '0 0 30px rgba(0, 191, 255, 0.5)' }}>
            <h2 className="text-2xl font-bold mb-4 text-blue-400 text-center" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF' }}>
              CREATE NEW PROJECT
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-400 mb-1" style={{ fontFamily: 'monospace' }}>
                  PROJECT TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProjectType('delphi')}
                    className={`px-4 py-3 rounded font-bold transition border-2 ${
                      projectType === 'delphi'
                        ? 'bg-blue-400 text-black border-blue-400'
                        : 'bg-black text-blue-400 border-blue-400 hover:bg-blue-900'
                    }`}
                    style={{ fontFamily: 'monospace', boxShadow: projectType === 'delphi' ? '0 0 10px rgba(0, 191, 255, 0.5)' : 'none' }}
                  >
                    DELPHI STUDY
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectType('face-validity')}
                    className={`px-4 py-3 rounded font-bold transition border-2 ${
                      projectType === 'face-validity'
                        ? 'bg-blue-400 text-black border-blue-400'
                        : 'bg-black text-blue-400 border-blue-400 hover:bg-blue-900'
                    }`}
                    style={{ fontFamily: 'monospace', boxShadow: projectType === 'face-validity' ? '0 0 10px rgba(0, 191, 255, 0.5)' : 'none' }}
                  >
                    FACE VALIDITY
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-400 mb-1" style={{ fontFamily: 'monospace' }}>
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700"
                  placeholder="Enter project name"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-400 mb-1" style={{ fontFamily: 'monospace' }}>
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700"
                  placeholder="Enter project description"
                  rows={3}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-400 text-black py-2 rounded font-bold hover:bg-blue-300 transition border-2 border-blue-400"
                  style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
                >
                  CREATE
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 text-blue-400 py-2 rounded font-bold hover:bg-gray-600 transition border-2 border-blue-400"
                  style={{ fontFamily: 'monospace' }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
