<template>
  <div class="page-container">
    <div class="page-header"><h2>{{ pageTitle }}</h2></div>

    <!-- 用户管理模式（企业端 用户管理） -->
    <template v-if="isUserMode">
      <div class="panel fill">
        <div class="filter-row">
          <el-input
            v-model="userQuery.keyword"
            placeholder="用户名 / 姓名"
            clearable
            style="width: 200px"
            @keyup.enter="searchUsers"
          />
          <el-select v-model="userQuery.status" placeholder="状态" clearable style="width: 130px">
            <el-option label="启用" value="启用" />
            <el-option label="禁用" value="禁用" />
          </el-select>
          <el-button type="primary" @click="searchUsers">查询</el-button>
          <el-button @click="openUserDialog()">新增</el-button>
        </div>

        <div class="section-title">用户列表</div>
        <el-table :data="pagedUsers" border size="small" class="dense-table" style="width: 100%">
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="dept" label="所属部门" width="130" />
          <el-table-column prop="role" label="角色" width="130" />
          <el-table-column prop="phone" label="手机号" width="130" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column label="操作" min-width="200" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openUserDialog(row)">编辑</el-button>
              <el-button type="warning" link size="small" @click="resetPassword(row)">重置密码</el-button>
              <el-button :type="row.status === '启用' ? 'danger' : 'success'" link size="small" @click="toggleUserStatus(row)">
                {{ row.status === '启用' ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="userPage.current"
            v-model:page-size="userPage.size"
            :total="filteredUsers.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            background
            small
          />
        </div>
      </div>

      <el-dialog v-model="showUserDialog" :title="editingUser ? '编辑用户' : '新增用户'" width="480px">
        <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="80px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="!!editingUser" />
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="userForm.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="部门" prop="dept">
            <el-select v-model="userForm.dept" placeholder="请选择部门" style="width: 100%">
              <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
            </el-select>
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="userForm.role" placeholder="请选择角色" style="width: 100%">
              <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
            </el-select>
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showUserDialog = false">取消</el-button>
          <el-button type="primary" @click="saveUser">保存</el-button>
        </template>
      </el-dialog>
    </template>

    <!-- 角色 / 权限模式（企业端 角色管理、监管端 用户与权限） -->
    <template v-else>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-card>
            <template #header>组织树</template>
            <el-tree :data="orgTree" :props="{ label: 'label' }" default-expand-all highlight-current />
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card>
            <template #header>角色列表</template>
            <el-table :data="roles" border size="small">
              <el-table-column prop="name" label="角色名称" width="160" />
              <el-table-column prop="org" label="所属组织" width="140" />
              <el-table-column prop="desc" label="说明" />
              <el-table-column label="权限" width="100" align="center">
                <template #default="{ row }"><el-button type="primary" link size="small" @click="openPermDialog(row)">配置</el-button></template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-dialog v-model="showPermDialog" :title="`${currentRole?.name} — 权限配置`" width="500px">
        <el-tree
          ref="permTreeRef"
          :data="permTree"
          show-checkbox
          node-key="id"
          :default-checked-keys="currentPermKeys"
          :props="{ label: 'label', children: 'children' }"
        />
        <template #footer>
          <el-button @click="showPermDialog = false">取消</el-button>
          <el-button type="primary" @click="savePerm">保存</el-button>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const isUserMode = computed(() => route.name === 'EntSystemUser')
const pageTitle = computed(() => route.meta?.title || (isUserMode.value ? '用户管理' : '用户与权限'))

/* ---------------- 用户管理（EntSystemUser） ---------------- */

const deptOptions = ['资产管理部', '财务部', '综合办公室', '运营部']
const roleOptions = ['资产管理员', '收费员', '财务人员', '普通用户', '部门主管']

const users = ref([
  { username: 'zhangwei', name: '张伟', dept: '资产管理部', role: '资产管理员', phone: '13800001001', status: '启用', createdAt: '2024-03-12 09:30:00' },
  { username: 'lina', name: '李娜', dept: '财务部', role: '财务人员', phone: '13800001002', status: '启用', createdAt: '2024-04-02 14:20:00' },
  { username: 'wangqiang', name: '王强', dept: '资产管理部', role: '收费员', phone: '13800001003', status: '禁用', createdAt: '2024-05-18 10:05:00' },
  { username: 'zhaomin', name: '赵敏', dept: '综合办公室', role: '普通用户', phone: '13800001004', status: '启用', createdAt: '2024-06-21 16:45:00' },
  { username: 'sunlei', name: '孙磊', dept: '运营部', role: '部门主管', phone: '13800001005', status: '启用', createdAt: '2024-07-09 08:55:00' },
  { username: 'zhoufang', name: '周芳', dept: '财务部', role: '普通用户', phone: '13800001006', status: '启用', createdAt: '2024-08-15 11:30:00' },
  { username: 'wuhao', name: '吴昊', dept: '资产管理部', role: '收费员', phone: '13800001007', status: '禁用', createdAt: '2024-09-03 15:10:00' },
  { username: 'chenjing', name: '陈静', dept: '综合办公室', role: '普通用户', phone: '13800001008', status: '启用', createdAt: '2024-10-11 09:00:00' }
])

const userQuery = reactive({ keyword: '', status: '' })
const appliedQuery = reactive({ keyword: '', status: '' })
const userPage = reactive({ current: 1, size: 15 })

const filteredUsers = computed(() =>
  users.value.filter((u) => {
    const kw = appliedQuery.keyword.trim()
    if (kw && !u.username.includes(kw) && !u.name.includes(kw)) return false
    if (appliedQuery.status && u.status !== appliedQuery.status) return false
    return true
  })
)

const pagedUsers = computed(() => {
  const start = (userPage.current - 1) * userPage.size
  return filteredUsers.value.slice(start, start + userPage.size)
})

function searchUsers() {
  appliedQuery.keyword = userQuery.keyword
  appliedQuery.status = userQuery.status
  userPage.current = 1
}

const showUserDialog = ref(false)
const editingUser = ref(null)
const userFormRef = ref(null)
const userForm = reactive({ username: '', name: '', dept: '', role: '', phone: '' })
const userRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }]
}

function openUserDialog(row) {
  editingUser.value = row || null
  Object.assign(userForm, row
    ? { username: row.username, name: row.name, dept: row.dept, role: row.role, phone: row.phone }
    : { username: '', name: '', dept: '', role: '', phone: '' })
  showUserDialog.value = true
}

function saveUser() {
  userFormRef.value.validate((valid) => {
    if (!valid) return
    if (editingUser.value) {
      Object.assign(editingUser.value, { name: userForm.name, dept: userForm.dept, role: userForm.role, phone: userForm.phone })
      ElMessage.success('用户信息已保存')
    } else {
      users.value.unshift({
        username: userForm.username,
        name: userForm.name,
        dept: userForm.dept,
        role: userForm.role,
        phone: userForm.phone,
        status: '启用',
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      })
      ElMessage.success('用户已新增')
    }
    showUserDialog.value = false
  })
}

function resetPassword(row) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 8; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  row.passwordReset = true
  row.passwordResetTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  row.newPassword = pwd
  ElMessage.success(`已将「${row.name}」的密码重置为：${pwd}，请通知用户及时修改`)
}

function toggleUserStatus(row) {
  row.status = row.status === '启用' ? '禁用' : '启用'
  ElMessage.success(`用户「${row.name}」已${row.status}`)
}

/* ---------------- 角色 / 权限（EntSystemRole、GovSystemRole） ---------------- */

const orgTree = ref([
  { label: '长乐区国资中心', children: [
    { label: '运营科' }, { label: '综合科' }
  ] },
  { label: '城投集团', children: [
    { label: '资产管理部' }, { label: '财务部' }, { label: '综合办公室' }
  ] },
  { label: '产投集团', children: [{ label: '资产管理部' }] },
  { label: '水投集团', children: [{ label: '资产管理部' }] },
  { label: '领航公司', children: [{ label: '综合管理部' }] }
])

const roles = ref([
  { name: '运营科科长', org: '国资中心', desc: '监管端全权限' },
  { name: '运营科经办人', org: '国资中心', desc: '监管端查看+督办' },
  { name: '资产管理员', org: '城投集团', desc: '企业端全权限' },
  { name: '收费员', org: '城投集团', desc: '企业端收费模块' },
  { name: '资产管理员', org: '产投集团', desc: '企业端全权限' }
])

const showPermDialog = ref(false)
const currentRole = ref(null)
const permTreeRef = ref(null)

const permTree = [
  { id: 'dashboard', label: '工作台', children: [
    { id: 'dashboard:view', label: '查看' }
  ] },
  { id: 'asset', label: '资产管理', children: [
    { id: 'asset:view', label: '查看' },
    { id: 'asset:add', label: '新增' },
    { id: 'asset:edit', label: '编辑' },
    { id: 'asset:delete', label: '删除' },
    { id: 'asset:export', label: '导出' }
  ] },
  { id: 'lease', label: '租赁管理', children: [
    { id: 'lease:view', label: '查看' },
    { id: 'lease:contract', label: '合同管理' },
    { id: 'lease:fee', label: '收费管理' }
  ] },
  { id: 'finance', label: '财务管理', children: [
    { id: 'finance:view', label: '查看' },
    { id: 'finance:billing', label: '账单管理' }
  ] },
  { id: 'report', label: '报表统计', children: [
    { id: 'report:view', label: '查看' },
    { id: 'report:export', label: '导出' }
  ] },
  { id: 'supervise', label: '监管督办', children: [
    { id: 'supervise:view', label: '查看' },
    { id: 'supervise:create', label: '发起督办' }
  ] }
]

const rolePermMap = ref({
  '运营科科长': ['dashboard:view', 'asset:view', 'asset:add', 'asset:edit', 'asset:delete', 'asset:export', 'lease:view', 'lease:contract', 'lease:fee', 'finance:view', 'finance:billing', 'report:view', 'report:export', 'supervise:view', 'supervise:create'],
  '运营科经办人': ['dashboard:view', 'asset:view', 'asset:export', 'lease:view', 'finance:view', 'report:view', 'supervise:view', 'supervise:create'],
  '资产管理员': ['dashboard:view', 'asset:view', 'asset:add', 'asset:edit', 'asset:delete', 'asset:export', 'lease:view', 'lease:contract', 'lease:fee', 'finance:view', 'finance:billing', 'report:view', 'report:export'],
  '收费员': ['dashboard:view', 'lease:view', 'lease:fee', 'finance:view', 'finance:billing'],
})

const currentPermKeys = ref([])

function openPermDialog(row) {
  currentRole.value = row
  currentPermKeys.value = rolePermMap.value[row.name] || []
  showPermDialog.value = true
}

function savePerm() {
  const checkedKeys = permTreeRef.value.getCheckedKeys(false)
  const halfCheckedKeys = permTreeRef.value.getHalfCheckedKeys()
  rolePermMap.value[currentRole.value.name] = [...checkedKeys, ...halfCheckedKeys]
  showPermDialog.value = false
  ElMessage.success(`${currentRole.value.name} 权限已保存`)
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: var(--t-main);
}

.panel {
  background: var(--bg-card);
  border-radius: var(--r-sm);
  padding: 20px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.dense-table {
  font-size: 13px;
}

.dense-table :deep(.el-table__cell) {
  padding: 6px 0;
}

.dense-table :deep(th.el-table__cell) {
  background: var(--bg-th);
  color: var(--t-main);
  font-weight: 600;
}
</style>
