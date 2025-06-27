<template>
    <v-app>
      <v-main>
        <v-container class="fill-height d-flex align-center justify-center">
          <v-card class="pa-8" max-width="400">
            <h2 class="mb-4">กำลังเข้าสู่ระบบ...</h2>
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-card>
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script setup>
  import { useRouter, useRoute } from 'vue-router'
  import { onMounted } from 'vue'

  const router = useRouter()
  const route = useRoute()

// Function to decode JWT token (without verification for client-side)
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

  onMounted(() => {
    const token = route.query.token
    if (token) {
      localStorage.setItem('authToken', token)
    
    // Decode token to get user role
    const decodedToken = decodeToken(token)
    console.log('Decoded token:', decodedToken)
    
    if (decodedToken && decodedToken.role) {
      // Redirect based on user role
      if (decodedToken.role === 'admin') {
        console.log('Redirecting admin to /admin/dashboard')
        router.push('/admin/dashboard')
      } else {
        // Default user role
        console.log('Redirecting user to /user/report')
        router.push('/user/report')
      }
    } else {
      // Fallback to user report page if role is not available
      console.log('No role found, redirecting to /user/report')
      router.push('/user/report')
    }
  } else {
    // No token, redirect to login
    console.log('No token found, redirecting to /login')
    router.push('/login')
  }
  })
  </script> 