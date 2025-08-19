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
  <div id="app">
    <nav v-if="!isAuthPage" class="top-nav">
      <div class="nav-left">
        <h1 class="brand">News Chat Bot</h1>
        <router-link :to="{name:'chat'}" class="nav-link" active-class="active">Chat</router-link>
        <router-link :to="{name:'admin'}" class="nav-link" active-class="active">Admin</router-link>
      </div>
      <button @click="logout" class="logout-btn">Logout</button>
    </nav>
    <router-view />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
  height: 100vh;
  overflow: hidden;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e1e5e9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  font-size: 20px;
  font-weight: 600;
  color: #2563eb;
  margin: 0;
}

.nav-link {
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #2563eb;
  background: #f3f4f6;
}

.nav-link.active {
  color: #2563eb;
  background: #eff6ff;
}

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-btn:hover {
  background: #dc2626;
}
</style>
