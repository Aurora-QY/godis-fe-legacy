<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <h2>系统非功能性测试--压力测试</h2>
      <el-button type="primary" :disabled="isTestRunning" @click="startStressTest"> 开始压力测试 </el-button>
      <el-button type="danger" :disabled="!isTestRunning" @click="stopStressTest"> 停止压力测试 </el-button>
      <div>
        <el-card>
          <div id="connectionsChart" ref="connectionsChart" style="width: 100%; height: 400px" />
          <div>当前连接数: {{ testStatus.currentConnections }}</div>
        </el-card>
        <el-card>
          <div id="successfulCommandsChart" ref="successfulCommandsChart" style="width: 100%; height: 400px" />
          <div>成功命令数: {{ testStatus.successfulCommands }}</div>
        </el-card>

        <el-card>
          <div id="failedCommandsChart" ref="failedCommandsChart" style="width: 100%; height: 400px" />
          <div>失败命令数: {{ testStatus.failedCommands }}</div>
        </el-card>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'
import Sidebar from '../components/Sidebar.vue'

export default {
  components: {
    Sidebar,
  },
  data() {
    return {
      isTestRunning: false,
      testStatus: {
        currentConnections: 0,
        successfulCommands: 0,
        failedCommands: 0,
      },
      statusInterval: null,
      charts: {
        connectionsChart: null,
        successfulCommandsChart: null,
        failedCommandsChart: null,
      },
    }
  },
  beforeUnmount() {
    this.stopStatusPolling()
  },
  mounted() {
    this.initializeCharts()
  },
  methods: {
    async startStressTest() {
      try {
        await axios.post('/api/startStressTest')
        this.isTestRunning = true
        this.startStatusPolling()
      } catch (error) {
        console.error('启动压力测试失败:', error)
        this.$message.error('启动压力测试失败，请查看控制台获取详细信息。')
      }
    },
    async stopStressTest() {
      try {
        await axios.post('/api/stopStressTest')
        this.isTestRunning = false
        this.stopStatusPolling()
      } catch (error) {
        console.error('停止压力测试失败:', error)
        this.$message.error('停止压力测试失败，请查看控制台获取详细信息。')
      }
    },
    startStatusPolling() {
      this.statusInterval = setInterval(this.getTestStatus, 1000)
    },
    stopStatusPolling() {
      if (this.statusInterval) {
        clearInterval(this.statusInterval)
        this.statusInterval = null
      }
    },
    async getTestStatus() {
      try {
        const response = await axios.get('/api/getTestStatus')
        // 模拟后端返回的数据
        // const response = {
        //   data: {
        //     data: {
        //       currentConnections: Math.floor(Math.random() * 10) + 1,
        //       successfulCommands: Math.floor(Math.random() * 10) + 1,
        //       failedCommands: Math.floor(Math.random() * 10) + 1,
        //     },
        //   },
        // }
        this.testStatus = response.data.data
        this.updateCharts(this.testStatus)
      } catch (error) {
        console.error('获取测试状态失败:', error)
        this.stopStatusPolling()
        this.isTestRunning = false
        this.$message.error('获取测试状态失败，测试可能已经停止。')
      }
    },
    initializeCharts() {
      this.charts.connectionsChart = this.initChart(this.$refs.connectionsChart, '连接数折线图', '#0000FF')
      this.charts.successfulCommandsChart = this.initChart(this.$refs.successfulCommandsChart, '成功命令数折线图', '#008000')
      this.charts.failedCommandsChart = this.initChart(this.$refs.failedCommandsChart, '失败命令数折线图', '#FF0000')
    },
    initChart(container, title, color) {
      const chart = echarts.init(container)
      const options = {
        title: {
          text: title,
          textStyle: {
            color: 'black',
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#283b56',
            },
          },
        },
        xAxis: {
          type: 'category',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          boundaryGap: true,
        },
        yAxis: {
          type: 'value',
          min: 0,
        },
        series: [
          {
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            type: 'line',
            name: title,
            itemStyle: {
              color,
            },
            lineStyle: {
              color,
            },
          },
        ],
      }
      chart.setOption(options)
      return chart
    },
    updateCharts({ currentConnections, successfulCommands, failedCommands }) {
      const currentTime = new Date().toLocaleTimeString().replace(/^\D*/, '')
      this.updateChart(this.charts.connectionsChart, currentTime, currentConnections)
      this.updateChart(this.charts.successfulCommandsChart, currentTime, successfulCommands)
      this.updateChart(this.charts.failedCommandsChart, currentTime, failedCommands)
    },
    updateChart(chart, currentTime, data) {
      const options = chart.getOption()
      const xAxisData = options.xAxis[0].data
      const seriesData = options.series[0].data

      if (xAxisData.length >= 20) {
        xAxisData.shift()
        seriesData.shift()
      }

      xAxisData.push(currentTime)
      seriesData.push(data)

      chart.setOption({
        xAxis: [{ data: xAxisData }],
        series: [{ data: seriesData }],
      })
    },
  },
}
</script>

<style scoped>
.result-card {
  margin-top: 20px;
}

canvas {
  margin-top: 20px;
  max-width: 600px;
}
</style>
