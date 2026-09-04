import { createContext, useEffect, useState, useCallback } from 'react'
import authApi from '../api/authApi'



const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData }
      localStorage.setItem('user', JSON.stringify(merged))
      return merged
    })
  }, [])

  // Verify token with backend on initial load
  useEffect(() => {
    let isMounted = true

    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const userData = await authApi.getMe()
        if (isMounted) {
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        }
      } catch {
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    verifyAuth()

    // Listen for 401 unauthorized events from axiosClient
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('workforge:unauthorized', handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener('workforge:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
export default AuthProvider




