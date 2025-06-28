export default defineNuxtRouteMiddleware(async (to) => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBaseUrl
  
  // Skip auth check for login page and public pages
  if (to.path === '/login' || to.path === '/') {
    return
  }
  
  try {
    // Check authentication directly
    const response = await fetch(`${apiBase}/auth/me`, {
      credentials: 'include'
    })
    
    if (response.ok) {
      const userData = await response.json()
      
      // Check role-based access
      const user = userData
      
      // Admin routes
      if (to.path.startsWith('/admin')) {
        if (user.role !== 'admin') {
          return navigateTo('/user')
        }
      }
      
      // User routes
      if (to.path.startsWith('/user')) {
        if (user.role !== 'user' && user.role !== 'admin') {
          return navigateTo('/login')
        }
      }
      
    } else if (response.status === 401) {
      // Try to refresh token
      const refreshResponse = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (refreshResponse.ok) {
        // Retry getting user profile
        const retryResponse = await fetch(`${apiBase}/auth/me`, {
          credentials: 'include'
        })
        
        if (retryResponse.ok) {
          const userData = await retryResponse.json()
          
          // Check role-based access after refresh
          const user = userData
          
          if (to.path.startsWith('/admin') && user.role !== 'admin') {
            return navigateTo('/user')
          }
          
          if (to.path.startsWith('/user') && user.role !== 'user' && user.role !== 'admin') {
            return navigateTo('/login')
          }
        } else {
          return navigateTo('/login')
        }
      } else {
        return navigateTo('/login')
      }
    } else {
      return navigateTo('/login')
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error)
    return navigateTo('/login')
  }
}) 