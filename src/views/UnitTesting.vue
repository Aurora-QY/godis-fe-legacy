<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <div class="allure-report-container">
        <div class="report-info">
          <h2>单元测试</h2>
          <p><strong>测试工具：</strong></p>
          <p>go test (go部分) / google test (c++部分)</p>
          <p>使用go-junit-report工具转换go test并输出至allure</p>
          <p />
          <p><strong>测试用例设计方法：</strong></p>
          <p>黑盒测试技术：边界值分析法、等价类</p>
          <p>白盒测试技术：逻辑覆盖测试法</p>
        </div>
        <button class="toggle-button" @click="toggleReport">
          {{ isReportVisible ? '隐藏报告' : '单元测试' }}
        </button>
        <div v-if="isLoading" class="loading">加载中...</div>
        <div v-if="isReportVisible && !isLoading" class="report-wrapper">
          <iframe :src="allureReportUrl" frameborder="0" class="report-iframe" @load="onIframeLoad" />
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'AllureReport',
  data() {
    return {
      isReportVisible: false,
      isLoading: false,
      allureReportUrl: 'http://192.168.230.1:14900/', // 替换为你的 Allure 报告 URL
    }
  },
  methods: {
    toggleReport() {
      if (!this.isReportVisible) {
        this.isLoading = true
        setTimeout(() => {
          this.isReportVisible = true
          this.isLoading = false
        }, 1000) // 1秒延迟
      } else {
        this.isReportVisible = false
      }
    },
    onIframeLoad() {
      // 如果需要在iframe加载完成后做一些操作，可以在这里添加
    },
  },
}
</script>

<style scoped>
.allure-report-container {
  margin: 20px;
  font-family: Arial, sans-serif;
}

.report-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.report-info h2 {
  margin-top: 0;
  color: #333;
}

.report-info p {
  margin: 10px 0;
  color: #666;
}

.toggle-button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
  margin-bottom: 10px;
}

.report-wrapper {
  position: relative;
  width: 80vw;
  height: 60vh;
  max-width: 1200px;
  max-height: 800px;
  overflow: hidden;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading {
  font-size: 18px;
  margin-top: 20px;
  text-align: center;
}

.report-iframe {
  width: 100%;
  height: 100%;
  transform: scale(0.75);
  transform-origin: 0 0;
}

@media (max-width: 768px) {
  .report-wrapper {
    width: 95vw;
    height: 70vh;
  }

  .report-iframe {
    transform: scale(0.5);
  }
}
</style>
