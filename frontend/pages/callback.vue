<template>
  <div>
    <h1>กำลังเปลี่ยนเส้นทาง...</h1>
    <p>กรุณารอสักครู่</p>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()
const route = useRoute()

onMounted(() => {
  // Redirect to the correct auth callback page with the same token
  const token = route.query.token
  if (token) {
    router.replace(`/auth/callback?token=${token}`)
  } else {
    router.replace('/login')
  }
})
</script> 