<template>
  <div class="gov-assets">
    <div class="page-header">
      <h2>资产穿透查看（全区只读）</h2>
      <el-tag type="info">只读模式</el-tag>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="集团">
          <el-select v-model="filter.group" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="已出租" value="已出租" />
            <el-option label="闲置" value="闲置" />
            <el-option label="自用" value="自用" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="filter.keyword" placeholder="搜索资产名称/编号" clearable style="width: 200px" />
        </el-form-item>
      </el-form>
    </div>

    <div style="color: var(--t-weak); font-size: 13px">
      共 {{ filteredAssets.length }} 宗资产
    </div>

    <el-table :data="pagedAssets" border stripe class="table-card fill">
      <el-table-column prop="id" label="编号" width="90" />
      <el-table-column prop="name" label="资产名称" min-width="200" />
      <el-table-column prop="group" label="所属集团" width="110" />
      <el-table-column prop="location" label="位置" width="100" />
      <el-table-column prop="type" label="业态" width="90" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="area" label="面积㎡" width="90" align="right" />
      <el-table-column prop="bookValue" label="账面价值(万元)" width="120" align="right" />
      <el-table-column prop="certStatus" label="权证状态" width="140">
        <template #default="{ row }">
          <el-tag :type="row.certStatus.includes('已办证') ? 'success' : 'danger'" size="small">{{ row.certStatus }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="justify-content: flex-end"
      background layout="total, prev, pager, next"
      :total="filteredAssets.length"
      :page-size="pageSize"
      v-model:current-page="currentPage"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAssetStore } from '../../store/asset'

const route = useRoute()
const assetStore = useAssetStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']
// 支持从督办/预警等页面带参跳转（?keyword=CT-001&group=城投集团）
const filter = ref({
  group: route.query.group || '',
  status: route.query.status || '',
  keyword: route.query.keyword || ''
})
const currentPage = ref(1)
const pageSize = 20

// 演示数据：仅城投有明细，其他集团显示提示
const filteredAssets = computed(() => {
  let list = assetStore.assets
  if (filter.value.group) {
    list = list.filter(a => a.group === filter.value.group)
  }
  if (filter.value.status) {
    if (filter.value.status === '已出租') {
      list = list.filter(a => a.status === '已出租' || a.status === '部分出租')
    } else {
      list = list.filter(a => a.status === filter.value.status)
    }
  }
  if (filter.value.keyword) {
    const kw = filter.value.keyword.toLowerCase()
    list = list.filter(a => a.name.toLowerCase().includes(kw) || a.id.toLowerCase().includes(kw))
  }
  return list
})

const pagedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredAssets.value.slice(start, start + pageSize)
})

function statusType(status) {
  if (status === '已出租' || status === '部分出租') return 'success'
  if (status === '闲置') return 'info'
  if (status === '自用') return ''
  return 'warning'
}
</script>
