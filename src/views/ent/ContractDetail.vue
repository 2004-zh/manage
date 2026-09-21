<template>
  <div class="contract-detail" v-if="contract">
    <div class="page-header">
      <h2>合同详情 — {{ contract.id }}</h2>
      <el-button @click="$router.push('/ent/contract-approval')">返回列表</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>合同要素</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="合同编号">{{ contract.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="contract.status === '正常' ? 'success' : contract.status === '欠缴' ? 'danger' : 'warning'" size="small">{{ contract.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="资产">{{ contract.assetName }}</el-descriptions-item>
            <el-descriptions-item label="承租方">{{ contract.tenant }}</el-descriptions-item>
            <el-descriptions-item label="起始日期">{{ contract.startDate }}</el-descriptions-item>
            <el-descriptions-item label="截止日期">{{ contract.endDate }}</el-descriptions-item>
            <el-descriptions-item label="年租金">{{ contract.annualRent }} 万元</el-descriptions-item>
            <el-descriptions-item label="递增方式">{{ contract.increment }}</el-descriptions-item>
            <el-descriptions-item label="保证金">{{ contract.deposit }} 万元</el-descriptions-item>
            <el-descriptions-item label="电子合同">
              <el-tag :type="contract.electronic ? 'success' : 'info'" size="small">{{ contract.electronic ? '已签署' : '未签署' }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>缴费计划</template>
          <el-table :data="paymentPlan" border size="small">
            <el-table-column prop="period" label="期间" width="160" />
            <el-table-column prop="amount" label="应缴金额(万元)" width="130" align="right" />
            <el-table-column prop="actual" label="实缴金额(万元)" width="130" align="right" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === '已缴' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header>履约记录</template>
          <el-timeline>
            <el-timeline-item v-for="(r, idx) in 履约Records" :key="idx" :timestamp="r.time" :type="r.type" placement="top">
              {{ r.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>操作</template>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <el-button type="primary" @click="previewContract" :disabled="!contract.electronic">
              电子合同预览
            </el-button>
            <el-button v-if="contract.status === '欠缴'" type="warning" @click="handleUrge">
              一键催缴
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showPreview" title="电子合同预览" width="600px">
      <div style="border: 1px solid var(--bd); padding: 24px; min-height: 280px; background: var(--bg-page); text-align: center">
        <p style="font-size: 16px; font-weight: 600; margin-bottom: 20px">房屋租赁合同</p>
        <p style="color: var(--t-sub); line-height: 2; text-align: left; text-indent: 2em">
          甲方：城投集团<br/>
          乙方：{{ contract.tenant }}<br/>
          租赁标的：{{ contract.assetName }}<br/>
          租赁期限：{{ contract.startDate }} 至 {{ contract.endDate }}<br/>
          年租金：{{ contract.annualRent }} 万元<br/>
          保证金：{{ contract.deposit }} 万元
        </p>
        <div style="margin-top: 24px; padding: 10px; border: 2px dashed var(--c-danger); display: inline-block; color: var(--c-danger); font-size: 14px">
          电子签章（演示水印）
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContractStore } from '../../store/contract'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const contractStore = useContractStore()

const contract = computed(() => contractStore.getContractById(route.params.id))

const paymentPlan = computed(() => {
  if (!contract.value) return []
  const rent = contract.value.annualRent
  return [
    { period: '2026-01 至 2026-06', amount: (rent / 2).toFixed(1), actual: contract.value.status === '欠缴' ? (rent / 2 - contract.value.arrears).toFixed(1) : (rent / 2).toFixed(1), status: contract.value.status === '欠缴' ? '欠缴' : '已缴' },
    { period: '2026-07 至 2026-12', amount: (rent / 2).toFixed(1), actual: '0', status: '待缴' }
  ]
})

const baseRecords = computed(() => {
  if (!contract.value) return []
  if (contract.value.status === '欠缴') {
    return [
      { time: '2026-08-01', content: '租金应缴 21 万元', type: 'primary' },
      { time: '2026-08-05', content: `实收 ${(21 - contract.value.arrears).toFixed(1)} 万元，欠缴 ${contract.value.arrears} 万元`, type: 'danger' },
      { time: '2026-08-20', content: '发送催缴通知', type: 'warning' }
    ]
  }
  return [
    { time: contract.value.startDate, content: '合同生效', type: 'primary' },
    { time: '2026-06-30', content: '上半年租金已缴清', type: 'success' }
  ]
})

const extraRecords = ref([])
const 履约Records = computed(() => [...baseRecords.value, ...extraRecords.value])

const showPreview = ref(false)

function previewContract() {
  showPreview.value = true
}

function handleUrge() {
  ElMessageBox.confirm(`确认向 ${contract.value.tenant} 发送催缴通知？`, '一键催缴', {
    type: 'warning',
    confirmButtonText: '确认发送',
    cancelButtonText: '取消'
  }).then(() => {
    extraRecords.value.push({
      time: new Date().toISOString().slice(0, 10),
      content: '发送催缴通知',
      type: 'warning'
    })
    ElMessage.success('催缴通知已发送')
  }).catch(() => {})
}
</script>
