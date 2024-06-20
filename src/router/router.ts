// router.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import UnitTesting from '../views/UnitTesting.vue'
import IntegrationTesting from '../views/IntegrationTesting.vue'
import SystemTesting from '../views/SystemTesting.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/UnitTesting', component: UnitTesting },
  { path: '/IntegrationTesting', component: IntegrationTesting },
  { path: '/SystemTesting', component: SystemTesting },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
