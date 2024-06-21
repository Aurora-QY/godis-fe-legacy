<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="project-name">Godis</div>
      <img src="/public/godis-logo.png" alt="项目Logo" class="logo" />
    </div>
    <!-- <el-menu default-active="1" class="el-menu-vertical-demo">
      <el-menu-item index="1">
        命令控制台
      </el-menu-item>
      <el-menu-item index="2">
        命令历史记录
      </el-menu-item>
    </el-menu> -->
    <div class="server-select">
      <el-select v-model="selectedServer" placeholder="请选择服务器" @change="onServerChange">
        <el-option v-for="server in servers" :key="server.label" :label="server.label" :value="server.label">
          <template #default="{ label }">
            <div class="server-option">
              <el-tooltip :content="`URL: ${server.url}, 端口: ${server.port}`">
                <span class="option-text">{{ server.label }} {{ label }}</span>
              </el-tooltip>
              <el-button circle size="small" type="danger" :icon="Delete" @click.stop="removeServer(server.label)" />
            </div>
          </template>
        </el-option>
      </el-select>
      <el-button type="primary" :icon="Plus" class="add-server-button" @click="openAddServerDialog"> 添加服务器 </el-button>
    </div>
    <el-dialog v-model="addServerDialogVisible" title="添加服务器">
      <el-form :model="newServer">
        <el-form-item label="服务器名称">
          <el-input v-model="newServer.label" />
        </el-form-item>
        <el-form-item label="服务器URL">
          <el-input v-model="newServer.url" />
        </el-form-item>
        <el-form-item label="服务器端口">
          <el-input v-model="newServer.port" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addServerDialogVisible = false"> 取消 </el-button>
          <el-button type="primary" @click="addServer"> 添加 </el-button>
        </div>
      </template>
    </el-dialog>
    <el-menu class="menubar">
      <el-menu-item @click="navigateTo('/')"> 首页 </el-menu-item>
      <el-menu-item @click="navigateTo('/UnitTesting')"> 单元测试 </el-menu-item>
      <el-menu-item @click="navigateTo('/IntegrationTesting')"> 集成测试 </el-menu-item>
      <el-menu-item @click="navigateTo('/SystemTesting')"> 系统测试 </el-menu-item>
      <el-menu-item @click="navigateTo('/StressTesting')"> 压力测试 </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="js">
/* eslint-disable no-console */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
// import { server } from 'typescript'
import axios from 'axios'

import { useRouter } from 'vue-router'

const router = useRouter()

const selectedServer = ref('')
const servers = ref(JSON.parse(localStorage.getItem('servers')) || [{ label: '本地服务器', url: 'localhost', port: '6389' }])
const addServerDialogVisible = ref(false)
const newServer = ref({ label: '', url: '', port: '' })

function openAddServerDialog() {
  newServer.value = { label: '', url: '', port: '' }
  addServerDialogVisible.value = true
}

function addServer() {
  if (!newServer.value.label || !newServer.value.url || !newServer.value.port) {
    ElMessage.error('所有字段都不能为空')
    return
  }
  servers.value.push({ ...newServer.value })
  persistServers()
  addServerDialogVisible.value = false
  ElMessage({
    message: '服务器添加成功',
    type: 'success',
  })
}

function removeServer(label) {
  servers.value = servers.value.filter((server) => server.label !== label)
  persistServers()
  ElMessage({
    message: '服务器删除成功',
    type: 'success',
  })
}

function onServerChange() {
  const changedServer = servers.value.filter((server) => server.label === selectedServer.value)[0]
  // console.log(changedServer)
  // 向后端发送请求
  axios
    .post('/api/connect', { serverUrl: changedServer.url, port: changedServer.port })
    .then((_) => {
      // console.log(response)
      ElMessage.success('服务器已选择')
    })
    .catch((error) => {
      ElMessage.error('选择服务器失败', error)
    })
}

function persistServers() {
  localStorage.setItem('servers', JSON.stringify(servers.value))
}

function navigateTo(path) {
  console.log(path)
  router.push(path)
}

onMounted(() => {
  if (!servers.value.length) {
    openAddServerDialog()
  }
})
</script>

<style scoped>
.sidebar {
  width: 95%;
  background-color: #f5f5f5;
  padding: 5px;
  height: 95vh;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.logo {
  width: 100%;
  margin-bottom: 10px;
}

.project-name {
  font-family: 'Roboto', sans-serif;
  /* 推荐使用Roboto或其他现代无衬线字体 */
  font-size: 2em;
  /* 调整字号以提高视觉重点 */
  font-weight: bold;
  color: #285898;
  /* 深蓝色，适合科技感 */
  letter-spacing: 0.05em;
  /* 增加字母间距，增强清晰度 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  /* 轻微的文字阴影，增加层次感 */
  margin-bottom: 10px;
}

.server-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.option-text {
  flex-grow: 1;
}

.el-menu-vertical-demo {
  width: 100%;
  margin-bottom: 20px;
}

.server-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.el-select {
  width: 100%;
}

.add-server-button {
  align-self: center;
  width: auto;
}

.dialog-footer {
  text-align: right;
}
.menubar {
  margin-top: 20px;
  width: 90%;
}
</style>
