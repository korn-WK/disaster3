<template>
  <div class="wrapper">
    <Head>
      <title>Sign In - DISASTER SYSTEM</title>
    </Head>
    
    <!-- Left Side (Login/Menu) -->
    <div class="left">
      <div class="menuBox">
        <div class="logoBox">
          <img src="/mfu-logo.png" alt="MFU Logo" class="logo" />
        </div>
        <h1 class="title">DISASTER MANAGEMENT SYSTEM</h1>
        <p class="subtitle">Emergency Response & Disaster Prevention<br />Mae Fah Luang University</p>
        
        <div class="menuGrid">
          <div class="menuCard">
            <img src="/content-management.png" alt="Disaster Reports" class="menuIcon" />
            <div>
              <div class="menuTitle">Disaster Reports</div>
              <div class="menuDesc">Report and track incidents</div>
            </div>
          </div>
          <div class="menuCard">
            <img src="/location.png" alt="Location Tracking" class="menuIcon" />
            <div>
              <div class="menuTitle">Location Tracking</div>
              <div class="menuDesc">Monitor affected areas</div>
            </div>
          </div>
          <div class="menuCard">
            <img src="/department.png" alt="Emergency Contacts" class="menuIcon" />
            <div>
              <div class="menuTitle">Emergency Contacts</div>
              <div class="menuDesc">Response team directory</div>
            </div>
          </div>
          <div class="menuCard">
            <img src="/report.png" alt="Analytics" class="menuIcon" />
            <div>
              <div class="menuTitle">Analytics</div>
              <div class="menuDesc">Data analysis & insights</div>
            </div>
          </div>
        </div>
        
        <button @click="loginWithGoogle" class="ssoButton">
          <img src="/key.png" alt="MFU SSO logo" class="ssoLogo" />
          Sign in with Google
        </button>
        
        
        
        
      </div>
    </div>
    
    <!-- Right Side (Header/Background) -->
    <div class="right">
      <!-- Header MFU Overlay -->
      <div class="headerOverlay">
        <div class="header">
          <img src="/mfu-logo.png" alt="logo" class="headerLogo" />
          <div class="headerDivider"></div>
          <div class="headerText">
            <span class="headerTH">ระบบรับมือภัยภิบัติ มหาวิทยาลัยแม่ฟ้าหลวง</span>
            <span class="headerEN">Disaster Management System, Mae Fah Luang University</span>
          </div>
        </div>
      </div>
      <div class="bgOverlay"></div>
      <img src="/unnamed.png" alt="MFU Campus" class="bgImg" />
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl
const route = useRoute()
const error = ref(null)
const oauthStatus = ref(null)

onMounted(async () => {
  // Check for error in URL query params
  if (route.query.error) {
    error.value = route.query.error
  }
  
  // Check OAuth configuration status
  await checkOAuthStatus()
})

function getErrorMessage(errorCode) {
  const errorMessages = {
    'google_auth_failed': 'การยืนยันตัวตนด้วย Google ล้มเหลว กรุณาลองใหม่อีกครั้ง',
    'no_user': 'ไม่พบข้อมูลผู้ใช้ กรุณาลองใหม่อีกครั้ง',
    'token_error': 'เกิดข้อผิดพลาดในการสร้าง token กรุณาลองใหม่อีกครั้ง',
    'default': 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง'
  }
  return errorMessages[errorCode] || errorMessages['default']
}

async function checkOAuthStatus() {
  try {
    const response = await fetch(`${apiBase}/auth/test`)
    if (response.ok) {
      oauthStatus.value = await response.json()
    }
  } catch (error) {
    console.error('Error checking OAuth status:', error)
  }
}

function loginWithGoogle() {
  window.location.href = `${apiBase}/auth/google`
}
</script>

<style scoped>
@keyframes fadeInUp {
  0% { opacity: 0; transform: translateY(40px); }
  100% { opacity: 1; transform: none; }
}

@keyframes bgZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}

.wrapper {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #ffffff;
}

.left {
  flex: 1;
  min-width: 400px;
  max-width: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 30px 20px 30px;
  background: #ffffff;
  z-index: 2;
}

.menuBox {
  width: 100%;
  max-width: 600px;
  background: #ffffff;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: fadeInUp 0.8s cubic-bezier(.39,.575,.565,1) both;
}

.logoBox {
  margin-bottom: 10px;
  animation: fadeInUp 1.2s cubic-bezier(.39,.575,.565,1) both;
}

.logo {
  width: 100px;
  height: 100px;
}

.title {
  font-size: 1.7em;
  font-weight: 600;
  margin: 10px 0 0 0;
  letter-spacing: 1px;
  text-align: center;
  color: #000000;
  text-shadow: 0 2px 8px rgba(28,169,229,0.08);
}

.subtitle {
  color: rgba(151, 150, 150, 0.85);
  font-size: 1.1em;
  margin: 8px 0 22px 0;
  text-align: center;
  line-height: 1.4;
  font-weight: 500;
}

.menuGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.menuCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(60,60,130,0.07);
  padding: 22px 24px 18px 24px;
  min-width: 0;
  border: 1.5px solid #f2f4f8;
  transition: box-shadow 0.18s, transform 0.18s;
  cursor: default;
  width: 100%;
  max-width: 100%;
  min-height: 90px;
}

.menuCard:hover {
  box-shadow: 0 4px 20px 0 rgba(60,60,130,0.12);
  transform: translateY(-2px);
}

.menuIcon {
  width: 44px;
  height: 44px;
  object-fit: contain;
  margin-bottom: 8px;
  filter: drop-shadow(0 1px 2px rgba(28,169,229,0.10));
  flex-shrink: 0;
}

.menuTitle {
  font-weight: 700;
  font-size: 0.95em;
  color: #222;
  margin-bottom: 2px;
  text-align: center;
}

.menuDesc {
  font-size: 0.85em;
  color: #888;
  text-align: center;
  margin-top: 0;
}

.ssoButton {
  width: 100%;
  max-width: 400px;
  padding: 16px 0;
  font-size: 1.13em;
  background: linear-gradient(90deg,rgb(70, 72, 241) 0%,rgb(91, 170, 243) 80%);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  margin: 18px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(28,169,229,0.13);
  transition: background 0.2s, transform 0.15s;
  letter-spacing: 0.5px;
}

.ssoButton:hover {
  background: linear-gradient(90deg,rgb(104, 76, 231) 0%,rgb(141, 123, 242) 80%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(28,169,229,0.18);
}

.ssoLogo {
  width: 28px;
  height: 28px;
}

.errorMessage {
  color: #fff;
  background: #D7263D;
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
  font-size: 0.97em;
  text-align: center;
  box-shadow: 0 2px 8px rgba(215,38,61,0.10);
}

.statusMessage {
  margin: 15px 0;
  padding: 10px;
  border-radius: 6px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.status-success {
  color: #28a745;
  font-size: 0.9em;
  margin: 5px 0;
  font-weight: 500;
}

.status-error {
  color: #dc3545;
  font-size: 0.9em;
  margin: 5px 0;
  font-weight: 500;
}

.right {
  flex: 1;
  min-width: 400px;
  max-width: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(255,255,255,0.85);
}

.bgImg {
  width: 100%;
  height: 100vh;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  filter: brightness(0.92) saturate(1.08);
  animation: bgZoom 16s ease-in-out infinite alternate;
}

.bgOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 30, 60, 0.16);
  z-index: 2;
}

.headerOverlay {
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 11;
  margin: 0;
  padding: 32px 32px 28px 40px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0,0,0,0);
  padding: 0;
}

.headerLogo {
  height: 64px;
  width: auto;
  min-width: 40px;
  margin-top: 4px;
}

.headerDivider {
  width: 6px;
  height: 80px;
  background: linear-gradient(180deg, #D7263D 0%, #E2AE37 100%);
  border-radius: 3px;
  margin: 0 18px 0 8px;
}

.headerText {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.headerTH {
  font-size: 28px;
  color: #FFFFFF;
  font-weight: 550;
  letter-spacing: 1px;
  line-height: 1.1;
  font-family: inherit;
}

.headerEN {
  font-size: 18px;
  color: #ffffff;
  font-weight: 550;
  margin-top: 8px;
  letter-spacing: 0.5px;
  font-family: inherit;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .wrapper {
    flex-direction: column;
    min-height: 100vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .left {
    min-width: unset;
    padding: 25px 15px 15px 15px;
    flex: none;
    height: auto;
    min-height: 100vh;
    justify-content: center;
  }
  
  .menuBox {
    padding: 20px 18px 18px 18px;
    gap: 10px;
    max-width: 340px;
  }
  
  .logoBox {
    margin-bottom: 5px;
  }
  
  .logo {
    width: 60px;
    height: 60px;
  }
  
  .title {
    font-size: clamp(1em, 6vw, 1.3em) !important;
    max-width: 95vw !important;
  }
  
  .subtitle {
    font-size: 0.85em;
    margin: 5px 0 15px 0;
  }
  
  .menuGrid {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 18px;
    width: 100%;
    max-width: 100%;
  }
  
  .menuCard {
    padding: 8px 5px;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 3px;
  }
  
  .menuIcon {
    width: 20px;
    height: 20px;
  }
  
  .menuTitle {
    font-size: 0.8em;
    margin-bottom: 0;
    line-height: 1.1;
  }
  
  .menuDesc {
    font-size: 0.7em;
    line-height: 1.1;
  }
  
  .ssoButton {
    font-size: 0.9em;
    padding: 10px 0;
    margin-top: 15px;
    max-width: 280px;
  }
  
  .ssoLogo {
    width: 20px;
    height: 20px;
  }
  
  .errorMessage {
    font-size: 0.85em;
    padding: 6px;
    margin: 8px 0;
  }
  
  .right {
    display: none;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .left {
    max-width: 450px;
  }
  
  .menuBox {
    padding: 35px 30px 30px 30px;
  }
  
  .menuGrid {
    gap: 14px;
    max-width: 380px;
  }
}

@media (max-width: 600px) {
  .wrapper {
    flex-direction: column;
    min-height: 100vh;
    align-items: center;
    background: linear-gradient(180deg, #f8fbff 60%, #eaf3fa 100%);
  }
  
  .left {
    min-width: unset;
    padding: 18px 4vw 8px 4vw;
    flex: none;
    height: auto;
    min-height: 100vh;
    justify-content: flex-start;
    align-items: center;
    background: transparent;
  }
  
  .logoBox {
    margin-bottom: 8px;
  }
  
  .logo {
    width: 90px;
    height: 95px;
  }
  
  .title {
    font-size: 1.3em;
    margin: 10px 0 0 0;
    text-align: center;
    max-width: 95vw;
  }
  
  .subtitle {
    font-size: 0.95em;
    margin: 6px 0 18px 0;
    text-align: center;
  }
  
  .menuBox {
    padding: 0;
    gap: 10px;
    max-width: 98vw;
    background: transparent;
    box-shadow: none;
  }
  
  .menuGrid {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    width: 100%;
    max-width: 98vw;
    margin: 0 auto;
  }
  
  .menuCard {
    width: 100%;
    max-width: 100%;
    min-height: 80px;
    padding: 16px 10px;
    border-radius: 16px;
    box-shadow: 0 2px 12px 0 rgba(60,60,130,0.07);
    margin: 0 auto;
  }
  
  .menuIcon {
    width: 32px;
    height: 32px;
    margin-bottom: 6px;
  }
  
  .menuTitle {
    font-size: 0.97em;
    text-align: center;
  }
  
  .menuDesc {
    font-size: 0.82em;
    text-align: center;
  }
  
  .ssoButton {
    width: 100%;
    max-width: 100%;
    margin-top: 28px;
    font-size: 1em;
    border-radius: 14px;
    padding: 14px 0;
  }
}
</style>