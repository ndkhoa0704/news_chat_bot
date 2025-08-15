<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await axios.post('/api/auth/login', { email: email.value, password: password.value })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    router.push({ name: 'chat' })
  } catch (e) {
    error.value = e?.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width:420px;margin:64px auto">
    <h2>Login</h2>
    <form @submit.prevent="submit" style="display:flex;flex-direction:column;gap:12px">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button :disabled="loading" type="submit">{{ loading ? '...' : 'Login' }}</button>
      <p v-if="error" style="color:#c00">{{ error }}</p>
      <p>
        No account?
        <router-link :to="{name:'register'}">Register</router-link>
      </p>
    </form>
  </div>
</template>


