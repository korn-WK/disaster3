<template>
    <v-app>
      <!-- Header Component -->
      <Header />
      
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
            <v-col class="d-flex flex-column align-center justify-center" style="min-height: calc(100vh - 64px);">
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
  import Header from '~/components/Header.vue'
  
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
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
    })
  
    if (result.isConfirmed) {
      loading.value = true
      try {
        const response = await fetch(`${apiBase}/api/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            description: description.value,
            location: location.value,
            timestamp: new Date().toISOString()
          })
        })
  
        if (response.ok) {
          await Swal.fire({
            icon: 'success',
            title: t('reportSuccessTitle'),
            text: t('reportSuccessText'),
            confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
          })
          description.value = ''
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        console.error('Error submitting report:', error)
        await Swal.fire({
          icon: 'error',
          title: t('reportErrorTitle'),
          text: t('connectionErrorServer'),
          confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
        })
      } finally {
        loading.value = false
      }
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      await Swal.fire({
        icon: 'info',
        title: t('reportCanceled'),
        confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
      })
    }
  }
  
  function startListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      Swal.fire({
        icon: 'error',
        title: t('reportErrorTitle'),
        text: t('yourBrowserNotSupportVoiceRecognition'),
        confirmButtonText: language.value === 'th' ? 'ตกลง' : 'OK'
      })
      return
    }
  
    isListening.value = true
  
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
  
    recognition.lang = language.value === 'th' ? 'th-TH' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
  
    recognition.onstart = () => {
      console.log('Voice recognition started')
    }
  
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      description.value = transcript
      isListening.value = false
    }
  
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
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
    }
  
    recognition.start()
  }
  
  function toggleSidebarRail() {
    isCollapsed.value = !isCollapsed.value
  }
  </script>
  
  <style scoped>
  .fill-height {
    min-height: calc(100vh - 64px);
    padding-top: 64px;
  }
  
  .home-bg-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: calc(100vh - 64px);
  }
  
  .modern-shadow {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .fade-in {
    animation: fadeIn 0.6s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .responsive-card {
    width: 100%;
    max-width: 600px;
  }
  
  .responsive-title {
    font-size: clamp(1.5rem, 4vw, 2.5rem);
  }
  
  .responsive-desc {
    font-size: clamp(0.875rem, 2vw, 1rem);
  }
  
  .responsive-input {
    font-size: clamp(0.875rem, 2vw, 1rem);
  }
  
  .modern-input {
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    transition: all 0.3s ease;
  }
  
  .modern-input:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .glass-input {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(5px);
  }
  
  .gradient-btn {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    border: none;
    transition: all 0.3s ease;
  }
  
  .gradient-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
  }
  
  .premium-btn {
    font-weight: 600;
    text-transform: none;
    border-radius: 12px;
  }
  
  .btn-action {
    transition: all 0.3s ease;
  }
  
  .btn-action:hover {
    transform: scale(1.05);
  }
  
  .input-bar-row {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    padding: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    .responsive-card {
      margin: 16px;
      padding: 24px !important;
    }
    
    .input-bar-row {
      flex-direction: column;
      gap: 8px;
    }
  }
  </style> 