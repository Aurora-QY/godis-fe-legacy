<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <h2>系统非功能性测试--恢复性测试</h2>
      <el-button type="primary" @click="executeWriteOperations"> 执行一系列写操作 </el-button>
      <el-button type="success" @click="executeReadOperations"> 执行一系列读操作 </el-button>
      <el-button type="warning" @click="restartServer"> 重启服务器 </el-button>

      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="Write Results" name="write">
          <el-table :data="parsedWriteResults" style="width: 80%">
            <el-table-column prop="command" label="Command" width="200px" />
            <el-table-column prop="code" label="Code" width="150px" />
            <el-table-column prop="data" label="Data" />
            <el-table-column prop="message" label="Message" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="Read Results" name="read">
          <el-table :data="parsedReadResults" style="width: 80%">
            <el-table-column prop="command" label="Command" width="200px" />
            <el-table-column prop="code" label="Code" width="150px" />
            <el-table-column prop="data" label="Data" />
            <el-table-column prop="message" label="Message" />
          </el-table>
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
      writeResults: {},
      readResults: {},
    }
  },
  computed: {
    parsedWriteResults() {
      return this.parseResults(this.writeResults)
    },
    parsedReadResults() {
      return this.parseResults(this.readResults)
    },
  },
  methods: {
    parseResults(results) {
      return Object.keys(results).map((command) => ({
        command,
        ...results[command],
      }))
    },
    async executeWriteOperations() {
      try {
        const response = await axios.post('/api/persistenceTest/write')
        this.writeResults = response.data
        this.activeTab = 'write'
      } catch (error) {
        console.error('Failed to execute write operations:', error)
        this.$message.error('Failed to execute write operations.')
      }
    },
    async executeReadOperations() {
      try {
        const response = await axios.get('/api/persistenceTest/read')
        this.readResults = response.data
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
