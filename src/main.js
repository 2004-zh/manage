import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import { useUserStore } from './store/user'
import { piniaPersistPlugin } from './store/persist'
import './styles/global.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPersistPlugin)
app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

const userStore = useUserStore()
userStore.restore()

app.mount('#app')
