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
      <div style="display: inline-block; vertical-align: top; margin-left: 20px">
        <h3>Overall Pass Rate: {{ overallPassRate }}%</h3>
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
      testCaseResults: [], // 用于存储测试用例的结果
      allTestCases: [], // 用于存储所有的测试用例及其执行情况
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
            executed: result !== null, // 添加一个标志位，表示是否已经执行过
          })
        })
      })

      return flattenedResult
    },
    allTestCasesComputed() {
      const testCases = []

      Object.keys(this.testCasesData).forEach((command) => {
        const commandTestCases = this.testCasesData[command]

        Object.keys(commandTestCases).forEach((testCaseKey) => {
          const testCase = commandTestCases[testCaseKey]
          const commands = testCase.commands.map((cmd) => ({
            command: cmd.command,
            expected_output: cmd.expected_output,
            result: null,
            isPass: null,
          }))

          testCases.push({
            testCaseKey,
            remark: testCase.remark,
            commands,
            isPass: null,
          })
        })
      })

      return testCases
    },
    totalTestCases() {
      return this.allTestCasesComputed.length
    },
    passRateData() {
      const passCount = this.allTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const failCount = this.allTestCases.length - passCount

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

      // Iterate through each command in the test cases data
      Object.keys(this.testCasesData).forEach((command) => {
        const testCases = this.testCasesData[command]
        let passCount = 0
        let totalCases = 0

        // Iterate through each test case for the command
        Object.keys(testCases).forEach((testCaseKey) => {
          // Find the corresponding test case in the allTestCases array
          const testCaseResult = this.allTestCases.find((result) => result.testCaseKey === testCaseKey)

          // If the test case exists and all its commands passed, increment the pass count
          if (testCaseResult && testCaseResult.isPass === 'Pass') {
            passCount += 1
          }

          totalCases += 1
        })

        const passRate = (passCount / totalCases) * 100

        // Add the command statistics to the stats object
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
    overallPassRate() {
      const passCount = this.allTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const totalCount = this.allTestCases.length
      return totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : '0.00'
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
        this.allTestCases = this.allTestCasesComputed
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
      const results = [] // 用于存储执行结果
      for (const testCase of this.allTestCases) {
        for (const command of testCase.commands) {
          // const result = await this.executeCommand(command.command)
          const result = '(integer) 1'
          const expectedOutput = command.expected_output
          const isPass = result === expectedOutput
          command.result = result
          command.isPass = isPass ? 'Pass' : 'Fail'
        }
        testCase.isPass = testCase.commands.every((cmd) => cmd.isPass === 'Pass') ? 'Pass' : 'Fail'
      }

      // 更新测试结果
      this.testCaseResults = results

      // 强制更新通过率和命令统计数据
      this.updateCharts()
    },

    updateCharts() {
      this.overallPassRate = { ...this.overallPassRate }
      this.passRateData = { ...this.passRateData } // 创建一个新的对象来强制更新
      this.commandStatsData = { ...this.commandStatsData } // 创建一个新的对象来强制更新
    },

    getTestCaseResult(testCaseKey, command) {
      const testCase = this.allTestCases.find((testCase) => testCase.testCaseKey === testCaseKey)
      const commandResult = testCase?.commands.find((cmd) => cmd.command === command)
      return commandResult ? commandResult.result : null
    },
  },
}
</script>
