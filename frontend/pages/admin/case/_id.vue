<template>
  <div class="pa-10">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
          class="mb-2"
        />
        <h1 class="text-h4 font-weight-bold">รายละเอียดเคส #{{ $route.params.id }}</h1>
      </div>
      <div class="d-flex gap-2">
        <v-btn color="warning" prepend-icon="mdi-pencil">
          แก้ไข
        </v-btn>
        <v-btn color="error" prepend-icon="mdi-delete">
          ลบ
        </v-btn>
      </div>
    </div>

    <v-row>
      <!-- Main Content -->
      <v-col cols="12" lg="8">
        <!-- Case Details -->
        <v-card class="mb-6">
          <v-card-title class="text-h6">
            ข้อมูลเคส
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-format-title</v-icon>
                    </template>
                    <v-list-item-title>หัวข้อ</v-list-item-title>
                    <v-list-item-subtitle>{{ caseData.title }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-tag</v-icon>
                    </template>
                    <v-list-item-title>ประเภท</v-list-item-title>
                    <v-list-item-subtitle>{{ caseData.type }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-map-marker</v-icon>
                    </template>
                    <v-list-item-title>สถานที่</v-list-item-title>
                    <v-list-item-subtitle>{{ caseData.location }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-calendar</v-icon>
                    </template>
                    <v-list-item-title>วันที่รายงาน</v-list-item-title>
                    <v-list-item-subtitle>{{ caseData.reportedAt }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-alert</v-icon>
                    </template>
                    <v-list-item-title>ความรุนแรง</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getSeverityColor(caseData.severity)"
                        size="small"
                      >
                        {{ caseData.severity }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-information</v-icon>
                    </template>
                    <v-list-item-title>สถานะ</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getStatusColor(caseData.status)"
                        size="small"
                      >
                        {{ getStatusText(caseData.status) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Description -->
        <v-card class="mb-6">
          <v-card-title class="text-h6">
            รายละเอียด
          </v-card-title>
          <v-card-text>
            <p>{{ caseData.description }}</p>
          </v-card-text>
        </v-card>

        <!-- Updates -->
        <v-card>
          <v-card-title class="text-h6">
            การอัปเดต
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="update in caseData.updates"
                :key="update.id"
                :dot-color="update.color"
                size="small"
              >
                <div class="mb-4">
                  <div class="font-weight-bold">{{ update.title }}</div>
                  <div class="text-caption text-medium-emphasis">{{ update.date }}</div>
                  <div class="mt-1">{{ update.description }}</div>
                </div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Sidebar -->
      <v-col cols="12" lg="4">
        <!-- Status Actions -->
        <v-card class="mb-6">
          <v-card-title class="text-h6">
            การดำเนินการ
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedStatus"
              label="เปลี่ยนสถานะ"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              class="mb-4"
            />
            <v-btn
              color="primary"
              block
              @click="updateStatus"
              :loading="updating"
            >
              อัปเดตสถานะ
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Assignments -->
        <v-card class="mb-6">
          <v-card-title class="text-h6">
            ผู้รับผิดชอบ
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="assignee in caseData.assignees"
                :key="assignee.id"
              >
                <template v-slot:prepend>
                  <v-avatar size="32">
                    <v-img :src="assignee.avatar" />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ assignee.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ assignee.role }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Files -->
        <v-card>
          <v-card-title class="text-h6">
            ไฟล์แนบ
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="file in caseData.files"
                :key="file.id"
                @click="downloadFile(file)"
              >
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-file</v-icon>
                </template>
                <v-list-item-title>{{ file.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ file.size }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const updating = ref(false)
const selectedStatus = ref('')

// Mock data - ในอนาคตจะดึงจาก API
const caseData = ref({
  id: route.params.id,
  title: 'น้ำท่วมในพื้นที่กรุงเทพฯ',
  type: 'น้ำท่วม',
  status: 'active',
  location: 'กรุงเทพมหานคร',
  reportedAt: '2024-01-15',
  severity: 'สูง',
  description: 'เกิดน้ำท่วมในพื้นที่กรุงเทพมหานคร เนื่องจากฝนตกหนักต่อเนื่องเป็นเวลานาน ทำให้เกิดน้ำท่วมขังในหลายพื้นที่',
  assignees: [
    { id: 1, name: 'สมชาย ใจดี', role: 'ผู้จัดการ', avatar: '/api/placeholder/32/32' },
    { id: 2, name: 'สมหญิง รักดี', role: 'เจ้าหน้าที่', avatar: '/api/placeholder/32/32' }
  ],
  files: [
    { id: 1, name: 'รายงานสถานการณ์.pdf', size: '2.5 MB' },
    { id: 2, name: 'แผนที่พื้นที่.jpg', size: '1.8 MB' }
  ],
  updates: [
    {
      id: 1,
      title: 'เริ่มดำเนินการ',
      description: 'ทีมงานได้เริ่มเข้าพื้นที่เพื่อประเมินสถานการณ์',
      date: '2024-01-15 09:00',
      color: 'primary'
    },
    {
      id: 2,
      title: 'ประเมินความเสียหาย',
      description: 'ประเมินความเสียหายเบื้องต้นแล้ว พบความเสียหายในระดับปานกลาง',
      date: '2024-01-15 14:30',
      color: 'warning'
    }
  ]
})

const statusOptions = [
  { title: 'กำลังดำเนินการ', value: 'active' },
  { title: 'เสร็จสิ้น', value: 'resolved' },
  { title: 'ติดตาม', value: 'monitoring' },
  { title: 'ยกเลิก', value: 'cancelled' }
]

const getStatusColor = (status) => {
  const colors = {
    active: 'warning',
    resolved: 'success',
    monitoring: 'info',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    active: 'กำลังดำเนินการ',
    resolved: 'เสร็จสิ้น',
    monitoring: 'ติดตาม',
    cancelled: 'ยกเลิก'
  }
  return texts[status] || status
}

const getSeverityColor = (severity) => {
  const colors = {
    'สูง': 'error',
    'ปานกลาง': 'warning',
    'ต่ำ': 'success'
  }
  return colors[severity] || 'grey'
}

const goBack = () => {
  router.push('/admin/case')
}

const updateStatus = async () => {
  if (!selectedStatus.value) return
  
  updating.value = true
  try {
    // TODO: ส่ง API request
    await new Promise(resolve => setTimeout(resolve, 1000))
    caseData.value.status = selectedStatus.value
    selectedStatus.value = ''
  } catch (error) {
    console.error('Error updating status:', error)
  } finally {
    updating.value = false
  }
}

const downloadFile = (file) => {
  // TODO: Implement file download
  console.log('Downloading file:', file.name)
}

onMounted(async () => {
  // TODO: ดึงข้อมูลเคสจาก API
  console.log('Loading case data for ID:', route.params.id)
})
</script> 