<template>
  <div class="page-container">
    <div class="page-header">
      <h2>变更记录（权属流转）</h2>
      <div>
        <el-button type="primary" @click="showFlowDialog()">新增</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="12">
        <el-col :span="6">
          <el-input v-model="filters.keyword" placeholder="资产名称/变更编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.direction" placeholder="流转方向" clearable>
            <el-option v-for="d in directionOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.ownershipType" placeholder="权属类型" clearable>
            <el-option v-for="t in ownershipOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.approvalStatus" placeholder="审批状态" clearable>
            <el-option v-for="s in approvalStatusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.flowType" placeholder="流转类型" clearable>
            <el-option v-for="f in flowTypeOptions" :key="f" :label="f" :value="f" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.oldOwner" placeholder="请选择旧所有者" clearable>
            <el-option v-for="o in oldOwnerOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.changeType" placeholder="变更类型" clearable>
            <el-option label="信息变更" value="信息变更" />
            <el-option label="状态变更" value="状态变更" />
            <el-option label="权属变更" value="权属变更" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="16">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card fill" shadow="never">
      <el-table :data="pagedData" border stripe>
        <el-table-column type="expand" width="46">
          <template #default="{ row }">
            <div style="padding:8px 24px">
              <div class="section-title">变更明细</div>
              <div class="detail-grid">
                <div class="cell"><div class="label">流转前</div><div class="value">经营公司：{{ row.beforeCompany }}</div></div>
                <div class="cell"><div class="label">流转后</div><div class="value">经营公司：{{ row.afterCompany }}</div></div>
                <div class="cell"><div class="label">流转类型</div><div class="value">{{ row.flowType }}</div></div>
                <div class="cell"><div class="label">变更内容</div><div class="value">{{ row.changeContent }}</div></div>
                <div class="cell"><div class="label">变更前</div><div class="value">{{ row.beforeChange }}</div></div>
                <div class="cell"><div class="label">变更后</div><div class="value">{{ row.afterChange }}</div></div>
                <div class="cell"><div class="label">申请人</div><div class="value">{{ row.applicant.name }} {{ row.applicant.phone }}</div></div>
                <div class="cell"><div class="label">审批截至时间</div><div class="value">{{ row.approvalDeadline }}</div></div>
                <div class="cell"><div class="label">审批完成时间</div><div class="value">{{ row.approvalFinish || '—' }}</div></div>
                <div class="cell"><div class="label">变更人</div><div class="value">{{ row.changePerson }}</div></div>
                <div class="cell" style="grid-column: span 2"><div class="label">备注</div><div class="value">{{ row.remark || '无' }}</div></div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="changeNo" label="变更编号" width="120" fixed="left" />
        <el-table-column prop="assetName" label="资产名称" width="170" show-overflow-tooltip />
        <el-table-column prop="changeType" label="变更类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getChangeTypeTag(row.changeType)" size="small">{{ row.changeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="direction" label="流转方向" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.direction === '内部流转' ? 'primary' : 'warning'">{{ row.direction }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ownershipType" label="权属类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="success" effect="plain">{{ row.ownershipType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approvalStatus" label="审批状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getApprovalTag(row.approvalStatus)" size="small">{{ row.approvalStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="changeTime" label="变更时间" width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewAssetInfo(row)">资产信息</el-button>
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-dropdown style="margin-left:4px" @command="cmd => handleCommand(cmd, row)">
              <el-button type="primary" link size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="approve">合同审批</el-dropdown-item>
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
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="page = 1"
        />
      </div>
    </el-card>

    <!-- 变更详情对话框 -->
    <el-dialog v-model="detailVisible" title="变更详情" width="760px">
      <template v-if="currentRow">
        <div class="detail-grid">
          <div class="cell"><div class="label">变更编号</div><div class="value hl">{{ currentRow.changeNo }}</div></div>
          <div class="cell"><div class="label">变更类型</div><div class="value">
            <el-tag :type="getChangeTypeTag(currentRow.changeType)" size="small">{{ currentRow.changeType }}</el-tag>
          </div></div>
          <div class="cell"><div class="label">审批状态</div><div class="value">
            <el-tag :type="getApprovalTag(currentRow.approvalStatus)" size="small">{{ currentRow.approvalStatus }}</el-tag>
          </div></div>
          <div class="cell" style="grid-column: span 3"><div class="label">资产名称</div><div class="value">{{ currentRow.assetName }}</div></div>
          <div class="cell"><div class="label">资产编号</div><div class="value hl">{{ currentRow.assetNo }}</div></div>
          <div class="cell"><div class="label">资产类型</div><div class="value">{{ currentRow.assetType }}</div></div>
          <div class="cell"><div class="label">台账状态</div><div class="value">{{ currentRow.assetStatus }}</div></div>
          <div class="cell" style="grid-column: span 3"><div class="label">资产坐落</div><div class="value">{{ currentRow.location }}</div></div>
          <div class="cell"><div class="label">流转方向</div><div class="value">{{ currentRow.direction }}</div></div>
          <div class="cell"><div class="label">权属类型</div><div class="value">{{ currentRow.ownershipType }}</div></div>
          <div class="cell"><div class="label">流转类型</div><div class="value">{{ currentRow.flowType }}</div></div>
          <div class="cell"><div class="label">流转前</div><div class="value">经营公司：{{ currentRow.beforeCompany }}</div></div>
          <div class="cell"><div class="label">流转后</div><div class="value">经营公司：{{ currentRow.afterCompany }}</div></div>
          <div class="cell"><div class="label">申请人</div><div class="value">{{ currentRow.applicant.name }} {{ currentRow.applicant.phone }}</div></div>
          <div class="cell"><div class="label">审批截至时间</div><div class="value">{{ currentRow.approvalDeadline }}</div></div>
          <div class="cell"><div class="label">审批完成时间</div><div class="value">{{ currentRow.approvalFinish || '—' }}</div></div>
          <div class="cell"><div class="label">金额（万元）</div><div class="value">{{ currentRow.amount || '—' }}</div></div>
          <div class="cell" style="grid-column: span 3"><div class="label">流转附件</div><div class="value">
            <span v-if="!currentRow.files?.length">无</span>
            <el-tag v-for="f in currentRow.files" :key="f" size="small" style="margin-right:6px">{{ f }}</el-tag>
          </div></div>
          <div class="cell" style="grid-column: span 3"><div class="label">变更内容</div><div class="value">{{ currentRow.changeContent }}</div></div>
          <div class="cell"><div class="label">变更前</div><div class="value">{{ currentRow.beforeChange }}</div></div>
          <div class="cell"><div class="label">变更后</div><div class="value">{{ currentRow.afterChange }}</div></div>
          <div class="cell"><div class="label">变更人</div><div class="value">{{ currentRow.changePerson }}</div></div>
          <div class="cell"><div class="label">变更时间</div><div class="value">{{ currentRow.changeTime }}</div></div>
          <div class="cell" style="grid-column: span 3"><div class="label">备注</div><div class="value">{{ currentRow.remark || '无' }}</div></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 资产信息对话框 -->
    <el-dialog v-model="assetInfoVisible" title="资产信息" width="700px">
      <template v-if="currentRow">
        <div class="detail-grid">
          <div class="cell"><div class="label">资产名称</div><div class="value hl">{{ currentRow.assetName }}</div></div>
          <div class="cell"><div class="label">资产编号</div><div class="value">{{ currentRow.assetNo }}</div></div>
          <div class="cell"><div class="label">资产类型</div><div class="value">{{ currentRow.assetType }}</div></div>
          <div class="cell" style="grid-column: span 3"><div class="label">资产座落</div><div class="value">{{ currentRow.location }}</div></div>
          <div class="cell"><div class="label">经营公司</div><div class="value">{{ currentRow.afterCompany }}</div></div>
          <div class="cell"><div class="label">产权公司</div><div class="value">{{ currentRow.beforeCompany }}</div></div>
          <div class="cell"><div class="label">资产状态</div><div class="value">{{ currentRow.assetStatus }}</div></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="assetInfoVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 保存权属流转对话框 -->
    <el-dialog v-model="flowDialogVisible" title="保存权属流转" width="920px" destroy-on-close>
      <el-form :model="flowForm" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="流转方向" required>
              <el-select v-model="flowForm.direction" placeholder="请选择流转方向" style="width:100%">
                <el-option v-for="d in directionOptions" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权属类型" required>
              <el-select v-model="flowForm.ownershipType" placeholder="请选择权属类型" style="width:100%">
                <el-option v-for="t in ownershipOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原产权公司">
              <el-select v-model="flowForm.originCompany" placeholder="选资产后自动带出" style="width:100%">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="现产权公司" :required="flowForm.direction === '外部流转'">
              <el-select v-model="flowForm.targetCompany" :placeholder="flowForm.direction === '外部流转' ? '外部流转必选' : '内部流转保持原单位'" style="width:100%" clearable>
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="流转类型" required>
              <el-select v-model="flowForm.flowType" placeholder="请选择流转类型" style="width:100%">
                <el-option v-for="f in flowTypeOptions" :key="f" :label="f" :value="f" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="变更申请人" required>
              <el-select v-model="flowForm.applicant" placeholder="请选择变更申请人" style="width:100%">
                <el-option v-for="p in applicantOptions" :key="p.name" :label="`${p.name}（${p.phone}）`" :value="p.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审批截至时间" required>
              <el-date-picker v-model="flowForm.approvalDeadline" type="date" placeholder="请选择审批截至时间" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额(万元)" required>
              <el-input-number v-model="flowForm.amount" :min="0" :step="10" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="流转原因" required>
          <el-input v-model="flowForm.reason" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="请输入流转原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="flowForm.remark" type="textarea" :rows="2" maxlength="255" show-word-limit placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload drag action="#" :auto-upload="false" :show-file-list="false" :limit="5" :on-change="onFlowFileChange" style="width:100%">
            <el-icon :size="40"><UploadFilled /></el-icon>
            <div>将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div style="color:#999;font-size:12px">支持上传权属证明、协议等材料，最多5个文件；演示环境登记附件名称</div>
            </template>
          </el-upload>
          <div v-if="flowForm.files.length" class="attached-list">
            <el-tag v-for="(fn, i) in flowForm.files" :key="i" closable size="small" @close="flowForm.files.splice(i, 1)">{{ fn }}</el-tag>
          </div>
        </el-form-item>
      </el-form>

      <div class="section-title">资产列表</div>
      <div style="margin-bottom:8px">
        <el-button type="primary" link @click="flowAssetPickerVisible = true">添加资产</el-button>
      </div>
      <el-table :data="flowForm.assets" border stripe size="small">
        <el-table-column prop="assetNo" label="资产编号" width="130" />
        <el-table-column prop="assetName" label="资产名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="location" label="资产座落" min-width="200" show-overflow-tooltip />
        <el-table-column prop="assetType" label="资产类型" width="100" />
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="flowForm.assets.splice($index, 1)">移除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无资产，请点击添加资产" :image-size="60" />
        </template>
      </el-table>

      <template #footer>
        <el-button @click="flowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFlow">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加资产选择对话框 -->
    <el-dialog v-model="flowAssetPickerVisible" title="添加资产" width="780px" append-to-body>
      <el-table :data="pickableFlowAssets" border stripe size="small" max-height="360">
        <el-table-column prop="assetNo" label="资产编号" width="130" />
        <el-table-column prop="assetName" label="资产名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="location" label="资产座落" min-width="200" show-overflow-tooltip />
        <el-table-column prop="assetType" label="资产类型" width="100" />
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="addFlowAsset(row)">添加</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无可添加资产" :image-size="60" />
        </template>
      </el-table>
      <template #footer>
        <el-button @click="flowAssetPickerVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 合同审批对话框 -->
    <el-dialog v-model="approveDialogVisible" title="合同审批" width="560px">
      <el-form label-width="110px">
        <el-form-item label="选择审批流程">
          <el-select v-model="selectedFlow" placeholder="请选择审批流程" style="width:100%">
            <el-option v-for="f in flowOptions" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="已选流程">
          <div class="chip-row" style="flex-wrap:wrap;margin-bottom:0">
            <span v-for="(f, idx) in chosenFlows" :key="f" class="chip on" @click="chosenFlows.splice(idx, 1)">{{ f }} ×</span>
            <span v-if="chosenFlows.length === 0" style="color:#999">暂未添加审批流程</span>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" link @click="addApprovalFlow">添加审批</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitContractApproval">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, UploadFilled } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useAuditStore } from '../../store/audit'
import { useUserStore } from '../../store/user'

const assetStore = useAssetStore()
const auditStore = useAuditStore()
const userStore = useUserStore()

// 企业端只看本公司相关的变更：种子记录看 oldOwner，运行期记录按资产编号回查归属
const currentCompany = computed(() => userStore.user?.org || '城投集团')
function belongsToCompany(row) {
  if (!userStore.isEnt) return true
  if (row.oldOwner && row.oldOwner !== '—') return row.oldOwner === currentCompany.value
  return assetStore.getAssetById(row.assetNo)?.group === currentCompany.value
}

const page = ref(1)
const pageSize = ref(15)

const directionOptions = ['内部流转', '外部流转']
const ownershipOptions = ['产权和经营权', '产权', '经营权']
const approvalStatusOptions = ['已通过', '已拒绝', '审批中', '待审批']
const flowTypeOptions = ['直接划拨', '协议转让', '公开竞价', '无偿划转']
const companyOptions = ['城投集团', '产投集团', '水投集团', '领航公司']
// 变更后的去向公司仍可选其他集团（权属变更本来就可能跨集团），但筛选只按本公司
const oldOwnerOptions = computed(() => userStore.isEnt ? [currentCompany.value] : ['城投集团', '产投集团', '水投集团', '领航公司', '区国资中心'])
const applicantOptions = [
  { name: '张伟', phone: '13800001111' },
  { name: '李娜', phone: '13900002222' },
  { name: '王磊', phone: '13700003333' },
  { name: '赵敏', phone: '13600004444' },
  { name: '孙强', phone: '13500005555' }
]

const filters = ref({ keyword: '', direction: '', ownershipType: '', approvalStatus: '', flowType: '', oldOwner: '', changeType: '', dateRange: null })

// 权属流转种子：只描述流转动作本身，资产名称/类型/坐落/状态/原产权单位一律按 assetNo
// 回查台账得到，保证这里的编号与资产主数据（CT-xxx）永远一致。
const flowSeeds = [
  { id: 1, changeNo: 'BG2026001', assetNo: 'CT-001', changeType: '信息变更', changeContent: '资产名称变更', beforeChange: '吴航商业街A区一层商铺', afterChange: '吴航街道商业街 A-01 商铺', changePerson: '张伟', changeTime: '2026-09-15', direction: '内部流转', ownershipType: '产权和经营权', flowType: '直接划拨', applicant: '张伟', approvalStatus: '已通过', approvalDeadline: '2026-09-18 17:00', approvalFinish: '2026-09-16 10:20', remark: '名称规范化调整' },
  { id: 2, changeNo: 'BG2026002', assetNo: 'CT-002', changeType: '状态变更', changeContent: '资产使用状态变更', beforeChange: '闲置', afterChange: '已出租', changePerson: '李娜', changeTime: '2026-09-12', direction: '内部流转', ownershipType: '经营权', flowType: '直接划拨', applicant: '李娜', approvalStatus: '已通过', approvalDeadline: '2026-09-15 17:00', approvalFinish: '2026-09-13 09:40', remark: '' },
  { id: 3, changeNo: 'BG2026003', assetNo: 'CT-003', changeType: '权属变更', changeContent: '产权单位变更', changePerson: '王磊', changeTime: '2026-09-10', direction: '外部流转', ownershipType: '产权和经营权', flowType: '协议转让', applicant: '王磊', approvalStatus: '审批中', approvalDeadline: '2026-09-20 17:00', approvalFinish: '', remark: '待集团复核', targetGroup: '产投集团' },
  { id: 4, changeNo: 'BG2026004', assetNo: 'CT-004', changeType: '信息变更', changeContent: '面积信息变更', beforeChange: '4600㎡', afterChange: '4800㎡', changePerson: '赵敏', changeTime: '2026-09-08', direction: '内部流转', ownershipType: '产权', flowType: '直接划拨', applicant: '赵敏', approvalStatus: '已通过', approvalDeadline: '2026-09-10 17:00', approvalFinish: '2026-09-09 15:00', remark: '实测面积补正' },
  { id: 5, changeNo: 'BG2026005', assetNo: 'CT-005', changeType: '状态变更', changeContent: '租约到期收回', beforeChange: '已出租', afterChange: '闲置', changePerson: '孙强', changeTime: '2026-09-05', direction: '内部流转', ownershipType: '经营权', flowType: '直接划拨', applicant: '孙强', approvalStatus: '已通过', approvalDeadline: '2026-09-08 17:00', approvalFinish: '2026-09-07 11:30', remark: '收回后纳入待盘活清单' },
  { id: 6, changeNo: 'BG2026006', assetNo: 'CT-006', changeType: '信息变更', changeContent: '账面原值补正', beforeChange: '860万元', afterChange: '890万元', changePerson: '周芳', changeTime: '2026-08-28', direction: '内部流转', ownershipType: '产权', flowType: '直接划拨', applicant: '周芳', approvalStatus: '待审批', approvalDeadline: '2026-09-05 17:00', approvalFinish: '', remark: '历史造价重估待复核' },
  { id: 7, changeNo: 'BG2026007', assetNo: 'CT-007', changeType: '权属变更', changeContent: '管理单位变更', changePerson: '吴涛', changeTime: '2026-08-20', direction: '外部流转', ownershipType: '产权和经营权', flowType: '无偿划转', applicant: '吴涛', approvalStatus: '审批中', approvalDeadline: '2026-08-25 17:00', approvalFinish: '', remark: '划转方案集团审议中', targetGroup: '城投集团' },
  { id: 8, changeNo: 'BG2026008', assetNo: 'CT-008', changeType: '状态变更', changeContent: '自用房产申请对外出租', beforeChange: '自用', afterChange: '已出租', changePerson: '郑洁', changeTime: '2026-08-15', direction: '外部流转', ownershipType: '经营权', flowType: '公开竞价', applicant: '郑洁', approvalStatus: '已拒绝', approvalDeadline: '2026-08-30 17:00', approvalFinish: '2026-08-23 16:40', remark: '保留办公用房，不予外租', targetGroup: '产投集团' },
  { id: 9, changeNo: 'BG2026009', assetNo: 'CT-097', changeType: '状态变更', changeContent: '闲置资产招租转化', beforeChange: '闲置', afterChange: '已出租', changePerson: '陈刚', changeTime: '2026-08-10', direction: '内部流转', ownershipType: '经营权', flowType: '公开竞价', applicant: '陈刚', approvalStatus: '待审批', approvalDeadline: '2026-08-14 17:00', approvalFinish: '', remark: '招租方案已上报待批' },
  { id: 10, changeNo: 'BG2026010', assetNo: 'CT-098', changeType: '信息变更', changeContent: '权属材料补充', beforeChange: '缺宗地图', afterChange: '已补宗地图', changePerson: '刘洋', changeTime: '2026-08-05', direction: '内部流转', ownershipType: '产权', flowType: '直接划拨', applicant: '刘洋', approvalStatus: '已通过', approvalDeadline: '2026-08-20 17:00', approvalFinish: '2026-08-12 10:10', remark: '历史用地材料归档' },
  { id: 11, changeNo: 'BG2026011', assetNo: 'CT-118', changeType: '状态变更', changeContent: '自用转经营性出租', beforeChange: '自用', afterChange: '已出租', changePerson: '周芳', changeTime: '2026-07-28', direction: '外部流转', ownershipType: '经营权', flowType: '协议转让', applicant: '周芳', approvalStatus: '已拒绝', approvalDeadline: '2026-08-02 17:00', approvalFinish: '2026-07-31 14:25', remark: '涉密办公用房不参与经营性出租', targetGroup: '水投集团' },
  { id: 12, changeNo: 'BG2026012', assetNo: 'CT-121', changeType: '信息变更', changeContent: '账面价值年度重估', beforeChange: '按原值列示', afterChange: '按重估值列示', changePerson: '吴涛', changeTime: '2026-07-20', direction: '内部流转', ownershipType: '产权和经营权', flowType: '直接划拨', applicant: '吴涛', approvalStatus: '已通过', approvalDeadline: '2026-07-26 17:00', approvalFinish: '2026-07-24 09:15', remark: '年度清产核资结果' }
]

/** 流转行与运行期留痕共用一套字段：资产事实全部回查台账，原/现产权单位按归属集团补全 */
function buildFlowRow(s) {
  const a = assetStore.getAssetById(s.assetNo)
  const origin = a?.group || s.beforeCompany || '—'
  const target = s.targetGroup || origin
  return {
    ...s,
    assetName: a?.name || s.assetNo,
    assetType: a?.type || a?.assetCategory || '—',
    location: a?.location || '—',
    assetStatus: a?.status || '—',
    beforeChange: s.beforeChange || origin,
    afterChange: s.afterChange || target,
    beforeCompany: origin,
    afterCompany: target,
    applicant: applicantOptions.find(p => p.name === s.applicant) || { name: s.applicant, phone: '—' },
    oldOwner: origin,
    files: s.files || []
  }
}

const changeRecords = ref(flowSeeds.map(buildFlowRow))


const getChangeTypeTag = (type) => {
  const map = { '信息变更': 'primary', '状态变更': 'warning', '权属变更': 'danger' }
  return map[type] || 'info'
}

const getApprovalTag = (status) => {
  const map = { '已通过': 'success', '已拒绝': 'danger', '审批中': 'warning', '待审批': 'info' }
  return map[status] || 'info'
}

// 运行期留痕统一来自 audit 业务变更记录（任何写操作都会进这里）
const runtimeChangeRows = computed(() =>
  auditStore.changeRecords
    .filter(r => r.module !== '流转')
    .map(r => {
      const a = assetStore.getAssetById(r.assetId)
      const changeType = r.field === 'status' || r.field === 'leaseStatus' || r.field === 'inventoryState'
        ? '状态变更'
        : (r.field === 'group' || r.action?.includes('权属') || r.action?.includes('流转') || r.action?.includes('划转'))
          ? '权属变更'
          : '信息变更'
      return {
        id: r.id,
        changeNo: r.id,
        assetName: r.assetName || a?.name || r.assetId || '—',
        assetNo: r.assetId || '—',
        assetType: a?.type || a?.assetCategory || '—',
        location: a?.location || '—',
        assetStatus: a?.status || '—',
        changeType,
        changeContent: r.fieldLabel ? `${r.module}·${r.action}（${r.fieldLabel}）` : `${r.module}·${r.action}`,
        beforeChange: r.before,
        afterChange: r.after,
        changePerson: r.operator,
        changeTime: r.time.slice(0, 10),
        direction: '内部流转',
        ownershipType: '—',
        beforeCompany: '—',
        afterCompany: '—',
        flowType: '—',
        applicant: { name: r.operator, phone: '—' },
        approvalStatus: '已通过',
        approvalDeadline: '—',
        approvalFinish: r.time,
        remark: r.remark || '',
        oldOwner: r.group || r.operatorOrg || '—'
      }
    })
)

const filteredData = computed(() => {
  return [...runtimeChangeRows.value, ...changeRecords.value].filter(item => {
    if (!belongsToCompany(item)) return false
    if (filters.value.keyword) {
      const kw = filters.value.keyword
      if (!item.assetName.includes(kw) && !item.changeNo.includes(kw)) return false
    }
    if (filters.value.direction && item.direction !== filters.value.direction) return false
    if (filters.value.ownershipType && item.ownershipType !== filters.value.ownershipType) return false
    if (filters.value.approvalStatus && item.approvalStatus !== filters.value.approvalStatus) return false
    if (filters.value.flowType && item.flowType !== filters.value.flowType) return false
    if (filters.value.oldOwner && item.oldOwner !== filters.value.oldOwner) return false
    if (filters.value.changeType && item.changeType !== filters.value.changeType) return false
    if (filters.value.dateRange && filters.value.dateRange.length === 2) {
      if (item.changeTime < filters.value.dateRange[0] || item.changeTime > filters.value.dateRange[1]) return false
    }
    return true
  })
    // 两段数据时间交错，统一按变更时间倒序；同日按编号倒序（越晚登记编号越大）
    .sort((l, r) => {
      if (l.changeTime !== r.changeTime) return l.changeTime < r.changeTime ? 1 : -1
      return l.changeNo < r.changeNo ? 1 : -1
    })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const detailVisible = ref(false)
const assetInfoVisible = ref(false)
const currentRow = ref(null)

function handleView(row) {
  currentRow.value = row
  detailVisible.value = true
}

function viewAssetInfo(row) {
  currentRow.value = row
  assetInfoVisible.value = true
}

function handleSearch() {
  page.value = 1
}

function resetFilters() {
  filters.value = { keyword: '', direction: '', ownershipType: '', approvalStatus: '', flowType: '', oldOwner: '', changeType: '', dateRange: null }
  page.value = 1
}

function handleExport() {
  const headers = ['变更编号', '资产名称', '变更类型', '流转方向', '权属类型', '审批状态', '变更时间']
  const rows = filteredData.value.map(item => [item.changeNo, item.assetName, item.changeType, item.direction, item.ownershipType, item.approvalStatus, item.changeTime])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_变更记录_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const flowDialogVisible = ref(false)
const flowAssetPickerVisible = ref(false)
const editingRow = ref(null)

const defaultFlowForm = {
  direction: '', ownershipType: '', originCompany: '', targetCompany: '', flowType: '', applicant: '',
  approvalDeadline: '', amount: 0, reason: '', remark: '', files: []
}
const flowForm = ref({ ...defaultFlowForm, assets: [] })

const flowAssetPool = computed(() =>
  assetStore.visibleAssets.slice(0, 200).map(a => ({
    assetNo: a.id,
    assetName: a.name,
    location: a.location || '—',
    assetType: a.type || a.assetCategory || '—',
    assetStatus: a.status || '—',
    group: a.group || '—'
  }))
)

const pickableFlowAssets = computed(() => {
  const chosen = new Set(flowForm.value.assets.map(a => a.assetNo))
  return flowAssetPool.value.filter(a => !chosen.has(a.assetNo))
})

function showFlowDialog(row = null) {
  editingRow.value = row
  if (row) {
    flowForm.value = {
      direction: row.direction, ownershipType: row.ownershipType, originCompany: row.beforeCompany,
      targetCompany: row.afterCompany, flowType: row.flowType, applicant: row.applicant.name,
      approvalDeadline: row.approvalDeadline.slice(0, 10),
      amount: row.amount || 0, reason: row.changeContent, remark: row.remark,
      files: [...(row.files || [])], assets: []
    }
  } else {
    flowForm.value = { ...defaultFlowForm, assets: [], files: [] }
  }
  flowDialogVisible.value = true
}

function addFlowAsset(row) {
  flowForm.value.assets.push({ ...row })
  // 原产权单位跟着资产走，第一宗资产确定后自动带出，避免手工填错
  if (!flowForm.value.originCompany) flowForm.value.originCompany = row.group
  ElMessage.success(`已添加资产：${row.assetName}`)
}

function onFlowFileChange(file, fileList) {
  flowForm.value.files = fileList.slice(0, 5).map(f => f.name)
}

function submitFlow() {
  const f = flowForm.value
  if (!f.direction || !f.ownershipType || !f.flowType || !f.applicant || !f.approvalDeadline || !f.reason) {
    ElMessage.warning('请填写必填项')
    return
  }
  // 内部流转不改变归属，只有外部流转才必须落到具体的现产权单位
  if (f.direction === '外部流转' && !f.targetCompany) {
    ElMessage.warning('外部流转请选择现产权单位')
    return
  }
  if (editingRow.value) {
    const target = changeRecords.value.find(r => r.id === editingRow.value.id)
    if (target) {
      Object.assign(target, {
        direction: f.direction, ownershipType: f.ownershipType, flowType: f.flowType,
        beforeCompany: f.originCompany || target.beforeCompany,
        afterCompany: f.direction === '外部流转' ? f.targetCompany : (f.originCompany || target.beforeCompany),
        amount: f.amount, remark: f.remark, files: [...f.files]
      })
      auditStore.recordEvent({
        assetId: target.assetNo, assetName: target.assetName, group: target.oldOwner,
        module: '流转', action: '权属流转修改', billNo: target.changeNo,
        remark: f.reason,
        detail: `${target.flowType} · ${target.direction} · ${target.beforeCompany}→${target.afterCompany}`
      })
    }
    ElMessage.success('权属流转记录已更新')
    flowDialogVisible.value = false
    return
  }
  if (!f.assets.length) {
    ElMessage.warning('请至少选择一宗流转资产')
    return
  }
  const stamp = Date.now()
  const todayText = new Date().toISOString().slice(0, 10)
  // 一宗资产一条流转记录：编号、名称、坐落、原产权单位全部回查台账，不与主数据打架
  const rows = f.assets.map((a, i) => buildFlowRow({
    id: stamp + i,
    changeNo: `BG2026${String(changeRecords.value.length + i + 1).padStart(3, '0')}`,
    assetNo: a.assetNo,
    changeType: '权属变更',
    changeContent: f.reason,
    changePerson: f.applicant,
    changeTime: todayText,
    direction: f.direction,
    ownershipType: f.ownershipType,
    flowType: f.flowType,
    applicant: f.applicant,
    approvalStatus: '待审批',
    approvalDeadline: `${f.approvalDeadline} 17:00`,
    approvalFinish: '',
    remark: f.remark,
    targetGroup: f.direction === '外部流转' ? f.targetCompany : '',
    beforeCompany: f.originCompany,
    amount: f.amount,
    files: [...f.files]
  }))
  changeRecords.value.unshift(...rows)
  rows.forEach(row => auditStore.recordEvent({
    assetId: row.assetNo,
    assetName: row.assetName,
    group: row.oldOwner,
    module: '流转',
    action: '权属流转申请',
    billNo: row.changeNo,
    remark: f.reason,
    detail: `${row.flowType} · ${row.direction} · ${row.ownershipType} · ${row.beforeCompany}→${row.afterCompany}`
      + `${row.amount ? ` · 金额 ${row.amount} 万元` : ''}${row.files.length ? ` · 附件 ${row.files.join('、')}` : ''}`
  }))
  ElMessage.success(`权属流转已提交，共 ${rows.length} 宗资产，审批截至 ${f.approvalDeadline}`)
  flowDialogVisible.value = false
}

const approveDialogVisible = ref(false)
const selectedFlow = ref('')
const chosenFlows = ref([])
const flowOptions = ref(['部门经理审批流程', '分管领导审批流程', '总经理审批流程', '法务合规审批流程', '国资中心备案流程'])

function addApprovalFlow() {
  if (!selectedFlow.value) {
    ElMessage.warning('请先选择审批流程')
    return
  }
  if (chosenFlows.value.includes(selectedFlow.value)) {
    ElMessage.warning('该审批流程已添加')
    return
  }
  chosenFlows.value.push(selectedFlow.value)
  selectedFlow.value = ''
}

function submitContractApproval() {
  if (chosenFlows.value.length === 0) {
    ElMessage.warning('请至少添加一个审批流程')
    return
  }
  approveDialogVisible.value = false
  ElMessage.success(`合同审批已提交，共 ${chosenFlows.value.length} 个审批流程`)
  chosenFlows.value = []
}

function handleCommand(cmd, row) {
  if (cmd === 'edit') {
    showFlowDialog(row)
  } else if (cmd === 'approve') {
    selectedFlow.value = ''
    chosenFlows.value = []
    approveDialogVisible.value = true
  } else if (cmd === 'delete') {
    ElMessageBox.confirm(`确认删除变更记录"${row.changeNo}"？`, '提示', { type: 'warning' }).then(() => {
      const idx = changeRecords.value.findIndex(r => r.id === row.id)
      if (idx !== -1) {
        changeRecords.value.splice(idx, 1)
      } else {
        const ai = auditStore.changeRecords.findIndex(e => e.id === row.id)
        if (ai !== -1) auditStore.changeRecords.splice(ai, 1)
      }
      ElMessage.success('删除成功')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.filter-bar :deep(.el-row) {
  row-gap: 12px;
}
.attached-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
</style>
