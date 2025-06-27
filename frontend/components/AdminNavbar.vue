<template>
  <div class="admin-navbar-tabs d-flex align-center">
    <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="admin-navbar-tab" :class="{'active': $route.path === item.to}">
      {{ item.label }}
    </NuxtLink>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const $route = useRoute()
const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'ทรัพยากร', to: '/admin/resources' },
  { label: 'แผนที่', to: '/admin/map' },
  { label: 'รายละเอียดเคส', to: '/admin/case/1' },
]
</script>

<style scoped>
.admin-navbar-tabs {
  background: #fff;
  border: 1.5px solid #2563eb;
  border-radius: 16px;
  padding: 2px 4px;
  width: 100%;
  gap: 0;
}
.admin-navbar-tab {
  font-size: 1.08rem;
  font-weight: 600;
  color: #2563eb;
  padding: 10px 32px;
  border-radius: 12px;
  text-decoration: none;
  background: transparent;
  transition: background 0.18s, color 0.18s;
  margin: 0 2px;
  border: none;
  position: relative;
}
.admin-navbar-tab.active {
  background: #2563eb;
  color: #fff;
  z-index: 2;
}
</style> 