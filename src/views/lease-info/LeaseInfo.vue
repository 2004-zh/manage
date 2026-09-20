<template>
  <div class="page-container">
    <div class="page-header">
      <h2>租赁信息</h2>
      <div>
        <el-button type="primary" @click="showAddDialog">新增租赁</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-tabs v-model="mainTab" type="border-card">
      <el-tab-pane label="规划信息" name="plan">
        <el-table :data="pagedPlans" border stripe>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-wrap">
                <div class="section-title">规划信息</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">规划用途</div><div class="value">{{ row.planUsage }}</div></div>
                  <div class="cell"><div class="label">规划年限</div><div class="value">{{ row.planYears }}</div></div>
                  <div class="cell"><div class="label">规划人</div><div class="value">{{ row.planner }}</div></div>
                  <div class="cell"><div class="label">规划日期</div><div class="value">{{ row.planDate }}</div></div>
                  <div class="cell"><div class="label">规划内容</div><div class="value hl">{{ row.planContent }}</div></div>
                </div>
                <div class="section-title">资产信息</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">省市区</div><div class="value">{{ row.region }}</div></div>
                  <div class="cell"><div class="label">项目名称</div><div class="value">{{ row.projectName }}</div></div>
                  <div class="cell"><div class="label">项目地址</div><div class="value">{{ row.projectAddress }}</div></div>
                  <div class="cell"><div class="label">分区</div><div class="value">{{ row.zone }}</div></div>
                  <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.assetName }}</div></div>
                  <div class="cell"><div class="label">资产编号</div><div class="value">{{ row.assetNo }}</div></div>
                  <div class="cell"><div class="label">资产座落</div><div class="value">{{ row.assetLocation }}</div></div>
                  <div class="cell"><div class="label">租赁状态</div><div class="value">{{ row.leaseStatus }}</div></div>
                  <div class="cell"><div class="label">状态</div><div class="value">{{ row.status }}</div></div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="planNo" label="项目编号" width="130" />
          <el-table-column prop="projectName" label="项目名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="projectType" label="项目类型" width="110" align="center">
            <template #default="{ row }">
              <el-tag type="primary" size="small" effect="dark">{{ row.projectType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="planUsage" label="规划用途" width="120" />
          <el-table-column prop="planner" label="规划人" width="100" />
          <el-table-column prop="planDate" label="规划日期" width="120" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="planStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="editPlan(row)">修改</el-button>
              <el-button type="danger" link size="small" @click="deletePlan(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="planPage"
            v-model:page-size="planPageSize"
            :page-sizes="[10, 20, 50]"
            :total="planRecords.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="备案信息" name="record">
        <el-card class="filter-bar" shadow="never">
          <el-row :gutter="16">
            <el-col :span="5">
              <el-input v-model="filters.keyword" placeholder="资产名称/合同编号/承租方" clearable :prefix-icon="Search" />
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.leaseStatus" placeholder="租赁状态" clearable>
                <el-option label="在租" value="在租" />
                <el-option label="已退租" value="已退租" />
                <el-option label="待起租" value="待起租" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.assetType" placeholder="资产类型" clearable>
                <el-option label="商铺" value="商铺" />
                <el-option label="写字楼" value="写字楼" />
                <el-option label="厂房" value="厂房" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-col>
          </el-row>
        </el-card>

        <el-table :data="pagedData" border stripe>
          <el-table-column type="expand" width="45">
            <template #default="{ row }">
              <div class="expand-wrap">
                <div class="section-title">租赁备案明细</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">月租金(元)</div><div class="value">{{ (row.monthlyRent || 0).toLocaleString() }}</div></div>
                  <div class="cell"><div class="label">资产类型</div><div class="value">{{ row.assetType || '—' }}</div></div>
                  <div class="cell"><div class="label">起租日</div><div class="value">{{ row.startDate }}</div></div>
                  <div class="cell"><div class="label">到期日</div><div class="value">{{ row.endDate }}</div></div>
                  <div class="cell"><div class="label">用途</div><div class="value">{{ row.usage || '—' }}</div></div>
                  <div class="cell"><div class="label">备注</div><div class="value">{{ row.remark || '—' }}</div></div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="contractNo" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="tenant" label="承租方" width="160" show-overflow-tooltip />
          <el-table-column prop="leaseArea" label="租赁面积(㎡)" width="110" align="right" />
          <el-table-column label="租期" width="170">
            <template #default="{ row }">{{ row.startDate }} 至 {{ row.endDate }}</template>
          </el-table-column>
          <el-table-column prop="leaseStatus" label="租赁状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.leaseStatus)" size="small">{{ row.leaseStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
              <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[15, 30, 50]"
            :total="filteredData.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="变更信息" name="change">
        <el-table :data="pagedChanges" border stripe>
          <el-table-column prop="changeNo" label="变更编号" width="130" />
          <el-table-column prop="projectName" label="关联项目" min-width="180" show-overflow-tooltip />
          <el-table-column prop="changeType" label="变更类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="warning" size="small" effect="plain">{{ row.changeType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="field" label="变更字段" width="120" />
          <el-table-column label="变更内容" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="before">{{ row.before }}</span>
              <span class="arrow">→</span>
              <span class="after">{{ row.after }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="applyDate" label="申请日期" width="120" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="changeStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewChange(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="changePage"
            v-model:page-size="changePageSize"
            :page-sizes="[10, 20, 50]"
            :total="changeRecords.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="planDialogVisible" :title="planEditIndex >= 0 ? '修改规划' : '新增规划'" width="680px" destroy-on-close>
      <el-form :model="planForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" required>
              <el-input v-model="planForm.projectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类型" required>
              <el-select v-model="planForm.projectType" placeholder="请选择" style="width:100%">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="项目产权" value="项目产权" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规划用途">
              <el-input v-model="planForm.planUsage" placeholder="请输入规划用途" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规划年限">
              <el-input v-model="planForm.planYears" placeholder="如：5年" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规划人">
              <el-select v-model="planForm.planner" placeholder="请选择" style="width:100%">
                <el-option v-for="p in planners" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规划日期">
              <el-date-picker v-model="planForm.planDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="状态">
          <el-select v-model="planForm.status" placeholder="请选择" style="width:200px">
            <el-option label="规划中" value="规划中" />
            <el-option label="待审批" value="待审批" />
            <el-option label="已生效" value="已生效" />
            <el-option label="已驳回" value="已驳回" />
          </el-select>
        </el-form-item>
        <el-form-item label="规划内容">
          <el-input v-model="planForm.planContent" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="请输入规划内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="changeDetailVisible" title="变更详情" width="600px">
      <el-descriptions :column="2" border v-if="currentChange">
        <el-descriptions-item label="变更编号">{{ currentChange.changeNo }}</el-descriptions-item>
        <el-descriptions-item label="变更类型">
          <el-tag type="warning" size="small" effect="plain">{{ currentChange.changeType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联项目" :span="2">{{ currentChange.projectName }}</el-descriptions-item>
        <el-descriptions-item label="变更字段">{{ currentChange.field }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="changeStatusType(currentChange.status)" size="small">{{ currentChange.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="变更前">{{ currentChange.before }}</el-descriptions-item>
        <el-descriptions-item label="变更后">{{ currentChange.after }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentChange.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请日期">{{ currentChange.applyDate }}</el-descriptions-item>
        <el-descriptions-item label="变更说明" :span="2">{{ currentChange.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="changeDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑租赁' : '新增租赁'" width="680px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="资产选择" required>
          <el-select v-model="form.assetName" placeholder="请选择资产" style="width:100%" filterable>
            <el-option v-for="a in assetStore.assets" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="承租方" required>
          <el-input v-model="form.tenant" placeholder="请输入承租方名称" />
        </el-form-item>
        <el-form-item label="租赁面积(㎡)" required>
          <el-input-number v-model="form.leaseArea" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="月租金(元)" required>
          <el-input-number v-model="form.monthlyRent" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="起租日" required>
          <el-date-picker v-model="form.startDate" type="date" placeholder="请选择起租日" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="到期日" required>
          <el-date-picker v-model="form.endDate" type="date" placeholder="请选择到期日" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="用途">
          <el-select v-model="form.usage" placeholder="请选择用途" style="width:100%">
            <el-option label="商业" value="商业" />
            <el-option label="办公" value="办公" />
            <el-option label="工业" value="工业" />
            <el-option label="仓储" value="仓储" />
            <el-option label="住宅" value="住宅" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="leaseDetailVisible" title="详情" size="500px">
      <template v-if="currentLeaseRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="合同编号">{{ currentLeaseRow.contractNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentLeaseRow.assetName }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentLeaseRow.tenant }}</el-descriptions-item>
          <el-descriptions-item label="租赁面积(㎡)">{{ currentLeaseRow.leaseArea }}</el-descriptions-item>
          <el-descriptions-item label="月租金(元)">{{ (currentLeaseRow.monthlyRent || 0).toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="起租日">{{ currentLeaseRow.startDate }}</el-descriptions-item>
          <el-descriptions-item label="到期日">{{ currentLeaseRow.endDate }}</el-descriptions-item>
          <el-descriptions-item label="租赁状态">
            <el-tag :type="getStatusType(currentLeaseRow.leaseStatus)" size="small">{{ currentLeaseRow.leaseStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产类型">{{ currentLeaseRow.assetType || '—' }}</el-descriptions-item>
          <el-descriptions-item label="用途">{{ currentLeaseRow.usage || '—' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentLeaseRow.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'

const assetStore = useAssetStore()
const mainTab = ref('plan')
const planners = ['张伟', '李娜', '王强', '刘敏', '陈杰']

const planRecords = ref([
  { id: 1, planNo: 'GH2026001', projectName: '吴航街道商业街盘活项目', projectType: '资产产权', planUsage: '商业零售', planYears: '5年', planner: '张伟', planDate: '2026-01-10', planContent: '统一规划为品牌零售业态，引入连锁商家整体运营。', region: '福建省福州市长乐区', projectAddress: '长乐区吴航街道商业街A区', zone: 'A区', assetName: '吴航街道商业街 A-01 商铺', assetNo: 'ZC00001', assetLocation: '吴航街道商业街A区1号', leaseStatus: '在租', status: '已生效' },
  { id: 2, planNo: 'GH2026002', projectName: '航城商务楼办公规划', projectType: '项目产权', planUsage: '商务办公', planYears: '8年', planner: '李娜', planDate: '2026-02-15', planContent: '整栋规划为科技型企业办公载体，配套共享会议空间。', region: '福建省福州市长乐区', projectAddress: '长乐区航城街道商务路88号', zone: 'B区', assetName: '航城商务楼 3F', assetNo: 'ZC00002', assetLocation: '航城街道商务路88号', leaseStatus: '在租', status: '已生效' },
  { id: 3, planNo: 'GH2026003', projectName: '营前标准厂房产业规划', projectType: '资产产权', planUsage: '工业生产', planYears: '10年', planner: '王强', planDate: '2026-03-01', planContent: '规划为智能制造产业园，重点引进高端装备企业。', region: '福建省福州市长乐区', projectAddress: '长乐区营前街道工业园', zone: 'C区', assetName: '营前标准厂房 2#', assetNo: 'ZC00003', assetLocation: '营前街道工业园区2号', leaseStatus: '在租', status: '待审批' },
  { id: 4, planNo: 'GH2026004', projectName: '首占保障房民生规划', projectType: '项目产权', planUsage: '住宅保障', planYears: '长期', planner: '刘敏', planDate: '2026-03-20', planContent: '作为区级保障性租赁住房，面向新市民及青年群体。', region: '福建省福州市长乐区', projectAddress: '长乐区首占镇新区', zone: 'D区', assetName: '首占新区保障房 1# 楼', assetNo: 'ZC00004', assetLocation: '首占镇新区民生路1号', leaseStatus: '在租', status: '已生效' },
  { id: 5, planNo: 'GH2026005', projectName: '吴航农贸市场升级规划', projectType: '资产产权', planUsage: '农贸市场', planYears: '6年', planner: '陈杰', planDate: '2026-04-05', planContent: '改造为智慧农贸综合体，引入生鲜电商前置仓。', region: '福建省福州市长乐区', projectAddress: '长乐区吴航街道市场路', zone: 'A区', assetName: '吴航农贸市场', assetNo: 'ZC00007', assetLocation: '吴航街道市场路12号', leaseStatus: '在租', status: '规划中' },
  { id: 6, planNo: 'GH2026006', projectName: '梅花镇综合楼文旅规划', projectType: '项目产权', planUsage: '文旅商业', planYears: '7年', planner: '张伟', planDate: '2026-04-18', planContent: '结合滨海资源规划为文旅商业综合体。', region: '福建省福州市长乐区', projectAddress: '长乐区梅花镇海滨路', zone: 'E区', assetName: '梅花镇综合楼', assetNo: 'ZC00008', assetLocation: '梅花镇海滨路66号', leaseStatus: '已退租', status: '待审批' },
  { id: 7, planNo: 'GH2026007', projectName: '安东大厦总部经济规划', projectType: '资产产权', planUsage: '总部办公', planYears: '5年', planner: '李娜', planDate: '2026-05-02', planContent: '规划为区域总部经济集聚区，引进龙头企业区域总部。', region: '江苏省南京市建邺区', projectAddress: '建邺区安东大厦', zone: 'F区', assetName: '安东大厦516', assetNo: 'ZC00009', assetLocation: '安东大厦5层516室', leaseStatus: '在租', status: '已生效' },
  { id: 8, planNo: 'GH2026008', projectName: '玉田旧厂房转型规划', projectType: '资产产权', planUsage: '创意产业', planYears: '9年', planner: '王强', planDate: '2026-05-25', planContent: '旧工业厂房转型为文创产业园，保留工业风貌。', region: '福建省福州市长乐区', projectAddress: '长乐区玉田镇旧工业区', zone: 'G区', assetName: '玉田镇旧工业厂房', assetNo: 'ZC00010', assetLocation: '玉田镇旧工业区9号', leaseStatus: '待起租', status: '规划中' },
  { id: 9, planNo: 'GH2026009', projectName: '鹤上创业园电商规划', projectType: '项目产权', planUsage: '电商仓储', planYears: '4年', planner: '刘敏', planDate: '2026-06-08', planContent: '规划为电商创业孵化园，配套直播基地与仓储。', region: '福建省福州市长乐区', projectAddress: '长乐区鹤上镇创业园', zone: 'H区', assetName: '鹤上镇创业园', assetNo: 'ZC00011', assetLocation: '鹤上镇创业园路1号', leaseStatus: '已退租', status: '已驳回' },
  { id: 10, planNo: 'GH2026010', projectName: '漳港仓储物流规划', projectType: '资产产权', planUsage: '仓储物流', planYears: '10年', planner: '陈杰', planDate: '2026-06-30', planContent: '建设区域冷链物流仓储中心，服务临空经济区。', region: '福建省福州市长乐区', projectAddress: '长乐区漳港街道物流园', zone: 'I区', assetName: '漳港街道仓储中心', assetNo: 'ZC00012', assetLocation: '漳港街道物流园路5号', leaseStatus: '待起租', status: '待审批' },
  { id: 11, planNo: 'GH2026011', projectName: '江田镇产业配套规划', projectType: '项目产权', planUsage: '产业配套', planYears: '6年', planner: '张伟', planDate: '2026-07-12', planContent: '为临港产业提供生产性配套服务设施。', region: '福建省福州市长乐区', projectAddress: '长乐区江田镇临港园', zone: 'J区', assetName: '江田镇配套用房', assetNo: 'ZC00013', assetLocation: '江田镇临港园路2号', leaseStatus: '待起租', status: '规划中' },
  { id: 12, planNo: 'GH2026012', projectName: '文武砂数字产业规划', projectType: '资产产权', planUsage: '数字经济', planYears: '8年', planner: '李娜', planDate: '2026-08-01', planContent: '规划为数字经济产业园，聚焦大数据与人工智能。', region: '福建省福州市长乐区', projectAddress: '长乐区文武砂街道数字园', zone: 'K区', assetName: '文武砂数字楼宇', assetNo: 'ZC00014', assetLocation: '文武砂街道数字园路8号', leaseStatus: '待起租', status: '已生效' }
])

const planPage = ref(1)
const planPageSize = ref(10)
const pagedPlans = computed(() => {
  const start = (planPage.value - 1) * planPageSize.value
  return planRecords.value.slice(start, start + planPageSize.value)
})
const planStatusType = (s) => ({ '已生效': 'success', '待审批': 'warning', '已驳回': 'danger', '规划中': 'info' }[s] || 'info')

const planDialogVisible = ref(false)
const planEditIndex = ref(-1)
const defaultPlanForm = { projectName: '', projectType: '', planUsage: '', planYears: '', planner: '', planDate: '', planContent: '', status: '规划中' }
const planForm = ref({ ...defaultPlanForm })

function editPlan(row) {
  planEditIndex.value = planRecords.value.findIndex(r => r.id === row.id)
  planForm.value = { ...row }
  planDialogVisible.value = true
}
function savePlan() {
  if (!planForm.value.projectName || !planForm.value.projectType) {
    ElMessage.warning('请填写项目名称与项目类型')
    return
  }
  if (planEditIndex.value >= 0) {
    Object.assign(planRecords.value[planEditIndex.value], planForm.value)
    ElMessage.success('修改成功')
  }
  planDialogVisible.value = false
}
function deletePlan(row) {
  ElMessageBox.confirm(`确定删除规划"${row.projectName}"吗？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = planRecords.value.findIndex(r => r.id === row.id)
    if (idx >= 0) planRecords.value.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const changeRecords = ref([
  { id: 1, changeNo: 'BG2026001', projectName: '吴航街道商业街盘活项目', changeType: '规划变更', field: '规划用途', before: '商业零售', after: '餐饮+零售', applicant: '张伟', applyDate: '2026-05-10', status: '已通过', remark: '结合业态调研调整用途' },
  { id: 2, changeNo: 'BG2026002', projectName: '航城商务楼办公规划', changeType: '年限变更', field: '规划年限', before: '5年', after: '8年', applicant: '李娜', applyDate: '2026-05-22', status: '已通过', remark: '延长规划年限以匹配招商周期' },
  { id: 3, changeNo: 'BG2026003', projectName: '营前标准厂房产业规划', changeType: '主体变更', field: '规划人', before: '王强', after: '刘敏', applicant: '王强', applyDate: '2026-06-03', status: '审核中', remark: '因岗位调整变更负责人' },
  { id: 4, changeNo: 'BG2026004', projectName: '首占保障房民生规划', changeType: '内容变更', field: '规划内容', before: '面向户籍家庭', after: '面向新市民及青年群体', applicant: '刘敏', applyDate: '2026-06-18', status: '已通过', remark: '扩大保障覆盖范围' },
  { id: 5, changeNo: 'BG2026005', projectName: '吴航农贸市场升级规划', changeType: '规划变更', field: '规划用途', before: '农贸市场', after: '智慧农贸综合体', applicant: '陈杰', applyDate: '2026-07-01', status: '已驳回', remark: '需补充交通影响评估' },
  { id: 6, changeNo: 'BG2026006', projectName: '安东大厦总部经济规划', changeType: '年限变更', field: '规划年限', before: '3年', after: '5年', applicant: '李娜', applyDate: '2026-07-15', status: '审核中', remark: '与承租方协商延长' },
  { id: 7, changeNo: 'BG2026007', projectName: '玉田旧厂房转型规划', changeType: '内容变更', field: '规划内容', before: '普通厂房', after: '文创产业园', applicant: '王强', applyDate: '2026-08-02', status: '已通过', remark: '转型文化创意产业' }
])
const changePage = ref(1)
const changePageSize = ref(10)
const pagedChanges = computed(() => {
  const start = (changePage.value - 1) * changePageSize.value
  return changeRecords.value.slice(start, start + changePageSize.value)
})
const changeStatusType = (s) => ({ '已通过': 'success', '审核中': 'warning', '已驳回': 'danger' }[s] || 'info')
const changeDetailVisible = ref(false)
const currentChange = ref(null)
function viewChange(row) { currentChange.value = row; changeDetailVisible.value = true }

const page = ref(1)
const pageSize = ref(15)
const dialogVisible = ref(false)
const isEdit = ref(false)
const leaseDetailVisible = ref(false)
const currentLeaseRow = ref(null)

const filters = ref({ keyword: '', leaseStatus: '', assetType: '' })

const defaultForm = { assetName: '', tenant: '', leaseArea: 0, monthlyRent: 0, startDate: '', endDate: '', usage: '', remark: '' }
const form = ref({ ...defaultForm })

const leaseRecords = ref([
  { contractNo: 'ZL-2026-001', assetName: '吴航街道商业街 A-01 商铺', tenant: '福州××商业管理有限公司', leaseArea: 320, monthlyRent: 35000, startDate: '2023-05-01', endDate: '2028-04-30', leaseStatus: '在租', assetType: '商铺' },
  { contractNo: 'ZL-2026-002', assetName: '航城商务楼 3F', tenant: '福建××科技有限公司', leaseArea: 1200, monthlyRent: 130000, startDate: '2025-01-01', endDate: '2027-12-31', leaseStatus: '在租', assetType: '写字楼' },
  { contractNo: 'ZL-2026-003', assetName: '营前标准厂房 2#', tenant: '长乐××物流有限公司', leaseArea: 3600, monthlyRent: 65000, startDate: '2024-03-01', endDate: '2026-09-30', leaseStatus: '在租', assetType: '厂房' },
  { contractNo: 'ZL-2026-004', assetName: '首占新区保障房 1# 楼', tenant: '长乐××物业管理有限公司', leaseArea: 1800, monthlyRent: 80000, startDate: '2024-06-01', endDate: '2029-05-31', leaseStatus: '在租', assetType: '商铺' },
  { contractNo: 'ZL-2026-005', assetName: '吴航农贸市场', tenant: '长乐××市场管理有限公司', leaseArea: 2100, monthlyRent: 56000, startDate: '2024-01-01', endDate: '2028-12-31', leaseStatus: '在租', assetType: '商铺' },
  { contractNo: 'ZL-2025-006', assetName: '梅花镇综合楼', tenant: '福建××贸易有限公司', leaseArea: 800, monthlyRent: 24000, startDate: '2023-01-01', endDate: '2025-12-31', leaseStatus: '已退租', assetType: '写字楼' },
  { contractNo: 'ZL-2026-007', assetName: '安东大厦516', tenant: '江苏望风有限公司', leaseArea: 60, monthlyRent: 10000, startDate: '2026-01-01', endDate: '2028-12-31', leaseStatus: '在租', assetType: '写字楼' },
  { contractNo: 'ZL-2026-008', assetName: '玉田镇旧工业厂房', tenant: '长乐××加工厂', leaseArea: 2400, monthlyRent: 36000, startDate: '2026-10-01', endDate: '2029-09-30', leaseStatus: '待起租', assetType: '厂房' },
  { contractNo: 'ZL-2025-009', assetName: '鹤上镇创业园', tenant: '福州××电商有限公司', leaseArea: 500, monthlyRent: 15000, startDate: '2024-06-01', endDate: '2026-05-31', leaseStatus: '已退租', assetType: '厂房' },
  { contractNo: 'ZL-2026-010', assetName: '漳港街道仓储中心', tenant: '福建××供应链有限公司', leaseArea: 4000, monthlyRent: 48000, startDate: '2026-11-01', endDate: '2029-10-31', leaseStatus: '待起租', assetType: '厂房' }
])

const filteredData = computed(() => {
  return leaseRecords.value.filter(r => {
    if (filters.value.keyword && !r.assetName.includes(filters.value.keyword) && !r.contractNo.includes(filters.value.keyword) && !r.tenant.includes(filters.value.keyword)) return false
    if (filters.value.leaseStatus && r.leaseStatus !== filters.value.leaseStatus) return false
    if (filters.value.assetType && r.assetType !== filters.value.assetType) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const getStatusType = (status) => {
  const map = { '在租': 'success', '已退租': 'info', '待起租': 'warning' }
  return map[status] || 'info'
}

function showAddDialog() {
  isEdit.value = false
  form.value = { ...defaultForm }
  dialogVisible.value = true
}

function editRecord(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

function viewRecord(row) {
  currentLeaseRow.value = row
  leaseDetailVisible.value = true
}

function saveRecord() {
  if (!form.value.assetName || !form.value.tenant || !form.value.startDate || !form.value.endDate) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    const target = leaseRecords.value.find(r => r.contractNo === form.value.contractNo)
    if (target) Object.assign(target, { ...form.value })
  } else {
    const newNo = 'ZL-2026-' + String(leaseRecords.value.length + 1).padStart(3, '0')
    leaseRecords.value.unshift({
      contractNo: newNo,
      ...form.value,
      leaseStatus: '在租',
      assetType: form.value.assetType || ''
    })
    page.value = 1
  }
  dialogVisible.value = false
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
}

function handleSearch() { page.value = 1 }
function resetFilters() { filters.value = { keyword: '', leaseStatus: '', assetType: '' }; page.value = 1 }
function handleExport() {
  const headers = ['合同编号', '资产名称', '承租方', '租赁面积(㎡)', '起租日', '到期日', '租赁状态']
  const rows = filteredData.value.map(item => [item.contractNo, item.assetName, item.tenant, item.leaseArea, item.startDate, item.endDate, item.leaseStatus])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_租赁信息_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.page-container { height: 100%; }
.expand-wrap { padding: 8px 24px 16px; }
.before { color: #999; text-decoration: line-through; }
.arrow { margin: 0 8px; color: var(--c-primary); }
.after { color: #333; font-weight: 600; }
</style>
