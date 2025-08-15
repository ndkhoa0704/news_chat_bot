<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const isAuthPage = computed(() => ['login', 'register'].includes(route.name))

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push({ name: 'login' })
}
</script>

<template>
  <div>
    <nav v-if="!isAuthPage" style="display:flex;gap:12px;padding:12px;border-bottom:1px solid #ddd;align-items:center;justify-content:space-between">
      <div style="display:flex;gap:12px;align-items:center">
        <strong>News Chat Bot</strong>
        <router-link :to="{name:'chat'}">Chat</router-link>
        <router-link :to="{name:'admin'}">Admin</router-link>
      </div>
      <button @click="logout">Logout</button>
    </nav>
    <router-view />
  </div>
  
</template>
