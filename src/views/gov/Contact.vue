<template>
  <div class="gov-contact">
    <div class="page-header">
      <h2>企业联络</h2>
    </div>

    <div class="grid-4">
      <el-card v-for="c in superviseStore.contacts" :key="c.group" class="contact-card" shadow="hover">
        <div class="contact-header">
          <el-icon :size="32" color="var(--c-primary)"><OfficeBuilding /></el-icon>
          <h3>{{ c.group }}</h3>
        </div>
        <el-descriptions :column="1" size="small" style="margin-top: 16px">
          <el-descriptions-item label="对接人">{{ c.contact }}</el-descriptions-item>
          <el-descriptions-item label="职务">{{ c.title }}</el-descriptions-item>
          <el-descriptions-item label="手机">
            {{ c.phone }}
            <el-button type="primary" link size="small" @click="copyText(c.phone, '手机号已复制')">复制</el-button>
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ c.email }}
            <el-button type="primary" link size="small" @click="copyText(c.email, '邮箱已复制')">复制</el-button>
          </el-descriptions-item>
          <el-descriptions-item label="地址">{{ c.address }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { useSuperviseStore } from '../../store/supervise'
import { ElMessage } from 'element-plus'
import { OfficeBuilding } from '@element-plus/icons-vue'

const superviseStore = useSuperviseStore()

function copyText(text, msg) {
  navigator.clipboard?.writeText(text)
  ElMessage.success(msg)
}
</script>

<style scoped>
.contact-card {
  text-align: center;
}

.contact-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.contact-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--t-main);
}
</style>
