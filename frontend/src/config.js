// API Configuration
// In production (Render), use the production backend URL
// In development, use localhost
export const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://kappa-collector.onrender.com'
    : 'http://localhost:4000')

