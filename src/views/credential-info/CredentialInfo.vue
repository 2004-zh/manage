<template>
  <div class="page-container">
    <div class="page-header">
      <h2>证件信息</h2>
      <div>
        <el-button type="primary" @click="showAddDialog">新增证件</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="证件名称/编号/证号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.certType" placeholder="证件类型" clearable>
            <el-option label="房产证" value="房产证" />
            <el-option label="土地证" value="土地证" />
            <el-option label="不动产权证" value="不动产权证" />
            <el-option label="规划许可证" value="规划许可证" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.certStatus" placeholder="证件状态" clearable>
            <el-option label="有效" value="有效" />
            <el-option label="即将到期" value="即将到期" />
            <el-option label="已过期" value="已过期" />
          </el-select>
        </el-col>
        <el-col :span="7">
          <el-date-picker
            v-model="filters.obtainRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始证件获得时间"
            end-placeholder="结束证件获得时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card fill" shadow="never">
      <el-table :data="pagedData" border stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-panel">
              <div class="section-title">证件详情</div>
              <div class="detail-grid">
                <div class="cell">
                  <div class="label">类型</div>
                  <div class="value">
                    <el-tag size="small" :type="row.catType === '资产' ? 'primary' : 'warning'">{{ row.catType }}</el-tag>
                  </div>
                </div>
                <div class="cell"><div class="label">证件类型</div><div class="value">{{ row.certType }}</div></div>
                <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                <div class="cell"><div class="label">证件号码</div><div class="value hl">{{ row.certCode }}</div></div>
                <div class="cell"><div class="label">证件获得日期</div><div class="value">{{ row.obtainDate }}</div></div>
                <div class="cell"><div class="label">备注</div><div class="value">{{ row.remark || '—' }}</div></div>
              </div>
              <div class="section-title">证件文件</div>
              <div class="file-thumbs">
                <div v-for="(f, i) in row.files" :key="i" class="thumb">
                  <el-icon :size="22"><Picture /></el-icon>
                  <span>{{ f }}</span>
                </div>
                <span v-if="!row.files.length" class="no-file">暂无证件文件</span>
              </div>
              <div class="section-title">关联资产</div>
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
        <el-table-column prop="catType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.catType === '资产' ? 'primary' : 'warning'">{{ row.catType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="certNo" label="证件编号" width="100" />
        <el-table-column prop="certName" label="证件名称" min-width="170" show-overflow-tooltip />
        <el-table-column prop="certType" label="证件类型" width="110" />
        <el-table-column prop="company" label="所属公司" min-width="180" show-overflow-tooltip />
        <el-table-column prop="relatedAsset" label="关联资产" min-width="160" show-overflow-tooltip />
        <el-table-column prop="certCode" label="证号" width="190" show-overflow-tooltip />
        <el-table-column prop="issueDate" label="发证日期" width="105" />
        <el-table-column prop="expiryDate" label="到期日期" width="105" />
        <el-table-column prop="certStatus" label="证件状态" width="95">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.certStatus)" size="small">{{ row.certStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="handleUpload(row)">上传附件</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑证件' : '新增证件'" width="680px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="证件名称" required>
          <el-input v-model="form.certName" placeholder="请输入证件名称" />
        </el-form-item>
        <el-form-item label="证件类型" required>
          <el-select v-model="form.certType" placeholder="请选择" style="width:100%">
            <el-option label="房产证" value="房产证" />
            <el-option label="土地证" value="土地证" />
            <el-option label="不动产权证" value="不动产权证" />
            <el-option label="规划许可证" value="规划许可证" />
          </el-select>
        </el-form-item>
        <el-form-item label="证号" required>
          <el-input v-model="form.certCode" placeholder="请输入证号" />
        </el-form-item>
        <el-form-item label="关联资产" required>
          <el-select v-model="form.relatedAsset" placeholder="请选择关联资产" style="width:100%" filterable>
            <el-option v-for="a in assetStore.visibleAssets" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="发证日期" required>
          <el-date-picker v-model="form.issueDate" type="date" placeholder="请选择发证日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="到期日期" required>
          <el-date-picker v-model="form.expiryDate" type="date" placeholder="请选择到期日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="证件附件">
          <el-upload action="#" :auto-upload="false" :limit="5" drag>
            <el-icon style="font-size: 40px; color: var(--t-weak);"><Plus /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF / JPG / PNG 格式，单个文件不超过 10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="类型">
            <el-tag size="small" :type="currentRow.catType === '资产' ? 'primary' : 'warning'">{{ currentRow.catType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="证件编号">{{ currentRow.certNo }}</el-descriptions-item>
          <el-descriptions-item label="证件名称">{{ currentRow.certName }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ currentRow.certType }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ currentRow.company }}</el-descriptions-item>
          <el-descriptions-item label="证号">{{ currentRow.certCode }}</el-descriptions-item>
          <el-descriptions-item label="关联资产">{{ currentRow.relatedAsset }}</el-descriptions-item>
          <el-descriptions-item label="发证日期">{{ currentRow.issueDate }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ currentRow.expiryDate }}</el-descriptions-item>
          <el-descriptions-item label="证件获得日期">{{ currentRow.obtainDate }}</el-descriptions-item>
          <el-descriptions-item label="证件状态">
            <el-tag :type="getStatusType(currentRow.certStatus)" size="small">{{ currentRow.certStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRow.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <el-dialog v-model="uploadDialogVisible" :title="'上传附件 - ' + (uploadTarget?.certNo || '')" width="500px" destroy-on-close>
      <el-upload drag action="" :auto-upload="false" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" :on-change="onUploadFileChange" :limit="5">
        <div style="padding: 20px">
          <p>将文件拖到此处，或点击上传</p>
          <p style="color: #999; font-size: 12px">支持图片、PDF、Word 格式，最多5个文件</p>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :disabled="!uploadFile">确认上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useCredentialStore } from '../../store/credential'

const assetStore = useAssetStore()
const credentialStore = useCredentialStore()

// 权证类证件直接落到资产的权证号并置为已办证；程序证件进证件层，联动推导办证状态
const RIGHT_CERT_TYPES = ['不动产权证', '房产证', '土地证']
function findAssetByName(name) {
  return assetStore.assets.find(a => a.name === name) || null
}
const page = ref(1)
const pageSize = ref(15)
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)

const filters = ref({ keyword: '', certType: '', certStatus: '', obtainRange: null })

const defaultForm = { certName: '', certType: '', certCode: '', relatedAsset: '', issueDate: '', expiryDate: '' }
const form = ref({ ...defaultForm })

const certRecords = ref([
  { certNo: 'ZJ-001', certName: '吴航商业街商铺产权证', certType: '不动产权证', relatedAsset: '吴航街道商业街 A-01 商铺', certCode: '闽(2020)长乐区不动产权第0012345号', issueDate: '2020-03-15', expiryDate: '2070-03-14', certStatus: '有效', catType: '资产', company: '长乐区城市投资建设集团有限公司', obtainDate: '2020-03-15', remark: '', files: ['产权证首页.jpg', '附记页.jpg'], asset: { region: '福建省福州市长乐区', projectName: '吴航商业街改造项目', projectAddr: '长乐区吴航街道解放路88号', zone: 'A区', assetName: '吴航街道商业街 A-01 商铺', assetNo: 'CT-001', assetAddr: '吴航街道商业街A区一层', leaseStatus: '已出租', status: '正常' } },
  { certNo: 'ZJ-002', certName: '航城商务楼产权证', certType: '不动产权证', relatedAsset: '航城商务楼 3F', certCode: '闽(2019)长乐区不动产权第0023456号', issueDate: '2019-06-20', expiryDate: '2069-06-19', certStatus: '有效', catType: '资产', company: '福州滨海新区建设集团有限公司', obtainDate: '2019-06-20', remark: '', files: ['产权证扫描件.pdf'], asset: { region: '福建省福州市长乐区', projectName: '航城商务楼项目', projectAddr: '长乐区航城街道会堂路1号', zone: 'B区', assetName: '航城商务楼 3F', assetNo: 'CT-002', assetAddr: '航城商务楼三层整层', leaseStatus: '已出租', status: '正常' } },
  { certNo: 'ZJ-003', certName: '营前厂房土地使用权证', certType: '土地证', relatedAsset: '营前标准厂房 2#', certCode: '闽(2018)长乐区不动产权第0034567号', issueDate: '2018-09-10', expiryDate: '2068-09-09', certStatus: '有效', catType: '项目', company: '长乐区国有资产营运有限公司', obtainDate: '2018-09-10', remark: '营前标准厂房三期项目用地', files: ['土地证正面.jpg', '宗地图.pdf'], asset: { region: '福建省福州市长乐区', projectName: '营前标准厂房三期项目', projectAddr: '长乐区营前街道工业路9号', zone: 'C区', assetName: '营前标准厂房 2#', assetNo: 'CT-003', assetAddr: '营前工业集中区2号厂房', leaseStatus: '已出租', status: '在建' } },
  { certNo: 'ZJ-004', certName: '首占保障房产权证', certType: '房产证', relatedAsset: '首占新区保障房 1# 楼', certCode: '闽(2021)长乐区不动产权第0045678号', issueDate: '2021-01-25', expiryDate: '2071-01-24', certStatus: '有效', catType: '项目', company: '长乐区城市投资建设集团有限公司', obtainDate: '2021-01-25', remark: '', files: ['房产证.jpg'], asset: { region: '福建省福州市长乐区', projectName: '首占保障房项目', projectAddr: '长乐区首占镇振铎路66号', zone: 'A区', assetName: '首占新区保障房 1# 楼', assetNo: 'CT-004', assetAddr: '首占新区一期1号楼', leaseStatus: '自用', status: '正常' } },
  { certNo: 'ZJ-005', certName: '吴航农贸市场规划许可证', certType: '规划许可证', relatedAsset: '吴航农贸市场', certCode: 'CLGH-2019-0156', issueDate: '2019-03-01', expiryDate: '2026-02-28', certStatus: '即将到期', catType: '项目', company: '吴航街道集体资产经营公司', obtainDate: '2019-03-01', remark: '需于到期前办理续期手续', files: ['规划许可证.pdf'], asset: { region: '福建省福州市长乐区', projectName: '吴航农贸市场升级项目', projectAddr: '长乐区吴航街道河下街32号', zone: 'B区', assetName: '吴航农贸市场', assetNo: 'CT-007', assetAddr: '吴航街道农贸市场主体建筑', leaseStatus: '已出租', status: '正常' } },
  { certNo: 'ZJ-006', certName: '江田仓储用地规划许可', certType: '规划许可证', relatedAsset: '江田镇仓储用地', certCode: 'CLGH-2020-0089', issueDate: '2020-05-15', expiryDate: '2025-05-14', certStatus: '已过期', catType: '资产', company: '福州滨海新区建设集团有限公司', obtainDate: '2020-05-15', remark: '许可证已过期，待重新申办', files: [], asset: { region: '福建省福州市长乐区', projectName: '江田仓储物流项目', projectAddr: '长乐区江田镇滨海大道120号', zone: 'C区', assetName: '江田镇仓储用地', assetNo: 'CT-006', assetAddr: '江田镇仓储用地地块', leaseStatus: '闲置', status: '待处置' } },
  { certNo: 'ZJ-007', certName: '梅花镇综合楼房产证', certType: '房产证', relatedAsset: '梅花镇综合楼', certCode: '闽(2020)长乐区不动产权第0067890号', issueDate: '2020-08-10', expiryDate: '2070-08-09', certStatus: '有效', catType: '资产', company: '长乐区国有资产营运有限公司', obtainDate: '2020-08-10', remark: '', files: ['房产证正本.jpg', '房产证副本.jpg'], asset: { region: '福建省福州市长乐区', projectName: '梅花镇综合楼项目', projectAddr: '长乐区梅花镇梅城路18号', zone: 'A区', assetName: '梅花镇综合楼', assetNo: 'CT-008', assetAddr: '梅花镇综合楼1-5层', leaseStatus: '部分出租', status: '正常' } },
  { certNo: 'ZJ-008', certName: '安东大厦不动产权证', certType: '不动产权证', relatedAsset: '安东大厦516', certCode: '闽(2017)长乐区不动产权第0098765号', issueDate: '2017-12-01', expiryDate: '2026-11-30', certStatus: '即将到期', catType: '资产', company: '长乐区城市投资建设集团有限公司', obtainDate: '2017-12-01', remark: '', files: ['不动产权证.pdf'], asset: { region: '福建省福州市长乐区', projectName: '安东大厦购置项目', projectAddr: '长乐区航城街道安东路516号', zone: 'B区', assetName: '安东大厦516', assetNo: 'CT-009', assetAddr: '安东大厦5层516室', leaseStatus: '已出租', status: '正常' } },
  { certNo: 'ZJ-009', certName: '玉田旧厂房房产证', certType: '房产证', relatedAsset: '玉田镇旧工业厂房', certCode: '闽(2015)长乐区房权字第0033221号', issueDate: '2015-04-18', expiryDate: '2065-04-17', certStatus: '有效', catType: '项目', company: '吴航街道集体资产经营公司', obtainDate: '2015-04-18', remark: '原乡镇企业房产，权属材料部分缺失', files: [], asset: { region: '福建省福州市长乐区', projectName: '玉田旧工业区改造项目', projectAddr: '长乐区玉田镇工业路5号', zone: 'C区', assetName: '玉田镇旧工业厂房', assetNo: 'CT-010', assetAddr: '玉田镇旧工业厂房1-2号楼', leaseStatus: '闲置', status: '待盘活' } },
  { certNo: 'ZJ-010', certName: '滨海新城安置房施工许可证', certType: '规划许可证', relatedAsset: '滨海新城安置房二期', certCode: 'CLSG-2022-0034', issueDate: '2022-02-10', expiryDate: '2027-02-09', certStatus: '有效', catType: '项目', company: '福州滨海新区建设集团有限公司', obtainDate: '2022-02-10', remark: '', files: ['施工许可证.pdf'], asset: { region: '福建省福州市长乐区', projectName: '滨海新城安置房二期项目', projectAddr: '长乐区滨海新城文武沙路7号', zone: 'A区', assetName: '滨海新城安置房二期', assetNo: 'CT-011', assetAddr: '滨海新城二期工地', leaseStatus: '未出租', status: '在建' } },
  { certNo: 'ZJ-011', certName: '漳港海鲜市场产权证', certType: '不动产权证', relatedAsset: '漳港海鲜批发市场', certCode: '闽(2021)长乐区不动产权第0044556号', issueDate: '2021-06-08', expiryDate: '2071-06-07', certStatus: '有效', catType: '资产', company: '长乐区国有资产营运有限公司', obtainDate: '2021-06-08', remark: '', files: ['产权证.pdf'], asset: { region: '福建省福州市长乐区', projectName: '漳港海鲜市场项目', projectAddr: '长乐区漳港街道海滨路21号', zone: 'B区', assetName: '漳港海鲜批发市场', assetNo: 'CT-012', assetAddr: '漳港海鲜市场主体及摊位', leaseStatus: '已出租', status: '正常' } },
  { certNo: 'ZJ-012', certName: '金峰纺织园区土地证', certType: '土地证', relatedAsset: '金峰纺织园区标准厂房', certCode: '闽(2016)长乐区国用第0022110号', issueDate: '2016-10-22', expiryDate: '2066-10-21', certStatus: '有效', catType: '项目', company: '长乐区城市投资建设集团有限公司', obtainDate: '2016-10-22', remark: '', files: ['土地证.jpg'], asset: { region: '福建省福州市长乐区', projectName: '金峰纺织园区项目', projectAddr: '长乐区金峰镇纺织一路2号', zone: 'C区', assetName: '金峰纺织园区标准厂房', assetNo: 'CT-013', assetAddr: '金峰纺织园区1-4号厂房', leaseStatus: '已出租', status: '正常' } }
])

const filteredData = computed(() => {
  return certRecords.value.filter(r => {
    if (filters.value.keyword && !r.certName.includes(filters.value.keyword) && !r.certNo.includes(filters.value.keyword) && !r.certCode.includes(filters.value.keyword)) return false
    if (filters.value.certType && r.certType !== filters.value.certType) return false
    if (filters.value.certStatus && r.certStatus !== filters.value.certStatus) return false
    const range = filters.value.obtainRange
    if (range && range.length === 2 && range[0] && range[1]) {
      if (r.obtainDate < range[0] || r.obtainDate > range[1]) return false
    }
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const getStatusType = (status) => {
  const map = { '有效': 'success', '即将到期': 'warning', '已过期': 'danger' }
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
  currentRow.value = row
  detailVisible.value = true
}

const uploadDialogVisible = ref(false)
const uploadTarget = ref(null)
const uploadFile = ref(null)

function handleUpload(row) {
  uploadTarget.value = row
  uploadFile.value = null
  uploadDialogVisible.value = true
}
function onUploadFileChange(file) {
  uploadFile.value = file
}
function submitUpload() {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  if (uploadTarget.value) {
    uploadTarget.value.files = uploadTarget.value.files || []
    uploadTarget.value.files.push(uploadFile.value.name)
  }
  uploadDialogVisible.value = false
  ElMessage.success(`附件 "${uploadFile.value?.name}" 已上传至 ${uploadTarget.value?.certNo}`)
}

function deleteRecord(row) {
  ElMessageBox.confirm(`确认删除证件"${row.certName}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = certRecords.value.findIndex(r => r.certNo === row.certNo)
    if (idx !== -1) certRecords.value.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function applyCertToAsset(f) {
  const asset = findAssetByName(f.relatedAsset)
  if (!asset) {
    ElMessage.warning(`未找到与“${f.relatedAsset}”匹配的台账资产，证件已登记但未联动办证状态`)
    return
  }
  if (RIGHT_CERT_TYPES.includes(f.certType)) {
    assetStore.updateAsset(asset.id, {
      certStatus: '已办证',
      certDetail: f.certCode,
      propertyRight: '有不动产证'
    }, { module: '证件管理', action: '登记权证', remark: `${f.certType} ${f.certCode}` })
    ElMessage.success(`已联动：${asset.name} 权证状态更新为「已办证」`)
  } else {
    credentialStore.addCredential({
      assetId: asset.id,
      group: asset.group,
      type: f.certType,
      certNo: f.certCode,
      issueDate: f.issueDate,
      status: '有效'
    })
    ElMessage.success(`已登记程序证件，${asset.name} 办证状态已按齐备度联动`)
  }
}

function saveRecord() {
  if (!form.value.certName || !form.value.certType || !form.value.certCode || !form.value.relatedAsset || !form.value.issueDate || !form.value.expiryDate) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    const target = certRecords.value.find(r => r.certNo === form.value.certNo)
    if (target) Object.assign(target, form.value)
    applyCertToAsset(form.value)
  } else {
    certRecords.value.unshift({
      ...form.value,
      certNo: `ZJ-${String(certRecords.value.length + 1).padStart(3, '0')}`,
      certStatus: '有效',
      catType: '资产',
      company: '',
      obtainDate: form.value.issueDate,
      remark: '',
      files: [],
      asset: { region: '', projectName: '', projectAddr: '', zone: '', assetName: form.value.relatedAsset, assetNo: '', assetAddr: '', leaseStatus: '', status: '正常' }
    })
    applyCertToAsset(form.value)
  }
  dialogVisible.value = false
}

function handleSearch() { page.value = 1 }
function resetFilters() { filters.value = { keyword: '', certType: '', certStatus: '', obtainRange: null }; page.value = 1 }
function handleExport() {
  const headers = ['类型', '证件编号', '证件名称', '证件类型', '所属公司', '关联资产', '证号', '发证日期', '到期日期', '证件状态', '备注']
  const rows = filteredData.value.map(item => [item.catType, item.certNo, item.certName, item.certType, item.company, item.relatedAsset, item.certCode, item.issueDate, item.expiryDate, item.certStatus, item.remark])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_证件信息_${new Date().toISOString().slice(0, 10)}.csv`
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
