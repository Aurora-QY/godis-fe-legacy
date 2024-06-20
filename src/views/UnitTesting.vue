<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <div>Total Test Cases: {{ totalTestCases }}</div>

      <div>
        <button @click="executeAllTestCases">Execute Test Cases</button>
      </div>

      <div style="height: 200px; width: 200px; display: inline-block">
        <PieChartComponent :chart-data="passRateData" />
      </div>

      <div style="height: 200px; width: 200px; display: inline-block">
        <LineChartComponent :chart-data="commandStatsData" />
      </div>
      <div>
        <h1>Test Cases</h1>
        <el-select v-model="selectedCommand" placeholder="Select Command" style="margin-bottom: 20px">
          <el-option v-for="command in commandOptions" :key="command" :label="command" :value="command" />
        </el-select>

        <el-table :data="commandStats">
          <el-table-column prop="command" label="Command" />
          <el-table-column prop="total" label="Total Cases" />
          <el-table-column prop="passRate" label="Pass Rate (%)" />
        </el-table>
        <br />
        <el-table :data="flattenedTestCases" :span-method="mergeCells">
          <el-table-column prop="testCaseKey" label="Test Case" />
          <el-table-column prop="remark" label="Remark" />
          <el-table-column prop="command" label="Command" />
          <el-table-column prop="expected_output" label="Expected Output" />
          <el-table-column prop="result" label="Result" />
          <el-table-column prop="isPass" label="Pass/Fail" />
        </el-table>
      </div>
    </el-main>
  </el-container>
</template>

<script>
/* eslint-disable no-console */
import axios from 'axios'
import Sidebar from '../components/Sidebar.vue'
import PieChartComponent from '../components/PieChart.vue'
import LineChartComponent from '../components/LineChart.vue'

export default {
  components: {
    Sidebar,
    PieChartComponent,
    LineChartComponent,
  },
  data() {
    return {
      testCasesData: {},
      selectedCommand: null,
      testCaseResults: [], // 新增一个数组来存储测试用例的结果
    }
  },
  computed: {
    commandOptions() {
      return Object.keys(this.testCasesData)
    },
    flattenedTestCases() {
      if (!this.selectedCommand) {
        return []
      }

      const testCases = this.testCasesData[this.selectedCommand]
      const flattenedResult = []

      Object.keys(testCases).forEach((testCaseKey) => {
        const testCase = testCases[testCaseKey]
        testCase.commands.forEach((cmd, index) => {
          const expectedOutput = Array.isArray(cmd.expected_output) ? cmd.expected_output.join(', ') : cmd.expected_output
          const result = this.getTestCaseResult(testCaseKey, cmd.command)
          const isPass = result !== null ? (result === expectedOutput ? 'Pass' : 'Fail') : null

          flattenedResult.push({
            testCaseKey,
            remark: index === 0 ? testCase.remark : '', // Only show remark in the first row for each test case
            command: cmd.command,
            expected_output: expectedOutput,
            result: result !== null ? result : '', // 若result为null则显示为空
            isPass: isPass !== null ? isPass : '', // 若isPass为null则显示为空
            index,
            totalCommands: testCase.commands.length,
            executed: result !== null, // 添加一个标志位,表示是否已经执行过
          })
        })
      })

      return flattenedResult
    },
    totalTestCases() {
      let total = 0
      Object.keys(this.testCasesData).forEach((command) => {
        total += Object.keys(this.testCasesData[command]).length
      })
      return total
    },
    passRateData() {
      const passCount = this.flattenedTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const failCount = this.flattenedTestCases.length - passCount

      return {
        labels: ['Pass', 'Fail'],
        datasets: [
          {
            data: [passCount, failCount],
            backgroundColor: ['#42b983', '#ff6384'],
          },
        ],
      }
    },
    commandStats() {
      const stats = {}

      Object.keys(this.testCasesData).forEach((command) => {
        const testCases = this.testCasesData[command]
        let passCount = 0
        let totalCases = 0

        Object.keys(testCases).forEach((testCaseKey) => {
          const testCase = testCases[testCaseKey]
          const allCommandsPassed = testCase.commands.every((cmd) => {
            const testCaseResult = this.flattenedTestCases.find(
              (flatTestCase) => flatTestCase.testCaseKey === testCaseKey && flatTestCase.command === cmd.command.trim(),
            )
            return testCaseResult && testCaseResult.isPass === 'Pass'
          })
          if (allCommandsPassed) {
            passCount += 1
          }
          totalCases += 1
        })

        const passRate = (passCount / totalCases) * 100

        stats[command] = {
          command,
          total: totalCases,
          passRate: passRate.toFixed(2),
        }
      })

      return Object.values(stats)
    },
    commandStatsData() {
      const labels = this.commandStats.map((stat) => stat.command)
      const data = this.commandStats.map((stat) => stat.passRate)

      return {
        labels,
        datasets: [
          {
            label: 'Pass Rate (%)',
            data,
            borderColor: '#42b983',
            backgroundColor: 'rgba(66, 185, 131, 0.2)',
          },
        ],
      }
    },
  },
  created() {
    fetch('/test-cases.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        this.testCasesData = data
      })
      .catch((error) => {
        console.error('Error fetching test cases:', error)
      })
  },
  methods: {
    mergeCells({ row, columnIndex }) {
      if (columnIndex === 0) {
        // Merge testCaseKey column
        if (row.index === 0) {
          return {
            rowspan: row.totalCommands,
            colspan: 1,
          }
        } else {
          return {
            rowspan: 0,
            colspan: 0,
          }
        }
      } else if (columnIndex === 1) {
        // Merge remark column
        if (row.index === 0) {
          return {
            rowspan: row.totalCommands,
            colspan: 1,
          }
        } else {
          return {
            rowspan: 0,
            colspan: 0,
          }
        }
      }
      return {
        rowspan: 1,
        colspan: 1,
      }
    },

    executeCommand(command) {
      if (!command.trim()) {
        ElMessage.error('命令不能为空')
        return null
      }

      let result = null
      return axios
        .post('/api/execute', { command })
        .then((response) => {
          if (response.data.code === 200) {
            result = response.data.data
            return result
          } else {
            ElMessage.error('执行错误!')
            result = response.data.data
            return result
          }
        })
        .catch((error) => {
          ElMessage.error('执行错误', error)
          return null
        })
    },

    async executeAllTestCases() {
      console.log('test')
      const results = [] // 用于存储执行结果
      for (const testCase of this.flattenedTestCases) {
        if (!testCase.executed) {
          console.log(testCase.command)
          // const result = await this.executeCommand(testCase.command)
          const result = '(integer) 1'
          const expectedOutput = testCase.expected_output
          const isPass = result === expectedOutput
          results.push({
            testCaseKey: testCase.testCaseKey,
            command: testCase.command,
            result,
            isPass: isPass ? 'Pass' : 'Fail',
          })
        }
      }

      // 更新测试结果
      this.testCaseResults = results

      // 强制更新通过率和命令统计数据
      this.updateCharts()
    },

    updateCharts() {
      this.passRateData = { ...this.passRateData } // 创建一个新的对象来强制更新
      this.commandStatsData = { ...this.commandStatsData } // 创建一个新的对象来强制更新
    },

    getTestCaseResult(testCaseKey, command) {
      const result = this.testCaseResults.find((result) => result.testCaseKey === testCaseKey && result.command === command)
      return result ? result.result : null
    },
  },
}
</script>
