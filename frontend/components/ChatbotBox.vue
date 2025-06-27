<template>
  <div class="chatbot-box-root">
    <div class="d-flex align-center pa-4 w-100 chat-header-bar" style="height: 56px; position: relative;">
      <v-spacer />
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { useRuntimeConfig } from '#app'
import VueMarkdown from 'vue-markdown-render'

const props = defineProps({
  language: {
    type: String,
    default: 'th'
  }
})

const userId = 'user123'
const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl

const translations = {
  th: {
    startConversation: 'เริ่มการสนทนาได้เลย...',
    aiThinking: 'AI กำลังคิด...',
    typeMessage: 'พิมพ์ข้อความ หรือกดไมค์เพื่อพูด...',
    loadingResponse: 'กำลังรอคำตอบ...',
    connectionError: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
    yourBrowserNotSupportVoiceRecognition: 'เบราว์เซอร์ของคุณไม่รองรับการแปลงเสียงเป็นข้อความ'
  },
  en: {
    startConversation: 'Start a conversation...',
    aiThinking: 'AI is thinking...',
    typeMessage: 'Type a message or press mic to speak...',
    loadingResponse: 'Waiting for response...',
    connectionError: '❌ Error connecting to server',
    yourBrowserNotSupportVoiceRecognition: 'Your browser does not support voice-to-text conversion'
  },
}

const message = ref('')
const chat = ref([])
const loading = ref(false)
const isListening = ref(false)
const messagesEndRef = ref(null)

function t(key) {
  return translations[props.language][key] || key
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString(props.language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })
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
  recognition.lang = props.language === 'th' ? 'th-TH' : 'en-US'
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

onMounted(() => {
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

</style> 
