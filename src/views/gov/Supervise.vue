<template>
  <div class="gov-supervise">
    <div class="page-header">
      <h2>督办管理</h2>
      <el-button type="primary" @click="$router.push('/gov/supervise/create')">
        <el-icon><Plus /></el-icon> 新建督办
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width: 140px">
            <el-option label="待处理" value="待处理" />
            <el-option label="处理中" value="待确认" />
            <el-option label="已办结" value="已办结" />
          </el-select>
        </el-form-item>
        <el-form-item label="集团">
          <el-select v-model="filter.group" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="filteredList" border stripe class="table-card">
      <el-table-column prop="id" label="督办编号" width="140" />
      <el-table-column prop="group" label="督办对象" width="120" />
      <el-table-column prop="type" label="督办类型" width="120" />
      <el-table-column prop="reason" label="督办事由" min-width="240" show-overflow-tooltip />
      <el-table-column prop="deadline" label="限期" width="110" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button type="primary" link @click="$router.push(`/gov/supervise/${row.id}`)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSuperviseStore } from '../../store/supervise'
import { Plus } from '@element-plus/icons-vue'

const superviseStore = useSuperviseStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']

const filter = ref({ status: '', group: '' })

const filteredList = computed(() => {
  return superviseStore.orders.filter(o => {
    if (filter.value.status && o.status !== filter.value.status) return false
    if (filter.value.group && o.group !== filter.value.group) return false
    return true
  })
})

function statusType(status) {
  if (status === '待处理') return 'warning'
  if (status === '待确认') return ''
  if (status === '已办结') return 'success'
  return 'info'
}

function resetFilter() {
  filter.value = { status: '', group: '' }
}
</script>
