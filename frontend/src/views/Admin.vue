<script setup>
import axios from 'axios'
import { onMounted, ref } from 'vue'

const users = ref([])
const loading = ref(false)
const error = ref('')
const form = ref({ userName: '', email: '', password: '' })

function authHeaders() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axios.get('/api/auth/users', { headers: authHeaders() })
    users.value = data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

async function createUser() {
  error.value = ''
  try {
    await axios.post('/api/auth/users', form.value, { headers: authHeaders() })
    form.value = { userName: '', email: '', password: '' }
    await loadUsers()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to create user'
  }
}

async function deleteUser(id) {
  error.value = ''
  try {
    await axios.delete(`/api/auth/users/${id}`, { headers: authHeaders() })
    await loadUsers()
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to delete user'
  }
}

onMounted(loadUsers)
</script>

<template>
  <div style="max-width:800px;margin:24px auto">
    <h2>Admin - Manage Users</h2>
    <div v-if="error" style="color:#c00">{{ error }}</div>

    <form @submit.prevent="createUser" style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
      <input v-model="form.userName" placeholder="User name" required />
      <input v-model="form.email" type="email" placeholder="Email" required />
      <input v-model="form.password" type="password" placeholder="Password" required />
      <button type="submit">Create</button>
    </form>

    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Name</th>
          <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Email</th>
          <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td style="padding:8px">{{ u.userName }}</td>
          <td style="padding:8px">{{ u.email }}</td>
          <td style="padding:8px">
            <button @click="deleteUser(u._id || u.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="loading">Loading...</div>
  </div>
  
</template>


