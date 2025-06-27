<template>
  <v-app>
    <v-row no-gutters class="fill-height">
      <!-- Chatbot (ซ้าย) -->
      <transition name="slide">
        <v-col v-if="!isChatCollapsed" cols="4" class="pa-0" style="min-width:340px;max-width:400px;background:#f8fafc;position:relative;margin-left:65px;">
          <!-- Header Chatbot -->
          <div class="chatbot-header d-flex align-center pa-4 pb-2">
            <v-avatar size="32" class="mr-2"><v-img src="/robot.png" /></v-avatar>
            <span class="chatbot-title font-weight-bold">DISASTER<br/>CHATBOT</span>
            <v-spacer />
            <v-btn icon class="chat-collapse-btn no-bg-btn" @click="isChatCollapsed = true" style="background:transparent;box-shadow:none;">
              <v-img src="/menu.png" width="28" height="28" />
            </v-btn>
          </div>
          <div class="chatbot-section pa-0 pt-0">
            <ChatbotBox :language="language" />
          </div>
        </v-col>
      </transition>
      <v-btn v-if="isChatCollapsed" icon class="chat-expand-btn no-bg-btn" @click="isChatCollapsed = false" style="position:fixed;top:24px;left:0;z-index:1001;background:transparent;box-shadow:none;">
        <v-img src="/menu.png" width="28" height="28" />
      </v-btn>
      <!-- Dashboard (ขวา) -->
      <v-col :cols="isChatCollapsed ? 12 : 8" class="pa-8" style="background:#fff;">
        <!-- ขวาบน: ปุ่มภาษา + โปรไฟล์ -->
        <div class="d-flex align-center justify-end mb-2" style="min-height:48px;">
          <v-btn variant="outlined" size="small" class="lang-btn premium-btn mr-2" @click="toggleLanguage">
            {{ language.toUpperCase() }}/{{ language === 'th' ? 'EN' : 'TH' }}
          </v-btn>
          <v-avatar size="36"><v-img src="/robot.png" /></v-avatar>
        </div>
        <!-- หัวข้อหลัก -->
        <div class="main-title-navbar-wrap mb-6">
          <div class="main-title mb-3">แจ้งเหตุฉุกเฉิน</div>
          <AdminNavbar />
        </div>
        <!-- Summary Cards -->
        <v-row class="mb-4" dense>
          <v-col cols="3">
            <div class="summary-card-ui border-blue">
              <div class="summary-label">เคสทั้งหมด</div>
              <div class="summary-value-ui">{{ summary.total }}</div>
            </div>
          </v-col>
          <v-col cols="3">
            <div class="summary-card-ui border-orange">
              <div class="summary-label">กำลังดำเนินการ</div>
              <div class="summary-value-ui">{{ summary.inProgress }}</div>
            </div>
          </v-col>
          <v-col cols="3">
            <div class="summary-card-ui border-red">
              <div class="summary-label">เกิน SLA</div>
              <div class="summary-value-ui d-flex align-center"><v-icon color="red" class="mr-1">mdi-alert</v-icon> {{ summary.overSLA }}</div>
            </div>
          </v-col>
          <v-col cols="3">
            <div class="summary-card-ui border-green">
              <div class="summary-label">ปิดเคส</div>
              <div class="summary-value-ui">{{ summary.closed }}</div>
            </div>
          </v-col>
        </v-row>
        <!-- Filter Bar -->
        <div class="filter-container-ui mb-6">
          <div class="filter-label font-weight-bold mb-5">ตัวกรอง</div>
          <v-card class="pa-4 filter-card-ui">
            <div class="d-flex align-center flex-wrap gap-4">
              <v-select :items="statusOptions" v-model="filter.status" label="สถานะ" dense outlined hide-details class="filter-select-ui mr-4" />
              <v-select :items="typeOptions" v-model="filter.type" label="ประเภท" dense outlined hide-details class="filter-select-ui mr-4" />
              <v-select :items="priorityOptions" v-model="filter.priority" label="ความเร่งด่วน" dense outlined hide-details class="filter-select-ui" />
            </div>
          </v-card>
        </div>
        <!-- Case List -->
        <div>
          <div v-for="c in filteredCases" :key="c.id" class="case-card-ui mb-4" :class="caseCardClass(c)">
            <div class="d-flex align-center mb-2">
              <v-chip v-if="c.isNew" color="blue" text-color="white" small class="mr-2">เหตุใหม่ด่วน</v-chip>
              <v-chip v-if="c.isOverSLA" color="red" text-color="white" small class="mr-2">เกิน SLA</v-chip>
              <span class="case-type font-weight-bold">{{ c.type }}</span>
            </div>
            <div class="case-title font-weight-bold mb-1">{{ c.description }}</div>
            <div class="case-meta grey--text text--darken-1 mb-1">{{ c.reporter }} | {{ c.location }}</div>
            <div class="case-meta grey--text text--darken-1 mb-2">{{ c.phone }}</div>
            <div class="d-flex justify-space-between align-center">
              <div class="case-time">02:30</div>
              <div class="d-flex gap-2">
                <v-btn v-if="!c.isOverSLA" color="primary" variant="flat" size="small">รับเหตุ</v-btn>
                <v-btn v-if="!c.isOverSLA" color="grey-lighten-2" variant="flat" size="small">มอบหมายให้</v-btn>
                <v-btn v-if="c.isOverSLA" color="grey-lighten-2" variant="flat" size="small">ปิดเคส</v-btn>
              </div>
            </div>
            <div v-if="c.isOverSLA" class="case-sla-text">เกิน SLA</div>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ChatbotBox from '~/components/ChatbotBox.vue'
import AdminNavbar from '~/components/AdminNavbar.vue'

const isChatCollapsed = ref(false)
const isMobile = ref(false)
const language = ref('th')
const $route = useRoute()

function toggleLanguage() {
  language.value = language.value === 'th' ? 'en' : 'th'
}

const cases = ref([
  {
    id: 1,
    status: 'กำลังดำเนินการ',
    type: 'นักศึกษาหมดสติในอาคารเรียน',
    description: 'นักศึกษาหมดสติขณะสอบชั้น 201 อาคาร A',
    reporter: 'คิม แทนมิน (student)',
    location: 'ห้องสอบเลขที่ : ตึกแผนก A',
    phone: '',
    sla: '02:30',
    isOverSLA: false,
    isClosed: false,
    isNew: true,
    priority: 'ด่วนมาก',
  },
  {
    id: 2,
    status: 'เกิน SLA',
    type: 'นักศึกษาหมดสติในอาคารเรียน',
    description: 'นักศึกษาหมดสติขณะสอบชั้น 201 อาคาร A',
    reporter: 'คิม แทนมิน (student)',
    location: 'ห้องสอบเลขที่ : ตึกแผนก A',
    phone: '',
    sla: '02:30',
    isOverSLA: true,
    isClosed: false,
    isNew: false,
    priority: 'ด่วนมาก',
  },
])

const summary = computed(() => ({
  total: cases.value.length,
  inProgress: cases.value.filter(c => c.status === 'กำลังดำเนินการ').length,
  overSLA: cases.value.filter(c => c.isOverSLA).length,
  closed: cases.value.filter(c => c.isClosed).length,
}))

const statusOptions = ['ทั้งหมด', 'กำลังดำเนินการ', 'เกิน SLA', 'ปิดเคสแล้ว']
const typeOptions = ['ทั้งหมด', 'นักศึกษาหมดสติในอาคารเรียน']
const priorityOptions = ['ทั้งหมด', 'ด่วนมาก', 'ด่วน', 'ปกติ']
const filter = ref({ status: 'ทั้งหมด', type: 'ทั้งหมด', priority: 'ทั้งหมด' })

const filteredCases = computed(() => {
  return cases.value.filter(c => {
    const matchStatus = filter.value.status === 'ทั้งหมด' ||
      (filter.value.status === 'กำลังดำเนินการ' && c.status === 'กำลังดำเนินการ') ||
      (filter.value.status === 'เกิน SLA' && c.isOverSLA) ||
      (filter.value.status === 'ปิดเคสแล้ว' && c.isClosed)
    const matchType = filter.value.type === 'ทั้งหมด' || c.type === filter.value.type
    const matchPriority = filter.value.priority === 'ทั้งหมด' || c.priority === filter.value.priority
    return matchStatus && matchType && matchPriority
  })
})

function caseCardClass(c) {
  if (c.isClosed) return 'case-card-closed'
  if (c.isOverSLA) return 'case-card-over-sla'
  if (c.status === 'กำลังดำเนินการ') return 'case-card-inprogress'
  return ''
}
</script>

<style scoped>
.fill-height { min-height: 100vh; }
.main-title-navbar-wrap {
  width: 100%;
  margin-bottom: 32px;
}
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
.summary-card-ui {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px #2563eb11;
  padding: 18px 0 12px 24px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 4px solid #e5e7eb;
}
.border-blue { border-bottom: 4px solid #2563eb !important; }
.border-orange { border-bottom: 4px solid #f59e42 !important; }
.border-red { border-bottom: 4px solid #ef4444 !important; }
.border-green { border-bottom: 4px solid #22c55e !important; }
.summary-label { font-size: 1.08rem; color: #888; margin-bottom: 2px; }
.summary-value-ui { font-size: 2.2rem; font-weight: bold; color: #2563eb; }
.filter-container-ui {
  width: 100%;
  margin-bottom: 32px;
}
.filter-label {
  font-size: 1.12rem;
  color: #222;
  margin-bottom: 8px;
}
.filter-card-ui {
  border-radius: 16px;
  box-shadow: 0 2px 8px #2563eb11;
  background: #fff;
  border: 1.5px solid #e0e7ef55;
}
.filter-select-ui { min-width: 180px; }
.case-card-ui {
  border-radius: 16px;
  box-shadow: 0 2px 8px #2563eb11;
  padding: 18px 24px;
  background: #fff;
  border: 1.5px solid #e0e7ef55;
  transition: box-shadow 0.18s, border 0.18s;
  margin-bottom: 18px;
}
.case-card-inprogress { border-left: 6px solid #f59e42; }
.case-card-over-sla { background: #fee2e2; border-left: 6px solid #ef4444; }
.case-card-closed { background: #e0fce2; border-left: 6px solid #22c55e; }
.case-type { font-weight: bold; color: #2563eb; margin-right: 8px; }
.case-title { font-size: 1.18rem; }
.case-meta { font-size: 0.98rem; }
.case-time { font-size: 1.08rem; color: #888; }
.case-sla-text { color: #ef4444; font-size: 1.05rem; font-weight: 600; margin-top: 8px; }
.gap-2 { gap: 8px; }
.chatbot-section { background: #f8fafc; min-height: 100vh; border-right: 1.5px solid #e0e7ef55; }
.chatbot-header { background: #fff; border-bottom: 1.5px solid #e0e7ef55; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem; min-height: 56px; margin-bottom: 22px; }
.chatbot-title { font-size: 1.12rem; line-height: 1.1; color: #222; }
.chat-collapse-btn { position: absolute; top: 16px; right: 8px; z-index: 10; }
.chat-expand-btn { position: fixed; top: 24px; left: 0; z-index: 1001; background: #fff; border-radius: 0 24px 24px 0; box-shadow: 0 2px 8px #2563eb22; }
.no-bg-btn { background: transparent !important; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
.slide-enter-active, .slide-leave-active { transition: all 0.3s cubic-bezier(.4,2,.6,1); }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); opacity: 0; }
</style> 