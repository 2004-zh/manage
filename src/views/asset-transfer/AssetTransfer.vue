<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资产调拨</h2>
      <div>
        <el-button type="primary" @click="showSaveDialog">保存资产调拨</el-button>
        <el-button @click="showAddDialog">新增调拨</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="资产名称/调拨编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.transferType" placeholder="调拨类型" clearable>
            <el-option label="划拨" value="划拨" />
            <el-option label="转让" value="转让" />
            <el-option label="置换" value="置换" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.approvalStatus" placeholder="审批状态" clearable>
            <el-option label="待审批" value="待审批" />
            <el-option label="已审批" value="已审批" />
            <el-option label="已驳回" value="已驳回" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.group" placeholder="所属公司" clearable>
            <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="pagedData" border stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="detail-grid expand-grid">
              <div class="cell"><div class="label">调出单位</div><div class="value">{{ row.fromUnit }}</div></div>
              <div class="cell"><div class="label">调入单位</div><div class="value">{{ row.toUnit }}</div></div>
              <div class="cell"><div class="label">资产调拨执行日期</div><div class="value">{{ row.executeDate }}</div></div>
              <div class="cell"><div class="label">调拨前</div><div class="value">责任部门：{{ row.beforeDept }}</div></div>
              <div class="cell"><div class="label">调拨后</div><div class="value">责任部门：{{ row.afterDept }}</div></div>
              <div class="cell"><div class="label">备注</div><div class="value">{{ row.remark || '无' }}</div></div>
              <div class="cell"><div class="label">审核发起时间</div><div class="value">{{ row.approvalStartTime }}</div></div>
              <div class="cell"><div class="label">审批截至时间</div><div class="value">{{ row.approvalDeadline }}</div></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="transferNo" label="调拨编号" width="120" />
        <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
        <el-table-column prop="transferType" label="调拨类型" width="90" />
        <el-table-column prop="transferDate" label="调拨 至 执行日期" min-width="170" show-overflow-tooltip sortable>
          <template #default="{ row }">{{ row.transferDate }} 至 {{ row.executeDate }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="调拨资产的原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="approvalStatus" label="审批状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getApprovalType(row.approvalStatus)" size="small">{{ row.approvalStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
            <el-dropdown style="margin-left:8px" @command="cmd => handleRowCommand(cmd, row)">
              <el-button type="primary" link size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="assetInfo">资产信息</el-dropdown-item>
                  <el-dropdown-item command="view">查看</el-dropdown-item>
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

    <!-- 新增/编辑调拨对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑调拨' : '新增调拨'" width="680px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="资产选择" required>
          <el-select v-model="form.assetName" placeholder="请选择资产" style="width:100%" filterable>
            <el-option v-for="a in assetStore.visibleAssets" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="调出单位" required>
          <el-select v-model="form.fromUnit" placeholder="请选择调出单位" style="width:100%">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="调入单位" required>
          <el-select v-model="form.toUnit" placeholder="请选择调入单位" style="width:100%">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="调拨类型" required>
          <el-select v-model="form.transferType" placeholder="请选择" style="width:100%">
            <el-option label="划拨" value="划拨" />
            <el-option label="转让" value="转让" />
            <el-option label="置换" value="置换" />
          </el-select>
        </el-form-item>
        <el-form-item label="调拨原因">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请输入调拨原因" />
        </el-form-item>
        <el-form-item label="调拨日期" required>
          <el-date-picker v-model="form.transferDate" type="date" placeholder="请选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <!-- 保存资产调拨对话框 -->
    <el-dialog v-model="saveDialogVisible" title="保存资产调拨" width="960px" destroy-on-close>
      <el-form :model="saveForm" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="所属公司" required>
              <el-select v-model="saveForm.company" placeholder="请选择所属公司" style="width:100%">
                <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="前责任部门" required>
              <el-select v-model="saveForm.beforeDept" placeholder="请选择前责任部门" style="width:100%">
                <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="前责任人" required>
              <el-select v-model="saveForm.beforePerson" placeholder="请选择前责任人" style="width:100%">
                <el-option v-for="p in personOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新责任部门" required>
              <el-select v-model="saveForm.afterDept" placeholder="请选择新责任部门" style="width:100%">
                <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新责任人" required>
              <el-select v-model="saveForm.afterPerson" placeholder="请选择新责任人" style="width:100%">
                <el-option v-for="p in personOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调拨日期" required>
              <el-date-picker v-model="saveForm.transferDate" type="date" placeholder="请选择调拨日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审批截至时间" required>
              <el-date-picker v-model="saveForm.approvalDeadline" type="date" placeholder="请选择审批截至时间" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="原因" required>
          <el-input v-model="saveForm.reason" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="请输入调拨资产的原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="saveForm.remark" type="textarea" :rows="2" maxlength="255" show-word-limit placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" list-type="picture-card" :limit="5">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <div class="section-title">资产列表</div>
      <div style="margin-bottom:8px">
        <el-button type="primary" link @click="assetPickerVisible = true">添加资产</el-button>
      </div>
      <el-table :data="pagedSaveAssets" border stripe size="small">
        <el-table-column prop="region" label="省市区" width="140" show-overflow-tooltip />
        <el-table-column prop="project" label="项目" width="130" show-overflow-tooltip />
        <el-table-column prop="zone" label="分区" width="100" />
        <el-table-column prop="opCompany" label="经营公司" width="120" show-overflow-tooltip />
        <el-table-column prop="propCompany" label="产权公司" width="120" show-overflow-tooltip />
        <el-table-column prop="assetNo" label="资产编号" width="120" />
        <el-table-column prop="assetName" label="资产名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="资产座落" min-width="160" show-overflow-tooltip />
        <el-table-column prop="assetType" label="资产类型" width="100" />
        <el-table-column prop="assetStatus" label="资产状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.assetStatus === '闲置' ? 'info' : 'success'">{{ row.assetStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="removeSaveAsset($index)">移除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无资产，请点击添加资产" :image-size="60" />
        </template>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="innerPage"
          v-model:page-size="innerPageSize"
          :page-sizes="[5, 10, 20]"
          :total="saveForm.assets.length"
          layout="total, sizes, prev, pager, next, jumper"
          small
        />
      </div>

      <template #footer>
        <el-button @click="saveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSaveTransfer">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加资产选择对话框 -->
    <el-dialog v-model="assetPickerVisible" title="添加资产" width="820px" append-to-body>
      <el-table :data="pickableAssets" border stripe size="small" max-height="360">
        <el-table-column prop="assetNo" label="资产编号" width="120" />
        <el-table-column prop="assetName" label="资产名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="资产座落" min-width="160" show-overflow-tooltip />
        <el-table-column prop="assetType" label="资产类型" width="100" />
        <el-table-column prop="assetStatus" label="资产状态" width="90" />
        <el-table-column label="操作" width="70" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="addSaveAsset(row)">添加</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无可添加资产" :image-size="60" />
        </template>
      </el-table>
      <template #footer>
        <el-button @click="assetPickerVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="调拨编号">{{ currentRow.transferNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentRow.assetName }}</el-descriptions-item>
          <el-descriptions-item label="调拨类型">{{ currentRow.transferType }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag :type="getApprovalType(currentRow.approvalStatus)" size="small">{{ currentRow.approvalStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="调出单位">{{ currentRow.fromUnit }}</el-descriptions-item>
          <el-descriptions-item label="调入单位">{{ currentRow.toUnit }}</el-descriptions-item>
          <el-descriptions-item label="调拨前责任部门">{{ currentRow.beforeDept }}</el-descriptions-item>
          <el-descriptions-item label="调拨后责任部门">{{ currentRow.afterDept }}</el-descriptions-item>
          <el-descriptions-item label="调拨日期">{{ currentRow.transferDate }}</el-descriptions-item>
          <el-descriptions-item label="执行日期">{{ currentRow.executeDate }}</el-descriptions-item>
          <el-descriptions-item label="审批截至时间">{{ currentRow.approvalDeadline }}</el-descriptions-item>
          <el-descriptions-item label="审核发起时间">{{ currentRow.approvalStartTime }}</el-descriptions-item>
          <el-descriptions-item label="调拨原因">{{ currentRow.reason }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRow.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useUserStore } from '../../store/user'

const assetStore = useAssetStore()
const userStore = useUserStore()
// 调出/调入单位仍要能选其他公司（资产本来就是调给别人的），但列表只放行本公司参与的调拨
const currentCompany = computed(() => userStore.user?.org || '城投集团')
const groups = ['城投集团', '产投集团', '水投集团', '领航公司']
const groupOptions = computed(() => userStore.isEnt ? [currentCompany.value] : groups)
const deptOptions = ['资产管理部', '运营管理部', '财务部', '综合办公室', '工程管理部']
const personOptions = ['张伟', '李娜', '王磊', '赵敏', '孙强', '周芳']

const page = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const isEdit = ref(false)

const filters = ref({ keyword: '', transferType: '', approvalStatus: '', group: '' })

const defaultForm = { assetName: '', fromUnit: '', toUnit: '', transferType: '', reason: '', transferDate: '' }
const form = ref({ ...defaultForm })

const transferRecords = ref([
  { transferNo: 'DB-2026-001', assetName: '吴航街道商业街 A-01 商铺', fromUnit: '城投集团', toUnit: '产投集团', transferType: '划拨', transferDate: '2026-03-15', approvalStatus: '已审批', beforeDept: '资产管理部', afterDept: '运营管理部', executeDate: '2026-03-20', reason: '统一商业运营管理的需要', remark: '已完成交接', approvalDeadline: '2026-03-18 17:00', approvalStartTime: '2026-03-12 09:30', assetType: '商铺', assetStatus: '已出租', location: '长乐区吴航街道商业街12号', opCompany: '城投经营公司', propCompany: '城投集团' },
  { transferNo: 'DB-2026-002', assetName: '航城商务楼 3F', fromUnit: '产投集团', toUnit: '水投集团', transferType: '转让', transferDate: '2026-04-20', approvalStatus: '已审批', beforeDept: '运营管理部', afterDept: '综合办公室', executeDate: '2026-04-28', reason: '办公场所整合调整', remark: '', approvalDeadline: '2026-04-25 17:00', approvalStartTime: '2026-04-16 10:00', assetType: '办公楼', assetStatus: '自用', location: '长乐区航城街道商务楼3层', opCompany: '产投经营公司', propCompany: '产投集团' },
  { transferNo: 'DB-2026-003', assetName: '营前标准厂房 2#', fromUnit: '水投集团', toUnit: '城投集团', transferType: '置换', transferDate: '2026-05-10', approvalStatus: '待审批', beforeDept: '工程管理部', afterDept: '资产管理部', executeDate: '2026-05-20', reason: '闲置厂房置换盘活', remark: '需评估作价', approvalDeadline: '2026-05-15 17:00', approvalStartTime: '2026-05-06 14:20', assetType: '厂房', assetStatus: '闲置', location: '长乐区营前街道标准厂房2#', opCompany: '水投经营公司', propCompany: '水投集团' },
  { transferNo: 'DB-2026-004', assetName: '江田镇仓储用地', fromUnit: '城投集团', toUnit: '领航公司', transferType: '划拨', transferDate: '2026-06-01', approvalStatus: '已驳回', beforeDept: '资产管理部', afterDept: '财务部', executeDate: '2026-06-10', reason: '仓储业务整体划转', remark: '权属材料不齐被驳回', approvalDeadline: '2026-06-05 17:00', approvalStartTime: '2026-05-28 09:00', assetType: '土地', assetStatus: '闲置', location: '长乐区江田镇仓储用地', opCompany: '城投经营公司', propCompany: '城投集团' },
  { transferNo: 'DB-2026-005', assetName: '首占新区保障房 1# 楼', fromUnit: '领航公司', toUnit: '城投集团', transferType: '转让', transferDate: '2026-07-12', approvalStatus: '待审批', beforeDept: '综合办公室', afterDept: '运营管理部', executeDate: '2026-07-20', reason: '保障房运营管理移交', remark: '', approvalDeadline: '2026-07-16 17:00', approvalStartTime: '2026-07-08 11:10', assetType: '住宅', assetStatus: '已出租', location: '长乐区首占新区保障房1#楼', opCompany: '领航经营公司', propCompany: '领航公司' },
  { transferNo: 'DB-2026-006', assetName: '吴航农贸市场', fromUnit: '水投集团', toUnit: '产投集团', transferType: '划拨', transferDate: '2026-08-05', approvalStatus: '已审批', beforeDept: '运营管理部', afterDept: '资产管理部', executeDate: '2026-08-12', reason: '农贸市场专业化运营', remark: '含附属设施一并调拨', approvalDeadline: '2026-08-09 17:00', approvalStartTime: '2026-08-01 08:50', assetType: '市场', assetStatus: '已出租', location: '长乐区吴航街道农贸市场', opCompany: '水投经营公司', propCompany: '水投集团' },
  { transferNo: 'DB-2026-007', assetName: '玉田镇旧工业厂房', fromUnit: '产投集团', toUnit: '水投集团', transferType: '置换', transferDate: '2026-08-28', approvalStatus: '待审批', beforeDept: '工程管理部', afterDept: '综合办公室', executeDate: '2026-09-05', reason: '低效工业资产置换升级', remark: '', approvalDeadline: '2026-09-01 17:00', approvalStartTime: '2026-08-24 15:40', assetType: '厂房', assetStatus: '闲置', location: '长乐区玉田镇旧工业厂房', opCompany: '产投经营公司', propCompany: '产投集团' },
  { transferNo: 'DB-2026-008', assetName: '漳港海鲜市场摊位区', fromUnit: '领航公司', toUnit: '产投集团', transferType: '划拨', transferDate: '2026-09-02', approvalStatus: '待审批', beforeDept: '资产管理部', afterDept: '运营管理部', executeDate: '2026-09-10', reason: '文旅商业统筹经营', remark: '待现场核查', approvalDeadline: '2026-09-06 17:00', approvalStartTime: '2026-08-30 09:20', assetType: '市场', assetStatus: '已出租', location: '长乐区漳港街道海鲜市场', opCompany: '领航经营公司', propCompany: '领航公司' },
  { transferNo: 'DB-2026-009', assetName: '鹤上镇物流园 B 区仓库', fromUnit: '城投集团', toUnit: '水投集团', transferType: '转让', transferDate: '2026-09-08', approvalStatus: '已审批', beforeDept: '财务部', afterDept: '工程管理部', executeDate: '2026-09-15', reason: '物流仓储资源整合', remark: '', approvalDeadline: '2026-09-12 17:00', approvalStartTime: '2026-09-04 10:30', assetType: '仓库', assetStatus: '已出租', location: '长乐区鹤上镇物流园B区', opCompany: '城投经营公司', propCompany: '城投集团' },
  { transferNo: 'DB-2026-010', assetName: '文武砂数字产业园 5F', fromUnit: '产投集团', toUnit: '领航公司', transferType: '置换', transferDate: '2026-09-12', approvalStatus: '待审批', beforeDept: '综合办公室', afterDept: '资产管理部', executeDate: '2026-09-20', reason: '数字经济产业布局调整', remark: '涉及租约同步转移', approvalDeadline: '2026-09-16 17:00', approvalStartTime: '2026-09-09 14:00', assetType: '办公楼', assetStatus: '自用', location: '长乐区文武砂数字产业园5层', opCompany: '产投经营公司', propCompany: '产投集团' },
  { transferNo: 'DB-2026-011', assetName: '古槐镇便民服务中心', fromUnit: '水投集团', toUnit: '城投集团', transferType: '划拨', transferDate: '2026-09-15', approvalStatus: '已审批', beforeDept: '运营管理部', afterDept: '综合办公室', executeDate: '2026-09-22', reason: '便民服务设施统一运维', remark: '', approvalDeadline: '2026-09-19 17:00', approvalStartTime: '2026-09-11 08:40', assetType: '公共服务', assetStatus: '自用', location: '长乐区古槐镇便民服务中心', opCompany: '水投经营公司', propCompany: '水投集团' },
  { transferNo: 'DB-2026-012', assetName: '湖南镇标准厂房 5#', fromUnit: '领航公司', toUnit: '水投集团', transferType: '转让', transferDate: '2026-09-18', approvalStatus: '已驳回', beforeDept: '资产管理部', afterDept: '财务部', executeDate: '2026-09-25', reason: '厂房资产盘活转让', remark: '价格偏低被驳回', approvalDeadline: '2026-09-22 17:00', approvalStartTime: '2026-09-14 16:10', assetType: '厂房', assetStatus: '闲置', location: '长乐区湖南镇标准厂房5#', opCompany: '领航经营公司', propCompany: '领航公司' }
])

const filteredData = computed(() => {
  return transferRecords.value.filter(r => {
    if (userStore.isEnt && r.fromUnit !== currentCompany.value && r.toUnit !== currentCompany.value) return false
    if (filters.value.group && r.propCompany !== filters.value.group) return false
    if (filters.value.keyword && !r.assetName.includes(filters.value.keyword) && !r.transferNo.includes(filters.value.keyword)) return false
    if (filters.value.transferType && r.transferType !== filters.value.transferType) return false
    if (filters.value.approvalStatus && r.approvalStatus !== filters.value.approvalStatus) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const getApprovalType = (status) => {
  const map = { '待审批': 'warning', '已审批': 'success', '已驳回': 'danger' }
  return map[status] || 'info'
}

function showAddDialog() {
  isEdit.value = false
  form.value = { ...defaultForm, fromUnit: userStore.isEnt ? currentCompany.value : '' }
  dialogVisible.value = true
}

function editRecord(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

function viewRecord(row) {
  currentRow.value = row
  detailVisible.value = true
}

function deleteRecord(row) {
  ElMessageBox.confirm(`确认删除调拨记录"${row.transferNo}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = transferRecords.value.findIndex(r => r.transferNo === row.transferNo)
    if (idx !== -1) transferRecords.value.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function saveRecord() {
  if (!form.value.assetName || !form.value.fromUnit || !form.value.toUnit || !form.value.transferType || !form.value.transferDate) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    const target = transferRecords.value.find(r => r.transferNo === form.value.transferNo)
    if (target) Object.assign(target, { ...form.value })
  } else {
    const newNo = 'DB-2026-' + String(transferRecords.value.length + 1).padStart(3, '0')
    transferRecords.value.unshift({
      transferNo: newNo,
      ...form.value,
      approvalStatus: '待审批',
      executeDate: '',
      remark: '',
      beforeDept: '',
      afterDept: '',
      assetType: '',
      assetStatus: '',
      location: '',
      opCompany: '',
      propCompany: form.value.fromUnit,
      approvalDeadline: '',
      approvalStartTime: ''
    })
    page.value = 1
  }
  dialogVisible.value = false
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
}

function handleSearch() { page.value = 1 }
function resetFilters() { filters.value = { keyword: '', transferType: '', approvalStatus: '', group: '' } }
function handleExport() {
  const headers = ['调拨编号', '资产名称', '调拨类型', '调拨日期', '执行日期', '调出单位', '调入单位', '调拨原因', '审批状态']
  const rows = filteredData.value.map(item => [item.transferNo, item.assetName, item.transferType, item.transferDate, item.executeDate, item.fromUnit, item.toUnit, item.reason, item.approvalStatus])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_资产调拨_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const currentRow = ref(null)
const detailVisible = ref(false)

function viewAssetInfo(row) {
  currentRow.value = row
  detailVisible.value = true
}

function viewDetail(row) {
  currentRow.value = row
  detailVisible.value = true
}

function handleRowCommand(cmd, row) {
  if (cmd === 'assetInfo') viewAssetInfo(row)
  else if (cmd === 'view') viewRecord(row)
  else if (cmd === 'delete') deleteRecord(row)
}

const saveDialogVisible = ref(false)
const assetPickerVisible = ref(false)
const innerPage = ref(1)
const innerPageSize = ref(5)

const defaultSaveForm = {
  company: '', beforeDept: '', beforePerson: '', afterDept: '', afterPerson: '',
  transferDate: '', approvalDeadline: '', reason: '', remark: '', assets: []
}
const saveForm = ref({ ...defaultSaveForm, assets: [] })

const assetPool = ref([
  { region: '福建省福州市长乐区', project: '吴航商业街项目', zone: '吴航分区', opCompany: '城投经营公司', propCompany: '城投集团', assetNo: 'ZC-0101', assetName: '吴航街道商业街 A-02 商铺', location: '长乐区吴航街道商业街14号', assetType: '商铺', assetStatus: '闲置' },
  { region: '福建省福州市长乐区', project: '航城商务项目', zone: '航城分区', opCompany: '产投经营公司', propCompany: '产投集团', assetNo: 'ZC-0205', assetName: '航城商务楼 5F', location: '长乐区航城街道商务楼5层', assetType: '办公楼', assetStatus: '闲置' },
  { region: '福建省福州市长乐区', project: '营前厂房项目', zone: '营前分区', opCompany: '水投经营公司', propCompany: '水投集团', assetNo: 'ZC-0308', assetName: '营前标准厂房 3#', location: '长乐区营前街道标准厂房3#', assetType: '厂房', assetStatus: '闲置' },
  { region: '福建省福州市长乐区', project: '首占保障房项目', zone: '首占分区', opCompany: '领航经营公司', propCompany: '领航公司', assetNo: 'ZC-0412', assetName: '首占新区保障房 2# 楼', location: '长乐区首占新区保障房2#楼', assetType: '住宅', assetStatus: '已出租' },
  { region: '福建省福州市长乐区', project: '鹤上物流园项目', zone: '鹤上分区', opCompany: '城投经营公司', propCompany: '城投集团', assetNo: 'ZC-0517', assetName: '鹤上镇物流园 C 区仓库', location: '长乐区鹤上镇物流园C区', assetType: '仓库', assetStatus: '闲置' },
  { region: '福建省福州市长乐区', project: '数字产业园项目', zone: '文武砂分区', opCompany: '产投经营公司', propCompany: '产投集团', assetNo: 'ZC-0623', assetName: '文武砂数字产业园 6F', location: '长乐区文武砂数字产业园6层', assetType: '办公楼', assetStatus: '闲置' },
  { region: '福建省福州市长乐区', project: '漳港市场项目', zone: '漳港分区', opCompany: '领航经营公司', propCompany: '领航公司', assetNo: 'ZC-0728', assetName: '漳港海鲜市场摊位区 B 段', location: '长乐区漳港街道海鲜市场B段', assetType: '市场', assetStatus: '已出租' }
])

const pickableAssets = computed(() => {
  const chosen = new Set(saveForm.value.assets.map(a => a.assetNo))
  // 企业端只能挑本公司名下的资产
  return assetPool.value.filter(a => !chosen.has(a.assetNo) && (!userStore.isEnt || a.propCompany === currentCompany.value))
})

const pagedSaveAssets = computed(() => {
  const start = (innerPage.value - 1) * innerPageSize.value
  return saveForm.value.assets.slice(start, start + innerPageSize.value)
})

function showSaveDialog() {
  saveForm.value = { ...defaultSaveForm, company: userStore.isEnt ? currentCompany.value : '', assets: [] }
  innerPage.value = 1
  saveDialogVisible.value = true
}

function addSaveAsset(row) {
  saveForm.value.assets.push({ ...row })
  ElMessage.success(`已添加资产：${row.assetName}`)
}

function removeSaveAsset(index) {
  const realIndex = (innerPage.value - 1) * innerPageSize.value + index
  saveForm.value.assets.splice(realIndex, 1)
  if (pagedSaveAssets.value.length === 0 && innerPage.value > 1) innerPage.value--
}

function submitSaveTransfer() {
  const f = saveForm.value
  if (!f.company || !f.beforeDept || !f.beforePerson || !f.afterDept || !f.afterPerson || !f.transferDate || !f.approvalDeadline || !f.reason) {
    ElMessage.warning('请填写必填项')
    return
  }
  const newRecords = f.assets.map((asset, i) => ({
    transferNo: 'DB-2026-' + String(transferRecords.value.length + i + 1).padStart(3, '0'),
    assetName: asset.name || asset.assetName || '批量调拨资产',
    fromUnit: f.beforeDept,
    toUnit: f.afterDept,
    transferType: '批量调拨',
    transferDate: f.transferDate,
    approvalStatus: '待审批',
    beforeDept: f.beforeDept,
    afterDept: f.afterDept,
    executeDate: '',
    reason: f.reason,
    remark: '',
    assetType: asset.type || '',
    assetStatus: '',
    location: asset.location || '',
    opCompany: f.company,
    propCompany: f.beforeDept,
    approvalDeadline: f.approvalDeadline,
    approvalStartTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
  }))
  transferRecords.value.unshift(...newRecords)
  saveDialogVisible.value = false
  page.value = 1
  ElMessage.success(`资产调拨保存成功，共调拨 ${f.assets.length} 宗资产`)
}
</script>

<style scoped>
.page-container { height: 100%; }
.expand-grid { margin: 8px 16px 12px 48px; }
</style>
