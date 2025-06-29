<template>
  <div class="pa-10">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">รายการเคส</h1>
      <v-btn color="primary" prepend-icon="mdi-plus">
        เพิ่มเคสใหม่
      </v-btn>
    </div>

    <!-- Search and Filter -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="ค้นหาเคส"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="statusFilter"
              label="สถานะ"
              :items="statusOptions"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="typeFilter"
              label="ประเภท"
              :items="typeOptions"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn color="secondary" block>
              กรอง
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Cases Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="cases"
        :search="search"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            :text="getStatusText(item.status)"
            size="small"
          />
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            size="small"
            color="primary"
            variant="text"
            @click="viewCase(item.id)"
          >
            ดูรายละเอียด
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const search = ref('')
const statusFilter = ref('all')
const typeFilter = ref('all')

// Mock data - ในอนาคตจะดึงจาก API
const cases = ref([
  {
    id: 1,
    title: 'น้ำท่วมในพื้นที่กรุงเทพฯ',
    type: 'น้ำท่วม',
    status: 'active',
    location: 'กรุงเทพมหานคร',
    reportedAt: '2024-01-15',
    severity: 'สูง'
  },
  {
    id: 2,
    title: 'ไฟไหม้ในโรงงาน',
    type: 'ไฟไหม้',
    status: 'resolved',
    location: 'สมุทรปราการ',
    reportedAt: '2024-01-14',
    severity: 'ปานกลาง'
  },
  {
    id: 3,
    title: 'แผ่นดินไหวในภาคเหนือ',
    type: 'แผ่นดินไหว',
    status: 'monitoring',
    location: 'เชียงใหม่',
    reportedAt: '2024-01-13',
    severity: 'สูง'
  }
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'หัวข้อ', key: 'title', sortable: true },
  { title: 'ประเภท', key: 'type', sortable: true },
  { title: 'สถานะ', key: 'status', sortable: true },
  { title: 'สถานที่', key: 'location', sortable: true },
  { title: 'วันที่รายงาน', key: 'reportedAt', sortable: true },
  { title: 'ความรุนแรง', key: 'severity', sortable: true },
  { title: 'การดำเนินการ', key: 'actions', sortable: false }
]

const statusOptions = [
  { title: 'ทั้งหมด', value: 'all' },
  { title: 'กำลังดำเนินการ', value: 'active' },
  { title: 'เสร็จสิ้น', value: 'resolved' },
  { title: 'ติดตาม', value: 'monitoring' }
]

const typeOptions = [
  { title: 'ทั้งหมด', value: 'all' },
  { title: 'น้ำท่วม', value: 'น้ำท่วม' },
  { title: 'ไฟไหม้', value: 'ไฟไหม้' },
  { title: 'แผ่นดินไหว', value: 'แผ่นดินไหว' },
  { title: 'พายุ', value: 'พายุ' }
]

const getStatusColor = (status) => {
  const colors = {
    active: 'warning',
    resolved: 'success',
    monitoring: 'info'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    active: 'กำลังดำเนินการ',
    resolved: 'เสร็จสิ้น',
    monitoring: 'ติดตาม'
  }
  return texts[status] || status
}

const viewCase = (id) => {
  router.push(`/admin/case/${id}`)
}

onMounted(async () => {
  loading.value = true
  // TODO: ดึงข้อมูลจาก API
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script> 