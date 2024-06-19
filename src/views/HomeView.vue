<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <CommandConsole />
    </el-main>
  </el-container>
</template>

<script>
import Sidebar from '../components/Sidebar.vue'
import CommandConsole from '../components/CommandConsole.vue'

export default {
  components: {
    Sidebar,
    CommandConsole,
  },
}
</script>

<style>

</style>
