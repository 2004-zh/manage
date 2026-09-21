<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资产处置</h2>
      <el-button type="primary" @click="showCreate = true">发起处置</el-button>
    </div>

    <div class="stat-strip">
      <div class="stat-item">
        <div class="stat-value">{{ records.length }}<span class="unit">件</span></div>
        <div class="stat-label">处置申请总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ totalAssetCount }}<span class="unit">宗</span></div>
        <div class="stat-label">处置资产总宗数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ finishedCount }}<span class="unit">/ {{ finishedZong }}宗</span></div>
        <div class="stat-label">处置完成数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ pendingDisposeCount }}<span class="unit">/ {{ pendingDisposeZong }}宗</span></div>
        <div class="stat-label">待处置数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ totalValue }}<span class="unit">万元</span></div>
        <div class="stat-label">处置总金额</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ yearValue }}<span class="unit">万元</span></div>
        <div class="stat-label">本年处置金额</div>
      </div>
    </div>

    <div class="grid-4">
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-value">{{ records.length }}</div>
        <div class="kpi-label">处置总数</div>
      </el-card>
      <el-card shadow="never" class="kpi-card" style="border-left:3px solid var(--c-warning)">
        <div class="kpi-value">{{ records.filter(r => r.status === '待审批').length }}</div>
        <div class="kpi-label">待审批</div>
      </el-card>
      <el-card shadow="never" class="kpi-card" style="border-left:3px solid var(--c-success)">
        <div class="kpi-value">{{ records.filter(r => r.status === '已完成').length }}</div>
        <div class="kpi-label">已完成</div>
      </el-card>
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-value">{{ totalValue }}<span style="font-size:14px;font-weight:normal">万</span></div>
        <div class="kpi-label">处置总金额</div>
      </el-card>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="处置申请" name="list">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>处置记录</span>
              <div>
                <el-select v-model="methodFilter" placeholder="处置方式" clearable size="small" style="width:120px;margin-right:8px">
                  <el-option label="出售" value="出售" />
                  <el-option label="转让" value="转让" />
                  <el-option label="报废" value="报废" />
                  <el-option label="其他" value="其他" />
                </el-select>
                <el-select v-model="statusFilter" placeholder="状态" clearable size="small" style="width:120px">
                  <el-option label="待审批" value="待审批" />
                  <el-option label="已通过" value="已通过" />
                  <el-option label="已完成" value="已完成" />
                  <el-option label="已驳回" value="已驳回" />
                </el-select>
              </div>
            </div>
          </template>

          <div style="display:flex;align-items:center;margin-bottom:8px">
            <el-button type="primary" @click="showDisposeSave()">新增</el-button>
            <div class="icon-toolbar">
              <el-tooltip content="刷新" placement="top">
                <el-button :icon="Refresh" circle size="small" @click="handleRefresh" />
              </el-tooltip>
              <el-tooltip content="筛选" placement="top">
                <el-button :icon="Filter" circle size="small" @click="showFilterChips = !showFilterChips" />
              </el-tooltip>
            </div>
          </div>

          <div v-if="showFilterChips" class="chip-row">
            <span class="chip-label">处置状态</span>
            <span class="chip" :class="{ on: !disposeStatusFilter }" @click="disposeStatusFilter = ''">全部</span>
            <span v-for="s in disposeStatusOptions" :key="s" class="chip" :class="{ on: disposeStatusFilter === s }" @click="disposeStatusFilter = s">{{ s }}</span>
          </div>

          <el-table :data="pagedRecords" border stripe show-summary :summary-method="getSummary">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid" style="margin-bottom:12px">
                    <div class="cell"><div class="label">项目类型</div><div class="value">{{ row.projectType }}</div></div>
                    <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                    <div class="cell"><div class="label">账面价值</div><div class="value">{{ row.bookValue }} 万元</div></div>
                    <div class="cell"><div class="label">处置时间</div><div class="value">{{ row.disposeDate }}</div></div>
                    <div class="cell"><div class="label">处置人</div><div class="value">{{ row.disposePerson }}</div></div>
                    <div class="cell"><div class="label">申请人</div><div class="value">{{ row.applicant }}</div></div>
                    <div class="cell"><div class="label">申请日期</div><div class="value">{{ row.applyDate }}</div></div>
                    <div class="cell"><div class="label">创建时间</div><div class="value">{{ row.createdAt }}</div></div>
                    <div class="cell"><div class="label">更新时间</div><div class="value">{{ row.updatedAt }}</div></div>
                  </div>
                  <div class="section-title">处置资产明细</div>
                  <el-table :data="row.assets" border stripe size="small">
                    <el-table-column prop="assetNo" label="资产编号" width="140" />
                    <el-table-column prop="assetName" label="资产名称" min-width="200" />
                    <el-table-column prop="disposeType" label="处置类型" width="120" />
                    <el-table-column prop="amount" label="金额(万元)" width="120" align="right" />
                    <template #empty>
                      <el-empty description="暂无处置资产明细" :image-size="50" />
                    </template>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="disposeNo" label="处置编号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="method" label="处置方式" width="90" />
            <el-table-column prop="disposeValue" label="处置金额(万)" width="110" align="right" />
            <el-table-column label="审批进度" width="80" align="center">
              <template #default="{ row }">
                <span style="color:var(--c-primary)">{{ row.approvalLevel }}/{{ row.totalLevels }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="85">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="disposeStatus" label="处置状态" width="85">
              <template #default="{ row }">
                <el-tag :type="disposeStatusType(row.disposeStatus)" size="small">{{ row.disposeStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
                <el-button type="primary" link size="small" @click="showDisposeSave(row)">修改</el-button>
                <el-dropdown style="margin-left:8px" @command="cmd => handleRowCommand(cmd, row)">
                  <el-button type="primary" link size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="flow">审批流</el-dropdown-item>
                      <el-dropdown-item command="cancel">取消处置</el-dropdown-item>
                      <el-dropdown-item command="finish">标记完成</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 15, 20, 50]"
              :total="filteredRecords.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="page = 1"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="审批流程" name="flow">
        <el-card shadow="never" style="margin-bottom:16px">
          <template #header><span>审批规则配置</span></template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="一级审批（部门经理）">所有处置申请均需部门经理审批</el-descriptions-item>
            <el-descriptions-item label="二级审批（分管领导）">处置金额 ≥ 50万元 需分管领导审批</el-descriptions-item>
            <el-descriptions-item label="三级审批（总经理）">处置金额 ≥ 200万元 需总经理审批</el-descriptions-item>
            <el-descriptions-item label="四级备案（国资中心）">处置金额 ≥ 500万元 需报国资中心备案</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>待我审批</span>
              <el-badge :value="pendingApprovalCount" type="warning" />
            </div>
          </template>
          <el-table :data="pagedPendingApprovals" border stripe>
            <el-table-column prop="disposeNo" label="处置编号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="method" label="处置方式" width="90" />
            <el-table-column prop="disposeValue" label="处置金额(万)" width="110" align="right" />
            <el-table-column prop="applicant" label="申请人" width="90" />
            <el-table-column label="当前审批级" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.currentLevelName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link size="small" @click="approveItem(row)">通过</el-button>
                <el-button type="danger" link size="small" @click="rejectItem(row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="pendingPage"
              v-model:page-size="pendingPageSize"
              :page-sizes="[10, 15, 20, 50]"
              :total="pendingApprovals.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="pendingPage = 1"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="审批记录" name="history">
        <el-table :data="pagedHistory" border stripe>
          <el-table-column prop="disposeNo" label="处置编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="levelName" label="审批级别" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ row.levelName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approver" label="审批人" width="90" />
          <el-table-column label="审批结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.result === '通过' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="approveDate" label="审批时间" width="150" />
          <el-table-column prop="comment" label="审批意见" min-width="180" show-overflow-tooltip />
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="historyPage"
            v-model:page-size="historyPageSize"
            :page-sizes="[10, 15, 20, 50]"
            :total="approvalHistory.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="historyPage = 1"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 发起处置 -->
    <el-dialog v-model="showCreate" title="发起资产处置" width="650px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="处置资产" required>
          <el-select v-model="createForm.assetId" placeholder="选择资产" style="width:100%" filterable>
            <el-option v-for="a in assetOptions" :key="a.id" :label="`${a.name} (${a.bookValue}万)`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置方式" required>
          <el-select v-model="createForm.method" style="width:100%">
            <el-option label="出售" value="出售" />
            <el-option label="转让" value="转让" />
            <el-option label="报废" value="报废" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置金额(万)" required>
          <el-input-number v-model="createForm.disposeValue" :min="0" :step="10" style="width:100%" />
        </el-form-item>
        <el-form-item label="评估机构">
          <el-input v-model="createForm.assessor" placeholder="资产评估机构名称（可选）" />
        </el-form-item>
        <el-form-item label="处置原因" required>
          <el-input v-model="createForm.reason" type="textarea" :rows="3" placeholder="请说明处置原因..." />
        </el-form-item>
        <el-form-item label="附件材料">
          <el-upload action="#" :auto-upload="false" :limit="5">
            <el-button size="small" type="primary">上传附件</el-button>
            <template #tip>
              <div style="color:var(--t-weak);font-size:12px">支持上传评估报告、技术鉴定等材料，最多5个文件</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-alert :title="approvalLevelHint" type="info" :closable="false" show-icon />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 保存处置记录对话框 -->
    <el-dialog v-model="disposeSaveVisible" :title="disposeEditRow ? '修改处置记录' : '保存处置记录'" width="680px" destroy-on-close>
      <el-form :model="disposeForm" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="所属公司">
              <el-select v-model="disposeForm.company" placeholder="请选择所属公司" style="width:100%">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型">
              <el-select v-model="disposeForm.projectType" placeholder="请选择项目类型" style="width:100%">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="分区产权" value="分区产权" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产">
              <el-select v-model="disposeForm.assetId" placeholder="请选择资产" style="width:100%" filterable>
                <el-option v-for="a in assetOptions" :key="a.id" :label="`${a.name} (${a.bookValue}万)`" :value="a.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处置类型">
              <el-select v-model="disposeForm.method" placeholder="请选择处置类型" style="width:100%">
                <el-option label="出售" value="出售" />
                <el-option label="转让" value="转让" />
                <el-option label="报废" value="报废" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="处置人">
              <el-select v-model="disposeForm.disposePerson" placeholder="请选择处置人" style="width:100%">
                <el-option v-for="p in personOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="金额(万元)">
              <el-input-number v-model="disposeForm.disposeValue" :min="0" :step="10" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="处置日期">
              <el-date-picker v-model="disposeForm.disposeDate" type="date" placeholder="请选择处置日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="disposeForm.remark" type="textarea" :rows="3" maxlength="250" show-word-limit placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" list-type="picture-card" :limit="5">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disposeSaveVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDisposeSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审批流详情 -->
    <el-drawer v-model="showFlowDrawer" title="审批流程" size="600px">
      <template v-if="currentFlowRecord">
        <el-descriptions :column="1" border style="margin-bottom:20px">
          <el-descriptions-item label="处置编号">{{ currentFlowRecord.disposeNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentFlowRecord.assetName }}</el-descriptions-item>
          <el-descriptions-item label="处置金额">{{ currentFlowRecord.disposeValue }} 万元</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusType(currentFlowRecord.status)" size="small">{{ currentFlowRecord.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-bottom:12px">审批流程</h4>
        <el-steps :active="currentFlowRecord.approvalLevel" align-center direction="vertical" style="margin-bottom:20px">
          <el-step v-for="(step, idx) in currentFlowRecord.approvalSteps" :key="idx"
            :title="step.levelName"
            :description="step.approver ? `${step.approver} · ${step.date || '待审批'}` : '待审批'"
            :status="step.result === '通过' ? 'finish' : step.result === '驳回' ? 'error' : step.isActive ? 'process' : 'wait'"
          />
        </el-steps>

        <h4 style="margin-bottom:12px">审批记录</h4>
        <el-timeline>
          <el-timeline-item v-for="(log, idx) in currentFlowRecord.approvalLogs" :key="idx"
            :timestamp="log.date"
            :type="log.result === '通过' ? 'success' : log.result === '驳回' ? 'danger' : 'primary'"
          >
            <strong>{{ log.approver }}</strong>（{{ log.levelName }}）{{ log.result }}
            <p v-if="log.comment" style="color:var(--t-sub);margin:4px 0 0">{{ log.comment }}</p>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <!-- 处置详情 -->
    <el-drawer v-model="showDetailDrawer" title="处置详情" size="550px">
      <template v-if="currentRecord">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="处置编号">{{ currentRecord.disposeNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentRecord.assetName }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ currentRecord.projectType }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ currentRecord.company }}</el-descriptions-item>
          <el-descriptions-item label="处置方式">{{ currentRecord.method }}</el-descriptions-item>
          <el-descriptions-item label="账面价值">{{ currentRecord.bookValue }} 万元</el-descriptions-item>
          <el-descriptions-item label="处置金额">{{ currentRecord.disposeValue }} 万元</el-descriptions-item>
          <el-descriptions-item label="处置时间">{{ currentRecord.disposeDate }}</el-descriptions-item>
          <el-descriptions-item label="处置人">{{ currentRecord.disposePerson }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentRecord.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ currentRecord.applyDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentRecord.status)" size="small">{{ currentRecord.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处置状态">
            <el-tag :type="disposeStatusType(currentRecord.disposeStatus)" size="small">{{ currentRecord.disposeStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批进度">{{ currentRecord.approvalLevel }}/{{ currentRecord.totalLevels }}</el-descriptions-item>
          <el-descriptions-item label="处置原因">{{ currentRecord.reason }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRecord.remark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentRecord.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentRecord.updatedAt }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 审批操作弹窗 -->
    <el-dialog v-model="showApproveDialog" :title="approveAction === 'approve' ? '审批通过' : '审批驳回'" width="480px">
      <el-form label-width="80px">
        <el-form-item label="处置编号">{{ approveRow?.disposeNo }}</el-form-item>
        <el-form-item label="资产名称">{{ approveRow?.assetName }}</el-form-item>
        <el-form-item label="处置金额">{{ approveRow?.disposeValue }} 万元</el-form-item>
        <el-form-item label="审批级别">
          <el-tag type="warning" size="small">{{ approveRow?.currentLevelName }}</el-tag>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveComment" type="textarea" :rows="3" placeholder="请输入审批意见..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button :type="approveAction === 'approve' ? 'success' : 'danger'" @click="submitApproval">{{ approveAction === 'approve' ? '确认通过' : '确认驳回' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Filter, Plus, MoreFilled } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useUserStore } from '../../store/user'
import { useControlStore } from '../../store/control'

const assetStore = useAssetStore()
const userStore = useUserStore()
const controlStore = useControlStore()
const currentCompany = computed(() => userStore.user?.org || '城投集团')

function assertDisposalAllowed(assetId) {
  const { ok, reasons } = controlStore.canDispose(assetId)
  if (ok) return true
  ElMessageBox.alert(reasons.map(r => `· ${r}`).join('<br/>'), '该资产不可处置', {
    type: 'warning', dangerouslyUseHTMLString: true
  })
  return false
}

const activeTab = ref('list')
const methodFilter = ref('')
const statusFilter = ref('')
const disposeStatusFilter = ref('')
const disposeStatusOptions = ['取消', '进行中', '完成']
const showFilterChips = ref(false)
const showCreate = ref(false)
const showDetailDrawer = ref(false)
const showFlowDrawer = ref(false)
const currentRecord = ref(null)
const currentFlowRecord = ref(null)

const page = ref(1)
const pageSize = ref(15)
const pendingPage = ref(1)
const pendingPageSize = ref(15)
const historyPage = ref(1)
const historyPageSize = ref(15)

const companyOptions = computed(() => [userStore.user?.org || '城投集团'])
const personOptions = ['张三', '李四', '王五', '赵六', '当前用户']

const createForm = ref({
  assetId: '', method: '出售', disposeValue: 0, reason: '', remark: '', assessor: ''
})

// 处置候选直接取台账资产，企业端天然只有本公司名下资产
const assetOptions = computed(() =>
  assetStore.visibleAssets
    .filter(a => a.status !== '已处置')
    .map(a => ({ id: a.id, name: a.name, bookValue: Math.round(a.bookValue || 0) }))
)

function getApprovalLevels(value) {
  if (value >= 500) return { total: 4, levels: ['部门经理', '分管领导', '总经理', '国资中心备案'] }
  if (value >= 200) return { total: 3, levels: ['部门经理', '分管领导', '总经理'] }
  if (value >= 50) return { total: 2, levels: ['部门经理', '分管领导'] }
  return { total: 1, levels: ['部门经理'] }
}

const approvalLevelHint = computed(() => {
  const val = createForm.value.disposeValue
  if (!val || val <= 0) return '请填写处置金额以查看审批级别'
  const { total, levels } = getApprovalLevels(val)
  return `根据处置金额 ${val} 万元，需经过 ${total} 级审批：${levels.join(' → ')}`
})

function buildApprovalSteps(value) {
  const { total, levels } = getApprovalLevels(value)
  const approvers = ['王建国（部门经理）', '陈志明（分管领导）', '刘大伟（总经理）', '国资中心']
  return levels.map((name, idx) => ({
    levelName: `${name}审批`,
    approver: idx < total ? approvers[idx] : '',
    date: '',
    result: '',
    isActive: idx === 0
  }))
}

const records = ref([
  {
    id: 1, disposeNo: 'CZ-2026-001', assetName: '旧办公楼设备', method: '报废', bookValue: 25, disposeValue: 5,
    applicant: '张三', applyDate: '2026-03-20', status: '已完成', reason: '设备老化无法使用', remark: '',
    projectType: '资产产权', company: '城投集团', disposeDate: '2026-03-25', disposePerson: '张三',
    createdAt: '2026-03-20 09:10', updatedAt: '2026-03-25 16:00', disposeStatus: '完成',
    assets: [
      { assetNo: 'CT-101', assetName: '旧办公楼中央空调机组', disposeType: '报废', amount: 3 },
      { assetNo: 'CT-102', assetName: '旧办公楼电梯设备', disposeType: '报废', amount: 2 }
    ],
    approvalLevel: 1, totalLevels: 1,
    approvalSteps: [{ levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-03-21', result: '通过', isActive: false }],
    approvalLogs: [{ levelName: '部门经理审批', approver: '王建国', date: '2026-03-21 09:30', result: '通过', comment: '设备确实已无法使用，同意报废' }]
  },
  {
    id: 2, disposeNo: 'CZ-2026-002', assetName: '城关旧厂房1#', method: '出售', bookValue: 280, disposeValue: 320,
    applicant: '李四', applyDate: '2026-03-15', status: '已通过', reason: '闲置资产盘活', remark: '已通过公开竞价出售',
    projectType: '资产产权', company: '城投集团', disposeDate: '2026-03-28', disposePerson: '李四',
    createdAt: '2026-03-15 10:20', updatedAt: '2026-03-28 11:30', disposeStatus: '完成',
    assets: [
      { assetNo: 'CT-001', assetName: '城关旧厂房1#主体', disposeType: '出售', amount: 280 },
      { assetNo: 'CT-002', assetName: '城关旧厂房1#附属仓库', disposeType: '出售', amount: 40 }
    ],
    approvalLevel: 3, totalLevels: 3,
    approvalSteps: [
      { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-03-16', result: '通过', isActive: false },
      { levelName: '分管领导审批', approver: '陈志明（分管领导）', date: '2026-03-17', result: '通过', isActive: false },
      { levelName: '总经理审批', approver: '刘大伟（总经理）', date: '2026-03-18', result: '通过', isActive: false },
    ],
    approvalLogs: [
      { levelName: '部门经理审批', approver: '王建国', date: '2026-03-16 10:00', result: '通过', comment: '同意出售，建议公开竞价' },
      { levelName: '分管领导审批', approver: '陈志明', date: '2026-03-17 14:20', result: '通过', comment: '金额合理，同意' },
      { levelName: '总经理审批', approver: '刘大伟', date: '2026-03-18 09:15', result: '通过', comment: '批准出售，请做好资产评估' },
    ]
  },
  {
    id: 3, disposeNo: 'CZ-2026-003', assetName: '运输车辆', method: '转让', bookValue: 45, disposeValue: 38,
    applicant: '张三', applyDate: '2026-03-10', status: '待审批', reason: '车辆更新换代', remark: '',
    projectType: '分区产权', company: '产投集团', disposeDate: '2026-03-30', disposePerson: '王五',
    createdAt: '2026-03-10 08:45', updatedAt: '2026-03-10 08:45', disposeStatus: '进行中',
    assets: [
      { assetNo: 'CT-061', assetName: '货运车辆闽A·D1234', disposeType: '转让', amount: 25 },
      { assetNo: 'CT-062', assetName: '商务车辆闽A·D5678', disposeType: '转让', amount: 13 }
    ],
    approvalLevel: 1, totalLevels: 2,
    approvalSteps: [
      { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '', result: '', isActive: true },
      { levelName: '分管领导审批', approver: '陈志明（分管领导）', date: '', result: '', isActive: false },
    ],
    approvalLogs: []
  },
  {
    id: 4, disposeNo: 'CZ-2026-004', assetName: '旧空调设备', method: '报废', bookValue: 12, disposeValue: 2,
    applicant: '李四', applyDate: '2026-03-05', status: '已驳回', reason: '达到使用年限', remark: '需提供技术鉴定报告',
    projectType: '资产产权', company: '水投集团', disposeDate: '2026-03-15', disposePerson: '李四',
    createdAt: '2026-03-05 15:00', updatedAt: '2026-03-06 11:00', disposeStatus: '取消',
    assets: [
      { assetNo: 'CT-071', assetName: '旧空调设备一批', disposeType: '报废', amount: 2 }
    ],
    approvalLevel: 1, totalLevels: 1,
    approvalSteps: [
      { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-03-06', result: '驳回', isActive: false },
    ],
    approvalLogs: [
      { levelName: '部门经理审批', approver: '王建国', date: '2026-03-06 11:00', result: '驳回', comment: '请提供技术鉴定报告后再申请' },
    ]
  },
  {
    id: 5, disposeNo: 'CZ-2026-005', assetName: '江田农贸市场2#', method: '出售', bookValue: 560, disposeValue: 680,
    applicant: '王五', applyDate: '2026-04-01', status: '待审批', reason: '市场经营不善，整体出售', remark: '已委托评估机构评估',
    projectType: '分区产权', company: '领航公司', disposeDate: '2026-04-30', disposePerson: '赵六',
    createdAt: '2026-04-01 09:30', updatedAt: '2026-04-02 09:00', disposeStatus: '进行中',
    assets: [
      { assetNo: 'CT-055', assetName: '江田农贸市场2#主体', disposeType: '出售', amount: 600 },
      { assetNo: 'CT-056', assetName: '江田农贸市场2#停车场', disposeType: '出售', amount: 80 }
    ],
    approvalLevel: 2, totalLevels: 4,
    approvalSteps: [
      { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-04-02', result: '通过', isActive: false },
      { levelName: '分管领导审批', approver: '陈志明（分管领导）', date: '', result: '', isActive: true },
      { levelName: '总经理审批', approver: '刘大伟（总经理）', date: '', result: '', isActive: false },
      { levelName: '国资中心备案', approver: '国资中心', date: '', result: '', isActive: false },
    ],
    approvalLogs: [
      { levelName: '部门经理审批', approver: '王建国', date: '2026-04-02 09:00', result: '通过', comment: '同意出售，金额较大，请逐级审批' },
    ]
  },
])

// 处置记录按登录公司隔离；新增/审批仍写回原始 records
const myRecords = computed(() => userStore.isEnt ? records.value.filter(r => r.company === currentCompany.value) : records.value)

const totalValue = computed(() => myRecords.value.reduce((sum, r) => sum + (r.disposeValue || 0), 0))
const totalAssetCount = computed(() => myRecords.value.reduce((sum, r) => sum + (r.assets ? r.assets.length : 0), 0))
const finishedRecords = computed(() => myRecords.value.filter(r => r.disposeStatus === '完成'))
const finishedCount = computed(() => finishedRecords.value.length)
const finishedZong = computed(() => finishedRecords.value.reduce((sum, r) => sum + (r.assets ? r.assets.length : 0), 0))
const pendingDisposeRecords = computed(() => myRecords.value.filter(r => r.disposeStatus === '进行中'))
const pendingDisposeCount = computed(() => pendingDisposeRecords.value.length)
const pendingDisposeZong = computed(() => pendingDisposeRecords.value.reduce((sum, r) => sum + (r.assets ? r.assets.length : 0), 0))
const currentYear = String(new Date().getFullYear())
const yearValue = computed(() => myRecords.value
  .filter(r => (r.disposeDate || '').startsWith(currentYear))
  .reduce((sum, r) => sum + (r.disposeValue || 0), 0))

const filteredRecords = computed(() => {
  let result = myRecords.value
  if (methodFilter.value) result = result.filter(r => r.method === methodFilter.value)
  if (statusFilter.value) result = result.filter(r => r.status === statusFilter.value)
  if (disposeStatusFilter.value) result = result.filter(r => r.disposeStatus === disposeStatusFilter.value)
  return result
})

const pagedRecords = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRecords.value.slice(start, start + pageSize.value)
})

function statusType(status) {
  if (status === '已完成' || status === '已通过') return 'success'
  if (status === '已驳回') return 'danger'
  return 'warning'
}

function disposeStatusType(status) {
  const map = { '完成': 'success', '进行中': 'warning', '取消': 'info' }
  return map[status] || 'info'
}

const getSummary = ({ columns, data }) => {
  return columns.map((col, i) => {
    if (i === 1) return '合计'
    if (['bookValue', 'disposeValue'].includes(col.property)) {
      return data.reduce((s, r) => s + (r[col.property] || 0), 0)
    }
    return ''
  })
}

function viewDetail(row) {
  currentRecord.value = row
  showDetailDrawer.value = true
}

function viewApprovalFlow(row) {
  currentFlowRecord.value = row
  showFlowDrawer.value = true
}

function handleRefresh() {
  page.value = 1
  ElMessage.success('列表已刷新')
}

// 待审批
const pendingApprovals = computed(() => {
  return myRecords.value.filter(r => r.status === '待审批' && r.approvalSteps.some(s => s.isActive))
})

const pendingApprovalCount = computed(() => pendingApprovals.value.length)

const pagedPendingApprovals = computed(() => {
  const start = (pendingPage.value - 1) * pendingPageSize.value
  return pendingApprovals.value.slice(start, start + pendingPageSize.value)
})

// 审批操作
const showApproveDialog = ref(false)
const approveRow = ref(null)
const approveAction = ref('approve')
const approveComment = ref('')

function approveItem(row) {
  approveRow.value = row
  approveAction.value = 'approve'
  approveComment.value = ''
  showApproveDialog.value = true
}

function rejectItem(row) {
  approveRow.value = row
  approveAction.value = 'reject'
  approveComment.value = ''
  showApproveDialog.value = true
}

function submitApproval() {
  if (!approveComment.value) {
    ElMessage.warning('请填写审批意见')
    return
  }
  const row = approveRow.value
  const activeStep = row.approvalSteps.find(s => s.isActive)
  const now = new Date().toLocaleString('zh-CN')

  if (approveAction.value === 'approve') {
    activeStep.result = '通过'
    activeStep.date = now.slice(0, 10)
    activeStep.isActive = false
    row.approvalLogs.push({
      levelName: activeStep.levelName,
      approver: activeStep.approver.split('（')[0],
      date: now,
      result: '通过',
      comment: approveComment.value
    })

    const nextStep = row.approvalSteps.find(s => !s.result && s !== activeStep)
    if (nextStep) {
      nextStep.isActive = true
      row.approvalLevel++
      ElMessage.success('审批通过，已流转至下一级审批人')
    } else {
      row.status = '已通过'
      ElMessage.success('所有审批级别已通过')
    }
  } else {
    activeStep.result = '驳回'
    activeStep.date = now.slice(0, 10)
    activeStep.isActive = false
    row.status = '已驳回'
    row.approvalLogs.push({
      levelName: activeStep.levelName,
      approver: activeStep.approver.split('（')[0],
      date: now,
      result: '驳回',
      comment: approveComment.value
    })
    ElMessage.warning('已驳回')
  }

  row.updatedAt = now
  showApproveDialog.value = false
}

// 审批记录
const approvalHistory = computed(() => {
  const all = []
  records.value.forEach(r => {
    r.approvalLogs.forEach(log => {
      all.push({
        disposeNo: r.disposeNo,
        assetName: r.assetName,
        levelName: log.levelName,
        approver: log.approver,
        result: log.result,
        approveDate: log.date,
        comment: log.comment
      })
    })
  })
  return all.sort((a, b) => (b.approveDate || '').localeCompare(a.approveDate || ''))
})

const pagedHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize.value
  return approvalHistory.value.slice(start, start + historyPageSize.value)
})

// 新增
function handleCreate() {
  if (!createForm.value.assetId || !createForm.value.reason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (!assertDisposalAllowed(createForm.value.assetId)) return
  const asset = assetOptions.value.find(a => a.id === createForm.value.assetId)
  const { total } = getApprovalLevels(createForm.value.disposeValue)
  const steps = buildApprovalSteps(createForm.value.disposeValue)
  const now = new Date().toLocaleString('zh-CN')

  records.value.unshift({
    id: records.value.length + 1,
    disposeNo: `CZ-${new Date().getFullYear()}-${String(records.value.length + 1).padStart(3, '0')}`,
    assetName: asset ? asset.name : createForm.value.assetId,
    method: createForm.value.method,
    bookValue: asset ? asset.bookValue : 0,
    disposeValue: createForm.value.disposeValue,
    applicant: '当前用户',
    applyDate: new Date().toISOString().slice(0, 10),
    status: '待审批',
    reason: createForm.value.reason,
    remark: createForm.value.remark,
    projectType: '资产产权',
    company: currentCompany.value,
    disposeDate: new Date().toISOString().slice(0, 10),
    disposePerson: '当前用户',
    createdAt: now,
    updatedAt: now,
    disposeStatus: '进行中',
    assets: [{ assetNo: asset ? asset.id : createForm.value.assetId, assetName: asset ? asset.name : createForm.value.assetId, disposeType: createForm.value.method, amount: createForm.value.disposeValue }],
    approvalLevel: 1,
    totalLevels: total,
    approvalSteps: steps,
    approvalLogs: []
  })
  showCreate.value = false
  createForm.value = { assetId: '', method: '出售', disposeValue: 0, reason: '', remark: '', assessor: '' }
  ElMessage.success('处置申请已提交，进入审批流程')
}

// 保存处置记录
const disposeSaveVisible = ref(false)
const disposeEditRow = ref(null)

const defaultDisposeForm = {
  company: '', projectType: '资产产权', assetId: '', method: '出售',
  disposePerson: '', disposeValue: 0, disposeDate: '', remark: ''
}
const disposeForm = ref({ ...defaultDisposeForm })

function showDisposeSave(row = null) {
  disposeEditRow.value = row
  if (row) {
    disposeForm.value = {
      company: row.company,
      projectType: row.projectType,
      assetId: row.assets && row.assets[0] ? row.assets[0].assetNo : '',
      method: row.method,
      disposePerson: row.disposePerson,
      disposeValue: row.disposeValue,
      disposeDate: row.disposeDate,
      remark: row.remark
    }
  } else {
    disposeForm.value = { ...defaultDisposeForm }
  }
  disposeSaveVisible.value = true
}

function submitDisposeSave() {
  const f = disposeForm.value
  if (!f.company || !f.assetId || !f.disposePerson || !f.disposeDate) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (!disposeEditRow.value && !assertDisposalAllowed(f.assetId)) return
  const now = new Date().toLocaleString('zh-CN')
  const asset = assetOptions.value.find(a => a.id === f.assetId)
  if (disposeEditRow.value) {
    Object.assign(disposeEditRow.value, {
      company: f.company,
      projectType: f.projectType,
      method: f.method,
      disposePerson: f.disposePerson,
      disposeValue: f.disposeValue,
      disposeDate: f.disposeDate,
      remark: f.remark,
      updatedAt: now
    })
    if (disposeEditRow.value.assets && disposeEditRow.value.assets[0]) {
      disposeEditRow.value.assets[0].disposeType = f.method
      disposeEditRow.value.assets[0].amount = f.disposeValue
    }
    ElMessage.success('处置记录已更新')
  } else {
    const { total } = getApprovalLevels(f.disposeValue)
    records.value.unshift({
      id: Date.now(),
      disposeNo: `CZ-${new Date().getFullYear()}-${String(records.value.length + 1).padStart(3, '0')}`,
      assetName: asset ? asset.name : f.assetId,
      method: f.method,
      bookValue: asset ? asset.bookValue : 0,
      disposeValue: f.disposeValue,
      applicant: '当前用户',
      applyDate: new Date().toISOString().slice(0, 10),
      status: '待审批',
      reason: '处置登记',
      remark: f.remark,
      projectType: f.projectType,
      company: f.company,
      disposeDate: f.disposeDate,
      disposePerson: f.disposePerson,
      createdAt: now,
      updatedAt: now,
      disposeStatus: '进行中',
      assets: [{ assetNo: f.assetId, assetName: asset ? asset.name : f.assetId, disposeType: f.method, amount: f.disposeValue }],
      approvalLevel: 1,
      totalLevels: total,
      approvalSteps: buildApprovalSteps(f.disposeValue),
      approvalLogs: []
    })
    ElMessage.success('处置记录保存成功')
  }
  disposeSaveVisible.value = false
}

function handleRowCommand(cmd, row) {
  if (cmd === 'flow') {
    viewApprovalFlow(row)
  } else if (cmd === 'cancel') {
    row.disposeStatus = '取消'
    row.updatedAt = new Date().toLocaleString('zh-CN')
    ElMessage.warning(`处置记录 ${row.disposeNo} 已取消`)
  } else if (cmd === 'finish') {
    row.disposeStatus = '完成'
    row.updatedAt = new Date().toLocaleString('zh-CN')
    ElMessage.success(`处置记录 ${row.disposeNo} 已标记完成`)
  } else if (cmd === 'delete') {
    ElMessageBox.confirm(`确认删除处置记录"${row.disposeNo}"？`, '提示', { type: 'warning' }).then(() => {
      const idx = records.value.findIndex(r => r.id === row.id)
      if (idx !== -1) records.value.splice(idx, 1)
      ElMessage.success('删除成功')
    }).catch(() => {})
  }
}
</script>
