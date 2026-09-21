<template>
  <div class="page-container">
    <div class="page-header">
      <h2>项目管理</h2>
      <div class="header-actions">
        <el-input v-model="searchKw" placeholder="搜索项目名称/地址" clearable style="width:240px" :prefix-icon="Search" />
        <el-select v-model="filterGroup" placeholder="所属集团" clearable style="width:140px">
          <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
        </el-select>
        <el-select v-model="filterType" placeholder="项目类型" clearable style="width:140px">
          <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="primary" @click="openCreateDialog">新增项目</el-button>
      </div>
    </div>

    <!-- 顶部 KPI -->
    <div class="grid-4 kpi-row">
      <el-card v-for="k in kpiList" :key="k.label" shadow="hover" class="kpi-card">
        <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}<span class="kpi-unit">{{ k.unit }}</span></div>
        <div class="kpi-label">{{ k.label }}</div>
      </el-card>
    </div>

    <!-- 项目卡片网格 -->
    <div class="project-grid grid-auto">
      <el-card
        v-for="p in filteredProjects"
        :key="p.id"
        shadow="hover"
        class="project-card"
        @click="goToProject(p)"
      >
        <div class="card-img">
          <img v-if="p.image" :src="p.image" :alt="p.name" />
          <div v-else class="card-img-placeholder">
            <el-icon :size="36"><OfficeBuilding /></el-icon>
          </div>
          <el-tag class="card-type-tag" :type="typeTagColor(p.type)" effect="dark" size="small">{{ p.type }}</el-tag>
        </div>
        <div class="card-body">
          <div class="card-title">{{ p.name }}</div>
          <div class="card-group">{{ p.group }}</div>
          <div class="card-address"><el-icon><Location /></el-icon>{{ p.address }}</div>
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-val">{{ p.totalAssets }}</span>
              <span class="stat-lbl">资产总数</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">{{ formatArea(p.totalArea) }}</span>
              <span class="stat-lbl">面积(m²)</span>
            </div>
            <div class="stat-item">
              <span class="stat-val" style="color:#67c23a">{{ p.rentedCount }}</span>
              <span class="stat-lbl">盘活宗数</span>
            </div>
            <div class="stat-item">
              <span class="stat-val" style="color:#f56c6c">{{ p.idleCount }}</span>
              <span class="stat-lbl">闲置宗数</span>
            </div>
          </div>
          <div class="card-footer">
            <div class="rate-bar">
              <div class="rate-fill" :style="{ width: p.rentalRate + '%', background: rateColor(p.rentalRate) }"></div>
            </div>
            <span class="rate-text">出租率 {{ p.rentalRate }}%</span>
          </div>
          <div class="card-actions">
            <el-button type="primary" link size="small" @click.stop="openAttach(p)">挂入已有资产</el-button>
            <el-button type="primary" link size="small" @click.stop="openPartitions(p)">分区管理</el-button>
            <span class="attach-count">已挂入 {{ attachedCount(p.id) }} 项</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-if="!filteredProjects.length" description="暂无匹配项目" />

    <!-- 新增项目对话框 -->
    <el-dialog v-model="createDialogVisible" title="新增项目" width="900px" destroy-on-close top="3vh">
      <el-form :model="form" label-width="90px" ref="formRef" :rules="formRules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="form.name" placeholder="如：红联壹城" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型" prop="type">
              <el-select v-model="form.type" style="width:100%">
                <el-option label="住宅项目" value="住宅项目" />
                <el-option label="商业办公" value="商业办公" />
                <el-option label="交通枢纽" value="交通枢纽" />
                <el-option label="商业街区" value="商业街区" />
                <el-option label="文化设施" value="文化设施" />
                <el-option label="商业综合" value="商业综合" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属集团" prop="group">
              <el-select v-model="form.group" style="width:100%">
                <el-option v-for="g in formGroupOptions" :key="g" :label="g" :value="g" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目地址" prop="address">
              <el-input v-model="form.address" placeholder="如：长乐区吴航街道" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目图片">
          <div class="img-field">
            <el-upload :auto-upload="false" :show-file-list="false" accept="image/*" :on-change="handleImageChange">
              <img v-if="form.image" :src="form.image" class="img-preview" alt="项目图片" />
              <div v-else class="img-placeholder">
                <el-icon><Plus /></el-icon>
                <span>选择图片</span>
              </div>
            </el-upload>
            <div class="img-side">
              <el-button v-if="form.image" link type="danger" size="small" @click="form.image = ''">移除图片</el-button>
              <span class="img-tip">选填，不上传则卡片用默认占位图。支持 jpg/png，保存前会自动压缩</span>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <!-- 快捷录入 -->
      <div class="quick-add-bar">
        <span class="quick-label">快捷录入：</span>
        <el-input-number v-model="quickBuild.partitions" :min="1" :max="10" size="small" /> <span class="quick-unit">个分区</span>
        <el-input-number v-model="quickBuild.floorsPerPartition" :min="1" :max="30" size="small" /> <span class="quick-unit">层/分区</span>
        <el-input-number v-model="quickBuild.roomsPerFloor" :min="1" :max="20" size="small" /> <span class="quick-unit">间/层</span>
        <el-input-number v-model="quickBuild.roomArea" :min="10" :max="10000" :step="10" size="small" /> <span class="quick-unit">㎡/间</span>
        <el-button type="primary" size="small" @click="applyQuickBuild">生成结构</el-button>
      </div>

      <!-- 分区/楼层/房间编辑 -->
      <div class="structure-editor">
        <div v-for="(part, pi) in form.partitions" :key="pi" class="partition-block">
          <div class="partition-hd">
            <el-input v-model="part.name" placeholder="分区名称" size="small" style="width:150px" />
            <el-input-number v-model="part.area" :min="0" :step="100" size="small" placeholder="面积" />
            <span class="area-unit">㎡</span>
            <el-button size="small" type="primary" link @click="addFloor(pi)">+ 添加楼层</el-button>
            <el-button size="small" type="danger" link @click="removePartition(pi)">删除分区</el-button>
          </div>

          <div v-for="(floor, fi) in part.floors" :key="fi" class="floor-block">
            <div class="floor-hd">
              <el-input v-model="floor.name" placeholder="楼层名称" size="small" style="width:100px" />
              <el-button size="small" type="primary" link @click="addRoom(pi, fi)">+ 添加房间</el-button>
              <el-button size="small" type="danger" link @click="removeFloor(pi, fi)">删除楼层</el-button>
            </div>

            <el-table v-if="floor.rooms.length" :data="floor.rooms" size="small" border class="room-table">
              <el-table-column label="房间名称" min-width="160">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" placeholder="如：101室" />
                </template>
              </el-table-column>
              <el-table-column label="资产编号" width="140">
                <template #default="{ row }">
                  <el-input v-model="row.assetNo" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="面积(㎡)" width="110">
                <template #default="{ row }">
                  <el-input-number v-model="row.area" :min="0" :step="10" size="small" controls-position="right" style="width:90px" />
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.status" size="small">
                    <el-option label="已出租" value="已出租" />
                    <el-option label="空置" value="空置" />
                    <el-option label="闲置" value="闲置" />
                    <el-option label="自用" value="自用" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeRoom(pi, fi, $index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <el-button type="primary" plain @click="addPartition" style="width:100%;margin-top:8px">+ 添加分区</el-button>
      </div>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 挂入已有资产 -->
    <el-dialog v-model="attachVisible" :title="`挂入已有资产 · ${attachProject?.name || ''}`" width="920px" destroy-on-close top="5vh">
      <el-tabs v-model="attachTab">
        <el-tab-pane label="从台账挑选" name="pick">
          <div class="attach-target">
            <span class="attach-label">目标分区</span>
            <el-select v-model="attachTarget.zoneName" filterable allow-create default-first-option placeholder="选择或输入新分区名" style="width:220px">
              <el-option v-for="z in zoneOptions" :key="z" :label="z" :value="z" />
            </el-select>
            <span class="attach-label">目标楼层</span>
            <el-select v-model="attachTarget.floorName" filterable allow-create default-first-option placeholder="选择或输入新楼层名" style="width:180px">
              <el-option v-for="f in floorOptions" :key="f" :label="f" :value="f" />
            </el-select>
            <el-input v-model="attachKw" placeholder="搜索资产名称/编号/坐落" clearable style="width:240px" :prefix-icon="Search" />
          </div>
          <el-table :data="candidates" size="small" border max-height="380" @selection-change="v => pickSel = v">
            <el-table-column type="selection" width="42" />
            <el-table-column prop="id" label="资产编号" width="100" />
            <el-table-column prop="name" label="资产名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="90" />
            <el-table-column prop="area" label="面积(㎡)" width="95" align="right" />
            <el-table-column prop="status" label="状态" width="85" />
            <el-table-column prop="location" label="坐落" min-width="140" show-overflow-tooltip />
          </el-table>
          <div class="attach-tip">列表只显示本公司名下、还没归属任何项目的资产；挂入后项目总览与资产管控看板立即按这一口径统计。</div>
        </el-tab-pane>

        <el-tab-pane :label="`本项目已挂入(${attachedList.length})`" name="attached">
          <el-table :data="attachedList" size="small" border max-height="380" @selection-change="v => detachSel = v">
            <el-table-column type="selection" width="42" />
            <el-table-column prop="id" label="资产编号" width="100" />
            <el-table-column prop="name" label="资产名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="zoneName" label="分区" width="120" />
            <el-table-column prop="floorName" label="楼层" width="90" />
            <el-table-column prop="area" label="面积(㎡)" width="95" align="right" />
            <el-table-column prop="status" label="状态" width="85" />
          </el-table>
          <el-empty v-if="!attachedList.length" description="该项目还没有挂入外部资产" :image-size="60" />
          <div class="attach-tip">移出只解除项目归属，资产本身不会被删除，仍保留在台账里。</div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="attachVisible = false">关闭</el-button>
        <el-button v-if="attachTab === 'pick'" type="primary" @click="doAttach">确认挂入{{ pickSel.length ? `(${pickSel.length})` : '' }}</el-button>
        <el-button v-else type="danger" @click="doDetach">移出所选{{ detachSel.length ? `(${detachSel.length})` : '' }}</el-button>
      </template>
    </el-dialog>

    <PartitionManager v-model="partitionVisible" :project-id="partitionProjectId" />
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Location, OfficeBuilding, Plus } from '@element-plus/icons-vue'
import { useProjectStore } from '../../store/project'
import { useAssetStore } from '../../store/asset'
import { useUserStore } from '../../store/user'
import PartitionManager from '../../components/PartitionManager.vue'

const router = useRouter()
const projectStore = useProjectStore()
const assetStore = useAssetStore()
const userStore = useUserStore()
// 新建项目只能落在本集团名下
const currentCompany = computed(() => userStore.user?.org || '城投集团')
const formGroupOptions = computed(() =>
  userStore.isEnt ? [currentCompany.value] : ['城投集团', '产投集团', '水投集团', '领航公司']
)

const searchKw = ref('')
const filterGroup = ref('')
const filterType = ref('')

const projects = computed(() => projectStore.visibleProjects)

const groupOptions = computed(() => [...new Set(projects.value.map(p => p.group))])
const typeOptions = computed(() => [...new Set(projects.value.map(p => p.type))])

const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    if (filterGroup.value && p.group !== filterGroup.value) return false
    if (filterType.value && p.type !== filterType.value) return false
    if (searchKw.value) {
      const kw = searchKw.value.toLowerCase()
      if (!p.name.toLowerCase().includes(kw) && !p.address.toLowerCase().includes(kw)) return false
    }
    return true
  // 卡片数字取资产台账的真实归集口径（项目自带房间 + 挂进来的平铺资产），
  // 种子项目里写死的那套统计字段不再参与展示
  }).map(p => ({ ...p, ...assetStore.projectStats(p.id) }))
})

const statTotals = computed(() => {
  const rows = projects.value.map(p => assetStore.projectStats(p.id))
  const total = rows.reduce((s, r) => s + r.totalAssets, 0)
  const rented = rows.reduce((s, r) => s + r.rentedCount, 0)
  return {
    totalAssets: total,
    totalIdle: rows.reduce((s, r) => s + r.idleCount, 0),
    overallRate: total ? Math.round(rented / total * 1000) / 10 : 0
  }
})

const kpiList = computed(() => [
  { label: '项目数', value: projects.value.length, unit: '个', color: '#1668DC' },
  { label: '资产总宗数', value: statTotals.value.totalAssets, unit: '宗', color: '#722ed1' },
  { label: '资产利用率', value: statTotals.value.overallRate, unit: '%', color: '#18A058' },
  { label: '闲置宗数', value: statTotals.value.totalIdle, unit: '宗', color: '#D93026' }
])

function formatArea(v) {
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString()
}

function typeTagColor(type) {
  const map = { '住宅项目': 'primary', '商业办公': 'success', '交通枢纽': 'warning', '商业街区': 'warning', '文化设施': 'danger', '商业综合': '' }
  return map[type] || ''
}

function rateColor(rate) {
  if (rate >= 80) return '#18A058'
  if (rate >= 60) return '#E8912A'
  return '#D93026'
}

function resetFilters() {
  searchKw.value = ''
  filterGroup.value = ''
  filterType.value = ''
}

function goToProject(p) {
  router.push({ path: '/ent/asset-control', query: { projectId: p.id } })
}

// ===== 新增项目 =====
const createDialogVisible = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  name: '',
  type: '住宅项目',
  group: userStore.isEnt ? currentCompany.value : '城投集团',
  address: '',
  image: '',
  partitions: []
})

const form = reactive(defaultForm())

const formRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  group: [{ required: true, message: '请选择所属集团', trigger: 'change' }],
  address: [{ required: true, message: '请输入项目地址', trigger: 'blur' }]
}

const quickBuild = reactive({
  partitions: 1,
  floorsPerPartition: 2,
  roomsPerFloor: 4,
  roomArea: 100
})

function openCreateDialog() {
  Object.assign(form, defaultForm())
  form.partitions = []
  createDialogVisible.value = true
}

// 项目图片选填：本地文件读成 data URL 存进 store，离线演示也能显示
function handleImageChange(file) {
  const raw = file?.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (raw.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片超过 5MB，请压缩后再上传')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      form.image = shrinkToDataUrl(img, 720)
    }
    img.onerror = () => ElMessage.error('图片无法读取，请换一张')
    img.src = reader.result
  }
  reader.onerror = () => ElMessage.error('图片读取失败，请重试')
  reader.readAsDataURL(raw)
}

// 等比缩到 maxW 以内再编码，避免大图把 localStorage 撑爆
function shrinkToDataUrl(img, maxW) {
  const scale = Math.min(1, maxW / img.width)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function applyQuickBuild() {
  form.partitions = []
  for (let pi = 0; pi < quickBuild.partitions; pi++) {
    const floors = []
    for (let fi = 0; fi < quickBuild.floorsPerPartition; fi++) {
      const rooms = []
      for (let ri = 0; ri < quickBuild.roomsPerFloor; ri++) {
        const roomNo = `${fi + 1}${String(ri + 1).padStart(2, '0')}`
        rooms.push({
          name: `${form.name || '项目'}${pi + 1}#${roomNo}`,
          assetNo: '',
          area: quickBuild.roomArea,
          status: '空置'
        })
      }
      floors.push({ name: `${fi + 1}F`, area: quickBuild.roomArea * quickBuild.roomsPerFloor, rooms })
    }
    form.partitions.push({
      name: form.partitions.length === 0 && quickBuild.partitions === 1 ? '主楼' : `分区${pi + 1}`,
      area: quickBuild.roomArea * quickBuild.roomsPerFloor * quickBuild.floorsPerPartition,
      floors
    })
  }
  ElMessage.success(`已生成 ${quickBuild.partitions} 个分区、${quickBuild.partitions * quickBuild.floorsPerPartition} 个楼层、${quickBuild.partitions * quickBuild.floorsPerPartition * quickBuild.roomsPerFloor} 个房间`)
}

function addPartition() {
  form.partitions.push({
    name: `分区${form.partitions.length + 1}`,
    area: 0,
    floors: [{ name: '1F', area: 0, rooms: [] }]
  })
}

function removePartition(pi) {
  form.partitions.splice(pi, 1)
}

function addFloor(pi) {
  const part = form.partitions[pi]
  part.floors.push({ name: `${part.floors.length + 1}F`, area: 0, rooms: [] })
}

function removeFloor(pi, fi) {
  form.partitions[pi].floors.splice(fi, 1)
}

function addRoom(pi, fi) {
  const floor = form.partitions[pi].floors[fi]
  floor.rooms.push({ name: '', assetNo: '', area: 100, status: '空置' })
}

function removeRoom(pi, fi, ri) {
  form.partitions[pi].floors[fi].rooms.splice(ri, 1)
}

function submitCreate() {
  formRef.value.validate(valid => {
    if (!valid) return
    if (!form.partitions.length) {
      ElMessage.warning('请至少添加一个分区（可使用"快捷录入"生成结构）')
      return
    }
    const hasRooms = form.partitions.some(p => p.floors.some(f => f.rooms.length > 0))
    if (!hasRooms) {
      ElMessage.warning('请至少添加一个房间')
      return
    }
    const project = projectStore.addProject({
      name: form.name,
      type: form.type,
      group: form.group,
      address: form.address,
      image: form.image,
      partitions: form.partitions
    })
    createDialogVisible.value = false
    const stats = assetStore.projectStats(project.id)
    ElMessage.success(`项目「${project.name}」创建成功，共 ${stats.totalAssets} 项资产，可在卡片上点「挂入已有资产」继续归集`)
  })
}

// ===== 挂入已有资产 =====
const attachVisible = ref(false)
const attachTab = ref('pick')
const attachProject = ref(null)
const attachKw = ref('')
const pickSel = ref([])
const detachSel = ref([])
const attachTarget = reactive({ zoneName: '', floorName: '' })

const candidates = computed(() => {
  const kw = attachKw.value.trim()
  const list = assetStore.unattachedAssets
  if (!kw) return list
  return list.filter(a => [a.name, a.id, a.assetNo, a.location].filter(Boolean).join(' ').includes(kw))
})

const attachedList = computed(() => attachProject.value ? assetStore.attachedAssetsOf(attachProject.value.id) : [])

function attachedCount(projectId) {
  return assetStore.attachedAssetsOf(projectId).length
}

const zoneOptions = computed(() => {
  const p = attachProject.value
  return p ? [...new Set(p.partitions.map(x => x.name))] : []
})

const floorOptions = computed(() => {
  const p = attachProject.value
  if (!p) return []
  const part = p.partitions.find(x => x.name === attachTarget.zoneName)
  if (part) return [...new Set(part.floors.map(f => f.name))]
  return [...new Set(p.partitions.flatMap(x => x.floors.map(f => f.name)))]
})

const partitionVisible = ref(false)
const partitionProjectId = ref('')

function openPartitions(p) {
  partitionProjectId.value = p.id
  partitionVisible.value = true
}

function openAttach(p) {
  attachProject.value = p
  attachTab.value = 'pick'
  attachKw.value = ''
  pickSel.value = []
  detachSel.value = []
  attachTarget.zoneName = p.partitions[0]?.name || ''
  attachTarget.floorName = p.partitions[0]?.floors[0]?.name || ''
  attachVisible.value = true
}

function doAttach() {
  if (!attachTarget.zoneName || !attachTarget.floorName) {
    ElMessage.warning('请选择或填写分区与楼层')
    return
  }
  if (!pickSel.value.length) {
    ElMessage.warning('请先勾选要挂入的资产')
    return
  }
  const part = attachProject.value.partitions.find(x => x.name === attachTarget.zoneName)
  let ok = 0
  pickSel.value.forEach(a => {
    if (assetStore.attachToProject(a.id, {
      projectId: attachProject.value.id,
      partitionId: part ? part.id : '',
      zoneName: attachTarget.zoneName,
      floorName: attachTarget.floorName
    })) ok++
  })
  pickSel.value = []
  ElMessage.success(`已把 ${ok} 项资产挂入「${attachProject.value.name} / ${attachTarget.zoneName} / ${attachTarget.floorName}」`)
}

function doDetach() {
  if (!detachSel.value.length) {
    ElMessage.warning('请先勾选要移出的资产')
    return
  }
  let ok = 0
  detachSel.value.forEach(a => {
    if (assetStore.detachFromProject(a.id)) ok++
  })
  detachSel.value = []
  ElMessage.success(`已移出 ${ok} 项资产，它们回到未归属状态，可重新挂到别的项目`)
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.kpi-card {
  text-align: center;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  white-space: nowrap;
}

.attach-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.attach-target {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.attach-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.attach-tip {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.kpi-unit {
  font-size: 13px;
  font-weight: 400;
  margin-left: 2px;
  color: var(--t-weak);
}

.kpi-label {
  font-size: 13px;
  color: var(--t-sub);
  margin-top: 4px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-2px);
}

.project-card :deep(.el-card__body) {
  padding: 0;
}

.card-img {
  position: relative;
  height: 140px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--c-primary-light) 0%, #B9D4FF 100%);
}

.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0c4de;
}

.card-type-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-body {
  padding: 12px 16px 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--t-main);
  margin-bottom: 4px;
}

.card-group {
  font-size: 12px;
  color: var(--c-primary);
  margin-bottom: 6px;
}

.card-address {
  font-size: 12px;
  color: var(--t-weak);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--bd);
  border-bottom: 1px solid var(--bd);
}

.stat-item {
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--t-main);
}

.stat-lbl {
  display: block;
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 2px;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-bar {
  flex: 1;
  height: 6px;
  background: var(--bd);
  border-radius: 3px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}

.rate-text {
  font-size: 12px;
  color: var(--t-sub);
  white-space: nowrap;
}

/* 新增项目对话框 */
.quick-add-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #f6f8fa;
  border-radius: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.img-field {
  display: flex;
  align-items: center;
  gap: 12px;
}

.img-field :deep(.el-upload) {
  display: block;
}

.img-preview,
.img-placeholder {
  width: 216px;
  height: 84px;
  border-radius: var(--r-sm);
  border: 1px solid var(--bd);
  object-fit: cover;
  cursor: pointer;
}

.img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--bg-th);
  color: var(--t-weak);
  font-size: 12px;
}

.img-placeholder:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
}

.img-side {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.img-tip {
  font-size: 12px;
  color: var(--t-weak);
  line-height: 1.5;
}

.quick-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--t-main);
  margin-right: 4px;
}

.quick-unit {
  font-size: 12px;
  color: var(--t-sub);
  margin-right: 8px;
}

.structure-editor {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid var(--bd);
  border-radius: 6px;
  padding: 12px;
}

.partition-block {
  margin-bottom: 12px;
  border: 1px solid var(--bd);
  border-radius: 6px;
  padding: 10px;
  background: var(--bg-th);
}

.partition-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.area-unit {
  font-size: 12px;
  color: var(--t-weak);
}

.floor-block {
  margin-left: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--bd);
  border-radius: 4px;
  padding: 8px;
  background: #fff;
}

.floor-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.room-table {
  width: 100%;
}

.room-table :deep(.el-input-number) {
  width: 90px;
}
</style>
