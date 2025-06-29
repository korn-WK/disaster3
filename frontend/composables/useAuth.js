// composable สำหรับจัดการ authentication ที่ใช้ HttpOnly cookies:
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl
  
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  // Helper function to create proper API URL
  const createApiUrl = (endpoint) => {
    const apiUrl = new URL(apiBase);
    return `${apiUrl.origin}${endpoint}`;
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      isLoading.value = true
      const response = await fetch(createApiUrl('/auth/me'), {
        credentials: 'include'
      })
      
      if (response.ok) {
        const userData = await response.json()
        user.value = userData
        isAuthenticated.value = true
        return { success: true, user: userData }
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshResponse = await fetch(createApiUrl('/auth/refresh'), {
          method: 'POST',
          credentials: 'include'
        })
        
        if (refreshResponse.ok) {
          // Retry getting user profile
          const retryResponse = await fetch(createApiUrl('/auth/me'), {
            credentials: 'include'
          })
          
          if (retryResponse.ok) {
            const userData = await retryResponse.json()
            user.value = userData
            isAuthenticated.value = true
            return { success: true, user: userData }
          }
        }
        
        // Authentication failed
        user.value = null
        isAuthenticated.value = false
        return { success: false, error: 'Authentication failed' }
      } else {
        user.value = null
        isAuthenticated.value = false
        return { success: false, error: 'Server error' }
      }
    } catch (error) {
      console.error('Error checking authentication:', error)
      user.value = null
      isAuthenticated.value = false
      return { success: false, error: 'Network error' }
    } finally {
      isLoading.value = false
    }
  }

  // Logout user
  const logout = async () => {
    try {
      const response = await fetch(createApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        user.value = null
        isAuthenticated.value = false
        return { success: true }
      } else {
        return { success: false, error: 'Logout failed' }
      }
    } catch (error) {
      console.error('Error during logout:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Make authenticated API request with automatic token refresh
  const apiRequest = async (url, options = {}) => {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, { ...defaultOptions, ...options })
      
      if (response.status === 401) {
        // Try to refresh token
        const refreshResponse = await fetch(createApiUrl('/auth/refresh'), {
          method: 'POST',
          credentials: 'include'
        })
        
        if (refreshResponse.ok) {
          // Retry original request
          const retryResponse = await fetch(url, { ...defaultOptions, ...options })
          return retryResponse
        } else {
          // Refresh failed, redirect to login
          throw new Error('Authentication expired')
        }
      }
      
      return response
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    checkAuth,
    logout,
    apiRequest
  }
} 