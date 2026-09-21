<template>
  <div class="ent-cert">
    <div class="page-header">
      <h2>产权信息</h2>
    </div>

    <div class="section-title">资债权证</div>

    <div class="filter-bar">
      <el-form :inline="true">
        <el-form-item label="权证状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width: 160px">
            <el-option label="已办证" value="已办证" />
            <el-option label="未办证（办理中）" value="办理中" />
            <el-option label="未办证（未启动）" value="未启动" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div style="margin-bottom: 12px">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic title="已办证" :value="certStats.certified" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="办理中" :value="certStats.processing" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="未启动" :value="certStats.notStarted">
            <template #suffix><el-tag type="danger" size="small">需关注</el-tag></template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>

    <el-table :data="filteredRecords" border stripe class="table-card" style="margin-bottom: 16px">
      <el-table-column prop="assetId" label="资产编号" width="100" />
      <el-table-column prop="assetName" label="资产名称" min-width="200" />
      <el-table-column prop="location" label="位置" width="100" />
      <el-table-column prop="certStatus" label="权证状态" width="160">
        <template #default="{ row }">
          <el-tag :type="row.certStatus.includes('已办证') ? 'success' : 'danger'" size="small">{{ row.certStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="办证进度" min-width="200" show-overflow-tooltip />
    </el-table>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="产权信息" name="prop">
        <div class="toolbar-row">
          <el-button type="primary" :icon="Plus" @click="openPropDialog()">新增产权证件</el-button>
        </div>

        <el-card class="filter-bar" shadow="never">
          <el-form :inline="true">
            <el-form-item>
              <el-input v-model="propFilters.keyword" placeholder="资产信息/产权编号" clearable :prefix-icon="Search" style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.company" placeholder="公司" clearable style="width: 200px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.certType" placeholder="产权证类型" clearable style="width: 150px">
                <el-option v-for="t in certTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.projectType" placeholder="项目类型" clearable style="width: 140px">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="项目产权" value="项目产权" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.propType" placeholder="产权类型" clearable style="width: 140px">
                <el-option v-for="t in propTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePropSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card" shadow="never">
          <el-table :data="pagedProps" border stripe>
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-panel">
                  <div class="section-title">产权证比例</div>
                  <el-table :data="row.ratios" border size="small" style="width: 460px; margin-bottom: 12px">
                    <el-table-column prop="name" label="名称" min-width="200" />
                    <el-table-column prop="ratio" label="比例%" width="120" align="right" />
                  </el-table>
                  <div class="section-title">证件文件</div>
                  <div class="file-thumbs">
                    <div v-for="(f, i) in row.files" :key="i" class="thumb">
                      <el-icon :size="22"><Picture /></el-icon>
                      <span>{{ f }}</span>
                    </div>
                    <span v-if="!row.files.length" class="no-file">暂无证件文件</span>
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
            <el-table-column prop="projectType" label="项目类型" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="row.projectType === '资产产权' ? 'primary' : 'warning'">{{ row.projectType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hasCert" label="产权证有无" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.hasCert === '有' ? 'success' : 'danger'">{{ row.hasCert }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="certNo" label="产权编号" width="170" show-overflow-tooltip />
            <el-table-column prop="certType" label="产权证类型" width="120" />
            <el-table-column prop="ratioType" label="产权比例类型" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.ratioType === '单独所有' ? 'primary' : 'warning'" effect="plain">{{ row.ratioType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注（缺证原因）" min-width="160" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column prop="updateTime" label="更新时间" width="160" />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openPropDialog(row)">修改</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="propPage"
              v-model:page-size="propPageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="filteredProps.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="证件信息" name="cert">
        <el-card class="table-card" shadow="never">
          <el-table :data="pagedCertTab" border stripe size="small">
            <el-table-column prop="certName" label="证件名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="certType" label="证件类型" width="120" />
            <el-table-column prop="certCode" label="证件号码" min-width="220" show-overflow-tooltip />
            <el-table-column prop="company" label="所属公司" min-width="200" show-overflow-tooltip />
            <el-table-column prop="obtainDate" label="获得日期" width="110" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="certTabStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="certTabPage"
              v-model:page-size="certTabPageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="certTabData.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="propDialogVisible" :title="propIsEdit ? '修改产权证件' : '新增产权证件'" width="760px" destroy-on-close>
      <el-form :model="propForm" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="项目类型" required>
              <el-select v-model="propForm.projectType" placeholder="请选择" style="width: 100%">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="项目产权" value="项目产权" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属公司" required>
              <el-select v-model="propForm.company" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权证有无" required>
              <el-select v-model="propForm.hasCert" placeholder="请选择" style="width: 100%">
                <el-option label="有" value="有" />
                <el-option label="无" value="无" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权编号">
              <el-input v-model="propForm.certNo" placeholder="请输入产权编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权证类型">
              <el-select v-model="propForm.certType" placeholder="请选择" clearable style="width: 100%">
                <el-option v-for="t in certTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权类型">
              <el-select v-model="propForm.propType" placeholder="请选择" clearable style="width: 100%">
                <el-option v-for="t in propTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权比例类型">
              <el-select v-model="propForm.ratioType" placeholder="请选择" style="width: 100%">
                <el-option label="单独所有" value="单独所有" />
                <el-option label="共同所有" value="共同所有" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="propForm.remark" type="textarea" :rows="2" maxlength="255" show-word-limit placeholder="缺证原因等备注信息" />
        </el-form-item>
        <el-form-item label="产权证比例">
          <div style="width: 100%">
            <el-table v-if="propForm.ratios.length" :data="propForm.ratios" border size="small">
              <el-table-column label="名称" min-width="200">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" placeholder="请输入名称" />
                </template>
              </el-table-column>
              <el-table-column label="比例%" width="170">
                <template #default="{ row }">
                  <el-input-number v-model="row.ratio" size="small" :min="0" :max="100" :precision="2" style="width: 100%" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeRatio($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link :icon="Plus" @click="addRatio">新增</el-button>
          </div>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" list-type="picture-card" :limit="5">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="propDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProp">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Picture } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'

const assetStore = useAssetStore()

const filterStatus = ref('')

const certStats = computed(() => {
  const all = assetStore.visibleAssets
  return {
    certified: all.filter(a => a.certStatus === '已办证').length,
    processing: all.filter(a => a.certStatus.includes('办理中')).length,
    notStarted: all.filter(a => a.certStatus.includes('未启动')).length
  }
})

const filteredRecords = computed(() => {
  return assetStore.certRecords.filter(r => {
    if (!filterStatus.value) return true
    if (filterStatus.value === '已办证') return r.certStatus.includes('已办证')
    if (filterStatus.value === '办理中') return r.certStatus.includes('办理中')
    if (filterStatus.value === '未启动') return r.certStatus.includes('未启动')
    return true
  })
})

const activeTab = ref('prop')

const companyOptions = ['长乐区城市投资建设集团有限公司', '福州滨海新区建设集团有限公司', '长乐区国有资产营运有限公司', '吴航街道集体资产经营公司']
const certTypeOptions = ['不动产权证', '房产证', '土地证', '规划许可证', '施工许可证']
const propTypeOptions = ['房产产权', '土地产权', '不动产产权', '在建工程产权']

const propFilters = ref({ keyword: '', company: '', certType: '', projectType: '', propType: '' })
const propPage = ref(1)
const propPageSize = ref(10)

const propRecords = ref([
  {
    id: 'CQ-001', projectType: '资产产权', hasCert: '有', certNo: '闽(2020)长乐区不动产权第0012345号', certType: '不动产权证', propType: '不动产产权', ratioType: '单独所有', company: '长乐区城市投资建设集团有限公司', remark: '', createTime: '2024-03-12 09:30', updateTime: '2025-06-18 14:22',
    ratios: [{ name: '长乐区城市投资建设集团有限公司', ratio: 100 }],
    files: ['产权证首页.jpg', '产权证附记页.jpg'],
    asset: { region: '福建省福州市长乐区', projectName: '吴航商业街改造项目', projectAddr: '长乐区吴航街道解放路88号', zone: 'A区', assetName: '吴航街道商业街 A-01 商铺', assetNo: 'CT-001', assetAddr: '吴航街道商业街A区一层', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'CQ-002', projectType: '资产产权', hasCert: '有', certNo: '闽(2019)长乐区不动产权第0023456号', certType: '不动产权证', propType: '房产产权', ratioType: '共同所有', company: '福州滨海新区建设集团有限公司', remark: '', createTime: '2024-04-02 10:15', updateTime: '2025-07-01 09:40',
    ratios: [{ name: '福州滨海新区建设集团有限公司', ratio: 60 }, { name: '长乐区国有资产营运有限公司', ratio: 40 }],
    files: ['产权证扫描件.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '航城商务楼项目', projectAddr: '长乐区航城街道会堂路1号', zone: 'B区', assetName: '航城商务楼 3F', assetNo: 'CT-002', assetAddr: '航城商务楼三层整层', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'CQ-003', projectType: '项目产权', hasCert: '无', certNo: '', certType: '', propType: '在建工程产权', ratioType: '单独所有', company: '长乐区国有资产营运有限公司', remark: '项目尚在建设中，竣工验收后办理', createTime: '2024-05-20 16:02', updateTime: '2025-05-11 11:30',
    ratios: [{ name: '长乐区国有资产营运有限公司', ratio: 100 }],
    files: [],
    asset: { region: '福建省福州市长乐区', projectName: '营前标准厂房三期项目', projectAddr: '长乐区营前街道工业路9号', zone: 'C区', assetName: '营前标准厂房 2#', assetNo: 'CT-003', assetAddr: '营前工业集中区2号厂房', leaseStatus: '已出租', status: '在建' }
  },
  {
    id: 'CQ-004', projectType: '资产产权', hasCert: '有', certNo: '闽(2018)长乐区不动产权第0034567号', certType: '土地证', propType: '土地产权', ratioType: '单独所有', company: '长乐区城市投资建设集团有限公司', remark: '', createTime: '2024-01-08 08:50', updateTime: '2024-12-25 15:10',
    ratios: [{ name: '长乐区城市投资建设集团有限公司', ratio: 100 }],
    files: ['土地证正面.jpg', '土地证背面.jpg', '宗地图.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '首占保障房项目', projectAddr: '长乐区首占镇振铎路66号', zone: 'A区', assetName: '首占新区保障房 1# 楼', assetNo: 'CT-004', assetAddr: '首占新区一期1号楼', leaseStatus: '自用', status: '正常' }
  },
  {
    id: 'CQ-005', projectType: '项目产权', hasCert: '有', certNo: 'CLGH-2019-0156', certType: '规划许可证', propType: '在建工程产权', ratioType: '共同所有', company: '吴航街道集体资产经营公司', remark: '', createTime: '2024-06-15 14:33', updateTime: '2025-08-02 10:05',
    ratios: [{ name: '吴航街道集体资产经营公司', ratio: 51 }, { name: '长乐区城市投资建设集团有限公司', ratio: 49 }],
    files: ['规划许可证.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '吴航农贸市场升级项目', projectAddr: '长乐区吴航街道河下街32号', zone: 'B区', assetName: '吴航农贸市场', assetNo: 'CT-007', assetAddr: '吴航街道农贸市场主体建筑', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'CQ-006', projectType: '资产产权', hasCert: '无', certNo: '', certType: '', propType: '土地产权', ratioType: '单独所有', company: '福州滨海新区建设集团有限公司', remark: '历史划拨用地，权属材料缺失，正在补办', createTime: '2024-07-01 09:12', updateTime: '2025-04-19 16:48',
    ratios: [{ name: '福州滨海新区建设集团有限公司', ratio: 100 }],
    files: [],
    asset: { region: '福建省福州市长乐区', projectName: '江田仓储物流项目', projectAddr: '长乐区江田镇滨海大道120号', zone: 'C区', assetName: '江田镇仓储用地', assetNo: 'CT-006', assetAddr: '江田镇仓储用地地块', leaseStatus: '闲置', status: '待处置' }
  },
  {
    id: 'CQ-007', projectType: '资产产权', hasCert: '有', certNo: '闽(2020)长乐区不动产权第0067890号', certType: '房产证', propType: '房产产权', ratioType: '单独所有', company: '长乐区国有资产营运有限公司', remark: '', createTime: '2024-02-28 11:26', updateTime: '2025-03-14 09:55',
    ratios: [{ name: '长乐区国有资产营运有限公司', ratio: 100 }],
    files: ['房产证.jpg'],
    asset: { region: '福建省福州市长乐区', projectName: '梅花镇综合楼项目', projectAddr: '长乐区梅花镇梅城路18号', zone: 'A区', assetName: '梅花镇综合楼', assetNo: 'CT-008', assetAddr: '梅花镇综合楼1-5层', leaseStatus: '部分出租', status: '正常' }
  },
  {
    id: 'CQ-008', projectType: '项目产权', hasCert: '有', certNo: '闽(2017)长乐区不动产权第0098765号', certType: '不动产权证', propType: '不动产产权', ratioType: '共同所有', company: '长乐区城市投资建设集团有限公司', remark: '', createTime: '2023-11-05 15:40', updateTime: '2025-02-20 10:18',
    ratios: [{ name: '长乐区城市投资建设集团有限公司', ratio: 70 }, { name: '吴航街道集体资产经营公司', ratio: 30 }],
    files: ['不动产权证.pdf', '共有权人附页.jpg'],
    asset: { region: '福建省福州市长乐区', projectName: '安东大厦购置项目', projectAddr: '长乐区航城街道安东路516号', zone: 'B区', assetName: '安东大厦516', assetNo: 'CT-009', assetAddr: '安东大厦5层516室', leaseStatus: '已出租', status: '正常' }
  },
  {
    id: 'CQ-009', projectType: '资产产权', hasCert: '无', certNo: '', certType: '', propType: '房产产权', ratioType: '单独所有', company: '吴航街道集体资产经营公司', remark: '原乡镇企业房产，未办理初始登记', createTime: '2024-08-12 10:08', updateTime: '2025-01-06 14:52',
    ratios: [{ name: '吴航街道集体资产经营公司', ratio: 100 }],
    files: [],
    asset: { region: '福建省福州市长乐区', projectName: '玉田旧工业区改造项目', projectAddr: '长乐区玉田镇工业路5号', zone: 'C区', assetName: '玉田镇旧工业厂房', assetNo: 'CT-010', assetAddr: '玉田镇旧工业厂房1-2号楼', leaseStatus: '闲置', status: '待盘活' }
  },
  {
    id: 'CQ-010', projectType: '项目产权', hasCert: '有', certNo: '闽(2022)长乐区不动产权第0011223号', certType: '施工许可证', propType: '在建工程产权', ratioType: '单独所有', company: '福州滨海新区建设集团有限公司', remark: '', createTime: '2024-09-03 08:45', updateTime: '2025-09-01 09:20',
    ratios: [{ name: '福州滨海新区建设集团有限公司', ratio: 100 }],
    files: ['施工许可证.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '滨海新城安置房二期项目', projectAddr: '长乐区滨海新城文武沙路7号', zone: 'A区', assetName: '滨海新城安置房二期', assetNo: 'CT-011', assetAddr: '滨海新城二期工地', leaseStatus: '未出租', status: '在建' }
  },
  {
    id: 'CQ-011', projectType: '资产产权', hasCert: '有', certNo: '闽(2021)长乐区不动产权第0044556号', certType: '不动产权证', propType: '不动产产权', ratioType: '单独所有', company: '长乐区国有资产营运有限公司', remark: '', createTime: '2024-10-18 13:26', updateTime: '2025-08-15 11:02',
    ratios: [{ name: '长乐区国有资产营运有限公司', ratio: 100 }],
    files: ['产权证.pdf'],
    asset: { region: '福建省福州市长乐区', projectName: '漳港海鲜市场项目', projectAddr: '长乐区漳港街道海滨路21号', zone: 'B区', assetName: '漳港海鲜批发市场', assetNo: 'CT-012', assetAddr: '漳港海鲜市场主体及摊位', leaseStatus: '已出租', status: '正常' }
  }
])

const filteredProps = computed(() => {
  const f = propFilters.value
  return propRecords.value.filter(r => {
    if (f.keyword) {
      const kw = f.keyword
      const hit = r.certNo.includes(kw) || r.asset.assetName.includes(kw) || r.asset.assetNo.includes(kw) || r.asset.projectName.includes(kw)
      if (!hit) return false
    }
    if (f.company && r.company !== f.company) return false
    if (f.certType && r.certType !== f.certType) return false
    if (f.projectType && r.projectType !== f.projectType) return false
    if (f.propType && r.propType !== f.propType) return false
    return true
  })
})

const pagedProps = computed(() => {
  const start = (propPage.value - 1) * propPageSize.value
  return filteredProps.value.slice(start, start + propPageSize.value)
})

function handlePropSearch() { propPage.value = 1 }

const certTabData = ref([
  { certName: '吴航商业街商铺产权证', certType: '不动产权证', certCode: '闽(2020)长乐区不动产权第0012345号', company: '长乐区城市投资建设集团有限公司', obtainDate: '2020-03-15', status: '有效' },
  { certName: '航城商务楼产权证', certType: '不动产权证', certCode: '闽(2019)长乐区不动产权第0023456号', company: '福州滨海新区建设集团有限公司', obtainDate: '2019-06-20', status: '有效' },
  { certName: '营前厂房土地使用权证', certType: '土地证', certCode: '闽(2018)长乐区不动产权第0034567号', company: '长乐区国有资产营运有限公司', obtainDate: '2018-09-10', status: '有效' },
  { certName: '首占保障房产权证', certType: '房产证', certCode: '闽(2021)长乐区不动产权第0045678号', company: '长乐区城市投资建设集团有限公司', obtainDate: '2021-01-25', status: '有效' },
  { certName: '吴航农贸市场规划许可证', certType: '规划许可证', certCode: 'CLGH-2019-0156', company: '吴航街道集体资产经营公司', obtainDate: '2019-03-01', status: '即将到期' },
  { certName: '江田仓储用地规划许可', certType: '规划许可证', certCode: 'CLGH-2020-0089', company: '福州滨海新区建设集团有限公司', obtainDate: '2020-05-15', status: '已过期' },
  { certName: '梅花镇综合楼房产证', certType: '房产证', certCode: '闽(2020)长乐区不动产权第0067890号', company: '长乐区国有资产营运有限公司', obtainDate: '2020-08-10', status: '有效' },
  { certName: '安东大厦不动产权证', certType: '不动产权证', certCode: '闽(2017)长乐区不动产权第0098765号', company: '长乐区城市投资建设集团有限公司', obtainDate: '2017-12-01', status: '即将到期' }
])
const certTabPage = ref(1)
const certTabPageSize = ref(10)

const pagedCertTab = computed(() => {
  const start = (certTabPage.value - 1) * certTabPageSize.value
  return certTabData.value.slice(start, start + certTabPageSize.value)
})

function certTabStatusType(status) {
  const map = { '有效': 'success', '即将到期': 'warning', '已过期': 'danger' }
  return map[status] || 'info'
}

const propDialogVisible = ref(false)
const propIsEdit = ref(false)
const editingPropId = ref('')

const defaultPropForm = {
  projectType: '', company: '', hasCert: '有', certNo: '', certType: '', propType: '', ratioType: '单独所有', remark: '', ratios: []
}
const propForm = ref({ ...defaultPropForm, ratios: [] })

function openPropDialog(row) {
  if (row) {
    propIsEdit.value = true
    editingPropId.value = row.id
    propForm.value = {
      projectType: row.projectType, company: row.company, hasCert: row.hasCert, certNo: row.certNo,
      certType: row.certType, propType: row.propType, ratioType: row.ratioType, remark: row.remark,
      ratios: row.ratios.map(r => ({ ...r }))
    }
  } else {
    propIsEdit.value = false
    editingPropId.value = ''
    propForm.value = { ...defaultPropForm, ratios: [] }
  }
  propDialogVisible.value = true
}

function addRatio() {
  propForm.value.ratios.push({ name: '', ratio: 0 })
}

function removeRatio(index) {
  propForm.value.ratios.splice(index, 1)
}

function nowText() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function saveProp() {
  const f = propForm.value
  if (!f.projectType || !f.company || !f.hasCert) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (f.hasCert === '有' && (!f.certNo || !f.certType)) {
    ElMessage.warning('产权证有时须填写产权编号与产权证类型')
    return
  }
  if (propIsEdit.value) {
    const rec = propRecords.value.find(r => r.id === editingPropId.value)
    if (rec) {
      Object.assign(rec, {
        projectType: f.projectType, company: f.company, hasCert: f.hasCert, certNo: f.certNo,
        certType: f.certType, propType: f.propType, ratioType: f.ratioType, remark: f.remark,
        ratios: f.ratios.map(r => ({ ...r })), updateTime: nowText()
      })
    }
    ElMessage.success('修改成功')
  } else {
    propRecords.value.unshift({
      id: `CQ-${String(propRecords.value.length + 1).padStart(3, '0')}`,
      projectType: f.projectType, hasCert: f.hasCert, certNo: f.certNo, certType: f.certType,
      propType: f.propType, ratioType: f.ratioType, company: f.company, remark: f.remark,
      createTime: nowText(), updateTime: nowText(),
      ratios: f.ratios.map(r => ({ ...r })), files: [],
      asset: { region: '福建省福州市长乐区', projectName: '—', projectAddr: '—', zone: '—', assetName: '—', assetNo: '—', assetAddr: '—', leaseStatus: '未出租', status: '正常' }
    })
    ElMessage.success('新增成功')
  }
  propDialogVisible.value = false
}
</script>

<style scoped>
.ent-cert { height: 100%; }
.toolbar-row { display: flex; align-items: center; margin-bottom: 12px; }
.expand-panel { padding: 12px 24px; background: #fcfcfc; }
.file-thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.file-thumbs .thumb {
  width: 92px; height: 92px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fafafa;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; color: #999; padding: 6px; text-align: center; word-break: break-all; overflow: hidden;
}
.file-thumbs .no-file { font-size: 13px; color: #999; line-height: 92px; }
</style>
