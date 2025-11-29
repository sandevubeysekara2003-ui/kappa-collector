import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

function LoginPage({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
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
    <div className="min-h-screen relative overflow-hidden bg-black flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10 w-full max-w-md">
        <h1 className="text-6xl font-bold text-center mb-8 text-blue-400 tracking-wider animate-pulse" style={{ fontFamily: 'monospace', textShadow: '0 0 10px #00BFFF, 0 0 20px #00BFFF, 0 0 30px #00BFFF' }}>
          KAPPA Collector
        </h1>

        <div className="bg-black bg-opacity-80 border-2 border-blue-400 rounded-lg shadow-2xl p-8 backdrop-blur-sm" style={{ boxShadow: '0 0 20px rgba(0, 191, 255, 0.3)' }}>
          <h2 className="text-2xl font-bold text-center text-blue-400 mb-6" style={{ fontFamily: 'monospace' }}>
            ACCESS TERMINAL
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-400 mb-1" style={{ fontFamily: 'monospace' }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700"
                placeholder="user@kappa.net"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-400 mb-1" style={{ fontFamily: 'monospace' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-black border-2 border-blue-400 rounded text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-blue-700"
                placeholder="••••••••"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-400 text-black py-3 rounded font-bold hover:bg-blue-300 transition disabled:opacity-50 border-2 border-blue-400"
              style={{ fontFamily: 'monospace', boxShadow: '0 0 10px rgba(0, 191, 255, 0.5)' }}
            >
              {isLoading ? 'ACCESSING...' : 'ENTER SYSTEM'}
            </button>
          </form>

          <p className="text-center text-blue-400 mt-4" style={{ fontFamily: 'monospace' }}>
            NEW USER?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-300 font-semibold hover:underline"
            >
              REGISTER
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
