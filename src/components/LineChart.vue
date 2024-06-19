<template>
  <div>
    <LineChartComponent :chart-data="chartData" />
  </div>
</template>

<script>
import { Line as LineChartComponent } from 'vue-chartjs'
import { CategoryScale, Chart as ChartJS, Legend, LineElement, LinearScale, PointElement, Title, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, Legend, LineElement, LinearScale, PointElement, Title, Tooltip)

export default {
  components: {
    LineChartComponent,
  },
  props: {
    chartData: {
      type: Object,
      required: true,
    },
  },
}
</script>
