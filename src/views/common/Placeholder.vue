<template>
  <div class="placeholder-page fill">
    <div class="placeholder-content">
      <el-icon :size="64" color="var(--t-weak)"><InfoFilled /></el-icon>
      <h2>{{ moduleName }}</h2>
      <p class="placeholder-desc">{{ moduleDesc }}</p>
      <el-tag type="info" size="large" effect="plain">该模块属完整产品版能力，本期原型未展开</el-tag>
      <p class="placeholder-hint">完整产品版具备此功能，本期按监管核心诉求先做穿透演示，后续可按需扩展。</p>
      <el-button type="primary" @click="$router.back()">返回上一页</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { InfoFilled } from '@element-plus/icons-vue'

const route = useRoute()

const moduleMap = {
  'asset-map': { name: '资产地图', desc: '资产空间分布、地图打点、状态着色、可视化分布' },
  'valuation': { name: '资产评估', desc: '评估记录、评估价值登记与更新' },
  'inventory': { name: '资产盘点', desc: '盘点计划与盘点结果记录' },
  'invoice': { name: '数电发票/缴费', desc: '电子发票、多渠道缴费、开票记录' },
  'repair': { name: '巡检/报修', desc: '报事报修、安全巡检、维修整改、处理流转' },
  'finance': { name: '业财一体', desc: '资产生命周期台账、台账与核算、收支数据同步' },
  'log': { name: '操作日志', desc: '关键操作留痕，协同工作、权限清晰、责任挂钩' }
}

const moduleName = computed(() => {
  const m = route.query.m
  return (m && moduleMap[m]?.name) || route.meta.title || '功能模块'
})

const moduleDesc = computed(() => {
  const m = route.query.m
  return (m && moduleMap[m]?.desc) || '该功能正在规划中'
})
</script>

<style scoped>
.placeholder-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.placeholder-content {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  text-align: center;
  background: var(--bg-card);
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 32px 24px;
}

.placeholder-content h2 {
  font-size: 20px;
  color: var(--t-main);
  margin: 16px 0 8px;
}

.placeholder-desc {
  font-size: 14px;
  color: var(--t-sub);
  margin-bottom: 16px;
}

.placeholder-hint {
  font-size: 13px;
  color: var(--t-weak);
  margin: 16px 0;
  line-height: 1.6;
}
</style>
