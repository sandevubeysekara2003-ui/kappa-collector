import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import HomePage from './components/HomePage'
import ProjectDashboard from './components/ProjectDashboard'
import ExpertAssessment from './components/ExpertAssessment'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [expertProjectId, setExpertProjectId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if this is an expert assessment link
    const path = window.location.pathname
    const expertMatch = path.match(/\/expert-assessment\/(.+)/)

    if (expertMatch) {
      const projectId = expertMatch[1]
      setExpertProjectId(projectId)
      setCurrentPage('expert-assessment')
      setIsLoading(false)
    } else {
      // Clear any old tokens and start fresh
      localStorage.removeItem('token')
      setIsLoading(false)
    }
  }, [])

  const fetchUserData = async (token) => {
    try {
      const res = await fetch('http://localhost:4000/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setCurrentPage('home')
      } else {
        localStorage.removeItem('token')
      }
    } catch (err) {
      console.error(err)
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentPage('home')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentPage('login')
    setSelectedProject(null)
  }

  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    setCurrentPage('project-dashboard')
  }

  const handleBackToHome = () => {
    setSelectedProject(null)
    setCurrentPage('home')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {currentPage === 'login' && (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentPage('register')}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage
          onRegister={handleLogin}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'home' && user && (
        <HomePage
          user={user}
          onLogout={handleLogout}
          onProjectSelect={handleProjectSelect}
        />
      )}

      {currentPage === 'project-dashboard' && selectedProject && (
        <ProjectDashboard
          project={selectedProject}
          user={user}
          onBack={handleBackToHome}
        />
      )}

      {currentPage === 'expert-assessment' && expertProjectId && (
        <ExpertAssessment
          projectId={expertProjectId}
          onBack={() => setCurrentPage('login')}
        />
      )}
    </div>
  )
}

export default App
