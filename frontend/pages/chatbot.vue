<template>
  <v-app>
    <Sidebar
      v-model="sidebarOpen"
      :is-mobile="isMobile"
      :is-collapsed="isCollapsed"
      @toggle-rail="toggleSidebarRail"
      @close="sidebarOpen = true"
      @new-chat="handleNewChat"
      @report="handleReportEmergency"
      :language="language"
    />
    <v-main>
      <v-container fluid class="pa-0 fill-height d-flex chat-bg-gradient">
        <v-row no-gutters class="flex-grow-1">
          <v-col class="d-flex flex-column align-center justify-center" style="height: 100vh;">
            <div class="d-flex align-center pa-4 w-100 chat-header-bar" style="height: 56px; position: relative;">
              <v-spacer />
              <v-btn variant="outlined" size="small" class="lang-btn premium-btn" @click="toggleLanguage">
                {{ language.toUpperCase() }}/{{ language === 'th' ? 'EN' : 'TH' }}
              </v-btn>
            </div>
            <v-card class="flex-grow-1 mx-auto chat-container-card glass-card premium-shadow rounded-xl fade-in responsive-card chatgpt-card">
              <v-card-text class="chat-scroll-area">
                <div v-if="chat.length === 0" class="text-secondary text-center responsive-desc" style="font-size:1.1rem;">{{ t('startConversation') }}</div>
                <div v-for="(msg, i) in chat" :key="i" class="fade-in-bubble">
                  <div class="d-flex align-items-start mb-2">
                    <v-avatar v-if="msg.role === 'ai'" size="32" class="mr-2">
                      <v-img src="/robot.png" />
                    </v-avatar>
                    <div :class="msg.role === 'user' ? 'user-message-bubble glass-bubble' : 'assistant-message-bubble glass-bubble'" style="max-width: 70%; word-wrap: break-word;">
                      <vue-markdown v-if="msg.role === 'ai'" :source="msg.text" />
                      <span v-else>{{ msg.text }}</span>
                    </div>
                  </div>
                  <small v-if="msg.createdAt"
                    :class="msg.role === 'user' ? 'float-right' : 'float-left'"
                    style="font-size: 0.85rem; color: #6c757d; margin-bottom: 30px"
                  >
                    {{ formatTime(msg.createdAt) }}
                  </small>
                  <div style="clear: both"></div>
                </div>
                <div v-if="loading" class="d-flex align-items-center mb-3">
                  <v-progress-circular indeterminate size="20" class="mr-2" color="primary" />
                  <small class="text-secondary">{{ t('aiThinking') }}</small>
                </div>
                <div ref="messagesEndRef" />
              </v-card-text>
            </v-card>
            <div class="pa-4 d-flex align-center chat-input-bar glass-card premium-shadow rounded-xl fade-in responsive-card chatgpt-input-bar input-bar-row">
              <v-form @submit.prevent="sendMessage" class="flex-grow-1 d-flex align-center">
                <v-textarea
                  v-model="message"
                  :placeholder="loading ? t('loadingResponse') : t('typeMessage')"
                  auto-grow
                  rows="1"
                  max-rows="1"
                  class="chat-input flex-grow-1 modern-input glass-input responsive-input"
                  :disabled="loading"
                  @keydown.enter.exact.prevent="sendMessage"
                  style="margin-bottom: 0; min-height: 44px;"
                />
                <v-btn
                  v-if="message.trim()"
                  type="submit"
                  class="ml-2 gradient-btn premium-btn"
                  color="primary"
                  :disabled="loading"
                  icon
                  style="height: 44px; width: 44px; margin-bottom: 0;"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  type="button"
                  class="ml-2 gradient-btn premium-btn"
                  :disabled="loading || isListening"
                  icon
                  @click="startListening"
                  style="height: 44px; width: 44px; margin-bottom: 0;"
                >
                  <v-progress-circular v-if="isListening" indeterminate size="20" color="primary" />
                  <v-icon v-else>mdi-microphone</v-icon>
                </v-btn>
              </v-form>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRuntimeConfig } from '#app'
import Sidebar from '~/components/Sidebar.vue'
import VueMarkdown from 'vue-markdown-render'
const userId = 'user123'
const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl

const translations = {
  th: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'แชทใหม่',
    reportEmergency: 'แจ้งข้อมูลภัยพิบัติ',
    startConversation: 'เริ่มการสนทนาได้เลย...',
    aiThinking: 'AI กำลังคิด...',
    typeMessage: 'พิมพ์ข้อความ หรือกดไมค์เพื่อพูด...',
    loadingResponse: 'กำลังรอคำตอบ...',
    connectionError: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
    historyLoadError: '❌ โหลดประวัติการแชทไม่สำเร็จ',
    browserVoiceRecognition: 'เบราว์เซอร์ไม่รองรับ Voice Recognition',
    send: 'ส่ง',
    cancel: 'ยกเลิก',
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
    yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ'

  },
  en: {
    sidebarHeader: 'DISASTER CHATBOT',
    newChat: 'New Chat',
    reportEmergency: 'Report Disaster ',
    startConversation: 'Start a conversation...',
    aiThinking: 'AI is thinking...',
    typeMessage: 'Type a message or press mic to speak...',
    loadingResponse: 'Waiting for response...',
    connectionError: '❌ Error connecting to server',
    historyLoadError: '❌ Failed to load chat history',
    browserVoiceRecognition: 'Your browser does not support Voice Recognition',
    send: 'Send',
    cancel: 'Cancel',
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
    yourBrowserNotSupportVoiceRecognition: 'Your browser does not support voice-to-text conversion'
  },
}

const language = ref('th')
const sidebarOpen = ref(false)
const isMobile = ref(false)
const isCollapsed = ref(false)
const message = ref('')
const chat = ref([])
const loading = ref(false)
const isListening = ref(false)
const messagesEndRef = ref(null)
const router = useRouter()

function t(key) {
  return translations[language.value][key] || key
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString(language.value === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}

function toggleLanguage() {
  language.value = language.value === 'th' ? 'en' : 'th'
}

function handleNewChat() {
  chat.value = []
  if (isMobile.value) sidebarOpen.value = false
}

function handleReportEmergency() {
  router.push('/')
  if (isMobile.value) sidebarOpen.value = false
}

async function sendMessage() {
  if (!message.value.trim()) return
  const userMsg = { role: 'user', text: message.value, createdAt: new Date().toISOString() }
  chat.value.push(userMsg)
  message.value = ''
  loading.value = true
  try {
    const res = await fetch(`${apiBase}/api/chat/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message: userMsg.text })
    })
    const data = await res.json()
    chat.value.push({ role: 'ai', text: data.response, createdAt: new Date().toISOString() })
  } catch (e) {
    chat.value.push({ role: 'ai', text: t('connectionError') })
  } finally {
    loading.value = false
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    alert(t('yourBrowserNotSupportVoiceRecognition'))
    return
  }
  const recognition = new SpeechRecognition()
  recognition.lang = language.value === 'th' ? 'th-TH' : 'en-US'
  recognition.interimResults = true
  recognition.maxAlternatives = 3
  isListening.value = true

  recognition.onresult = (event) => {
    let interimTranscript = ''
    let finalTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) finalTranscript += transcript
      else interimTranscript += transcript
    }
    message.value = finalTranscript || interimTranscript
  }
  recognition.onerror = (event) => {
    alert(t('cannotListen') + event.error)
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

onMounted(() => {
  const handleResize = () => { isMobile.value = window.innerWidth <= 768 }
  handleResize()
  window.addEventListener('resize', handleResize)
  fetch(`${apiBase}/api/chat/${userId}`)
    .then(res => res.json())
    .then(data => { chat.value = data.messages || [] })
    .catch(() => { chat.value = [] })
  watch(chat, async () => {
    await nextTick()
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  }, { deep: true })
})
</script>

<style scoped>
.chat-bg-gradient {
  background: linear-gradient(135deg, #e3f0ff 0%, #e0ecff 50%, #b6d0f7 100%);
}
.responsive-card {
  width: 100%;
  max-width: 98vw;
  margin: 3vw auto 3vw auto;
  padding: 0 2vw;
  box-sizing: border-box;
}
.chatgpt-card {
  max-width: 98vw;
  min-height: 40vh;
  max-height: 75vh;
  margin: 3vw auto 32px auto;
  border-radius: 1.25rem !important;
  box-shadow: 0 8px 32px 0 #2563eb22, 0 1.5px 6px 0 #38bdf822;
  background: rgba(255,255,255,0.55) !important;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.chat-scroll-area {
  max-height: 60vh;
  min-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
  scroll-behavior: smooth;
}
.chatgpt-input-bar {
  margin-top: 0;
  margin-bottom: 3vw !important;
  max-width: 98vw;
  padding-left: 2vw;
  padding-right: 2vw;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  min-height: unset !important;
}
.hamburger-btn {
  background: #fff !important;
  color: #2563eb !important;
  border-radius: 8px;
  box-shadow: 0 1px 4px #2563eb11;
}
.chat-header-bar {
  background: transparent;
  min-height: 56px;
}
.responsive-desc {
  font-size: 0.98rem !important;
}
.responsive-input textarea {
  min-height: 32px !important;
  font-size: 1.05rem !important;
  padding: 6px 10px !important;
}
@media (max-width: 400px) {
  .responsive-card {
    max-width: 98vw;
    padding: 0.7rem 0.2rem 1rem 0.2rem !important;
  }
}
.premium-shadow {
  box-shadow: 0 8px 32px 0 #2563eb22, 0 1.5px 6px 0 #38bdf822;
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
.user-message-bubble {
  background: linear-gradient(90deg, #e0f2fe 0%, #bae6fd 100%);
  color: #2563eb;
  border-radius: 16px;
  padding: 12px 18px;
  margin-left: auto;
  margin-bottom: 12px;
  text-align: right;
  font-size: 1.05rem;
  font-weight: 500;
  box-shadow: 0 2px 8px #38bdf822;
  border: 1.5px solid #e0e7ef33;
}
.assistant-message-bubble {
  background: linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #1e3a8a;
  border-radius: 16px;
  padding: 12px 18px;
  margin-right: auto;
  margin-bottom: 12px;
  text-align: left;
  font-size: 1.05rem;
  font-weight: 500;
  box-shadow: 0 2px 8px #2563eb22;
  border: 1.5px solid #e0e7ef33;
}
.glass-bubble {
  backdrop-filter: blur(6px) saturate(160%);
  -webkit-backdrop-filter: blur(6px) saturate(160%);
  background-color: rgba(255,255,255,0.45) !important;
}
.fade-in {
  animation: fadeIn 0.7s cubic-bezier(.39,.575,.56,1) both;
}
.fade-in-bubble {
  animation: fadeInBubble 0.5s cubic-bezier(.39,.575,.56,1) both;
}
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(24px) scale(0.98); }
  100% { opacity: 1; transform: none; }
}
@keyframes fadeInBubble {
  0% { opacity: 0; transform: translateY(12px) scale(0.98); }
  100% { opacity: 1; transform: none; }
}
.lang-btn {
  background: #fff !important;
  color: #2563eb !important;
  border: 1.5px solid #38bdf8 !important;
  font-weight: 600;
  letter-spacing: 1px;
  border-radius: 8px;
}
@media (min-width: 900px) {
  .responsive-card {
    max-width: 1400px;
    padding: 2.2rem 2.5rem 2rem 2.5rem !important;
    margin: 0 auto 32px auto;
  }
  .chatgpt-card {
    max-width: 1400px;
    min-height: 40vh;
    max-height: 75vh;
    margin: 32px auto 32px auto;
  }
  .chatgpt-input-bar {
    max-width: 1400px;
    margin-top: 0;
    margin-bottom: 32px !important;
  }
}
.input-bar-row {
  align-items: center;
}
.modern-input textarea {
  min-height: 44px !important;
  font-size: 1.08rem;
}
</style>