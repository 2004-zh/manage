<template>
  <el-dialog
    :model-value="modelValue"
    title="地图选点"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="map-picker-container">
      <div ref="mapContainerRef" class="map-container"></div>
      <div class="picker-info">
        <div v-if="pickedLng && pickedLat" class="coord-display">
          <span>经度: {{ pickedLng.toFixed(6) }}</span>
          <span>纬度: {{ pickedLat.toFixed(6) }}</span>
          <span v-if="pickedTown">乡镇: {{ pickedTown }}</span>
        </div>
        <div v-else class="coord-hint">
          点击地图选择位置
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :disabled="!pickedLng || !pickedLat" @click="handleConfirm">
        确认选点
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { CHANGLE_BOUNDS, resolveTownByVoronoi } from '../data/locations'

const AMAP_KEY = 'd9902108686d1a72769e105fb5f8343e'

function loadAmapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) { resolve(); return }
    if (document.querySelector('script[src*="webapi.amap.com"]')) {
      const wait = setInterval(() => { if (window.AMap) { clearInterval(wait); resolve() } }, 100)
      setTimeout(() => { clearInterval(wait); reject(new Error('高德地图脚本加载超时')) }, 15000)
      return
    }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(s)
  })
}

const props = defineProps({
  modelValue: Boolean,
  initialLng: Number,
  initialLat: Number
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const mapContainerRef = ref(null)
let amapInstance = null
let markerInstance = null

const pickedLng = ref(null)
const pickedLat = ref(null)
const pickedTown = ref('')

async function initMap() {
  try {
    await loadAmapScript()
  } catch (e) {
    console.error('[MapPicker] 高德地图加载失败:', e)
    return
  }

  if (amapInstance) {
    try { amapInstance.destroy() } catch (e) { console.warn(e) }
    amapInstance = null
  }

  const el = mapContainerRef.value
  if (!el) return

  el.innerHTML = ''

  const centerLng = props.initialLng || 119.60
  const centerLat = props.initialLat || 25.87

  amapInstance = new window.AMap.Map(el, {
    zoom: 14,
    center: [centerLng, centerLat],
    mapStyle: 'amap://styles/normal',
    viewMode: '2D',
    resizeEnable: true,
    showIndoorMap: false,
    showBuildingBlock: false
  })

  // 如果有初始坐标，放置标记
  if (props.initialLng && props.initialLat) {
    placeMarker(props.initialLng, props.initialLat)
  }

  // 点击地图选点
  amapInstance.on('click', (e) => {
    const lng = e.lnglat.getLng()
    const lat = e.lnglat.getLat()
    placeMarker(lng, lat)
  })
}

async function placeMarker(lng, lat) {
  pickedLng.value = lng
  pickedLat.value = lat

  const { town } = await resolveTownByVoronoi(lng, lat)
  pickedTown.value = town

  if (markerInstance) {
    markerInstance.setPosition(new window.AMap.LngLat(lng, lat))
  } else {
    markerInstance = new window.AMap.Marker({
      position: new window.AMap.LngLat(lng, lat),
      content: `<div style="width:20px;height:20px;background:#1668DC;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      offset: new window.AMap.Pixel(-10, -10)
    })
    markerInstance.setMap(amapInstance)
  }
}

function handleConfirm() {
  if (pickedLng.value && pickedLat.value) {
    emit('confirm', pickedLng.value, pickedLat.value, pickedTown.value)
  }
  handleClose()
}

function handleClose() {
  emit('update:modelValue', false)
}

function cleanup() {
  if (amapInstance) {
    try { amapInstance.destroy() } catch (e) { console.warn(e) }
    amapInstance = null
    markerInstance = null
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    nextTick(() => {
      setTimeout(initMap, 100)
    })
  } else {
    cleanup()
    pickedLng.value = null
    pickedLat.value = null
    pickedTown.value = ''
  }
})

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style scoped>
.map-picker-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-container {
  width: 100%;
  height: 450px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.picker-info {
  min-height: 24px;
}

.coord-display {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.coord-hint {
  font-size: 13px;
  color: #909399;
  padding: 8px 12px;
}
</style>
