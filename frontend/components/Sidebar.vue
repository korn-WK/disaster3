<template>
  <div>
    <v-navigation-drawer
      v-if="!isCollapsed"
      app
      :rail="false"
      width="340"
      class="sidebar-modern-glass"
    >
      <div class="sidebar-header-row d-flex flex-row align-center" style="gap: 16px; padding-left: 24px; padding-right: 24px; min-height: 88px;">
        <v-btn icon size="large" class="sidebar-rail-btn" @click="$emit('toggle-rail')" :title="'Collapse'" style="min-width:48px; min-height:48px;">
          <v-icon size="32">mdi-chevron-left</v-icon>
        </v-btn>
        <v-avatar size="48" class="sidebar-app-avatar">
          <v-img src="/robot.png" alt="Logo" />
        </v-avatar>
        <div class="sidebar-title-block d-flex flex-column justify-center" style="line-height:1.1;">
          <span class="font-weight-bold sidebar-title" style="font-size:1.45rem;">DISASTER</span>
          <span class="sidebar-title-2" style="font-size:1.08rem;">CHATBOT</span>
        </div>
      </div>
      <v-divider class="my-2" />
      <v-list dense nav class="sidebar-list">
        <v-list-item to="/chatbot" :active="$route.path === '/chatbot'" class="sidebar-link" rounded>
          <template #prepend>
            <v-icon color="primary">mdi-message-plus</v-icon>
          </template>
          <v-list-item-title style="font-size:1.18rem;">แชทใหม่</v-list-item-title>
        </v-list-item>
        <v-list-item to="/" :active="$route.path === '/'" class="sidebar-link" rounded>
          <template #prepend>
            <v-icon color="red">mdi-alert</v-icon>
          </template>
          <v-list-item-title class="red--text" style="font-size:1.18rem;">แจ้งข้อมูลภัยพิบัติ</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-spacer />
    </v-navigation-drawer>
    <v-btn
      v-else
      icon
      size="x-large"
      class="sidebar-fab-chev"
      @click="$emit('toggle-rail')"
      :title="'Expand sidebar'"
    >
      <v-icon size="32">mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
defineProps({
  isCollapsed: Boolean,
  isMobile: Boolean,
  language: String
})
</script>

<style scoped>
.sidebar-modern-glass {
  background: linear-gradient(135deg, #38bdf8cc 0%, #2563ebcc 100%) !important;
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border-right: 2px solid #e0e7ef33;
  box-shadow: 2px 0 32px #2563eb22, 0 1.5px 6px #38bdf822;
  color: #fff !important;
  min-height: 100vh;
  transition: width 0.25s cubic-bezier(.4,2,.6,1), background 0.3s;
  padding-right: 0;
}
.sidebar-fab-chev {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 3000;
  background: #fff !important;
  color: #2563eb !important;
  box-shadow: 0 2px 12px #2563eb33;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
}
.sidebar-fab-chev:hover {
  background: #38bdf8 !important;
  color: #fff !important;
  transform: scale(1.08);
}
.sidebar-header-row {
  min-height: 80px;
  padding: 24px 16px 0 16px;
  position: relative;
}
.sidebar-header-collapsed {
  justify-content: center !important;
  align-items: center !important;
  min-height: 100vh;
  padding: 0;
}
.sidebar-rail-btn {
  background: #fff !important;
  color: #2563eb !important;
  border-radius: 50%;
  box-shadow: 0 2px 8px #2563eb22;
  transition: background 0.18s, transform 0.18s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-rail-btn-abs {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 10;
}
.sidebar-rail-btn:hover {
  background: #38bdf8 !important;
  color: #fff !important;
  transform: scale(1.12);
}
.sidebar-app-avatar {
  background: #e0e7ef !important;
  border: 2px solid #38bdf8;
}
.sidebar-title-block {
  line-height: 1.1;
}
.sidebar-title {
  color: #fff !important;
  font-size: 1.55rem;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px #2563eb33;
}
.sidebar-title-2 {
  color: #bae6fd;
  font-size: 1.18rem;
  font-weight: 500;
  letter-spacing: 1px;
}
.sidebar-list {
  margin-top: 24px;
}
.sidebar-link {
  border-radius: 12px !important;
  margin-bottom: 12px;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  font-size: 1.18rem;
  font-weight: 500;
  padding: 16px 20px !important;
}
.sidebar-link:hover {
  background: #e0f2fe55 !important;
  color: #2563eb !important;
  box-shadow: 0 2px 12px #38bdf822;
}
.v-list-item--active {
  background: #fff !important;
  color: #2563eb !important;
  font-weight: bold;
  box-shadow: 0 2px 12px #2563eb33;
}
.sidebar-user-block {
  background: rgba(255,255,255,0.18);
  border-radius: 20px;
  box-shadow: 0 2px 8px #2563eb22;
  padding: 10px 0 10px 0;
  align-items: center;
  transition: background 0.18s;
  min-width: 0;
}
.sidebar-user-block:hover {
  background: rgba(255,255,255,0.28);
}
.sidebar-user-name {
  color: #fff;
  font-size: 1.08rem;
}
.sidebar-user-role {
  color: #bae6fd;
  font-size: 0.98rem;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
@media (max-width: 600px) {
  .sidebar-modern-glass {
    width: 64px !important;
    min-width: 64px !important;
    max-width: 64px !important;
    padding: 0;
  }
  .sidebar-header-row {
    min-height: 48px;
    padding: 8px 2px 0 2px;
  }
  .sidebar-title, .sidebar-title-2, .sidebar-title-block {
    display: none !important;
  }
  .sidebar-user-block {
    display: none !important;
  }
}
</style> 