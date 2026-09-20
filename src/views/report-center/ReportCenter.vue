<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <div>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>打印
        </el-button>
      </div>
    </div>

    <el-card>
      <el-tabs v-model="activeCategory" class="category-tabs">
        <el-tab-pane v-for="cat in categories" :key="cat" :label="cat" :name="cat" />
      </el-tabs>

      <el-form :inline="true" class="search-form">
        <el-form-item v-for="f in cfg.filters" :key="f.key" :label="f.label">
          <el-input
            v-if="f.type === 'input'"
            v-model="filterState[f.key]"
            :placeholder="'请输入' + f.label"
            clearable
            style="width: 180px"
          />
          <el-select
            v-else-if="f.type === 'select'"
            v-model="filterState[f.key]"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
          </el-select>
          <el-date-picker
            v-else
            v-model="filterState[f.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </el-form-item>
      </el-form>

      <div v-for="row in cfg.chips" :key="row.label" class="chip-row">
        <span class="chip-label">{{ row.label }}</span>
        <span
          v-for="opt in row.options"
          :key="opt"
          class="chip"
          :class="{ on: chipState[row.label] === opt }"
          @click="chipState[row.label] = opt"
        >{{ opt }}</span>
      </div>

      <el-table :data="pagedRows" border stripe style="width: 100%">
        <el-table-column
          v-for="col in cfg.columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.min"
          :show-overflow-tooltip="!!col.tip"
        >
          <template #default="{ row }">
            <el-tag v-if="col.tag" size="small" :type="tagType(row[col.prop])">{{ row[col.prop] }}</el-tag>
            <span v-else>{{ row[col.prop] }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据" :image-size="80" />
        </template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filteredRows.length"
          layout="total, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, Printer } from '@element-plus/icons-vue'

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || '报表中心')

const categories = ['房产类', '土地类', '经营类房屋店铺', '农贸市场', '运输设备', '矿产资源类', '公共设备类', '长期股权投资类', '经营性生产设备类', '特殊特种行业类', '经营权类资产', '特殊动植物类']
const activeCategory = ref('房产类')
const page = ref(1)
const pageSize = 10
const filterState = ref({})
const chipState = reactive({})

const SOURCE_CHIPS = { label: '来源类型', options: ['不限', '房屋拆迁', '收储', '征收', '法院判决', '股权合作', '置换代管', '投资建设', '还建', '回迁', '划入', '租入', '购入', '自筹建设', '托管', '移交资产'] }
const OWNERSHIP_CHIPS = { label: '资产权属', options: ['不限', '其他', '联营', '委托经营资产', '自有资产', '代管资产', '移交资产'] }

const CONFIG = {
  EntReportAssetStats: {
    filters: [
      { key: 'kw', label: '资产编号/名称', type: 'input' },
      { key: 'tenant', label: '租赁方信息', type: 'input' },
      { key: 'company', label: '所属公司', type: 'select', options: ['城投经营有限公司', '文旅经营有限公司', '农投经营有限公司', '江苏安东控股集团有限公司'] },
      { key: 'lease', label: '租赁状态', type: 'select', options: ['已使用', '未使用'] }
    ],
    chips: [SOURCE_CHIPS, OWNERSHIP_CHIPS],
    columns: [
      { prop: 'region', label: '省市区', width: 170, tip: true },
      { prop: 'project', label: '项目', width: 120, tip: true },
      { prop: 'district', label: '分区', width: 70 },
      { prop: 'company', label: '所属公司', width: 150, tip: true },
      { prop: 'code', label: '资产编号', width: 110 },
      { prop: 'name', label: '资产名称', min: 160, tip: true },
      { prop: 'leaseStatus', label: '租赁状态', width: 90, tag: true },
      { prop: 'type', label: '资产类型', width: 90 },
      { prop: 'layout', label: '资产房型', width: 90 }
    ],
    rows: [
      { category: '房产类', region: '江苏省/淮安市/涟水县/涟城街道', project: '涟水中央城', district: '24', company: '江苏安东控股集团有限公司', code: 'ZYC35106', name: '中央城35号楼106商铺', leaseStatus: '已使用', type: '商品房', layout: '场地' },
      { category: '房产类', region: '江苏省/淮安市/涟水县/涟城街道', project: '涟水中央城', district: '35', company: '江苏安东控股集团有限公司', code: 'ZYC35105', name: '中央城35号楼105商铺', leaseStatus: '已使用', type: '商品房', layout: '场地' },
      { category: '房产类', region: '江苏省/淮安市/涟水县/涟城街道', project: '涟水中央城', district: '35', company: '江苏安东控股集团有限公司', code: 'ZYC35104', name: '中央城35号楼104商铺', leaseStatus: '已使用', type: '商品房', layout: '场地' },
      { category: '房产类', region: '江苏省/淮安市/涟水县/涟城街道', project: '涟水中央城', district: '32', company: '江苏安东控股集团有限公司', code: 'ZYC32104', name: '中央城32号楼104商铺', leaseStatus: '已使用', type: '商品房', layout: '场地' },
      { category: '房产类', region: '江苏省/淮安市/涟水县/涟城街道', project: '涟水中央城', district: '33', company: '江苏安东控股集团有限公司', code: 'ZYC33106', name: '中央城33号楼106商铺', leaseStatus: '已使用', type: '商品房', layout: '场地' },
      { category: '房产类', region: '江苏省/淮安市/涟水县/涟城街道', project: '涟水中央城', district: '33', company: '江苏安东控股集团有限公司', code: 'ZYC33105', name: '中央城33号楼105商铺', leaseStatus: '已使用', type: '商品房', layout: '场地' },
      { category: '房产类', region: '北京市朝阳区/朝阳区', project: '阳光花园项目', district: 'A', company: '城投经营有限公司', code: 'ZC2024001', name: '阳光花园1号楼101室', leaseStatus: '已使用', type: '廉租房', layout: '三室一厅' },
      { category: '房产类', region: '北京市朝阳区/朝阳区', project: '阳光花园项目', district: 'B', company: '产投经营有限公司', code: 'ZC2024002', name: '阳光花园1号楼102室', leaseStatus: '未使用', type: '廉租房', layout: '三室一厅' },
      { category: '房产类', region: '湖北省/武汉市/武昌区', project: '国贸中心项目', district: 'A', company: '城投经营有限公司', code: 'ZC2024020', name: '国贸写字楼A座1501', leaseStatus: '已使用', type: '写字楼', layout: '整层' },
      { category: '农贸市场', region: '广东省/广州市/天河区', project: '朝阳农贸市场项目', district: 'C', company: '农投经营有限公司', code: 'ZC2024040', name: '朝阳农贸市场1号厅', leaseStatus: '已使用', type: '市场', layout: '摊位' },
      { category: '土地类', region: '福建省/福州市/长乐区', project: '长乐地块A', district: 'A', company: '城投经营有限公司', code: 'ZC2024050', name: '长乐区工业用地A1', leaseStatus: '未使用', type: '工业用地', layout: '—' },
      { category: '运输设备', region: '福建省/福州市', project: '运输车队', district: '—', company: '文旅经营有限公司', code: 'ZC2024060', name: '重型运输卡车01', leaseStatus: '已使用', type: '车辆', layout: '—' },
      { category: '公共设备类', region: '福建省/福州市/长乐区', project: '市政设施', district: '—', company: '城投经营有限公司', code: 'ZC2024070', name: '公共停车场设备', leaseStatus: '已使用', type: '设备', layout: '—' },
      { category: '长期股权投资类', region: '福建省/福州市', project: '股权投资项目', district: '—', company: '产投经营有限公司', code: 'ZC2024080', name: '海峡银行股权投资', leaseStatus: '已使用', type: '股权', layout: '—' },
      { category: '经营性生产设备类', region: '江苏省/淮安市', project: '生产基地', district: '—', company: '江苏安东控股集团有限公司', code: 'ZC2024090', name: '数控机床生产线', leaseStatus: '已使用', type: '设备', layout: '—' },
      { category: '特殊特种行业类', region: '福建省/福州市', project: '港口项目', district: '—', company: '城投经营有限公司', code: 'ZC2024100', name: '港口特种作业设备', leaseStatus: '已使用', type: '特种设备', layout: '—' },
      { category: '经营权类资产', region: '福建省/福州市/长乐区', project: '公交运营', district: '—', company: '城投经营有限公司', code: 'ZC2024110', name: '公交线路经营权', leaseStatus: '已使用', type: '经营权', layout: '—' },
      { category: '特殊动植物类', region: '福建省/福州市', project: '养殖基地', district: '—', company: '农投经营有限公司', code: 'ZC2024120', name: '水产养殖基地', leaseStatus: '已使用', type: '生物资产', layout: '—' },
      { category: '矿产资源类', region: '福建省/龙岩市', project: '矿区项目', district: '—', company: '产投经营有限公司', code: 'ZC2024130', name: '石灰石矿区', leaseStatus: '已使用', type: '矿产', layout: '—' },
      { category: '经营类房屋店铺', region: '福建省/福州市/鼓楼区', project: '商业街项目', district: 'A', company: '文旅经营有限公司', code: 'ZC2024140', name: '东街口商铺01', leaseStatus: '已使用', type: '商铺', layout: '店面' }
    ]
  },
  EntReportOperationStats: {
    filters: [
      { key: 'kw', label: '合同编号/承租方', type: 'input' },
      { key: 'company', label: '所属公司', type: 'select', options: ['城投经营有限公司', '文旅经营有限公司', '农投经营有限公司'] },
      { key: 'lease', label: '租赁状态', type: 'select', options: ['已出租', '部分出租', '未出租'] },
      { key: 'range', label: '租期', type: 'date' }
    ],
    chips: [{ label: '租金类型', options: ['不限', '固定租金', '递增租金', '提成租金'] }],
    columns: [
      { prop: 'code', label: '合同编号', width: 130 },
      { prop: 'name', label: '资产名称', min: 160, tip: true },
      { prop: 'tenant', label: '承租方', width: 150, tip: true },
      { prop: 'period', label: '租期', width: 170 },
      { prop: 'rent', label: '月租金(元)', width: 100 },
      { prop: 'collection', label: '收缴状态', width: 90, tag: true },
      { prop: 'lease', label: '租赁状态', width: 90, tag: true },
      { prop: 'rate', label: '出租率', width: 90 }
    ],
    rows: [
      { category: '经营类房屋店铺', code: 'HT-2026-001', name: '吴航街道商业街 A-01 商铺', tenant: '福州长乐融辉贸易有限公司', period: '2026-01-15 至 2028-01-14', rent: 8500, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '房产类', code: 'HT-2026-002', name: '航城商务楼 3F', tenant: '福建省长乐市鸿运纺织有限公司', period: '2026-02-01 至 2031-01-31', rent: 26000, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '房产类', code: 'HT-2025-018', name: '营前标准厂房 2#', tenant: '长乐区鑫源投资有限公司', period: '2025-07-01 至 2028-06-30', rent: 12800, collection: '欠缴', lease: '已出租', rate: '100%' },
      { category: '房产类', code: 'HT-2024-035', name: '福州航城物流有限公司仓库', tenant: '福州航城物流有限公司', period: '2024-04-01 至 2026-03-31', rent: 15600, collection: '欠缴', lease: '部分出租', rate: '72%' },
      { category: '房产类', code: 'HT-2026-009', name: '滨江科技园A座8层', tenant: '杭州星辰科技有限公司', period: '2026-03-01 至 2029-02-28', rent: 3200, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '经营类房屋店铺', code: 'HT-2025-027', name: '西湖区文三路商铺', tenant: '长乐吴航街道陈氏食品店', period: '2025-12-01 至 2027-11-30', rent: 1500, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '房产类', code: 'HT-2024-012', name: '首占新区保障房 1# 楼', tenant: '长乐××物业管理有限公司', period: '2024-06-01 至 2029-05-31', rent: 96, collection: '已缴', lease: '部分出租', rate: '81%' },
      { category: '农贸市场', code: 'HT-2024-015', name: '吴航农贸市场摊位区', tenant: '长乐××市场管理有限公司', period: '2024-01-01 至 2028-12-31', rent: 68, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '房产类', code: 'HT-2025-006', name: '航城商务楼 5F', tenant: '福建××科技有限公司', period: '2025-01-01 至 2027-12-31', rent: 156, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '土地类', code: 'HT-2026-011', name: '余杭区仓储中心3号库', tenant: '浙江蓝海贸易公司', period: '2026-05-01 至 2029-04-30', rent: 48000, collection: '欠缴', lease: '未出租', rate: '0%' },
      { category: '运输设备', code: 'HT-2026-015', name: '重型运输卡车01', tenant: '福州远洋运输有限公司', period: '2026-03-01 至 2028-02-28', rent: 15000, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '公共设备类', code: 'HT-2025-030', name: '公共停车场设备', tenant: '长乐区市政管理处', period: '2025-06-01 至 2027-05-31', rent: 3200, collection: '欠缴', lease: '已出租', rate: '100%' },
      { category: '长期股权投资类', code: 'HT-2026-020', name: '海峡银行股权投资', tenant: '福建海峡银行股份有限公司', period: '2026-01-01 至 2030-12-31', rent: 50000, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '经营性生产设备类', code: 'HT-2025-042', name: '数控机床生产线', tenant: '长乐恒达制造有限公司', period: '2025-09-01 至 2028-08-31', rent: 22000, collection: '欠缴', lease: '已出租', rate: '100%' },
      { category: '特殊特种行业类', code: 'HT-2026-025', name: '港口特种作业设备', tenant: '福州港务集团有限公司', period: '2026-04-01 至 2029-03-31', rent: 38000, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '经营权类资产', code: 'HT-2025-050', name: '公交线路经营权', tenant: '长乐区公交公司', period: '2025-01-01 至 2030-12-31', rent: 12000, collection: '已缴', lease: '已出租', rate: '100%' },
      { category: '特殊动植物类', code: 'HT-2026-030', name: '水产养殖基地', tenant: '福州绿源农业合作社', period: '2026-06-01 至 2029-05-31', rent: 8000, collection: '欠缴', lease: '已出租', rate: '100%' },
      { category: '矿产资源类', code: 'HT-2025-055', name: '石灰石矿区', tenant: '福建矿业开发有限公司', period: '2025-03-01 至 2030-02-28', rent: 45000, collection: '已缴', lease: '已出租', rate: '100%' }
    ]
  },
  EntReportFinanceStats: {
    filters: [
      { key: 'kw', label: '账单编号/承租方', type: 'input' },
      { key: 'fee', label: '费用类型', type: 'select', options: ['租金', '物业费', '水电费', '其他'] },
      { key: 'status', label: '缴费状态', type: 'select', options: ['已缴', '欠缴', '逾期'] },
      { key: 'range', label: '账单期间', type: 'date' }
    ],
    chips: [{ label: '费用类型', options: ['不限', '租金', '物业费', '水电费', '其他'] }],
    columns: [
      { prop: 'bill', label: '账单编号', width: 140 },
      { prop: 'tenant', label: '承租方', min: 180, tip: true },
      { prop: 'contract', label: '合同编号', width: 130 },
      { prop: 'month', label: '账单月份', width: 100 },
      { prop: 'feeType', label: '费用类型', width: 90 },
      { prop: 'due', label: '应收(元)', width: 110 },
      { prop: 'paid', label: '实缴(元)', width: 110 },
      { prop: 'status', label: '缴费状态', width: 90, tag: true }
    ],
    rows: [
      { category: '房产类', bill: 'ZD-2026-0801', tenant: '福州长乐融辉贸易有限公司', contract: 'HT-2026-001', month: '2026-08', feeType: '租金', due: 8500, paid: 8500, status: '已缴' },
      { category: '房产类', bill: 'ZD-2026-0802', tenant: '福建省长乐市鸿运纺织有限公司', contract: 'HT-2026-002', month: '2026-08', feeType: '租金', due: 26000, paid: 26000, status: '已缴' },
      { category: '房产类', bill: 'ZD-2026-0803', tenant: '长乐区鑫源投资有限公司', contract: 'HT-2025-018', month: '2026-08', feeType: '租金', due: 12800, paid: 0, status: '欠缴' },
      { category: '房产类', bill: 'ZD-2026-0804', tenant: '福州航城物流有限公司', contract: 'HT-2024-035', month: '2026-08', feeType: '物业费', due: 4600, paid: 0, status: '逾期' },
      { category: '房产类', bill: 'ZD-2026-0805', tenant: '杭州星辰科技有限公司', contract: 'HT-2026-009', month: '2026-08', feeType: '租金', due: 3200, paid: 3200, status: '已缴' },
      { category: '经营类房屋店铺', bill: 'ZD-2026-0806', tenant: '长乐吴航街道陈氏食品店', contract: 'HT-2025-027', month: '2026-08', feeType: '水电费', due: 1860, paid: 1860, status: '已缴' },
      { category: '房产类', bill: 'ZD-2026-0807', tenant: '长乐××物业管理有限公司', contract: 'HT-2024-012', month: '2026-08', feeType: '租金', due: 9600, paid: 9600, status: '已缴' },
      { category: '农贸市场', bill: 'ZD-2026-0808', tenant: '长乐××市场管理有限公司', contract: 'HT-2024-015', month: '2026-08', feeType: '租金', due: 6800, paid: 0, status: '欠缴' },
      { category: '房产类', bill: 'ZD-2026-0809', tenant: '福建××科技有限公司', contract: 'HT-2025-006', month: '2026-08', feeType: '物业费', due: 2300, paid: 2300, status: '已缴' },
      { category: '土地类', bill: 'ZD-2026-0810', tenant: '浙江蓝海贸易公司', contract: 'HT-2026-011', month: '2026-08', feeType: '其他', due: 500, paid: 0, status: '逾期' },
      { category: '运输设备', bill: 'ZD-2026-0811', tenant: '福州远洋运输有限公司', contract: 'HT-2026-015', month: '2026-08', feeType: '租金', due: 15000, paid: 15000, status: '已缴' },
      { category: '公共设备类', bill: 'ZD-2026-0812', tenant: '长乐区市政管理处', contract: 'HT-2025-030', month: '2026-08', feeType: '物业费', due: 3200, paid: 0, status: '欠缴' },
      { category: '长期股权投资类', bill: 'ZD-2026-0813', tenant: '福建海峡银行股份有限公司', contract: 'HT-2026-020', month: '2026-08', feeType: '其他', due: 50000, paid: 50000, status: '已缴' },
      { category: '经营性生产设备类', bill: 'ZD-2026-0814', tenant: '长乐恒达制造有限公司', contract: 'HT-2025-042', month: '2026-08', feeType: '租金', due: 22000, paid: 0, status: '逾期' },
      { category: '特殊特种行业类', bill: 'ZD-2026-0815', tenant: '福州港务集团有限公司', contract: 'HT-2026-025', month: '2026-08', feeType: '租金', due: 38000, paid: 38000, status: '已缴' },
      { category: '经营权类资产', bill: 'ZD-2026-0816', tenant: '长乐区公交公司', contract: 'HT-2025-050', month: '2026-08', feeType: '其他', due: 12000, paid: 12000, status: '已缴' },
      { category: '特殊动植物类', bill: 'ZD-2026-0817', tenant: '福州绿源农业合作社', contract: 'HT-2026-030', month: '2026-08', feeType: '租金', due: 8000, paid: 0, status: '欠缴' },
      { category: '矿产资源类', bill: 'ZD-2026-0818', tenant: '福建矿业开发有限公司', contract: 'HT-2025-055', month: '2026-08', feeType: '租金', due: 45000, paid: 45000, status: '已缴' }
    ]
  },
  EntReportInventoryStats: {
    filters: [
      { key: 'kw', label: '盘点单号/范围', type: 'input' },
      { key: 'company', label: '所属公司', type: 'select', options: ['城投经营有限公司', '文旅经营有限公司', '农投经营有限公司'] },
      { key: 'status', label: '盘点状态', type: 'select', options: ['已完成', '进行中', '待盘点'] },
      { key: 'range', label: '盘点日期', type: 'date' }
    ],
    chips: [{ label: '盘点类型', options: ['不限', '全面盘点', '抽样盘点', '离任盘点'] }],
    columns: [
      { prop: 'code', label: '盘点单号', width: 130 },
      { prop: 'scope', label: '盘点范围', min: 180, tip: true },
      { prop: 'type', label: '盘点类型', width: 90 },
      { prop: 'date', label: '盘点日期', width: 110 },
      { prop: 'owner', label: '负责人', width: 90 },
      { prop: 'book', label: '账面数(宗)', width: 90 },
      { prop: 'actual', label: '实盘数(宗)', width: 90 },
      { prop: 'diff', label: '差异数(宗)', width: 90 },
      { prop: 'status', label: '盘点状态', width: 90, tag: true }
    ],
    rows: [
      { category: '房产类', code: 'PD-2026-001', scope: '涟水中央城 24-35 分区', type: '全面盘点', date: '2026-03-15', owner: '陈秀英', book: 120, actual: 120, diff: 0, status: '已完成' },
      { category: '房产类', code: 'PD-2026-002', scope: '阳光花园项目全部楼栋', type: '全面盘点', date: '2026-04-20', owner: '林建国', book: 86, actual: 85, diff: 1, status: '已完成' },
      { category: '房产类', code: 'PD-2026-003', scope: '国贸中心A/B座写字楼', type: '抽样盘点', date: '2026-05-18', owner: '周敏', book: 42, actual: 42, diff: 0, status: '已完成' },
      { category: '农贸市场', code: 'PD-2026-004', scope: '朝阳农贸市场 1/2 号厅', type: '全面盘点', date: '2026-06-22', owner: '吴海涛', book: 64, actual: 62, diff: 2, status: '已完成' },
      { category: '经营类房屋店铺', code: 'PD-2026-005', scope: '万达广场商铺 A/B 区', type: '抽样盘点', date: '2026-07-10', owner: '陈秀英', book: 38, actual: 38, diff: 0, status: '已完成' },
      { category: '房产类', code: 'PD-2026-006', scope: '高新技术产业园厂房 C1/C2', type: '全面盘点', date: '2026-08-05', owner: '林建国', book: 12, actual: 12, diff: 0, status: '进行中' },
      { category: '房产类', code: 'PD-2026-007', scope: '滨江科技园A座整层', type: '抽样盘点', date: '2026-08-25', owner: '周敏', book: 26, actual: 26, diff: 0, status: '进行中' },
      { category: '土地类', code: 'PD-2026-008', scope: '余杭区仓储中心全部库房', type: '全面盘点', date: '2026-09-10', owner: '吴海涛', book: 18, actual: 0, diff: 0, status: '待盘点' },
      { category: '运输设备', code: 'PD-2026-009', scope: '运输车队全部车辆', type: '全面盘点', date: '2026-09-15', owner: '陈秀英', book: 15, actual: 0, diff: 0, status: '待盘点' },
      { category: '公共设备类', code: 'PD-2026-010', scope: '市政公共设施', type: '抽样盘点', date: '2026-09-20', owner: '林建国', book: 30, actual: 0, diff: 0, status: '待盘点' }
    ]
  },
  EntReportRepairStats: {
    filters: [
      { key: 'kw', label: '工单号/资产名称', type: 'input' },
      { key: 'company', label: '所属公司', type: 'select', options: ['城投经营有限公司', '文旅经营有限公司', '农投经营有限公司'] },
      { key: 'status', label: '工单状态', type: 'select', options: ['已完成', '维修中', '待派单'] },
      { key: 'range', label: '报修日期', type: 'date' }
    ],
    chips: [{ label: '维修类型', options: ['不限', '自修', '委外维修', '应急抢修'] }],
    columns: [
      { prop: 'code', label: '工单号', width: 130 },
      { prop: 'name', label: '资产名称', min: 170, tip: true },
      { prop: 'content', label: '报修内容', min: 150, tip: true },
      { prop: 'type', label: '维修类型', width: 90 },
      { prop: 'report', label: '报修日期', width: 110 },
      { prop: 'done', label: '完成日期', width: 110 },
      { prop: 'cost', label: '维修费用(元)', width: 110 },
      { prop: 'status', label: '工单状态', width: 90, tag: true }
    ],
    rows: [
      { category: '房产类', code: 'WX-2026-015', name: '中央城33号楼105商铺', content: '空调压缩机更换', type: '委外维修', report: '2026-08-02', done: '2026-08-05', cost: 8500, status: '已完成' },
      { category: '房产类', code: 'WX-2026-016', name: '阳光花园1号楼101室', content: '卫生间防水重做', type: '委外维修', report: '2026-08-06', done: '2026-08-12', cost: 4600, status: '已完成' },
      { category: '房产类', code: 'WX-2026-017', name: '国贸写字楼A座1501', content: '门禁读卡器故障', type: '自修', report: '2026-08-09', done: '2026-08-09', cost: 0, status: '已完成' },
      { category: '农贸市场', code: 'WX-2026-018', name: '朝阳农贸市场1号厅', content: '排水沟堵塞清淤', type: '应急抢修', report: '2026-08-14', done: '2026-08-14', cost: 1200, status: '已完成' },
      { category: '经营类房屋店铺', code: 'WX-2026-019', name: '万达广场商铺A101', content: '卷帘门电机异响', type: '自修', report: '2026-08-18', done: '2026-08-20', cost: 350, status: '已完成' },
      { category: '房产类', code: 'WX-2026-020', name: '航城商务楼 3F', content: '消防喷淋头渗漏', type: '委外维修', report: '2026-08-23', done: '', cost: 2600, status: '维修中' },
      { category: '土地类', code: 'WX-2026-021', name: '余杭区仓储中心3号库', content: '屋面彩钢板掀翻', type: '应急抢修', report: '2026-08-27', done: '', cost: 15800, status: '维修中' },
      { category: '房产类', code: 'WX-2026-022', name: '阳光花园2号楼201室', content: '入户门锁芯更换', type: '自修', report: '2026-09-01', done: '', cost: 0, status: '待派单' },
      { category: '房产类', code: 'WX-2026-023', name: '国贸写字楼B座801', content: '电梯困人检修', type: '委外维修', report: '2026-09-03', done: '', cost: 6800, status: '维修中' },
      { category: '房产类', code: 'WX-2026-024', name: '涟水中央城35号楼104商铺', content: '外立面脱落修补', type: '委外维修', report: '2026-09-08', done: '', cost: 0, status: '待派单' }
    ]
  }
}

const cfg = computed(() => CONFIG[route.name] || CONFIG.EntReportAssetStats)

const initChipState = () => {
  Object.keys(chipState).forEach(k => delete chipState[k])
  cfg.value.chips.forEach(row => { chipState[row.label] = '不限' })
}

watch(() => route.name, () => {
  page.value = 1
  filterState.value = {}
  initChipState()
}, { immediate: true })

const filteredRows = computed(() => {
  let rows = cfg.value.rows
  if (activeCategory.value) {
    rows = rows.filter(r => !r.category || r.category === activeCategory.value)
  }
  const fs = filterState.value
  if (fs.kw) {
    const kw = fs.kw.toLowerCase()
    rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(kw)))
  }
  cfg.value.filters.forEach(f => {
    if (f.key === 'kw') return
    const val = fs[f.key]
    if (val) {
      const col = cfg.value.columns.find(c => {
        const labelMap = { tenant: '承租方', company: '所属公司', lease: '租赁状态', fee: '费用类型', status: '缴费状态', type: '类型', range: '' }
        return c.label === (labelMap[f.key] || f.label)
      })
      if (col) rows = rows.filter(r => String(r[col.prop]) === String(val))
    }
  })
  cfg.value.chips.forEach(chip => {
    const sel = chipState[chip.label]
    if (sel && sel !== '不限') {
      const col = cfg.value.columns.find(c => c.label === chip.label)
      if (col) rows = rows.filter(r => String(r[col.prop]) === sel)
    }
  })
  return rows
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

const tagType = (v) => ({
  '已使用': 'success', '已出租': 'success', '已缴': 'success', '已完成': 'success',
  '未使用': 'warning', '部分出租': 'warning', '欠缴': 'warning', '进行中': 'warning', '待盘点': 'info', '待派单': 'info',
  '逾期': 'danger', '未出租': 'info'
}[v] || 'info')

const handleSearch = () => {
  page.value = 1
  ElMessage.success('查询完成')
}

const handleReset = () => {
  filterState.value = {}
  initChipState()
  page.value = 1
}

const handleExport = () => {
  const cols = cfg.value.columns
  const headers = cols.map(c => c.label)
  const rows = filteredRows.value.map(r => cols.map(c => r[c.prop]))
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pageTitle.value}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const handlePrint = () => {
  ElMessage.success(`${pageTitle.value} 打印预览`)
  window.print()
}
</script>

<style scoped>
.category-tabs {
  margin-bottom: 4px;
}

.search-form {
  margin-bottom: 4px;
}
</style>
