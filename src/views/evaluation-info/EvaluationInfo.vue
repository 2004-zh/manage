<template>
  <div class="page-container">
    <div class="page-header">
      <h2>评估信息</h2>
      <div>
        <el-button type="primary" @click="showAddDialog">新增评估</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="成本信息" name="cost">
        <el-card class="filter-bar" shadow="never">
          <el-form :inline="true">
            <el-form-item>
              <el-input v-model="costFilters.keyword" placeholder="资产名称/编号/项目" clearable :prefix-icon="Search" style="width: 220px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="costFilters.company" placeholder="公司" clearable style="width: 220px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="costFilters.costType" placeholder="成本类型" clearable style="width: 150px">
                <el-option v-for="t in costTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCostSearch">查询</el-button>
              <el-button type="primary" plain :icon="Plus" @click="openCostDialog()">新增</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card fill" shadow="never">
          <el-table :data="pagedCosts" border stripe>
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-panel">
                  <div class="section-title">成本信息</div>
                  <div class="detail-grid">
                    <div class="cell"><div class="label">所属公司</div><div class="value hl">{{ row.company }}</div></div>
                    <div class="cell"><div class="label">创建时间</div><div class="value">{{ row.createTime }}</div></div>
                  </div>
                  <div class="section-title">其他费用明细</div>
                  <el-table v-if="row.extraFees.length" :data="row.extraFees" border size="small" style="width: 100%; margin-bottom: 12px">
                    <el-table-column prop="name" label="费用名称" min-width="180" />
                    <el-table-column prop="amount" label="金额(万元)" width="120" align="right" />
                    <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
                  </el-table>
                  <el-empty v-else description="暂无其他费用" :image-size="60" />
                  <div class="section-title">附件</div>
                  <div class="file-thumbs">
                    <div v-for="(f, i) in row.files" :key="i" class="thumb">
                      <el-icon :size="22"><Picture /></el-icon>
                      <span>{{ f }}</span>
                    </div>
                    <span v-if="!row.files.length" class="no-file">暂无附件</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="projectType" label="项目类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.projectType === '项目' ? 'warning' : 'primary'">{{ row.projectType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="项目/资产名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="costType" label="成本类型" width="120" />
            <el-table-column prop="amount" label="成本金额(万元)" width="130" align="right" />
            <el-table-column prop="costDate" label="成本日期" width="115" />
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openCostDialog(row)">修改</el-button>
                <el-button type="danger" link size="small" @click="deleteCost(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="costPage"
              v-model:page-size="costPageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="filteredCosts.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="评估信息" name="eval">
        <el-card class="filter-bar" shadow="never">
          <el-form :inline="true">
            <el-form-item>
              <el-input v-model="evFilters.org" placeholder="评估机构" clearable :prefix-icon="Search" style="width: 220px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="evFilters.projectType" placeholder="项目类型" clearable style="width: 150px">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="项目产权" value="项目产权" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Plus" @click="showAddDialog">新增</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card fill" shadow="never">
          <el-table :data="pagedEvals" border stripe @selection-change="handleEvalSelection">
            <el-table-column type="selection" width="45" />
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-panel">
                  <div class="section-title">评估详情</div>
                  <div class="detail-grid">
                    <div class="cell"><div class="label">评估机构</div><div class="value hl">{{ row.org }}</div></div>
                    <div class="cell"><div class="label">租赁单价</div><div class="value">{{ row.leasePrice }}</div></div>
                    <div class="cell"><div class="label">评估有效期限</div><div class="value">{{ row.validFrom }} 至 {{ row.validTo }}</div></div>
                    <div class="cell"><div class="label">创建时间</div><div class="value">{{ row.createTime }}</div></div>
                    <div class="cell"><div class="label">更新时间</div><div class="value">{{ row.updateTime }}</div></div>
                  </div>
                  <div class="section-title">附件</div>
                  <div class="file-thumbs">
                    <div v-for="(f, i) in row.files" :key="i" class="thumb">
                      <el-icon :size="22"><Picture /></el-icon>
                      <span>{{ f }}</span>
                    </div>
                    <span v-if="!row.files.length" class="no-file">暂无附件</span>
                  </div>
                  <div class="section-title">资产信息</div>
                  <div class="detail-grid">
                    <div class="cell"><div class="label">省市区</div><div class="value">{{ row.asset.region }}</div></div>
                    <div class="cell"><div class="label">项目名称</div><div class="value hl">{{ row.asset.projectName }}</div></div>
                    <div class="cell"><div class="label">项目地址</div><div class="value">{{ row.asset.projectAddr }}</div></div>
                    <div class="cell"><div class="label">分区</div><div class="value">{{ row.asset.zone }}</div></div>
                    <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.asset.assetName }}</div></div>
                    <div class="cell"><div class="label">资产编号</div><div class="value">{{ row.asset.assetNo }}</div></div>
                    <div class="cell"><div class="label">资产座落</div><div class="value">{{ row.asset.assetAddr }}</div></div>
                    <div class="cell"><div class="label">租赁状态</div><div class="value">{{ row.asset.leaseStatus }}</div></div>
                    <div class="cell">
                      <div class="label">状态</div>
                      <div class="value">
                        <el-tag size="small" :type="row.asset.status === '正常' ? 'success' : 'warning'">{{ row.asset.status }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="projectType" label="项目类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.projectType === '资产产权' ? 'primary' : 'warning'">{{ row.projectType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="company" label="所属公司" min-width="180" show-overflow-tooltip />
            <el-table-column label="评估有效期限" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">{{ row.validFrom }} 至 {{ row.validTo }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === '正常' ? 'success' : 'danger'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建/更新时间" min-width="170" show-overflow-tooltip sortable>
              <template #default="{ row }">{{ (row.createTime || '').slice(0, 10) }} 至 {{ (row.updateTime || '').slice(0, 10) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewEvalDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="evPage"
              v-model:page-size="evPageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="filteredEvals.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>

        <div class="section-title" style="margin-top: 16px">评估记录</div>

        <el-card class="filter-bar" shadow="never">
          <el-row :gutter="16">
            <el-col :span="5">
              <el-input v-model="filters.keyword" placeholder="资产名称/评估编号" clearable prefix-icon="Search" />
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.evalType" placeholder="评估类型" clearable>
                <el-option label="市场比较法" value="市场比较法" />
                <el-option label="收益还原法" value="收益还原法" />
                <el-option label="成本法" value="成本法" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.evalStatus" placeholder="评估状态" clearable>
                <el-option label="待评估" value="待评估" />
                <el-option label="已评估" value="已评估" />
                <el-option label="已过期" value="已过期" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="table-card fill" shadow="never">
          <el-table :data="pagedData" border stripe>
            <el-table-column prop="evalNo" label="评估编号" width="120" />
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="evalType" label="评估类型" width="110" />
            <el-table-column prop="evalOrg" label="评估机构" width="160" show-overflow-tooltip />
            <el-table-column prop="evalValue" label="评估价值(万元)" width="120" align="right" />
            <el-table-column prop="evalDate" label="评估日期 至 有效期至" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">{{ row.evalDate }} 至 {{ row.validUntil }}</template>
            </el-table-column>
            <el-table-column prop="evalStatus" label="评估状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.evalStatus)" size="small">{{ row.evalStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
                <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteRecord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="filteredData.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="costDialogVisible" :title="costIsEdit ? '修改成本信息' : '保存成本信息'" width="820px" destroy-on-close>
      <el-form :model="costForm" label-width="130px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="项目类型" required>
              <el-select v-model="costForm.projectType" placeholder="请选择" style="width: 100%">
                <el-option label="项目" value="项目" />
                <el-option label="资产" value="资产" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属公司" required>
              <el-select v-model="costForm.company" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产" required>
              <el-select v-model="costForm.assetName" placeholder="请选择资产" filterable style="width: 100%">
                <el-option v-for="a in assetStore.visibleAssets" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本类型" required>
              <el-select v-model="costForm.costType" placeholder="请选择" style="width: 100%">
                <el-option v-for="t in costTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本金额(万元)" required>
              <el-input-number v-model="costForm.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本日期" required>
              <el-date-picker v-model="costForm.costDate" type="date" placeholder="请选择成本日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" required>
          <el-input v-model="costForm.remark" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" list-type="picture-card" :limit="5">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="其他费用(万元)">
          <div style="width: 100%">
            <el-table v-if="costForm.extraFees.length" :data="costForm.extraFees" border size="small">
              <el-table-column label="费用名称" min-width="150">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" placeholder="费用名称" />
                </template>
              </el-table-column>
              <el-table-column label="金额" width="150">
                <template #default="{ row }">
                  <el-input-number v-model="row.amount" size="small" :min="0" :precision="2" style="width: 100%" />
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="150">
                <template #default="{ row }">
                  <el-input v-model="row.remark" size="small" placeholder="备注" />
                </template>
              </el-table-column>
              <el-table-column label="附件" width="90" align="center">
                <template #default>
                  <el-upload action="#" :auto-upload="false" :show-file-list="false">
                    <el-button type="primary" link size="small">上传</el-button>
                  </el-upload>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeFee($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无其他费用" :image-size="60" />
            <el-button type="primary" link :icon="Plus" @click="addFee">新增</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="costDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCost">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑评估' : '新增评估'" width="680px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="资产选择" required>
          <el-select v-model="form.assetName" placeholder="请选择资产" style="width:100%" filterable>
            <el-option v-for="a in assetStore.visibleAssets" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="评估类型" required>
          <el-select v-model="form.evalType" placeholder="请选择" style="width:100%">
            <el-option label="市场比较法" value="市场比较法" />
            <el-option label="收益还原法" value="收益还原法" />
            <el-option label="成本法" value="成本法" />
          </el-select>
        </el-form-item>
        <el-form-item label="评估机构" required>
          <el-input v-model="form.evalOrg" placeholder="请输入评估机构名称" />
        </el-form-item>
        <el-form-item label="评估价值(万元)" required>
          <el-input-number v-model="form.evalValue" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="评估日期" required>
          <el-date-picker v-model="form.evalDate" type="date" placeholder="请选择评估日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="有效期至" required>
          <el-date-picker v-model="form.validUntil" type="date" placeholder="请选择有效截止日" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="评估说明">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入评估说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="evalDetailVisible" title="详情" size="500px">
      <template v-if="currentEvalRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="评估编号">{{ currentEvalRow.evalNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentEvalRow.assetName }}</el-descriptions-item>
          <el-descriptions-item label="评估类型">{{ currentEvalRow.evalType }}</el-descriptions-item>
          <el-descriptions-item label="评估机构">{{ currentEvalRow.evalOrg }}</el-descriptions-item>
          <el-descriptions-item label="评估价值(万元)">{{ currentEvalRow.evalValue }}</el-descriptions-item>
          <el-descriptions-item label="评估日期">{{ currentEvalRow.evalDate }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ currentEvalRow.validUntil }}</el-descriptions-item>
          <el-descriptions-item label="评估状态">
            <el-tag :type="getStatusType(currentEvalRow.evalStatus)" size="small">{{ currentEvalRow.evalStatus }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Picture } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'

const assetStore = useAssetStore()
const activeTab = ref('cost')

const companyOptions = ['长乐区城市投资建设集团有限公司', '福州滨海新区建设集团有限公司', '长乐区国有资产营运有限公司', '吴航街道集体资产经营公司']
const costTypeOptions = ['购置成本', '建安成本', '改造成本', '维修成本', '税费支出', '其他成本']

const costFilters = ref({ keyword: '', company: '', costType: '' })
const costPage = ref(1)
const costPageSize = ref(15)

const costRecords = ref([
  { id: 'CB-001', projectType: '资产', name: '吴航街道商业街 A-01 商铺', company: '长乐区城市投资建设集团有限公司', costType: '购置成本', amount: 2100.00, costDate: '2020-03-15', remark: '商业街商铺购置款', createTime: '2024-03-12 09:30', files: ['购置合同.pdf', '发票.jpg'], extraFees: [{ name: '契税', amount: 63.00, remark: '按成交价3%缴纳' }, { name: '中介费', amount: 21.00, remark: '按成交价1%支付' }] },
  { id: 'CB-002', projectType: '资产', name: '航城商务楼 3F', company: '福州滨海新区建设集团有限公司', costType: '购置成本', amount: 6200.00, costDate: '2019-06-20', remark: '商务楼整层购置', createTime: '2024-04-02 10:15', files: ['购置合同.pdf'], extraFees: [{ name: '登记费', amount: 0.55, remark: '不动产登记工本费' }] },
  { id: 'CB-003', projectType: '项目', name: '营前标准厂房三期项目', company: '长乐区国有资产营运有限公司', costType: '建安成本', amount: 8600.00, costDate: '2023-11-30', remark: '三期厂房主体建安工程结算', createTime: '2024-05-20 16:02', files: ['结算书.pdf', '施工合同.pdf'], extraFees: [{ name: '监理费', amount: 86.00, remark: '按建安费1%计取' }, { name: '设计费', amount: 129.00, remark: '按建安费1.5%计取' }, { name: '勘察费', amount: 34.40, remark: '地质勘察' }] },
  { id: 'CB-004', projectType: '资产', name: '首占新区保障房 1# 楼', company: '长乐区城市投资建设集团有限公司', costType: '建安成本', amount: 5400.00, costDate: '2021-01-25', remark: '保障房1号楼建设成本', createTime: '2024-01-08 08:50', files: [], extraFees: [] },
  { id: 'CB-005', projectType: '项目', name: '吴航农贸市场升级项目', company: '吴航街道集体资产经营公司', costType: '改造成本', amount: 760.00, costDate: '2024-06-15', remark: '市场立面及摊位改造', createTime: '2024-06-15 14:33', files: ['改造合同.pdf'], extraFees: [{ name: '垃圾清运费', amount: 8.20, remark: '施工期间清运' }] },
  { id: 'CB-006', projectType: '资产', name: '江田镇仓储用地', company: '福州滨海新区建设集团有限公司', costType: '税费支出', amount: 320.00, costDate: '2020-05-15', remark: '土地出让金及契税', createTime: '2024-07-01 09:12', files: ['缴款凭证.jpg'], extraFees: [] },
  { id: 'CB-007', projectType: '资产', name: '梅花镇综合楼', company: '长乐区国有资产营运有限公司', costType: '维修成本', amount: 85.50, costDate: '2025-03-14', remark: '屋面防水及外墙修缮', createTime: '2025-03-14 09:55', files: [], extraFees: [{ name: '脚手架租赁', amount: 6.30, remark: '修缮期间租赁' }] },
  { id: 'CB-008', projectType: '项目', name: '安东大厦购置项目', company: '长乐区城市投资建设集团有限公司', costType: '购置成本', amount: 1280.00, costDate: '2017-12-01', remark: '安东大厦516室购置', createTime: '2023-11-05 15:40', files: ['产权证.pdf'], extraFees: [] },
  { id: 'CB-009', projectType: '资产', name: '玉田镇旧工业厂房', company: '吴航街道集体资产经营公司', costType: '其他成本', amount: 45.00, costDate: '2024-08-12', remark: '厂房安全鉴定及评估费用', createTime: '2024-08-12 10:08', files: [], extraFees: [] },
  { id: 'CB-010', projectType: '项目', name: '滨海新城安置房二期项目', company: '福州滨海新区建设集团有限公司', costType: '建安成本', amount: 15800.00, costDate: '2025-09-01', remark: '二期桩基及主体进度款', createTime: '2024-09-03 08:45', files: ['进度款支付单.pdf'], extraFees: [{ name: '检测费', amount: 42.00, remark: '桩基检测' }, { name: '临时设施费', amount: 68.00, remark: '项目部临建' }] },
  { id: 'CB-011', projectType: '资产', name: '漳港海鲜批发市场', company: '长乐区国有资产营运有限公司', costType: '维修成本', amount: 120.00, costDate: '2025-08-15', remark: '冷库设备更新维护', createTime: '2024-10-18 13:26', files: [], extraFees: [] }
])

const filteredCosts = computed(() => {
  const f = costFilters.value
  return costRecords.value.filter(r => {
    if (f.keyword && !r.name.includes(f.keyword) && !r.id.includes(f.keyword)) return false
    if (f.company && r.company !== f.company) return false
    if (f.costType && r.costType !== f.costType) return false
    return true
  })
})

const pagedCosts = computed(() => {
  const start = (costPage.value - 1) * costPageSize.value
  return filteredCosts.value.slice(start, start + costPageSize.value)
})

function handleCostSearch() { costPage.value = 1 }

const costDialogVisible = ref(false)
const costIsEdit = ref(false)
const editingCostId = ref('')

const defaultCostForm = { projectType: '', company: '', assetName: '', costType: '', amount: 0, costDate: '', remark: '', extraFees: [] }
const costForm = ref({ ...defaultCostForm, extraFees: [] })

function openCostDialog(row) {
  if (row) {
    costIsEdit.value = true
    editingCostId.value = row.id
    costForm.value = {
      projectType: row.projectType, company: row.company, assetName: row.name, costType: row.costType,
      amount: row.amount, costDate: row.costDate, remark: row.remark,
      extraFees: row.extraFees.map(f => ({ ...f }))
    }
  } else {
    costIsEdit.value = false
    editingCostId.value = ''
    costForm.value = { ...defaultCostForm, extraFees: [] }
  }
  costDialogVisible.value = true
}

function addFee() {
  costForm.value.extraFees.push({ name: '', amount: 0, remark: '' })
}

function removeFee(index) {
  costForm.value.extraFees.splice(index, 1)
}

function nowText() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function saveCost() {
  const f = costForm.value
  if (!f.projectType || !f.company || !f.assetName || !f.costType || !f.costDate || !f.remark) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (costIsEdit.value) {
    const rec = costRecords.value.find(r => r.id === editingCostId.value)
    if (rec) {
      Object.assign(rec, {
        projectType: f.projectType, company: f.company, name: f.assetName, costType: f.costType,
        amount: f.amount, costDate: f.costDate, remark: f.remark,
        extraFees: f.extraFees.map(x => ({ ...x }))
      })
    }
    ElMessage.success('修改成功')
  } else {
    costRecords.value.unshift({
      id: `CB-${String(costRecords.value.length + 1).padStart(3, '0')}`,
      projectType: f.projectType, name: f.assetName, company: f.company, costType: f.costType,
      amount: f.amount, costDate: f.costDate, remark: f.remark, createTime: nowText(),
      files: [], extraFees: f.extraFees.map(x => ({ ...x }))
    })
    ElMessage.success('保存成功')
  }
  costDialogVisible.value = false
}

function deleteCost(row) {
  ElMessageBox.confirm(`确认删除成本记录"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = costRecords.value.findIndex(r => r.id === row.id)
    if (idx !== -1) costRecords.value.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const evFilters = ref({ org: '', projectType: '' })
const evPage = ref(1)
const evPageSize = ref(15)
const selectedEvals = ref([])

const evalInfoRecords = ref([
  {
    id: 'PGX-001', projectType: '资产产权', company: '长乐区城市投资建设集团有限公司', org: '福建××资产评估有限公司', validFrom: '2025-01-15', validTo: '2027-01-14', status: '正常', createTime: '2025-01-15 09:30', updateTime: '2025-06-18 14:22', leasePrice: '1.80 元/㎡/天', files: ['评估报告.pdf', '评估明细表.xlsx'],
    asset: { region: '福建省福州市长乐区', projectName: '吴航商业街改造项目', projectAddr: '长乐区吴航街道解放路88号', zone: 'A区', assetName: '吴航街道商业街 A-01 商铺', assetNo: 'CT-001', assetAddr: '吴航街道商业街A区一层', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'PGX-002', projectType: '资产产权', company: '福州滨海新区建设集团有限公司', org: '福州××房地产评估所', validFrom: '2025-02-20', validTo: '2027-02-19', status: '正常', createTime: '2025-02-20 10:15', updateTime: '2025-07-01 09:40', leasePrice: '1.20 元/㎡/天', files: ['评估报告.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '航城商务楼项目', projectAddr: '长乐区航城街道会堂路1号', zone: 'B区', assetName: '航城商务楼 3F', assetNo: 'CT-002', assetAddr: '航城商务楼三层整层', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'PGX-003', projectType: '项目产权', company: '长乐区国有资产营运有限公司', org: '长乐××评估事务所', validFrom: '2024-03-10', validTo: '2026-03-09', status: '正常', createTime: '2024-03-10 16:02', updateTime: '2025-05-11 11:30', leasePrice: '0.65 元/㎡/天', files: ['评估报告.pdf', '现场照片.zip'],
    asset: { region: '福建省福州市长乐区', projectName: '营前标准厂房三期项目', projectAddr: '长乐区营前街道工业路9号', zone: 'C区', assetName: '营前标准厂房 2#', assetNo: 'CT-003', assetAddr: '营前工业集中区2号厂房', leaseStatus: '已出租', status: '在建' }
  },
  {
    id: 'PGX-004', projectType: '资产产权', company: '长乐区城市投资建设集团有限公司', org: '福建××土地评估有限公司', validFrom: '2023-05-08', validTo: '2025-05-07', status: '过期', createTime: '2023-05-08 08:50', updateTime: '2025-05-08 09:00', leasePrice: '0.40 元/㎡/天', files: [],
    asset: { region: '福建省福州市长乐区', projectName: '江田仓储物流项目', projectAddr: '长乐区江田镇滨海大道120号', zone: 'C区', assetName: '江田镇仓储用地', assetNo: 'CT-006', assetAddr: '江田镇仓储用地地块', leaseStatus: '闲置', status: '待处置' }
  },
  {
    id: 'PGX-005', projectType: '项目产权', company: '吴航街道集体资产经营公司', org: '福建××资产评估有限公司', validFrom: '2025-09-01', validTo: '2027-08-31', status: '正常', createTime: '2025-09-01 14:33', updateTime: '2025-09-01 14:33', leasePrice: '2.10 元/㎡/天', files: ['评估报告.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '吴航农贸市场升级项目', projectAddr: '长乐区吴航街道河下街32号', zone: 'B区', assetName: '吴航农贸市场', assetNo: 'CT-007', assetAddr: '吴航街道农贸市场主体建筑', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'PGX-006', projectType: '资产产权', company: '长乐区国有资产营运有限公司', org: '福州××房地产评估所', validFrom: '2024-08-10', validTo: '2026-08-09', status: '正常', createTime: '2024-08-10 11:26', updateTime: '2025-03-14 09:55', leasePrice: '0.90 元/㎡/天', files: ['评估报告.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '梅花镇综合楼项目', projectAddr: '长乐区梅花镇梅城路18号', zone: 'A区', assetName: '梅花镇综合楼', assetNo: 'CT-008', assetAddr: '梅花镇综合楼1-5层', leaseStatus: '部分出租', status: '正常' }
  },
  {
    id: 'PGX-007', projectType: '项目产权', company: '福州滨海新区建设集团有限公司', org: '长乐××评估事务所', validFrom: '2023-12-01', validTo: '2025-11-30', status: '过期', createTime: '2023-12-01 15:40', updateTime: '2025-12-01 08:30', leasePrice: '1.05 元/㎡/天', files: ['评估报告旧版.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '安东大厦购置项目', projectAddr: '长乐区航城街道安东路516号', zone: 'B区', assetName: '安东大厦516', assetNo: 'CT-009', assetAddr: '安东大厦5层516室', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'PGX-008', projectType: '资产产权', company: '长乐区城市投资建设集团有限公司', org: '福建××资产评估有限公司', validFrom: '2026-01-20', validTo: '2028-01-19', status: '正常', createTime: '2026-01-20 09:12', updateTime: '2026-01-20 09:12', leasePrice: '1.50 元/㎡/天', files: ['评估报告.pdf', '产权核对表.docx'],
    asset: { region: '福建省福州市长乐区', projectName: '漳港海鲜市场项目', projectAddr: '长乐区漳港街道海滨路21号', zone: 'B区', assetName: '漳港海鲜批发市场', assetNo: 'CT-012', assetAddr: '漳港海鲜市场主体及摊位', leaseStatus: '已出租', status: '正常' }
  }
])

const filteredEvals = computed(() => {
  const f = evFilters.value
  return evalInfoRecords.value.filter(r => {
    if (f.org && !r.org.includes(f.org)) return false
    if (f.projectType && r.projectType !== f.projectType) return false
    return true
  })
})

const pagedEvals = computed(() => {
  const start = (evPage.value - 1) * evPageSize.value
  return filteredEvals.value.slice(start, start + evPageSize.value)
})

function handleEvalSelection(rows) {
  selectedEvals.value = rows
}

function viewEvalDetail(row) {
  currentEvalRow.value = row
  evalDetailVisible.value = true
}

const page = ref(1)
const pageSize = ref(15)
const dialogVisible = ref(false)
const isEdit = ref(false)
const evalDetailVisible = ref(false)
const currentEvalRow = ref(null)

const filters = ref({ keyword: '', evalType: '', evalStatus: '' })

const defaultForm = { assetName: '', evalType: '', evalOrg: '', evalValue: 0, evalDate: '', validUntil: '', remark: '' }
const form = ref({ ...defaultForm })

const evalRecords = ref([
  { evalNo: 'PG-2026-001', assetName: '吴航街道商业街 A-01 商铺', evalType: '市场比较法', evalOrg: '福建××资产评估有限公司', evalValue: 2100.00, evalDate: '2026-01-15', validUntil: '2027-01-14', evalStatus: '已评估' },
  { evalNo: 'PG-2026-002', assetName: '航城商务楼 3F', evalType: '收益还原法', evalOrg: '福州××房地产评估所', evalValue: 6200.00, evalDate: '2026-02-20', validUntil: '2027-02-19', evalStatus: '已评估' },
  { evalNo: 'PG-2026-003', assetName: '营前标准厂房 2#', evalType: '成本法', evalOrg: '长乐××评估事务所', evalValue: 2400.00, evalDate: '2026-03-10', validUntil: '2027-03-09', evalStatus: '已评估' },
  { evalNo: 'PG-2026-004', assetName: '江田镇仓储用地', evalType: '市场比较法', evalOrg: '福建××土地评估有限公司', evalValue: 3500.00, evalDate: '2026-05-08', validUntil: '2027-05-07', evalStatus: '已评估' },
  { evalNo: 'PG-2026-005', assetName: '首占新区保障房 1# 楼', evalType: '收益还原法', evalOrg: '福建××资产评估有限公司', evalValue: 7100.00, evalDate: '2026-09-01', validUntil: '2027-08-31', evalStatus: '待评估' },
  { evalNo: 'PG-2025-006', assetName: '玉田镇旧工业厂房', evalType: '成本法', evalOrg: '长乐××评估事务所', evalValue: 920.00, evalDate: '2025-06-15', validUntil: '2026-06-14', evalStatus: '已过期' }
])

const filteredData = computed(() => {
  return evalRecords.value.filter(r => {
    if (filters.value.keyword && !r.assetName.includes(filters.value.keyword) && !r.evalNo.includes(filters.value.keyword)) return false
    if (filters.value.evalType && r.evalType !== filters.value.evalType) return false
    if (filters.value.evalStatus && r.evalStatus !== filters.value.evalStatus) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const getStatusType = (status) => {
  const map = { '待评估': 'warning', '已评估': 'success', '已过期': 'danger' }
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
  currentEvalRow.value = row
  evalDetailVisible.value = true
}

function deleteRecord(row) {
  ElMessageBox.confirm(`确认删除评估记录"${row.evalNo}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = evalRecords.value.findIndex(r => r.evalNo === row.evalNo)
    if (idx !== -1) evalRecords.value.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function saveRecord() {
  if (!form.value.assetName || !form.value.evalType || !form.value.evalOrg || !form.value.evalDate || !form.value.validUntil) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    const target = evalRecords.value.find(r => r.evalNo === form.value.evalNo)
    if (target) Object.assign(target, { ...form.value })
  } else {
    const newNo = 'PG-2026-' + String(evalRecords.value.length + 1).padStart(3, '0')
    evalRecords.value.unshift({
      evalNo: newNo, ...form.value,
      evalStatus: '已评估'
    })
    page.value = 1
  }
  dialogVisible.value = false
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
}

function handleSearch() { page.value = 1 }
function resetFilters() { filters.value = { keyword: '', evalType: '', evalStatus: '' } }
function handleExport() {
  const headers = ['评估编号', '资产名称', '评估类型', '评估机构', '评估价值(万元)', '评估日期', '有效期至', '评估状态']
  const rows = filteredData.value.map(item => [item.evalNo, item.assetName, item.evalType, item.evalOrg, item.evalValue, item.evalDate, item.validUntil, item.evalStatus])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_评估信息_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.expand-panel { padding: 12px 24px; background: var(--bg-page); }
.file-thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.file-thumbs .thumb {
  width: 92px; height: 92px; border: 1px solid var(--bd); border-radius: var(--r-sm); background: var(--bg-card);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; color: var(--t-weak); padding: 6px; text-align: center; word-break: break-all; overflow: hidden;
}
.file-thumbs .no-file { font-size: 13px; color: var(--t-weak); line-height: 92px; }
</style>
