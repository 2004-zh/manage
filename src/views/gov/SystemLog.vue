<template>
  <div>
    <div class="page-header"><h2>操作日志</h2></div>
    <el-table :data="logs" border stripe size="small">
      <el-table-column prop="time" label="时间" width="180" />
      <el-table-column prop="user" label="操作人" width="140" />
      <el-table-column prop="org" label="组织" width="120" />
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="action" label="操作内容" />
      <el-table-column prop="ip" label="IP" width="140" />
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const logs = ref([
  { time: '2026-09-15 09:30:12', user: '林××', org: '国资中心', module: '督办管理', action: '发起督办 DB-2026-014', ip: '192.168.1.100' },
  { time: '2026-09-15 09:15:45', user: '陈××', org: '城投集团', module: '资产台账', action: '修改 CT-005 状态为闲置', ip: '192.168.1.50' },
  { time: '2026-09-14 16:45:30', user: '陈××', org: '城投集团', module: '数据报送', action: '提交 2026 年度报表', ip: '192.168.1.50' },
  { time: '2026-09-14 14:20:18', user: '林××', org: '国资中心', module: '报表管理', action: '导出固定资产情况表（全部）', ip: '192.168.1.100' },
  { time: '2026-09-14 10:30:00', user: '林××', org: '国资中心', module: '督办管理', action: '确认办结 DB-2026-005', ip: '192.168.1.100' },
  { time: '2026-09-13 15:00:22', user: '陈××', org: '城投集团', module: '收费管理', action: '一键催缴 HT-2023-018', ip: '192.168.1.50' }
])
</script>
