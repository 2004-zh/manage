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
          <div class="cell"><div class="label">流转方向</div><div class="value">{{ currentRow.direction }}</div></div>
          <div class="cell"><div class="label">权属类型</div><div class="value">{{ currentRow.ownershipType }}</div></div>
          <div class="cell"><div class="label">流转类型</div><div class="value">{{ currentRow.flowType }}</div></div>
          <div class="cell"><div class="label">流转前</div><div class="value">经营公司：{{ currentRow.beforeCompany }}</div></div>
          <div class="cell"><div class="label">流转后</div><div class="value">经营公司：{{ currentRow.afterCompany }}</div></div>
          <div class="cell"><div class="label">申请人</div><div class="value">{{ currentRow.applicant.name }} {{ currentRow.applicant.phone }}</div></div>
          <div class="cell"><div class="label">审批截至时间</div><div class="value">{{ currentRow.approvalDeadline }}</div></div>
          <div class="cell"><div class="label">审批完成时间</div><div class="value">{{ currentRow.approvalFinish || '—' }}</div></div>
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
              <el-select v-model="flowForm.originCompany" placeholder="请选择原产权公司" style="width:100%">
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
          <el-upload drag action="#" :auto-upload="false" :limit="5" style="width:100%">
            <el-icon :size="40"><UploadFilled /></el-icon>
            <div>将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div style="color:#999;font-size:12px">支持上传权属证明、协议等材料，最多5个文件</div>
            </template>
          </el-upload>
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
import { useChangeLogStore } from '../../store/changeLog'
import { useAuditStore } from '../../store/audit'
import { useUserStore } from '../../store/user'

const assetStore = useAssetStore()
const changeLogStore = useChangeLogStore()
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

const changeRecords = ref([
  { id: 1, changeNo: 'BG2026001', assetName: '城投大厦A座1201室', assetNo: 'ZC-1001', assetType: '办公楼', location: '长乐区吴航街道城投大厦A座12层', assetStatus: '自用', changeType: '信息变更', changeContent: '资产名称变更', beforeChange: '城投大厦A座12层办公区', afterChange: '城投大厦A座1201室', changePerson: '张伟', changeTime: '2026-09-15', direction: '内部流转', ownershipType: '产权和经营权', beforeCompany: '城投经营公司', afterCompany: '城投经营公司', flowType: '直接划拨', applicant: { name: '张伟', phone: '13800001111' }, approvalStatus: '已通过', approvalDeadline: '2026-09-18 17:00', approvalFinish: '2026-09-16 10:20', remark: '名称规范化调整', oldOwner: '城投集团' },
  { id: 2, changeNo: 'BG2026002', assetName: '阳光花园1号楼101室', assetNo: 'ZC-1002', assetType: '住宅', location: '长乐区航城街道阳光花园1号楼', assetStatus: '已出租', changeType: '状态变更', changeContent: '资产使用状态变更', beforeChange: '闲置', afterChange: '已出租', changePerson: '李娜', changeTime: '2026-09-12', direction: '内部流转', ownershipType: '经营权', beforeCompany: '产投经营公司', afterCompany: '产投经营公司', flowType: '直接划拨', applicant: { name: '李娜', phone: '13900002222' }, approvalStatus: '已通过', approvalDeadline: '2026-09-15 17:00', approvalFinish: '2026-09-13 09:40', remark: '', oldOwner: '产投集团' },
  { id: 3, changeNo: 'BG2026003', assetName: '万达广场商铺A101', assetNo: 'ZC-1003', assetType: '商铺', location: '长乐区吴航街道万达广场A101', assetStatus: '已出租', changeType: '权属变更', changeContent: '产权单位变更', beforeChange: '城投集团', afterChange: '产投集团', changePerson: '王磊', changeTime: '2026-09-10', direction: '内部流转', ownershipType: '产权和经营权', beforeCompany: '城投经营公司', afterCompany: '产投经营公司', flowType: '直接划拨', applicant: { name: '王磊', phone: '13700003333' }, approvalStatus: '审批中', approvalDeadline: '2026-09-20 17:00', approvalFinish: '', remark: '待集团复核', oldOwner: '城投集团' },
  { id: 4, changeNo: 'BG2026004', assetName: '国贸写字楼A座1501', assetNo: 'ZC-1004', assetType: '办公楼', location: '长乐区营前街道国贸写字楼A座15层', assetStatus: '已出租', changeType: '信息变更', changeContent: '面积信息变更', beforeChange: '260㎡', afterChange: '280㎡', changePerson: '赵敏', changeTime: '2026-09-08', direction: '内部流转', ownershipType: '产权', beforeCompany: '水投经营公司', afterCompany: '水投经营公司', flowType: '直接划拨', applicant: { name: '赵敏', phone: '13600004444' }, approvalStatus: '已通过', approvalDeadline: '2026-09-10 17:00', approvalFinish: '2026-09-09 15:00', remark: '实测面积补正', oldOwner: '水投集团' },
  { id: 5, changeNo: 'BG2026005', assetName: '高新技术产业园厂房C1', assetNo: 'ZC-1005', assetType: '厂房', location: '长乐区古槐镇高新技术产业园C1', assetStatus: '维修中', changeType: '状态变更', changeContent: '资产维修状态变更', beforeChange: '已出租', afterChange: '维修中', changePerson: '孙强', changeTime: '2026-09-05', direction: '外部流转', ownershipType: '经营权', beforeCompany: '领航经营公司', afterCompany: '城投经营公司', flowType: '协议转让', applicant: { name: '孙强', phone: '13500005555' }, approvalStatus: '已拒绝', approvalDeadline: '2026-09-08 17:00', approvalFinish: '2026-09-07 11:30', remark: '维修责任未明确', oldOwner: '领航公司' },
  { id: 6, changeNo: 'BG2026006', assetName: '朝阳农贸市场1号厅', assetNo: 'ZC-1006', assetType: '市场', location: '长乐区吴航街道朝阳农贸市场', assetStatus: '已出租', changeType: '信息变更', changeContent: '租金价格变更', beforeChange: '30000元/月', afterChange: '35000元/月', changePerson: '周芳', changeTime: '2026-08-28', direction: '内部流转', ownershipType: '经营权', beforeCompany: '城投经营公司', afterCompany: '城投经营公司', flowType: '直接划拨', applicant: { name: '张伟', phone: '13800001111' }, approvalStatus: '待审批', approvalDeadline: '2026-09-05 17:00', approvalFinish: '', remark: '随市场行情调整', oldOwner: '城投集团' },
  { id: 7, changeNo: 'BG2026007', assetName: '滨江商铺B区203', assetNo: 'ZC-1007', assetType: '商铺', location: '长乐区航城街道滨江商铺B区203', assetStatus: '已出租', changeType: '权属变更', changeContent: '管理单位变更', beforeChange: '水投集团', afterChange: '城投集团', changePerson: '吴涛', changeTime: '2026-08-20', direction: '内部流转', ownershipType: '产权和经营权', beforeCompany: '水投经营公司', afterCompany: '城投经营公司', flowType: '无偿划转', applicant: { name: '李娜', phone: '13900002222' }, approvalStatus: '已通过', approvalDeadline: '2026-08-25 17:00', approvalFinish: '2026-08-23 16:40', remark: '', oldOwner: '水投集团' },
  { id: 8, changeNo: 'BG2026008', assetName: '领航科技楼5层', assetNo: 'ZC-1008', assetType: '办公楼', location: '长乐区首占新区领航科技楼5层', assetStatus: '闲置', changeType: '状态变更', changeContent: '资产使用状态变更', beforeChange: '已出租', afterChange: '闲置', changePerson: '郑洁', changeTime: '2026-08-15', direction: '外部流转', ownershipType: '经营权', beforeCompany: '领航经营公司', afterCompany: '产投经营公司', flowType: '公开竞价', applicant: { name: '王磊', phone: '13700003333' }, approvalStatus: '审批中', approvalDeadline: '2026-08-30 17:00', approvalFinish: '', remark: '租约到期收回', oldOwner: '领航公司' },
  { id: 9, changeNo: 'BG2026009', assetName: '城南仓储物流中心', assetNo: 'ZC-1009', assetType: '仓库', location: '长乐区鹤上镇城南路88号', assetStatus: '已出租', changeType: '信息变更', changeContent: '坐落地址变更', beforeChange: '城南路88号', afterChange: '城南路88号附1号', changePerson: '陈刚', changeTime: '2026-08-10', direction: '内部流转', ownershipType: '产权', beforeCompany: '城投经营公司', afterCompany: '城投经营公司', flowType: '直接划拨', applicant: { name: '赵敏', phone: '13600004444' }, approvalStatus: '已通过', approvalDeadline: '2026-08-14 17:00', approvalFinish: '2026-08-12 10:10', remark: '门牌号行政区划调整', oldOwner: '区国资中心' },
  { id: 10, changeNo: 'BG2026010', assetName: '东区保障房3号楼', assetNo: 'ZC-1010', assetType: '住宅', location: '长乐区首占新区东区保障房3号楼', assetStatus: '已出租', changeType: '权属变更', changeContent: '产权归属变更', beforeChange: '产投集团', afterChange: '城投集团', changePerson: '刘洋', changeTime: '2026-08-05', direction: '内部流转', ownershipType: '产权和经营权', beforeCompany: '产投经营公司', afterCompany: '城投经营公司', flowType: '直接划拨', applicant: { name: '孙强', phone: '13500005555' }, approvalStatus: '待审批', approvalDeadline: '2026-08-20 17:00', approvalFinish: '', remark: '保障房统一归口管理', oldOwner: '产投集团' },
  { id: 11, changeNo: 'BG2026011', assetName: '漳港海鲜市场摊位区', assetNo: 'ZC-1011', assetType: '市场', location: '长乐区漳港街道海鲜市场', assetStatus: '已出租', changeType: '权属变更', changeContent: '经营权流转', beforeChange: '领航公司', afterChange: '水投集团', changePerson: '周芳', changeTime: '2026-07-28', direction: '外部流转', ownershipType: '经营权', beforeCompany: '领航经营公司', afterCompany: '水投经营公司', flowType: '协议转让', applicant: { name: '张伟', phone: '13800001111' }, approvalStatus: '已通过', approvalDeadline: '2026-08-02 17:00', approvalFinish: '2026-07-31 14:25', remark: '', oldOwner: '领航公司' },
  { id: 12, changeNo: 'BG2026012', assetName: '玉田镇旧工业厂房', assetNo: 'ZC-1012', assetType: '厂房', location: '长乐区玉田镇旧工业厂房', assetStatus: '闲置', changeType: '状态变更', changeContent: '资产盘活状态变更', beforeChange: '闲置', afterChange: '待改造', changePerson: '吴涛', changeTime: '2026-07-20', direction: '内部流转', ownershipType: '产权和经营权', beforeCompany: '产投经营公司', afterCompany: '产投经营公司', flowType: '直接划拨', applicant: { name: '李娜', phone: '13900002222' }, approvalStatus: '已拒绝', approvalDeadline: '2026-07-26 17:00', approvalFinish: '2026-07-24 09:15', remark: '改造方案未通过评审', oldOwner: '产投集团' }
])

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
      const changeType = r.field === 'status' || r.field === 'leaseStatus' || r.field === 'inventoryState'
        ? '状态变更'
        : (r.field === 'group' || r.action?.includes('权属') || r.action?.includes('流转') || r.action?.includes('划转'))
          ? '权属变更'
          : '信息变更'
      return {
        id: r.id,
        changeNo: r.id,
        assetName: r.assetName || r.assetId || '—',
        assetNo: r.assetId || '—',
        assetType: '—',
        location: '—',
        assetStatus: '—',
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
  direction: '', ownershipType: '', originCompany: '', flowType: '', applicant: '',
  approvalDeadline: '', amount: 0, reason: '', remark: ''
}
const flowForm = ref({ ...defaultFlowForm, assets: [] })

const flowAssetPool = computed(() =>
  assetStore.visibleAssets.slice(0, 200).map(a => ({
    assetNo: a.id,
    assetName: a.name,
    location: a.location || '—',
    assetType: a.type || a.assetCategory || '—'
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
      flowType: row.flowType, applicant: row.applicant.name, approvalDeadline: row.approvalDeadline.slice(0, 10),
      amount: 0, reason: row.changeContent, remark: row.remark, assets: []
    }
  } else {
    flowForm.value = { ...defaultFlowForm, assets: [] }
  }
  flowDialogVisible.value = true
}

function addFlowAsset(row) {
  flowForm.value.assets.push({ ...row })
  ElMessage.success(`已添加资产：${row.assetName}`)
}

function submitFlow() {
  const f = flowForm.value
  if (!f.direction || !f.ownershipType || !f.flowType || !f.applicant || !f.approvalDeadline || !f.reason) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (editingRow.value) {
    const target = changeRecords.value.find(r => r.id === editingRow.value.id)
    if (target) {
      Object.assign(target, {
        direction: f.direction, ownershipType: f.ownershipType, flowType: f.flowType,
        beforeCompany: f.originCompany || target.beforeCompany, remark: f.remark
      })
    }
    ElMessage.success('权属流转记录已更新')
  } else {
    changeRecords.value.unshift({
      id: Date.now(),
      changeNo: `BG2026${String(changeRecords.value.length + 1).padStart(3, '0')}`,
      assetName: f.assets[0] ? f.assets[0].assetName : '（多宗资产）',
      assetNo: f.assets[0] ? f.assets[0].assetNo : '—',
      assetType: f.assets[0] ? f.assets[0].assetType : '—',
      location: f.assets[0] ? f.assets[0].location : '—',
      assetStatus: '闲置',
      changeType: '权属变更',
      changeContent: f.reason,
      beforeChange: f.originCompany || '—',
      afterChange: f.originCompany || '—',
      changePerson: f.applicant,
      changeTime: new Date().toISOString().slice(0, 10),
      direction: f.direction,
      ownershipType: f.ownershipType,
      beforeCompany: f.originCompany || '—',
      afterCompany: f.originCompany || '—',
      flowType: f.flowType,
      applicant: applicantOptions.find(p => p.name === f.applicant) || { name: f.applicant, phone: '—' },
      approvalStatus: '待审批',
      approvalDeadline: `${f.approvalDeadline} 17:00`,
      approvalFinish: '',
      remark: f.remark,
      oldOwner: f.originCompany || '—'
    })
    ElMessage.success('权属流转保存成功')
    f.assets.forEach(a => {
      changeLogStore.record({
        assetId: a.assetNo, assetName: a.assetName, module: '流转', type: '权属变更',
        before: f.originCompany || '—', after: `${f.flowType} · ${f.direction} · ${f.ownershipType}`
      })
    })
  }
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
</style>
