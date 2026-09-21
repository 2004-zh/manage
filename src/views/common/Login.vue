<template>
  <div class="login-page">
    <div class="login-brand">
      <div class="brand-decor">
        <div class="glow g1"></div>
        <div class="glow g2"></div>
        <div class="iso-plane p1"></div>
        <div class="iso-plane p2"></div>
        <div class="iso-cube c1"></div>
        <div class="iso-cube c2"></div>
        <div class="iso-cube c3"></div>
      </div>
      <div class="brand-top">
        <div class="brand-logo">
          <el-icon :size="26" color="var(--c-primary)"><OfficeBuilding /></el-icon>
        </div>
        <div>
          <div class="brand-title">资管云平台</div>
          <div class="brand-sub">Asset Management Cloud Platform</div>
        </div>
      </div>
      <div class="brand-mid">
        <div class="brand-big">国有资产数字化 · 一条链 · 一张屏</div>
        <div class="brand-points">
          <span>资产全生命周期管理</span>
          <span>经营数据实时看板</span>
          <span>风险预警智能监管</span>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-container">
        <div class="login-header">
          <h1>长乐区国有资产经营管理系统</h1>
          <p>经营性资产管理 · 数据一条链 · 监管一张屏</p>
        </div>

        <el-form :model="form" class="login-form" @submit.prevent="handleLogin">
          <el-form-item>
            <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item>
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="请输入验证码" size="large" maxlength="4" @keyup.enter="handleLogin">
                <template #prefix>
                  <svg class="shield-svg" viewBox="0 0 1024 1024" width="14" height="14" aria-hidden="true">
                    <path d="M512 64 128 192v288c0 212 149 388 384 480 235-92 384-268 384-480V192L512 64z m0 128 256 85.3V480c0 152.5-103.4 281.4-256 350.7C359.4 761.4 256 632.5 256 480V277.3L512 192z" fill="currentColor" />
                  </svg>
                </template>
              </el-input>
              <div class="captcha-img" title="点击刷新验证码" @click="refreshCaptcha">
                <svg width="118" height="40" viewBox="0 0 118 40">
                  <rect width="118" height="40" rx="4" fill="#f2f6fc" />
                  <line
                    v-for="(l, i) in captchaLines"
                    :key="'l' + i"
                    :x1="l.x1" :y1="l.y1" :x2="l.x2" :y2="l.y2"
                    :stroke="l.color" stroke-width="1"
                  />
                  <text
                    v-for="(c, i) in captchaItems"
                    :key="'c' + i"
                    :x="c.x" :y="c.y"
                    :fill="c.color"
                    :transform="`rotate(${c.rotate} ${c.x} ${c.y})`"
                    font-size="22" font-weight="700" font-family="Arial, sans-serif"
                  >{{ c.ch }}</text>
                </svg>
              </div>
            </div>
          </el-form-item>
          <div class="form-options">
            <el-checkbox v-model="rememberPwd">记住密码</el-checkbox>
          </div>
          <el-form-item>
            <el-button type="primary" size="large" style="width: 100%" @click="handleLogin">登 录</el-button>
          </el-form-item>
        </el-form>

        <div class="role-section">
          <p class="role-title">选择角色快速进入</p>
          <div class="role-cards grid-2">
            <div
              v-for="role in filteredRoles"
              :key="role.id"
              class="role-card"
              :class="{ active: selectedRole === role.id }"
              @click="quickLogin(role)"
            >
              <div class="role-icon">
                <el-icon :size="28"><Monitor v-if="role.endpoint === 'gov'" /><OfficeBuilding v-else /></el-icon>
              </div>
              <div class="role-name">{{ role.name }}</div>
              <div class="role-desc">{{ role.desc }}</div>
              <div class="role-enter">进入系统 →</div>
            </div>
          </div>
        </div>

        <div class="login-footer">
          <span>演示账号已预置 · 点击角色卡片即可进入</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../store/user'
import { ElMessage } from 'element-plus'
import { Monitor, OfficeBuilding, User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({ username: '', password: '', captcha: '' })
const selectedRole = ref('')
const rememberPwd = ref(false)
const captchaCode = ref('')
const captchaItems = ref([])
const captchaLines = ref([])

const REMEMBER_KEY = 'zgy-remembered-username'
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXY345678'
const CAPTCHA_COLORS = ['#1668DC', '#722ed1', '#E8912A', '#13c2c2', '#2F54EB', '#18A058']

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function refreshCaptcha() {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CAPTCHA_CHARS[rand(0, CAPTCHA_CHARS.length - 1)]
  }
  captchaCode.value = code
  captchaItems.value = code.split('').map((ch, i) => ({
    ch,
    x: 16 + i * 25 + rand(-3, 3),
    y: rand(27, 31),
    rotate: rand(-22, 22),
    color: CAPTCHA_COLORS[rand(0, CAPTCHA_COLORS.length - 1)]
  }))
  captchaLines.value = Array.from({ length: 4 }, () => ({
    x1: rand(0, 30),
    y1: rand(0, 40),
    x2: rand(88, 118),
    y2: rand(0, 40),
    color: CAPTCHA_COLORS[rand(0, CAPTCHA_COLORS.length - 1)]
  }))
  form.value.captcha = ''
}

const filteredRoles = computed(() => {
  return userStore.roles.filter(r =>
    !form.value.username || r.username.includes(form.value.username) || form.value.username === ''
  )
})

onMounted(() => {
  if (route.query.switch === '1') {
    userStore.logout()
  }
  refreshCaptcha()
  const saved = localStorage.getItem(REMEMBER_KEY)
  if (saved) {
    form.value.username = saved
    rememberPwd.value = true
  }
})

function persistRemember() {
  if (rememberPwd.value) {
    localStorage.setItem(REMEMBER_KEY, form.value.username)
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
}

function handleLogin() {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (!form.value.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (form.value.captcha.toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误，请重新输入')
    refreshCaptcha()
    return
  }
  const role = userStore.roles.find(r => r.username === form.value.username && r.password === form.value.password)
  if (!role) {
    ElMessage.error('用户名或密码错误')
    refreshCaptcha()
    return
  }
  persistRemember()
  userStore.login(form.value.username, form.value.password, role.id)
  router.push(role.home)
}

function quickLogin(role) {
  selectedRole.value = role.id
  form.value.username = role.username
  form.value.password = role.password
  persistRemember()
  userStore.login(role.username, role.password, role.id)
  router.push(role.home)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, var(--c-primary-dark) 0%, color-mix(in srgb, var(--c-primary-dark) 70%, var(--c-primary)) 55%, var(--c-primary) 130%);
}

.login-brand {
  flex: 1 1 55%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 72px;
  color: #fff;
}

.brand-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.glow.g1 {
  width: 320px;
  height: 320px;
  background: rgba(22, 104, 220, 0.4);
  top: -80px;
  right: -60px;
}

.glow.g2 {
  width: 260px;
  height: 260px;
  background: rgba(22, 104, 220, 0.2);
  bottom: -60px;
  left: 10%;
}

.iso-plane {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
}

.iso-plane.p1 {
  width: 320px;
  height: 320px;
  right: 8%;
  bottom: 12%;
  transform: perspective(700px) rotateX(58deg) rotateZ(45deg);
}

.iso-plane.p2 {
  width: 200px;
  height: 200px;
  right: 20%;
  bottom: 26%;
  transform: perspective(700px) rotateX(58deg) rotateZ(45deg);
  border-color: rgba(22, 104, 220, 0.35);
}

.iso-cube {
  position: absolute;
  border-radius: var(--r-sm);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.iso-cube.c1 {
  width: 74px;
  height: 74px;
  right: 16%;
  bottom: 34%;
  background: linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%);
  transform: skewY(-12deg);
}

.iso-cube.c2 {
  width: 52px;
  height: 52px;
  right: 27%;
  bottom: 24%;
  background: linear-gradient(135deg, var(--c-primary) 0%, var(--c-primary-dark) 100%);
  transform: skewY(-12deg);
  opacity: 0.7;
}

.iso-cube.c3 {
  width: 36px;
  height: 36px;
  right: 12%;
  bottom: 22%;
  background: linear-gradient(135deg, var(--c-accent) 0%, var(--c-warning) 100%);
  transform: skewY(-12deg);
}

.brand-top {
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 52px;
  height: 52px;
  border-radius: var(--r-md);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
}

.brand-sub {
  font-size: 13px;
  opacity: 0.7;
  letter-spacing: 1px;
  margin-top: 2px;
}

.brand-mid {
  position: relative;
  z-index: 1;
  margin-top: 56px;
}

.brand-big {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
}

.brand-points {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.brand-points span {
  font-size: 14px;
  opacity: 0.85;
  padding-left: 18px;
  position: relative;
}

.brand-points span::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 8px;
  height: 8px;
  border-radius: var(--r-sm);
  background: var(--c-primary);
}

.login-right {
  flex: 1 1 45%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 40px;
}

.login-container {
  width: 100%;
  max-width: 520px;
  background: var(--bg-card);
  border-radius: var(--r-lg);
  padding: 36px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-header h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--t-main);
  margin-bottom: 8px;
}

.login-header p {
  font-size: 13px;
  color: var(--t-weak);
}

.login-form {
  margin-bottom: 20px;
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-row .el-input {
  flex: 1;
}

.shield-svg {
  color: var(--t-weak);
}

.captcha-img {
  flex: none;
  cursor: pointer;
  border-radius: var(--r-sm);
  overflow: hidden;
  border: 1px solid var(--bd);
  display: flex;
  align-items: center;
  user-select: none;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.role-section {
  border-top: 1px solid var(--bd-split);
  padding-top: 20px;
}

.role-title {
  font-size: 13px;
  color: var(--t-weak);
  margin-bottom: 12px;
  text-align: center;
}

.role-cards {
  position: relative;
}

.role-card {
  border: 2px solid var(--bd);
  border-radius: var(--r-md);
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s, background 0.2s;
}

.role-card:hover {
  border-color: var(--c-primary);
  background: var(--c-primary-light);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(22, 104, 220, 0.18);
}

.role-card.active {
  border-color: var(--c-primary);
  background: var(--c-primary-light);
}

.role-enter {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-primary);
  opacity: 0;
  transition: opacity 0.2s;
}

.role-card:hover .role-enter,
.role-card.active .role-enter {
  opacity: 1;
}

.role-icon {
  color: var(--c-primary);
  margin-bottom: 8px;
}

.role-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--t-main);
  margin-bottom: 4px;
}

.role-desc {
  font-size: 12px;
  color: var(--t-weak);
  line-height: 1.3;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: var(--t-weak);
}

@media (max-width: 1100px) {
  .login-brand {
    display: none;
  }

  .login-right {
    flex: 1;
    width: auto;
    padding: 24px;
  }
}
</style>
