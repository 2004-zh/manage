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
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="6" v-for="k in kpiList" :key="k.label">
        <el-card shadow="hover" class="kpi-card">
          <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}<span class="kpi-unit">{{ k.unit }}</span></div>
          <div class="kpi-label">{{ k.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目卡片网格 -->
    <div class="project-grid">
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
                <el-option label="城投集团" value="城投集团" />
                <el-option label="产投集团" value="产投集团" />
                <el-option label="水投集团" value="水投集团" />
                <el-option label="领航公司" value="领航公司" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目地址" prop="address">
              <el-input v-model="form.address" placeholder="如：长乐区吴航街道" />
            </el-form-item>
          </el-col>
        </el-row>
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
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Location, OfficeBuilding } from '@element-plus/icons-vue'
import { useProjectStore } from '../../store/project'

const router = useRouter()
const projectStore = useProjectStore()

const searchKw = ref('')
const filterGroup = ref('')
const filterType = ref('')

const projects = computed(() => projectStore.projects)

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
  })
})

const totalAssets = computed(() => projects.value.reduce((s, p) => s + p.totalAssets, 0))
const totalRented = computed(() => projects.value.reduce((s, p) => s + p.rentedCount, 0))
const totalIdle = computed(() => projects.value.reduce((s, p) => s + p.idleCount, 0))
const overallRate = computed(() => totalAssets.value ? Math.round(totalRented.value / totalAssets.value * 1000) / 10 : 0)

const kpiList = computed(() => [
  { label: '项目数', value: projects.value.length, unit: '个', color: '#1890ff' },
  { label: '资产总宗数', value: totalAssets.value, unit: '宗', color: '#722ed1' },
  { label: '资产利用率', value: overallRate.value, unit: '%', color: '#52c41a' },
  { label: '闲置宗数', value: totalIdle.value, unit: '宗', color: '#f5222d' }
])

function formatArea(v) {
  return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toLocaleString()
}

function typeTagColor(type) {
  const map = { '住宅项目': 'primary', '商业办公': 'success', '交通枢纽': 'warning', '商业街区': 'warning', '文化设施': 'danger', '商业综合': '' }
  return map[type] || ''
}

function rateColor(rate) {
  if (rate >= 80) return '#52c41a'
  if (rate >= 60) return '#faad14'
  return '#f5222d'
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
  group: '城投集团',
  address: '',
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
      partitions: form.partitions
    })
    createDialogVisible.value = false
    ElMessage.success(`项目「${project.name}」创建成功，共 ${project.totalAssets} 个资产已同步到资产登记和资产管控`)
  })
}
</script>

<style scoped>
.page-container {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.kpi-row {
  margin-bottom: 16px;
}

.kpi-card {
  text-align: center;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
}

.kpi-unit {
  font-size: 13px;
  font-weight: 400;
  margin-left: 2px;
  color: #999;
}

.kpi-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
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
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
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
  color: #333;
  margin-bottom: 4px;
}

.card-group {
  font-size: 12px;
  color: #1890ff;
  margin-bottom: 6px;
}

.card-address {
  font-size: 12px;
  color: #999;
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
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  text-align: center;
}

.stat-val {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stat-lbl {
  display: block;
  font-size: 11px;
  color: #999;
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
  background: #f0f0f0;
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
  color: #666;
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

.quick-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-right: 4px;
}

.quick-unit {
  font-size: 12px;
  color: #666;
  margin-right: 8px;
}

.structure-editor {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
}

.partition-block {
  margin-bottom: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 10px;
  background: #fafafa;
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
  color: #999;
}

.floor-block {
  margin-left: 12px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
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
