<template>
  <v-app>
    <Sidebar
      :is-mobile="isMobile"
      :is-collapsed="isCollapsed"
      @toggle-rail="toggleSidebarRail"
      @new-chat="handleNewChat"
      @report="handleReportEmergency"
      :language="language"
    />
    <v-main>
      <v-container fluid class="pa-0 fill-height d-flex home-bg-gradient">
        <v-row no-gutters class="flex-grow-1">
          <v-col class="d-flex flex-column align-center justify-center" style="height: 100vh;">
            <div class="chat-header p-4 text-center w-100">
              <v-btn variant="outlined" size="small" class="lang-btn premium-btn" @click="toggleLanguage" style="position: absolute; top: 15px; right: 15px;">
                {{ language.toUpperCase() }}/{{ language === 'th' ? 'EN' : 'TH' }}
              </v-btn>
            </div>
            <v-card class="pa-6 d-flex flex-column align-center modern-shadow glass-card rounded-xl fade-in responsive-card">
              <h1 class="text-center mb-2 report-title responsive-title" style="color:#2563eb;">{{ t('reportTitle') }}</h1>
              <div class="text-center mb-4 text-muted report-description responsive-desc">{{ t('reportDescription') }}</div>
              <v-alert v-if="locationError" type="warning" class="mb-3">{{ locationError }}</v-alert>
              <v-form @submit.prevent="handleSubmit" class="w-100">
                <div class="input-bar-row d-flex align-center" style="gap: 12px;">
                  <v-textarea
                    v-model="description"
                    :placeholder="t('typeMessageOrSpeak')"
                    auto-grow
                    rows="1"
                    max-rows="5"
                    class="description-input flex-grow-1 modern-input glass-input responsive-input"
                    required
                    @keydown.enter.exact.prevent="description.trim() ? handleSubmit() : startListening()"
                    style="margin-bottom: 0; min-height: 44px;"
                  />
                  <v-btn
                    v-if="description.trim()"
                    type="submit"
                    :loading="loading"
                    class="btn-action gradient-btn premium-btn"
                    color="primary"
                    icon
                    style="height: 44px; width: 44px; margin-bottom: 0;"
                  >
                    <v-icon>mdi-send</v-icon>
                  </v-btn>
                  <v-btn
                    v-else
                    type="button"
                    :disabled="loading || isListening"
                    class="gradient-btn premium-btn"
                    color="primary"
                    icon
                    @click="startListening"
                    style="height: 44px; width: 44px; margin-bottom: 0;"
                  >
                    <v-progress-circular v-if="isListening" indeterminate size="20" color="primary" />
                    <v-icon v-else>mdi-microphone</v-icon>
                  </v-btn>
                </div>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'
import Swal from 'sweetalert2'
import Sidebar from '~/components/Sidebar.vue'

const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl

const translations = {
  th: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'แชทใหม่',
    reportEmergency: 'แจ้งข้อมูลภัยพิบัติ',
    reportTitle: 'แจ้งข้อมูลภัยพิบัติ',
    reportDescription: 'ภัยพิบัติสามารถเกิดขึ้นได้ทุกเมื่อ โดยไม่ทันตั้งตัว การแจ้งเหตุที่รวดเร็วและแม่นยำจะช่วยให้หน่วยงานสามารถเข้าถึงพื้นที่ได้ทันท่วงทีลดความสูญเสีย และช่วยเหลือผู้ประสบภัยอย่างมีประสิทธิภาพ โปรดรายงานเหตุการณ์ที่พบเห็นเพื่อร่วมเป็นส่วนหนึ่งในการปกป้องชีวิตและความปลอดภัยของทุกคน',
    noGeolocation: 'เบราว์เซอร์ไม่รองรับ Geolocation',
    cannotGetLocation: 'ไม่สามารถขอพิกัดได้: ',
    confirmReportTitle: 'ยืนยันการแจ้งข้อมูล?',
    confirmReportText: 'โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน',
    confirmReportButton: 'ใช่, ยืนยัน!',
    cancelReportButton: 'ไม่, ยกเลิก',
    reportSuccessTitle: 'สำเร็จ!',
    reportSuccessText: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว.',
    reportErrorTitle: 'เกิดข้อผิดพลาด!',
    reportErrorMessage: 'ไม่สามารถส่งรายงานได้: ',
    connectionErrorServer: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์.',
    reportCanceled: 'การส่งรายงานถูกยกเลิก.',
    cannotListen: '⚠️ ไม่สามารถฟังเสียงได้: ',
    allowLocationShare: 'ไม่สามารถระบุตำแหน่งของคุณได้ กรุณาอนุญาตให้แชร์พิกัด',
    yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ',
    typeMessageOrSpeak: 'รายงานเหตุการณ์ที่พบเห็นเพื่อร่วมเป็นส่วนหนึ่งในการปกป้องชีวิตและความปลอดภัยของทุกคน',
    cancel: 'ยกเลิก',
  },
  en: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'New Chat',
    reportEmergency: 'Report Disaster ',
    reportTitle: 'Report Disaster Information',
    reportDescription: 'Disasters can happen at any time, without warning. Rapid and accurate reporting will help agencies reach the area in a timely manner, reducing losses and effectively assisting those affected. Please report any incidents you witness to be part of protecting everyone\'s lives and safety.',
    noGeolocation: 'Browser does not support Geolocation',
    cannotGetLocation: 'Could not get location: ',
    confirmReportTitle: 'Confirm report?',
    confirmReportText: 'Please check the information before confirming',
    confirmReportButton: 'Yes, confirm!',
    cancelReportButton: 'No, cancel',
    reportSuccessTitle: 'Success!',
    reportSuccessText: 'Your report has been submitted successfully.',
    reportErrorTitle: 'Error!',
    reportErrorMessage: 'Failed to send report: ',
    connectionErrorServer: 'Error connecting to server.',
    reportCanceled: 'Report submission canceled.',
    cannotListen: '⚠️ Cannot listen: ',
    allowLocationShare: 'Unable to determine your location. Please allow location sharing.',
    yourBrowserNotSupportVoiceRecognition: 'Your browser does not support voice-to-text conversion',
    typeMessageOrSpeak: 'Report incidents witnessed to be part of protecting everyone\'s lives and safety',
    cancel: 'Cancel', 
  },
}

const language = ref('th')
const description = ref('')
const loading = ref(false)
const location = ref(null)
const locationError = ref(null)
const isListening = ref(false)
const isCollapsed = ref(false)
const isMobile = ref(false)
const router = useRouter()

function t(key) {
  return translations[language.value][key] || key
}

function toggleLanguage() {
  language.value = language.value === 'th' ? 'en' : 'th'
}

function handleNewChat() {
  router.push('/')
}

function handleReportEmergency() {
  router.push('/chatbot')
}

function getLocation() {
  if (!navigator.geolocation) {
    locationError.value = t('noGeolocation')
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      location.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      locationError.value = null
    },
    (err) => {
      locationError.value = t('cannotGetLocation') + err.message
    },
    { enableHighAccuracy: true }
  )
}

onMounted(() => {
  const handleResize = () => { isMobile.value = window.innerWidth <= 768 }
  handleResize()
  window.addEventListener('resize', handleResize)
  getLocation()
  watch(language, getLocation)
})

async function handleSubmit() {
  if (!location.value) {
    await Swal.fire({
      icon: 'error',
      title: t('reportErrorTitle'),
      text: t('allowLocationShare'),
      confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
    })
    return
  }

  const result = await Swal.fire({
    title: t('confirmReportTitle'),
    text: t('confirmReportText'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('confirmReportButton'),
    cancelButtonText: t('cancelReportButton'),
    reverseButtons: true,
    backdrop: 'rgba(0,0,0,0.5)'
  })

  if (result.isConfirmed) {
    loading.value = true
    try {
      const res = await fetch(`${apiBase}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.value,
          lat: location.value.lat,
          lng: location.value.lng
        })
      })
      const data = await res.json()
      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: t('reportSuccessTitle'),
          text: t('reportSuccessText'),
          confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
        })
        description.value = ''
      } else {
        await Swal.fire(
          t('reportErrorTitle'),
          t('reportErrorMessage') + (data.message || 'เกิดข้อผิดพลาดบางอย่าง'),
          'error'
        )
      }
    } catch (error) {
      await Swal.fire(
        t('reportErrorTitle'),
        t('connectionErrorServer'),
        'error'
      )
    } finally {
      loading.value = false
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    await Swal.fire({
      icon: 'error',
      title: t('cancel'),
      text: t('reportCanceled'),
      confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
    })
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    Swal.fire({
      icon: 'warning',
      title: t('reportErrorTitle'),
      text: t('yourBrowserNotSupportVoiceRecognition'),
      confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
    })
    return
  }
  const recognition = new SpeechRecognition()
  recognition.lang = language.value === 'th' ? 'th-TH' : 'en-US'
  recognition.interimResults = true
  recognition.maxAlternatives = 3
  isListening.value = true
  let baseDescription = description.value

  recognition.onresult = (event) => {
    let interimTranscript = ''
    let finalTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }
    if (finalTranscript) {
      baseDescription = (baseDescription + ' ' + finalTranscript).trim()
      description.value = baseDescription
    } else {
      description.value = (baseDescription + ' ' + interimTranscript).trim()
    }
  }
  recognition.onerror = (event) => {
    Swal.fire({
      icon: 'error',
      title: t('reportErrorTitle'),
      text: t('cannotListen') + event.error,
      confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
    })
    isListening.value = false
  }
  recognition.onend = () => {
    isListening.value = false
    if (description.value.trim()) handleSubmit()
  }
  recognition.start()
}

function toggleSidebarRail() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.home-bg-gradient {
  background: linear-gradient(135deg, #e3f0ff 0%, #e0ecff 50%, #b6d0f7 100%);
}
.responsive-card {
  width: 100%;
  max-width: 98vw;
  margin: 3vw auto 3vw auto;
  padding: 0 2vw;
  box-sizing: border-box;
}
@media (min-width: 900px) {
  .responsive-card {
    max-width: 1400px;
    padding: 2.2rem 2.5rem 2rem 2.5rem !important;
    margin: 0 auto 32px auto;
  }
}
@media (max-width: 600px) {
  .responsive-card {
    max-width: 420px;
    padding: 1.2rem 0.7rem 1.5rem 0.7rem !important;
  }
  .responsive-title {
    font-size: 1.35rem !important;
  }
  .responsive-desc {
    font-size: 0.98rem !important;
  }
  .responsive-input textarea {
    font-size: 0.98rem !important;
    padding: 8px 8px !important;
  }
}
@media (max-width: 400px) {
  .responsive-card {
    max-width: 98vw;
    padding: 0.7rem 0.2rem 1rem 0.2rem !important;
  }
}
.modern-shadow {
  box-shadow: 0 4px 24px 0 #1e3a8a22, 0 1.5px 6px 0 #38bdf822;
}
.glass-card {
  background: rgba(255,255,255,0.55) !important;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1.5px solid #e0e7ef33;
}
.glass-input textarea {
  background: rgba(241,245,249,0.85) !important;
  border-radius: 12px !important;
  font-size: 1.08rem;
  padding: 10px 14px;
  box-shadow: 0 1px 4px #2563eb11;
  border: 1.5px solid #e0e7ef33;
}
.rounded-xl {
  border-radius: 1.25rem !important;
}
.gradient-btn {
  background: linear-gradient(90deg, #38bdf8 0%, #2563eb 100%) !important;
  color: #fff !important;
  border: none !important;
  transition: box-shadow 0.2s, transform 0.18s;
}
.premium-btn:hover {
  box-shadow: 0 2px 12px #2563eb55;
  filter: brightness(1.08);
  transform: scale(1.07);
}
.description-input textarea {
  background: #f1f5f9 !important;
  border-radius: 12px !important;
  font-size: 1.08rem;
  padding: 10px 14px;
  box-shadow: 0 1px 4px #2563eb11;
}
.lang-btn {
  background: #fff !important;
  color: #2563eb !important;
  border: 1.5px solid #38bdf8 !important;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: 8px;
}
.fade-in {
  animation: fadeIn 0.7s cubic-bezier(.39,.575,.56,1) both;
}
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(24px) scale(0.98); }
  100% { opacity: 1; transform: none; }
}
.input-bar-row {
  align-items: center;
}
.modern-input textarea {
  min-height: 44px !important;
  font-size: 1.08rem;
}
</style>