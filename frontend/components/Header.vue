<template>
  <v-app-bar
    app
    elevation="0"
    color="white"
    class="header-container"
    style="border-bottom: 1px solid #e0e0e0;"
  >
    <!-- Left side - Logo/Brand -->
    <div class="d-flex align-center">
      <img src="/mfu-logo.png" alt="MFU Logo" class="header-logo" />
      <div class="ml-3">
        <div class="header-title">ระบบรับมือภัยพิบัติ</div>
        <div class="header-subtitle">Disaster Management System</div>
      </div>
    </div>

    <!-- Spacer to push profile to the right -->
    <v-spacer></v-spacer>

    <!-- Right side - Profile -->
    <div class="d-flex align-center">
      <!-- Language Toggle Button -->
      <v-btn
        variant="outlined"
        size="small"
        class="lang-btn mr-3"
        @click="toggleLanguage"
        style="background: #fff; color: #2563eb; border: 1.5px solid #38bdf8; font-weight: 600; border-radius: 8px;"
      >
        {{ language.toUpperCase() }}/{{ language === 'th' ? 'EN' : 'TH' }}
      </v-btn>

      <!-- Profile Menu -->
      <v-menu
        v-model="profileMenu"
        :close-on-content-click="false"
        location="bottom end"
        offset-y
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="profile-btn"
            style="text-transform: none;"
          >
            <v-avatar size="32" class="mr-2">
              <v-img
                v-if="userProfile?.picture"
                :src="userProfile.picture"
                alt="Profile"
              />
              <v-icon v-else>mdi-account-circle</v-icon>
            </v-avatar>
            <span class="profile-name">{{ userProfile?.name || 'ผู้ใช้' }}</span>
            <v-icon class="ml-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-card min-width="200" class="profile-menu">
          <v-list>
            <!-- User Info -->
            <v-list-item>
              <template v-slot:prepend>
                <v-avatar size="40">
                  <v-img
                    v-if="userProfile?.picture"
                    :src="userProfile.picture"
                    alt="Profile"
                  />
                  <v-icon v-else size="40">mdi-account-circle</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ userProfile?.name || 'ผู้ใช้' }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ userProfile?.email || 'user@example.com' }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <!-- Logout Button -->
            <v-list-item
              @click="handleLogout"
              class="logout-item"
              style="cursor: pointer;"
            >
              <template v-slot:prepend>
                <v-icon color="error">mdi-logout</v-icon>
              </template>
              <v-list-item-title class="text-error">
                {{ language === 'th' ? 'ออกจากระบบ' : 'Logout' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'

const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl
const router = useRouter()

const language = ref('th')
const profileMenu = ref(false)
const userProfile = ref(null)

// Get user profile from API
async function getUserProfile() {
  try {
    const response = await fetch(`${apiBase}/auth/me`, {
      credentials: 'include' // Important: include cookies
    })
    
    if (response.ok) {
      const userData = await response.json()
      userProfile.value = userData
      console.log('User profile loaded:', userData)
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
          userProfile.value = userData
          console.log('User profile loaded after refresh:', userData)
        } else {
          console.error('Failed to get user profile after refresh')
          router.push('/login')
        }
      } else {
        console.error('Failed to refresh token')
        router.push('/login')
      }
    } else {
      console.error('Failed to fetch user details:', response.status, response.statusText)
      router.push('/login')
    }
  } catch (error) {
    console.error('Error fetching user details:', error)
    router.push('/login')
  }
}

function toggleLanguage() {
  language.value = language.value === 'th' ? 'en' : 'th'
}

async function handleLogout() {
  try {
    const response = await fetch(`${apiBase}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    
    if (response.ok) {
      console.log('Logged out successfully')
    } else {
      console.error('Logout failed:', response.status)
    }
  } catch (error) {
    console.error('Error during logout:', error)
  }
  
  // Close menu
  profileMenu.value = false
  
  // Redirect to login page
  router.push('/login')
}

onMounted(() => {
  getUserProfile()
})
</script>

<style scoped>
.header-container {
  height: 64px;
}

.header-logo {
  height: 40px;
  width: auto;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #2563eb;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 12px;
  color: #666;
  line-height: 1.2;
}

.profile-btn {
  color: #333;
  font-weight: 500;
}

.profile-name {
  font-size: 14px;
  color: #333;
}

.profile-menu {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.logout-item:hover {
  background-color: #ffebee;
}

.lang-btn {
  font-size: 12px;
  padding: 6px 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .header-title {
    font-size: 14px;
  }
  
  .header-subtitle {
    font-size: 11px;
  }
  
  .profile-name {
    display: none;
  }
  
  .lang-btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style> 