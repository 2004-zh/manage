<template>
  <div class="page-container">
    <div class="page-header">
      <h2>部门管理</h2>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="部门名称">
          <el-input v-model="deptQuery.deptName" placeholder="请输入部门名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="人员名称">
          <el-input v-model="deptQuery.personName" placeholder="请输入人员名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="所属公司">
          <el-select v-model="deptQuery.company" placeholder="请选择公司" clearable style="width:220px">
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleDeptSearch">查询</el-button>
          <el-button type="primary" plain :icon="Plus" @click="openNodeDialog(null)">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="org-split">
      <el-card shadow="never">
        <template #header>
          <span>公司架构</span>
        </template>
        <el-tree :data="companyTree" :props="{ label: 'name', children: 'children' }" node-key="id" default-expand-all highlight-current :expand-on-click-node="false" @node-click="handleCompanyNodeClick" />
      </el-card>
      <el-card shadow="never" class="fill">
        <template #header>
          <span>部门列表</span>
        </template>
        <el-table :data="pagedDepartments" border stripe>
          <el-table-column prop="code" label="编号" width="100" class-name="num" />
          <el-table-column prop="name" label="部门名称" min-width="130" />
          <el-table-column prop="company" label="所属公司" min-width="170" show-overflow-tooltip />
          <el-table-column prop="members" label="部门人员" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.members">{{ row.members }}</span>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="memberCount" label="部门人数" width="90" align="center" class-name="num" />
          <el-table-column prop="createTime" label="创建时间" width="170" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openNodeDialog(row)">编辑</el-button>
              <el-button type="primary" link size="small" @click="openDeptMembers(row)">部门人员</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无数据" :image-size="60" />
          </template>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="deptPage"
            v-model:page-size="deptPageSize"
            :total="filteredDepartments.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-card>
    </div>

    <div class="section-title">组织与用户</div>

    <div class="user-split">
      <el-card shadow="never">
        <template #header>
          <div class="card-head">
            <span>组织架构</span>
            <el-button type="primary" size="small" @click="showAddOrg = true">新增</el-button>
          </div>
        </template>
        <el-tree :data="orgTree" :props="{ label: 'name', children: 'children' }" node-key="id" default-expand-all highlight-current @node-click="handleOrgClick">
          <template #default="{ node, data }">
            <div class="node-row">
              <span>{{ node.label }}</span>
              <span>
                <el-button type="primary" link size="small" @click.stop="editOrg(data)">编辑</el-button>
                <el-button type="danger" link size="small" @click.stop="deleteOrg(data)">删除</el-button>
              </span>
            </div>
          </template>
        </el-tree>
      </el-card>
      <el-card shadow="never">
        <el-tabs v-model="rightTab">
          <el-tab-pane label="用户管理" name="users">
            <div class="row-head">
              <span v-if="selectedOrg" class="sub-hint">{{ selectedOrg.name }}</span>
              <span v-else class="sub-hint">全部用户</span>
              <el-button type="primary" size="small" @click="showAddUser = true">新增用户</el-button>
            </div>
            <el-table :data="pagedUsers" border stripe>
              <el-table-column prop="username" label="用户名" width="120" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="role" label="角色" width="120" />
              <el-table-column prop="phone" label="手机号" width="130" class-name="num" />
              <el-table-column prop="email" label="邮箱" min-width="160" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === '启用' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="editUser(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="deleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination
                v-model:current-page="userPage"
                v-model:page-size="userPageSize"
                :total="filteredUsers.length"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane name="companies">
            <template #label>
              <span>下属公司收款配置</span>
            </template>
            <div class="row-head">
              <span class="sub-hint">配置各下属公司的收款账户及归属模式</span>
              <el-button type="primary" size="small" @click="openCompanyDialog(null)">新增公司</el-button>
            </div>
            <el-table :data="pagedCompanies" border stripe>
              <el-table-column prop="name" label="公司名称" min-width="160" />
              <el-table-column prop="shortName" label="简称" width="100" />
              <el-table-column prop="collectionMode" label="收款模式" width="130">
                <template #default="{ row }">
                  <el-tag :type="row.collectionMode === '独立收款' ? 'success' : 'warning'" size="small">{{ row.collectionMode }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="parentCollector" label="统收归属" width="130">
                <template #default="{ row }">
                  <span v-if="row.collectionMode === '上级统收'" class="link-text">{{ row.parentCollector || '-' }}</span>
                  <span v-else class="muted">-</span>
                </template>
              </el-table-column>
              <el-table-column prop="bankName" label="开户行" min-width="150" />
              <el-table-column prop="bankAccount" label="银行账号" min-width="180">
                <template #default="{ row }">
                  <span class="mono">{{ row.bankAccount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="accountName" label="账户名称" width="140" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openCompanyDialog(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="deleteCompany(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination
                v-model:current-page="companyPage"
                v-model:page-size="companyPageSize"
                :total="companies.length"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <el-dialog v-model="showAddOrg" :title="editingOrg ? '编辑组织' : '新增组织'" width="500px">
      <el-form :model="orgForm" label-width="100px">
        <el-form-item label="组织名称" required>
          <el-input v-model="orgForm.name" />
        </el-form-item>
        <el-form-item label="上级组织">
          <el-select v-model="orgForm.parentId" placeholder="无（顶级组织）" style="width:100%" clearable>
            <el-option v-for="org in parentOrgOptions" :key="org.id" :label="org.name" :value="org.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="orgForm.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddOrg = false">取消</el-button>
        <el-button type="primary" @click="saveOrg">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddUser" :title="editingUser ? '编辑用户' : '新增用户'" width="550px">
      <el-form :model="userForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="userForm.username" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="userForm.name" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="userForm.role" style="width:100%">
            <el-option label="资产管理员" value="资产管理员" />
            <el-option label="财务管理员" value="财务管理员" />
            <el-option label="合同管理员" value="合同管理员" />
            <el-option label="领导" value="领导" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="userForm.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddUser = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCompanyDialog" :title="editingCompany ? '编辑公司' : '新增公司'" width="620px" destroy-on-close>
      <el-form :model="companyForm" label-width="110px">
        <el-form-item label="公司全称" required>
          <el-input v-model="companyForm.name" placeholder="如：XX城市建设投资有限公司" />
        </el-form-item>
        <el-form-item label="简称">
          <el-input v-model="companyForm.shortName" />
        </el-form-item>
        <el-form-item label="收款模式" required>
          <el-radio-group v-model="companyForm.collectionMode">
            <el-radio value="独立收款">独立收款</el-radio>
            <el-radio value="上级统收">上级统收</el-radio>
          </el-radio-group>
          <div class="form-tip">
            <span v-if="companyForm.collectionMode === '独立收款'">租金收入直接进入本公司账户</span>
            <span v-else>租金收入归集到上级单位账户</span>
          </div>
        </el-form-item>
        <el-form-item v-if="companyForm.collectionMode === '上级统收'" label="统收归属">
          <el-select v-model="companyForm.parentCollector" placeholder="选择上级统收单位" style="width:100%" clearable>
            <el-option v-for="c in collectorOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-divider content-position="left">收款账户信息</el-divider>
        <el-form-item label="开户行" required>
          <el-input v-model="companyForm.bankName" placeholder="如：中国工商银行XX支行" />
        </el-form-item>
        <el-form-item label="银行账号" required>
          <el-input v-model="companyForm.bankAccount" placeholder="请输入银行账号" />
        </el-form-item>
        <el-form-item label="账户名称">
          <el-input v-model="companyForm.accountName" :placeholder="companyForm.name || '默认同公司全称'" />
        </el-form-item>
        <el-form-item label="联行号">
          <el-input v-model="companyForm.cnapsCode" placeholder="12位联行号（选填）" maxlength="12" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompanyDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCompany">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showNodeDialog" :title="editingNode ? '编辑组织节点' : '新增组织节点'" width="640px" destroy-on-close>
      <el-form ref="nodeFormRef" :model="nodeForm" :rules="nodeRules" label-width="120px">
        <el-form-item label="所属公司">
          <el-select v-model="nodeForm.company" placeholder="请选择公司" clearable style="width:100%">
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="nodeForm.name" placeholder="请输入公司名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="公司类型">
          <el-select v-model="nodeForm.type" placeholder="请选择公司类型" clearable style="width:100%">
            <el-option label="有限责任公司" value="有限责任公司" />
            <el-option label="股份有限公司" value="股份有限公司" />
            <el-option label="国有独资公司" value="国有独资公司" />
            <el-option label="合伙企业" value="合伙企业" />
          </el-select>
        </el-form-item>
        <el-form-item label="公司地址">
          <el-input v-model="nodeForm.address" placeholder="请输入公司地址" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="nodeForm.phone" placeholder="请输入联系电话" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="公司简称">
          <el-input v-model="nodeForm.shortName" placeholder="请输入公司简称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="组织机构代码">
          <el-input v-model="nodeForm.orgCode" placeholder="请输入组织机构代码" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="收款类型">
          <el-select v-model="nodeForm.collectionType" placeholder="请选择收款类型" style="width:100%">
            <el-option label="统一收款" value="统一收款" />
            <el-option label="分别收款" value="分别收款" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNodeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitNode">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeptMembers" title="部门人员" width="480px" destroy-on-close>
      <div class="section-title" v-if="currentDept">{{ currentDept.name }}</div>
      <el-checkbox-group v-model="selectedMemberIds">
        <div v-for="u in users" :key="u.id" class="member-row">
          <el-checkbox :value="u.id">{{ u.name }}（{{ u.role }} · {{ u.phone }}）</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showDeptMembers = false">取消</el-button>
        <el-button type="primary" @click="saveDeptMembers">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const rightTab = ref('users')
const selectedOrg = ref(null)
const showAddOrg = ref(false)
const showAddUser = ref(false)
const editingOrg = ref(null)
const editingUser = ref(null)

const orgForm = ref({ name: '', parentId: null, sort: 0 })
const userForm = ref({ username: '', name: '', role: '', phone: '', email: '', enabled: true })

const orgTree = ref([
  { id: 1, name: '城投集团', children: [
    { id: 11, name: '资产管理部' },
    { id: 12, name: '财务部' },
    { id: 13, name: '运营部' },
  ]},
])

const parentOrgOptions = computed(() => {
  const options = []
  const flatten = (nodes) => {
    nodes.forEach(n => {
      options.push(n)
      if (n.children) flatten(n.children)
    })
  }
  flatten(orgTree.value)
  return options
})

const users = ref([
  { id: 1, username: 'chengtou', name: '张管理员', role: '资产管理员', phone: '13800138001', email: 'zhang@chengtou.com', status: '启用', orgId: 11 },
  { id: 2, username: 'zhangsan', name: '张三', role: '资产管理员', phone: '13800138002', email: 'zhangsan@chengtou.com', status: '启用', orgId: 11 },
  { id: 3, username: 'lisi', name: '李四', role: '财务管理员', phone: '13800138003', email: 'lisi@chengtou.com', status: '启用', orgId: 12 },
  { id: 4, username: 'wangwu', name: '王五', role: '领导', phone: '13800138004', email: 'wangwu@chengtou.com', status: '启用', orgId: 13 },
  { id: 5, username: 'zhaoliu', name: '赵六', role: '合同管理员', phone: '13800138005', email: 'zhaoliu@chengtou.com', status: '启用', orgId: 12 },
  { id: 6, username: 'sunqi', name: '孙七', role: '资产管理员', phone: '13800138006', email: 'sunqi@chengtou.com', status: '启用', orgId: 13 },
])

const filteredUsers = computed(() => {
  if (!selectedOrg.value) return users.value
  return users.value.filter(u => u.orgId === selectedOrg.value.id)
})

const userPage = ref(1)
const userPageSize = ref(10)
const pagedUsers = computed(() => filteredUsers.value.slice((userPage.value - 1) * userPageSize.value, userPage.value * userPageSize.value))

const companies = ref([
  { id: 1, name: '城市建设投资有限公司', shortName: '城投公司', collectionMode: '独立收款', parentCollector: '', bankName: '中国工商银行城南支行', bankAccount: '6222 0200 1234 5678 901', accountName: '城市建设投资有限公司', cnapsCode: '102100099996' },
  { id: 2, name: '置业发展有限公司', shortName: '置业公司', collectionMode: '上级统收', parentCollector: '城市建设投资有限公司', bankName: '中国建设银行城北支行', bankAccount: '6217 0000 1234 5678 902', accountName: '置业发展有限公司', cnapsCode: '105100099997' },
  { id: 3, name: '物业管理服务有限公司', shortName: '物业公司', collectionMode: '独立收款', parentCollector: '', bankName: '中国农业银行城西支行', bankAccount: '6228 4800 1234 5678 903', accountName: '物业管理服务有限公司', cnapsCode: '103100099998' },
  { id: 4, name: '旅游开发投资有限公司', shortName: '旅投公司', collectionMode: '上级统收', parentCollector: '城市建设投资有限公司', bankName: '中国银行城东支行', bankAccount: '6216 6000 1234 5678 904', accountName: '旅游开发投资有限公司', cnapsCode: '104100099999' },
])

const companyPage = ref(1)
const companyPageSize = ref(10)
const pagedCompanies = computed(() => companies.value.slice((companyPage.value - 1) * companyPageSize.value, companyPage.value * companyPageSize.value))

const collectorOptions = computed(() => {
  return companies.value.filter(c => c.collectionMode === '独立收款').map(c => c.name)
})

const companyOptions = computed(() => companies.value.map(c => c.name))

const companyTree = computed(() => [
  { id: 'all', name: '全部', children: companies.value.map(c => ({ id: `company-${c.id}`, name: c.name })) }
])

const deptQuery = reactive({ deptName: '', personName: '', company: '' })

const departments = ref([
  { id: 1, code: 'BM-001', name: '资产管理部', company: '城市建设投资有限公司', type: '有限责任公司', address: '长乐区吴航街道安东大厦8楼', phone: '0591-28680001', shortName: '资管部', orgCode: '91350182MA31XXXX01', collectionType: '统一收款', memberIds: [1, 2], members: '张管理员、张三', memberCount: 2, createTime: '2024-03-01 09:00:00' },
  { id: 2, code: 'BM-002', name: '财务部', company: '城市建设投资有限公司', type: '有限责任公司', address: '长乐区吴航街道安东大厦7楼', phone: '0591-28680002', shortName: '财务部', orgCode: '91350182MA31XXXX02', collectionType: '统一收款', memberIds: [3, 5], members: '李四、赵六', memberCount: 2, createTime: '2024-03-01 09:30:00' },
  { id: 3, code: 'BM-003', name: '运营部', company: '城市建设投资有限公司', type: '有限责任公司', address: '长乐区吴航街道安东大厦6楼', phone: '0591-28680003', shortName: '运营部', orgCode: '91350182MA31XXXX03', collectionType: '分别收款', memberIds: [4, 6], members: '王五、孙七', memberCount: 2, createTime: '2024-03-05 14:00:00' },
  { id: 4, code: 'BM-004', name: '物业事业部', company: '物业管理服务有限公司', type: '有限责任公司', address: '长乐区航城街道物业服务中心', phone: '0591-28680004', shortName: '物业部', orgCode: '91350182MA31XXXX04', collectionType: '分别收款', memberIds: [], members: '', memberCount: 0, createTime: '2024-05-12 10:00:00' },
  { id: 5, code: 'BM-005', name: '招商经营部', company: '置业发展有限公司', type: '股份有限公司', address: '长乐区营前街道置业大厦3楼', phone: '0591-28680005', shortName: '招商部', orgCode: '91350182MA31XXXX05', collectionType: '统一收款', memberIds: [], members: '', memberCount: 0, createTime: '2024-06-20 15:30:00' },
  { id: 6, code: 'BM-006', name: '旅游运营部', company: '旅游开发投资有限公司', type: '国有独资公司', address: '长乐区江田镇滨海旅游集散中心', phone: '0591-28680006', shortName: '旅运部', orgCode: '91350182MA31XXXX06', collectionType: '分别收款', memberIds: [], members: '', memberCount: 0, createTime: '2024-08-08 11:20:00' },
])

const filteredDepartments = computed(() => departments.value.filter(d => {
  if (deptQuery.deptName && !d.name.includes(deptQuery.deptName)) return false
  if (deptQuery.personName && !d.members.includes(deptQuery.personName)) return false
  if (deptQuery.company && d.company !== deptQuery.company) return false
  return true
}))

const deptPage = ref(1)
const deptPageSize = ref(10)
const pagedDepartments = computed(() => filteredDepartments.value.slice((deptPage.value - 1) * deptPageSize.value, deptPage.value * deptPageSize.value))

const handleDeptSearch = () => { deptPage.value = 1 }

const handleCompanyNodeClick = (data) => {
  deptQuery.company = data.name === '全部' ? '' : data.name
  deptPage.value = 1
}

const showNodeDialog = ref(false)
const editingNode = ref(null)
const nodeFormRef = ref(null)
const nodeForm = ref({ company: '', name: '', type: '', address: '', phone: '', shortName: '', orgCode: '', collectionType: '统一收款' })
const nodeRules = {
  name: [{ required: true, message: '公司名称不能为空', trigger: ['blur', 'change'] }]
}

const openNodeDialog = (row) => {
  editingNode.value = row
  if (row) {
    nodeForm.value = {
      company: row.company || '', name: row.name || '', type: row.type || '', address: row.address || '',
      phone: row.phone || '', shortName: row.shortName || '', orgCode: row.orgCode || '', collectionType: row.collectionType || '统一收款'
    }
  } else {
    nodeForm.value = { company: '', name: '', type: '', address: '', phone: '', shortName: '', orgCode: '', collectionType: '统一收款' }
  }
  showNodeDialog.value = true
}

const submitNode = () => {
  nodeFormRef.value.validate((valid) => {
    if (!valid) return
    if (editingNode.value) {
      Object.assign(editingNode.value, nodeForm.value)
      ElMessage.success('组织节点已更新')
    } else {
      departments.value.unshift({
        id: Date.now(),
        code: `BM-${String(departments.value.length + 1).padStart(3, '0')}`,
        memberIds: [], members: '', memberCount: 0,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
        ...nodeForm.value
      })
      ElMessage.success('组织节点已新增')
    }
    showNodeDialog.value = false
    editingNode.value = null
  })
}

const showDeptMembers = ref(false)
const currentDept = ref(null)
const selectedMemberIds = ref([])

const openDeptMembers = (row) => {
  currentDept.value = row
  selectedMemberIds.value = [...(row.memberIds || [])]
  showDeptMembers.value = true
}

const saveDeptMembers = () => {
  const d = currentDept.value
  if (!d) return
  d.memberIds = [...selectedMemberIds.value]
  d.members = users.value.filter(u => d.memberIds.includes(u.id)).map(u => u.name).join('、')
  d.memberCount = d.memberIds.length
  showDeptMembers.value = false
  ElMessage.success('部门人员已更新')
}

const showCompanyDialog = ref(false)
const editingCompany = ref(null)
const companyForm = ref({
  name: '', shortName: '', collectionMode: '独立收款', parentCollector: '',
  bankName: '', bankAccount: '', accountName: '', cnapsCode: ''
})

const openCompanyDialog = (row) => {
  if (row) {
    editingCompany.value = row
    companyForm.value = { ...row }
  } else {
    editingCompany.value = null
    companyForm.value = { name: '', shortName: '', collectionMode: '独立收款', parentCollector: '', bankName: '', bankAccount: '', accountName: '', cnapsCode: '' }
  }
  showCompanyDialog.value = true
}

const saveCompany = () => {
  if (!companyForm.value.name) { ElMessage.warning('请输入公司全称'); return }
  if (!companyForm.value.bankName) { ElMessage.warning('请输入开户行'); return }
  if (!companyForm.value.bankAccount) { ElMessage.warning('请输入银行账号'); return }
  if (companyForm.value.collectionMode === '上级统收' && !companyForm.value.parentCollector) {
    ElMessage.warning('上级统收模式需选择统收归属单位')
    return
  }
  if (!companyForm.value.accountName) companyForm.value.accountName = companyForm.value.name
  if (editingCompany.value) {
    Object.assign(editingCompany.value, companyForm.value)
    ElMessage.success('公司信息已更新')
  } else {
    companies.value.push({ id: Date.now(), ...companyForm.value })
    ElMessage.success('公司已添加')
  }
  showCompanyDialog.value = false
}

const deleteCompany = (row) => {
  ElMessageBox.confirm(`确认删除公司"${row.name}"？删除后相关收款配置将丢失。`, '提示', { type: 'warning' }).then(() => {
    const idx = companies.value.findIndex(c => c.id === row.id)
    if (idx > -1) companies.value.splice(idx, 1)
    ElMessage.success('已删除')
  }).catch(() => {})
}

const handleOrgClick = (data) => { selectedOrg.value = data }

const editOrg = (data) => {
  editingOrg.value = data
  orgForm.value = { name: data.name, parentId: null, sort: 0 }
  showAddOrg.value = true
}

const deleteOrg = (data) => {
  ElMessageBox.confirm(`确认删除组织"${data.name}"？`, '提示', { type: 'warning' }).then(() => {
    const removeFromTree = (nodes) => {
      const idx = nodes.findIndex(n => n.id === data.id)
      if (idx > -1) { nodes.splice(idx, 1); return true }
      return nodes.some(n => n.children && removeFromTree(n.children))
    }
    removeFromTree(orgTree.value)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const saveOrg = () => {
  if (!orgForm.value.name) { ElMessage.warning('请输入组织名称'); return }
  if (editingOrg.value) {
    editingOrg.value.name = orgForm.value.name
    if (orgForm.value.parentId) {
      const parent = parentOrgOptions.value.find(n => n.id === orgForm.value.parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        const idx = parent.children.findIndex(n => n.id === editingOrg.value.id)
        if (idx === -1) parent.children.push({ id: editingOrg.value.id, name: orgForm.value.name })
      }
    }
  } else {
    const newNode = { id: Date.now(), name: orgForm.value.name, children: [] }
    if (orgForm.value.parentId) {
      const parent = parentOrgOptions.value.find(n => n.id === orgForm.value.parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(newNode)
      }
    } else {
      orgTree.value.push(newNode)
    }
  }
  showAddOrg.value = false
  editingOrg.value = null
  ElMessage.success('保存成功')
}

const editUser = (row) => {
  editingUser.value = row
  userForm.value = { username: row.username, name: row.name, role: row.role, phone: row.phone, email: row.email, enabled: row.status === '启用' }
  showAddUser.value = true
}

const deleteUser = (row) => {
  ElMessageBox.confirm(`确认删除用户"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = users.value.findIndex(u => u.id === row.id)
    if (idx > -1) users.value.splice(idx, 1)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const saveUser = () => {
  if (!userForm.value.username || !userForm.value.name || !userForm.value.role) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingUser.value) {
    Object.assign(editingUser.value, {
      username: userForm.value.username,
      name: userForm.value.name,
      role: userForm.value.role,
      phone: userForm.value.phone,
      email: userForm.value.email,
      status: userForm.value.enabled ? '启用' : '禁用'
    })
  } else {
    users.value.unshift({
      id: Date.now(),
      username: userForm.value.username,
      name: userForm.value.name,
      role: userForm.value.role,
      phone: userForm.value.phone,
      email: userForm.value.email,
      status: userForm.value.enabled ? '启用' : '禁用',
      orgId: selectedOrg.value?.id || null
    })
  }
  showAddUser.value = false
  editingUser.value = null
  ElMessage.success('保存成功')
}
</script>

<style scoped>
/* 筛选卡只留卡片自身一层内边距，表单项不再叠加底部空隙 */
.filter-card :deep(.el-form-item) { margin-bottom: 0; }

/* 树/列表两栏：左栏按内容定宽，右栏吃满剩余宽度，避免中间或右侧大洞 */
.org-split {
  display: grid;
  gap: 16px;
  grid-template-columns: 300px minmax(0, 1fr);
}

.user-split {
  display: grid;
  gap: 16px;
  grid-template-columns: 320px minmax(0, 1fr);
}

@media (max-width: 1200px) {
  .org-split,
  .user-split { grid-template-columns: minmax(0, 1fr); }
}

.card-head { display: flex; justify-content: space-between; align-items: center; }
.row-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.node-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.member-row { padding: 8px 0; border-bottom: 1px dashed var(--bd-split); }
.sub-hint { color: var(--t-weak); font-size: 13px; }
.muted { color: var(--t-weak); }
.link-text { color: var(--c-primary); }
.mono { font-family: var(--font-mono); }
.form-tip { color: var(--t-weak); font-size: 12px; margin-top: 4px; }
</style>
