import { useState, useEffect } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Assessment from './components/Assessment'
import AdminDashboard from './components/AdminDashboard'



function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [loginErrors, setLoginErrors] = useState({})
  const [registerErrors, setRegisterErrors] = useState({})
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      fetch('http://localhost:4000/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(r => {
          if (!r.ok) {
            throw new Error('Unauthorized')
          }
          return r.json()
        })
        .then(data => {
          if (data.error) {
            localStorage.removeItem('token')
            return
          }
          setUser(data)
          setIsAuthenticated(true)
        })
        .catch(err => {
          localStorage.removeItem('token')
          console.error('Auth check failed:', err)
        })
    }
  }, [])

  const validateLogin = (email, password) => {
    const errors = {}
    
    if (!email || email.trim() === '') {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password || password.trim() === '') {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    return errors
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    const form = e.target
    const email = form.loginEmail.value.trim()
    const password = form.loginPassword.value
    
    const errors = validateLogin(email, password)
    setLoginErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error)
          return
        }
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        toast.success('Login successful! Welcome back.')
        setShowLogin(false)
        setLoginErrors({})
        form.reset()
      })
      .catch(err => {
        toast.error('Login failed. Please try again.')
        console.error(err)
      })
  }

  const validateRegister = (name, email, password, confirmPassword) => {
    const errors = {}
    
    if (!name || name.trim() === '') {
      errors.name = 'Full name is required'
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      errors.name = 'Name can only contain letters and spaces'
    }
    
    if (!email || email.trim() === '') {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password || password.trim() === '') {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    } else if (password.length > 50) {
      errors.password = 'Password must be less than 50 characters'
    }
    
    if (!confirmPassword || confirmPassword.trim() === '') {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    return errors
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.registerName.value.trim()
    const qualification = form.registerQualification?.value.trim() || ''
    const email = form.registerEmail.value.trim()
    const experience = form.registerExperience?.value.trim() || ''
    const password = form.registerPassword.value
    const confirmPassword = form.registerConfirmPassword.value
    
    const errors = validateRegister(name, email, password, confirmPassword)
    setRegisterErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    fetch('http://localhost:4000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, qualification, email, experience, password })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error)
          return
        }
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setIsAuthenticated(true)
        toast.success('Registration successful! Welcome to Kappa Score.')
        setShowRegister(false)
        setRegisterErrors({})
        form.reset()
      })
      .catch(err => {
        toast.error('Registration failed. Please try again.')
        console.error(err)
      })
  }

  const handleLoginInputChange = (field) => {
    if (loginErrors[field]) {
      setLoginErrors({ ...loginErrors, [field]: '' })
    }
  }

  const handleRegisterInputChange = (field) => {
    if (registerErrors[field]) {
      setRegisterErrors({ ...registerErrors, [field]: '' })
    }
  }

  const closeLoginModal = () => {
    setShowLogin(false)
    setLoginErrors({})
  }

  const closeRegisterModal = () => {
    setShowRegister(false)
    setRegisterErrors({})
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }

  // Show Assessment page if user is authenticated
  if (isAuthenticated && user) {
    // Check if user is admin
    const isAdmin = user.isAdmin || user.email === 'admin@venu.com' || user.id === 'admin'
    
    return (
      <>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        {isAdmin ? (
          <AdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <Assessment user={user} onLogout={handleLogout} />
        )}
      </>
    )
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <style>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        :root {
            --primary: #4361ee;
            --secondary: #3a0ca3;
            --accent: #4cc9f0;
            --light: #f8f9fa;
            --dark: #212529;
            --success: #4bb543;
        }

        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: var(--dark);
            line-height: 1.6;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        header {
            background-color: white;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
        }

        .logo i {
            color: var(--secondary);
        }

        .nav-links {
            display: flex;
            gap: 2rem;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--dark);
            font-weight: 500;
            transition: color 0.3s;
        }

        .nav-links a:hover {
            color: var(--primary);
        }

        .auth-buttons {
            display: flex;
            gap: 1rem;
        }

        .btn {
            padding: 0.6rem 1.5rem;
            border-radius: 30px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            font-size: 0.9rem;
        }

        .btn-outline {
            background: transparent;
            border: 2px solid var(--primary);
            color: var(--primary);
        }

        .btn-outline:hover {
            background: var(--primary);
            color: white;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            border: 2px solid var(--primary);
        }

        .btn-primary:hover {
            background: var(--secondary);
            border-color: var(--secondary);
        }

        .hero {
            padding: 5rem 0;
            display: flex;
            align-items: center;
            min-height: 80vh;
        }

        .hero .container {
            display: flex;
            align-items: center;
            gap: 3rem;
            width: 100%;
        }

        .hero-content {
            flex: 1;
            padding-right: 2rem;
        }

        .hero-image {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .hero h1 {
            font-size: 3.5rem;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            color: var(--secondary);
        }

        .tagline {
            font-size: 1.8rem;
            color: var(--primary);
            margin-bottom: 2rem;
            font-weight: 300;
        }

        .description {
            font-size: 1.1rem;
            margin-bottom: 2.5rem;
            color: #555;
            max-width: 600px;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
        }

        .graphic {
            width: 100%;
            max-width: 500px;
            height: 400px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            box-shadow: 0 10px 30px rgba(67, 97, 238, 0.3);
            position: relative;
            overflow: hidden;
        }

        .graphic::before {
            content: "";
            position: absolute;
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            top: -50px;
            left: -50px;
        }

        .graphic::after {
            content: "";
            position: absolute;
            width: 200px;
            height: 200px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            bottom: -80px;
            right: -80px;
        }

        .graphic-content {
            z-index: 1;
            text-align: center;
            padding: 2rem;
        }

        .graphic-content i {
            font-size: 4rem;
            margin-bottom: 1rem;
        }

        .features {
            padding: 5rem 0;
            background-color: white;
        }

        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: var(--secondary);
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }

        .feature-card {
            background: var(--light);
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
            font-size: 2.5rem;
            color: var(--primary);
            margin-bottom: 1.5rem;
        }

        .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: var(--secondary);
        }

        .cta {
            padding: 5rem 0;
            text-align: center;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
            color: white;
        }

        .cta h2 {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
        }

        .cta p {
            font-size: 1.2rem;
            max-width: 700px;
            margin: 0 auto 2rem;
            opacity: 0.9;
        }

        .cta-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
        }

        .btn-light {
            background: white;
            color: var(--primary);
            border: 2px solid white;
        }

        .btn-light:hover {
            background: transparent;
            color: white;
        }

        footer {
            background: var(--dark);
            color: white;
            padding: 3rem 0 1.5rem;
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .footer-column {
            flex: 1;
            min-width: 200px;
        }

        .footer-column h3 {
            font-size: 1.2rem;
            margin-bottom: 1.5rem;
            color: var(--accent);
        }

        .footer-links {
            list-style: none;
        }

        .footer-links li {
            margin-bottom: 0.8rem;
        }

        .footer-links a {
            color: #ddd;
            text-decoration: none;
            transition: color 0.3s;
        }

        .footer-links a:hover {
            color: var(--accent);
        }

        .copyright {
            text-align: center;
            padding-top: 1.5rem;
            border-top: 1px solid #444;
            color: #aaa;
            font-size: 0.9rem;
        }

        .modal {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            background: white;
            border-radius: 15px;
            width: 100%;
            max-width: 480px;
            padding: 2.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            position: relative;
            animation: slideDown 0.3s ease-out;
            max-height: 90vh;
            overflow-y: auto;
        }

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

        .close-modal {
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 1.8rem;
            cursor: pointer;
            color: #777;
            line-height: 1;
            transition: color 0.3s;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .close-modal:hover {
            color: var(--dark);
            background-color: #f0f0f0;
        }

        .modal h2 {
            text-align: center;
            margin-bottom: 1.5rem;
            color: var(--secondary);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--dark);
        }

        .form-group input {
            width: 100%;
            padding: 0.8rem 1rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
            background-color: #ffffff;
            color: var(--dark);
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
        }

        .form-group input.error {
            border-color: #dc3545;
        }

        .error-message {
            color: #dc3545;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            display: block;
        }

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }

        .form-options a {
            color: var(--primary);
            text-decoration: none;
        }

        .submit-btn {
            width: 100%;
            padding: 0.8rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }

        .submit-btn:hover {
            background: var(--secondary);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        .auth-switch {
            text-align: center;
            margin-top: 1.5rem;
            font-size: 0.9rem;
        }

        .auth-switch a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }

        @media (max-width: 768px) {
            .navbar {
                flex-direction: column;
                gap: 1rem;
            }

            .nav-links {
                gap: 1rem;
            }

            .hero {
                padding: 3rem 0;
            }

            .hero .container {
                flex-direction: column;
                gap: 2rem;
            }

            .hero-content {
                padding-right: 0;
                text-align: center;
                margin-bottom: 2rem;
            }

            .hero-image {
                width: 100%;
            }

            .hero h1 {
                font-size: 2.5rem;
            }

            .tagline {
                font-size: 1.5rem;
            }

            .hero-buttons, .cta-buttons {
                flex-direction: column;
                align-items: center;
            }

            .graphic {
                height: 300px;
            }
        }
      `}</style>

      <header>
        <div className="container">
          <nav className="navbar">
            <div className="logo">
              <i className="fas fa-chart-line"></i>
              <span>Kappa Score</span>
            </div>
            <div className="nav-links">
              <a href="#">Home</a>
              <a href="#">Features</a>
              <a href="#">How It Works</a>
              <a href="#">Pricing</a>
            </div>
            <div className="auth-buttons">
              <button className="btn btn-outline" onClick={() => setShowLogin(true)}>Login</button>
              <button className="btn btn-primary" onClick={() => setShowRegister(true)}>Register</button>
            </div>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Kappa Score Collector</h1>
            <div className="tagline">Validate Smarter, Judge Better</div>
            <p className="description">
              Streamline your validation processes with our advanced Kappa score collection platform. 
              Make data-driven decisions with confidence and improve inter-rater reliability across your organization.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => setShowRegister(true)}>Get Started Free</button>
              <button className="btn btn-outline">Learn More</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="graphic">
              <div className="graphic-content">
                <i className="fas fa-analytics"></i>
                <h3>Reliability Metrics</h3>
                <p>Advanced Kappa Statistics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Kappa Score Collector?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h3>Advanced Analytics</h3>
              <p>Comprehensive Kappa statistics with detailed visualizations to understand inter-rater reliability.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Collaborative Rating</h3>
              <p>Enable multiple raters to evaluate content simultaneously with real-time synchronization.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure & Compliant</h3>
              <p>Enterprise-grade security with compliance for sensitive data and research protocols.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Ready to Improve Your Validation Process?</h2>
          <p>Join thousands of researchers and organizations who trust Kappa Score Collector for their reliability metrics.</p>
          <div className="cta-buttons">
            <button className="btn btn-light" onClick={() => setShowRegister(true)}>Start Free Trial</button>
            <button className="btn btn-outline" style={{borderColor: 'white', color: 'white'}}>Schedule a Demo</button>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Kappa Score</h3>
              <p>Validate Smarter, Judge Better. The premier platform for inter-rater reliability assessment.</p>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul className="footer-links">
                <li><a href="#">Home</a></li>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Documentation</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Resources</h3>
              <ul className="footer-links">
                <li><a href="#">Blog</a></li>
                <li><a href="#">Case Studies</a></li>
                <li><a href="#">Support</a></li>
                <li><a href="#">API</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contact</h3>
              <ul className="footer-links">
                <li><a href="#">info@kappascore.com</a></li>
                <li><a href="#">+1 (555) 123-4567</a></li>
                <li><a href="#">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>© 2023 Kappa Score Collector. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showLogin && (
        <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal() }}>
          <div className="modal-content">
            <span className="close-modal" onClick={closeLoginModal}>&times;</span>
            <h2>Login to Your Account</h2>
            <form id="loginForm" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">Email</label>
                <input 
                  type="email" 
                  id="loginEmail" 
                  name="loginEmail"
                  placeholder="Enter your email" 
                  className={loginErrors.email ? 'error' : ''}
                  onChange={() => handleLoginInputChange('email')}
                  required 
                />
                {loginErrors.email && <span className="error-message">{loginErrors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Password</label>
                <input 
                  type="password" 
                  id="loginPassword" 
                  name="loginPassword"
                  placeholder="Enter your password" 
                  className={loginErrors.password ? 'error' : ''}
                  onChange={() => handleLoginInputChange('password')}
                  required 
                />
                {loginErrors.password && <span className="error-message">{loginErrors.password}</span>}
              </div>
              <div className="form-options">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#">Forgot password?</a>
              </div>
              <button type="submit" className="submit-btn">Login</button>
            </form>
            <div className="auth-switch">
              Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); closeLoginModal(); setShowRegister(true); }}>Register</a>
            </div>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) closeRegisterModal() }}>
          <div className="modal-content">
            <span className="close-modal" onClick={closeRegisterModal}>&times;</span>
            <h2>Create an Account</h2>
            <form id="registerForm" onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label htmlFor="registerName">Full Name</label>
                <input 
                  type="text" 
                  id="registerName" 
                  name="registerName"
                  placeholder="Enter your full name" 
                  className={registerErrors.name ? 'error' : ''}
                  onChange={() => handleRegisterInputChange('name')}
                  required 
                />
                {registerErrors.name && <span className="error-message">{registerErrors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="registerQualification">Qualification (Optional)</label>
                <input 
                  type="text" 
                  id="registerQualification" 
                  name="registerQualification"
                  placeholder="e.g. MSc, PhD, BSc" 
                  onChange={() => handleRegisterInputChange('qualification')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerEmail">Email</label>
                <input 
                  type="email" 
                  id="registerEmail" 
                  name="registerEmail"
                  placeholder="Enter your email" 
                  className={registerErrors.email ? 'error' : ''}
                  onChange={() => handleRegisterInputChange('email')}
                  required 
                />
                {registerErrors.email && <span className="error-message">{registerErrors.email}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="registerPassword">Password</label>
                <input 
                  type="password" 
                  id="registerPassword" 
                  name="registerPassword"
                  placeholder="Create a password (min. 6 characters)" 
                  className={registerErrors.password ? 'error' : ''}
                  onChange={() => handleRegisterInputChange('password')}
                  required 
                />
                {registerErrors.password && <span className="error-message">{registerErrors.password}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="registerExperience">Experience (Optional)</label>
                <input 
                  type="text" 
                  id="registerExperience" 
                  name="registerExperience"
                  placeholder="Years of experience or summary" 
                  onChange={() => handleRegisterInputChange('experience')}
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerConfirmPassword">Confirm Password</label>
                <input 
                  type="password" 
                  id="registerConfirmPassword" 
                  name="registerConfirmPassword"
                  placeholder="Confirm your password" 
                  className={registerErrors.confirmPassword ? 'error' : ''}
                  onChange={() => handleRegisterInputChange('confirmPassword')}
                  required 
                />
                {registerErrors.confirmPassword && <span className="error-message">{registerErrors.confirmPassword}</span>}
              </div>
              <div className="form-options">
                <label>
                  <input type="checkbox" required /> I agree to the <a href="#">Terms of Service</a>
                </label>
              </div>
              <button type="submit" className="submit-btn">Create Account</button>
            </form>
            <div className="auth-switch">
              Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); closeRegisterModal(); setShowLogin(true); }}>Login</a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
