<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useProjectStore } from '../store/project'
import { useAssetStore } from '../store/asset'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const projectStore = useProjectStore()
const assetStore = useAssetStore()

const keyword = ref('')
const project = computed(() => (props.projectId ? projectStore.getProjectById(props.projectId) : null))

// 分区本身没有状态/时间戳字段，列表只展示结构里真实存在的事实：楼层数、房间数、面积
// 老缓存里的项目可能没有 partitions/floors，这里全部按缺省空数组兜住，否则 computed 抛错会让弹窗打不开
const rows = computed(() => {
  if (!project.value) return []
  const attached = assetStore.attachedAssetsOf(project.value.id)
  return (project.value.partitions || [])
    .filter(p => !keyword.value || p.name.includes(keyword.value))
    .map(p => {
      const stat = projectStore.partitionStats(p)
      return {
        id: p.id,
        name: p.name,
        area: p.area,
        ...stat,
        attachedCount: attached.filter(a => a.partitionId === p.id).length
      }
    })
})

const formVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: '', name: '', floorCount: 1, floorArea: 0 })

function openAdd() {
  isEdit.value = false
  form.id = ''
  form.name = `分区${rows.value.length + 1}`
  form.floorCount = 1
  form.floorArea = 0
  formVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.floorCount = row.floorCount
  form.floorArea = row.floorCount ? Math.round((row.area / row.floorCount) * 100) / 100 : 0
  formVisible.value = true
}

function submitForm() {
  if (!project.value) return ElMessage.warning('项目不存在，请刷新页面后重试')
  const name = form.name.trim()
  if (!name) return ElMessage.warning('请填写分区名称')
  if ((project.value.partitions || []).some(p => p.name === name && p.id !== form.id)) {
    return ElMessage.warning('该分区名称已存在')
  }
  const area = form.floorArea * form.floorCount

  if (isEdit.value) {
    projectStore.updatePartition(project.value.id, form.id, { name, area })
    ElMessage.success(`分区「${name}」已更新`)
  } else {
    const floors = Array.from({ length: form.floorCount }, (_, i) => ({
      name: `${i + 1}F`,
      area: form.floorArea,
      rooms: []
    }))
    projectStore.addPartition(project.value.id, { name, area, floors })
    ElMessage.success(`分区「${name}」已新增，可在「挂入已有资产」里选到它`)
  }
  formVisible.value = false
}

function removeRow(row) {
  const extra = row.attachedCount ? `，同时把挂在该分区的 ${row.attachedCount} 项资产移出项目` : ''
  ElMessageBox.confirm(`确定删除分区「${row.name}」吗？删除后项目统计会重算${extra}`, '删除分区', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (row.attachedCount) {
      assetStore.attachedAssetsOf(project.value.id)
        .filter(a => a.partitionId === row.id)
        .forEach(a => assetStore.detachFromProject(a.id, { remark: `分区「${row.name}」被删除，自动移出项目` }))
    }
    const res = projectStore.removePartition(project.value.id, row.id)
    if (!res.ok) return ElMessage.warning(res.reason)
    ElMessage.success(`分区「${row.name}」已删除`)
  }).catch(() => {})
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="'分区管理 - ' + (project ? project.name : '')"
    width="820px"
    top="6vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="pm-toolbar">
      <el-input v-model="keyword" placeholder="请输入分区名称" clearable style="width: 220px" />
      <el-button type="primary" plain :disabled="!project" @click="openAdd">
        <el-icon><Plus /></el-icon>
        新增分区
      </el-button>
    </div>

    <el-table :data="rows" style="width: 100%">
      <el-table-column prop="name" label="分区名称" min-width="150" />
      <el-table-column prop="floorCount" label="楼层数" width="90" align="center" />
      <el-table-column prop="roomCount" label="房间数" width="90" align="center" />
      <el-table-column prop="leasedCount" label="在租" width="80" align="center">
        <template #default="{ row }">
          <span :style="{ color: row.leasedCount ? '#f56c6c' : '#909399' }">{{ row.leasedCount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="attachedCount" label="挂入资产" width="100" align="center" />
      <el-table-column prop="area" label="面积(㎡)" width="110" align="right" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="removeRow(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="该项目还没有分区" :image-size="80" />
      </template>
    </el-table>

    <el-dialog v-model="formVisible" :title="isEdit ? '编辑分区' : '新增分区'" width="440px" append-to-body>
      <el-form label-width="96px">
        <el-form-item label="分区名称">
          <el-input v-model="form.name" maxlength="20" placeholder="如 东配楼" />
        </el-form-item>
        <el-form-item label="楼层数">
          <el-input-number v-model="form.floorCount" :min="0" :max="30" />
        </el-form-item>
        <el-form-item label="每层面积">
          <el-input-number v-model="form.floorArea" :min="0" :step="100" />
          <span class="pm-unit">㎡</span>
        </el-form-item>
        <el-form-item label="合计面积">
          <span class="pm-total">{{ (form.floorArea * form.floorCount).toFixed(2) }} ㎡</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.pm-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.pm-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
.pm-total {
  font-weight: 600;
}
</style>
