<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <h2>Persistence Test</h2>
      <el-button type="primary" @click="executeWriteOperations"> Execute Write Operations </el-button>
      <el-button type="success" @click="executeReadOperations"> Execute Read Operations </el-button>
      <el-button type="warning" @click="restartServer"> Restart Server </el-button>

      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="Write Results" name="write">
          <pre>{{ writeResults }}</pre>
        </el-tab-pane>
        <el-tab-pane label="Read Results" name="read">
          <pre>{{ readResults }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      activeTab: 'write',
      writeResults: null,
      readResults: null,
    }
  },
  methods: {
    async executeWriteOperations() {
      try {
        const response = await axios.post('/api/persistenceTest/write')
        this.writeResults = JSON.stringify(response.data, null, 2)
        this.activeTab = 'write'
      } catch (error) {
        console.error('Failed to execute write operations:', error)
        this.$message.error('Failed to execute write operations.')
      }
    },
    async executeReadOperations() {
      try {
        const response = await axios.get('/api/persistenceTest/read')
        this.readResults = JSON.stringify(response.data, null, 2)
        this.activeTab = 'read'
      } catch (error) {
        console.error('Failed to execute read operations:', error)
        this.$message.error('Failed to execute read operations.')
      }
    },
    async restartServer() {
      try {
        // await axios.post('/persistence-test/restart');
        this.$message.success('Server restarted successfully.')
        // 等待一段时间让服务器完全重启
        setTimeout(() => {
          this.executeReadOperations()
        }, 5000)
      } catch (error) {
        console.error('Failed to restart server:', error)
        this.$message.error('Failed to restart server.')
      }
    },
  },
}
</script>
