<template>
  <div class="gov-risk">
    <div class="page-header">
      <h2>风险预警中心</h2>
    </div>

    <div class="grid-4">
      <el-card
        v-for="w in warningCards"
        :key="w.label"
        class="warning-card"
        :class="{
          'wc-warn': w.key === '欠费',
          'wc-idle': w.key === '闲置超期',
          'wc-danger': w.key === '未办证',
          'wc-info': w.key === '合同临期'
        }"
        @click="activeType = w.key"
      >
        <div class="warning-count">{{ w.count }}</div>
        <div class="warning-label">{{ w.label }}</div>
      </el-card>
    </div>

    <div class="filter-bar">
      <el-form :inline="true">
        <el-form-item label="集团">
          <el-select v-model="filterGroup" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="activeType" clearable placeholder="全部" style="width: 140px">
            <el-option label="欠费" value="欠费" />
            <el-option label="闲置超期" value="闲置超期" />
            <el-option label="未办证" value="未办证" />
            <el-option label="合同临期" value="合同临期" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="filteredList" border stripe class="table-card fill">
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTagColor(row.type)" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="group" label="集团" width="100" />
      <el-table-column prop="asset" label="资产" width="200" />
      <el-table-column prop="desc" label="预警说明" min-width="240" show-overflow-tooltip />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleSupervise(row)">下发督办</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWarningStore } from '../../store/warning'

const router = useRouter()
const warningStore = useWarningStore()
const groups = ['城投集团', '产投集团', '水投集团', '领航公司']

const warningCards = [
  { key: '欠费', label: '欠费预警', count: warningStore.warnings.arrears.total, color: '#E8912A' },
  { key: '闲置超期', label: '闲置超期', count: warningStore.warnings.idle.total, color: '#94A3B8' },
  { key: '未办证', label: '未办证', count: warningStore.warnings.uncert.total, color: '#D93026' },
  { key: '合同临期', label: '合同临期', count: warningStore.warnings.expiring.total, color: '#1668DC' }
]

const activeType = ref('')
const filterGroup = ref('')

const filteredList = computed(() => {
  return warningStore.warningList.filter(w => {
    if (activeType.value && w.type !== activeType.value) return false
    if (filterGroup.value && w.group !== filterGroup.value) return false
    return true
  })
})

function typeTagColor(type) {
  if (type === '欠费') return 'warning'
  if (type === '闲置超期') return 'info'
  if (type === '未办证') return 'danger'
  return ''
}

function handleSupervise(row) {
  router.push({ path: '/gov/supervise/create', query: { reason: row.desc, type: row.type === '欠费' ? '欠费催缴' : row.type === '闲置超期' ? '闲置盘活' : '未办证推进', group: row.group } })
}
</script>

<style scoped>
.wc-warn { border-left-color: var(--st-owing); }
.wc-idle { border-left-color: var(--st-idle); }
.wc-danger { border-left-color: var(--st-uncert); }
.wc-info { border-left-color: var(--c-primary); }

.wc-warn .warning-count { color: var(--st-owing); }
.wc-idle .warning-count { color: var(--st-idle); }
.wc-danger .warning-count { color: var(--st-uncert); }
.wc-info .warning-count { color: var(--c-primary); }
</style>
