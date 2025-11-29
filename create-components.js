const fs = require('fs');
const path = require('path');

const loginPage = `import { useState } from 'react'
import { toast } from 'react-toastify'

function LoginPage({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        toast.success('Login successful!')
        onLogin(data.user)
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-purple-600 font-semibold hover:underline"
          >
            Register
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
`;

const registerPage = `import { useState } from 'react'
import { toast } from 'react-toastify'

function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('token', data.token)
        toast.success('Registration successful!')
        onRegister(data.user)
      } else {
        toast.error(data.error || 'Registration failed')
      }
    } catch (err) {
      toast.error('Connection error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-purple-600 font-semibold hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
`;

const homePage = `import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

function HomePage({ user, onLogout, onProjectSelect }) {
  const [projects, setProjects] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:4000/api/projects', {
        headers: { 'Authorization': \`Bearer \${token}\` }
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
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription
        })
      })

      if (res.ok) {
        toast.success('Project created successfully!')
        setShowCreateModal(false)
        setProjectName('')
        setProjectDescription('')
        fetchProjects()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create project')
      }
    } catch (err) {
      toast.error('Connection error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Validation Platform</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">My Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            + Create Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{project.description || 'No description'}</p>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>Face Validity: {project.faceValidity?.submissions?.length || 0}</span>
                <span>•</span>
                <span>Delphi: {project.delphi?.submissions?.length || 0}</span>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
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
`;

const projectDashboard = `import { useState } from 'react'

function ProjectDashboard({ project, user, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={onBack} className="text-purple-600 hover:text-purple-700 mb-2">
            Back to Projects
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          <p className="text-sm text-gray-600">{project.description}</p>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('overview')} className={\`px-4 py-3 font-medium border-b-2 transition \${activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-800'}\`}>
              Overview
            </button>
            <button onClick={() => setActiveTab('face-validity')} className={\`px-4 py-3 font-medium border-b-2 transition \${activeTab === 'face-validity' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-800'}\`}>
              Face Validity
            </button>
            <button onClick={() => setActiveTab('delphi')} className={\`px-4 py-3 font-medium border-b-2 transition \${activeTab === 'delphi' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 hover:text-gray-800'}\`}>
              Delphi Method
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">Face Validity</h3>
                <p className="text-sm text-gray-600 mb-2">Experts evaluate items</p>
                <p className="text-2xl font-bold text-purple-600">{project.faceValidity?.submissions?.length || 0} submissions</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Delphi Method</h3>
                <p className="text-sm text-gray-600 mb-2">Consensus building</p>
                <p className="text-2xl font-bold text-orange-600">{project.delphi?.submissions?.length || 0} submissions</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'face-validity' && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">Face Validity Assessment</h2>
            <p className="text-gray-700 mb-6">Face validity evaluation form</p>
            <div className="bg-white rounded-lg p-6">
              <p className="text-sm text-gray-500">Face validity form coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'delphi' && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-orange-800 mb-4">Delphi Method Assessment</h2>
            <p className="text-gray-700 mb-6">Delphi method evaluation form</p>
            <div className="bg-white rounded-lg p-6">
              <p className="text-sm text-gray-500">Delphi form coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDashboard
`;

fs.writeFileSync('frontend/src/components/LoginPage.jsx', loginPage, 'utf8');
fs.writeFileSync('frontend/src/components/RegisterPage.jsx', registerPage, 'utf8');
fs.writeFileSync('frontend/src/components/HomePage.jsx', homePage, 'utf8');
fs.writeFileSync('frontend/src/components/ProjectDashboard.jsx', projectDashboard, 'utf8');
console.log('All components created successfully!');

