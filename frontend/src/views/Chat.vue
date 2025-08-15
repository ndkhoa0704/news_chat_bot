<script setup>
import axios from 'axios'
import { onMounted, ref, watch } from 'vue'

const conversations = ref([])
const selectedId = ref('')
const messages = ref([])
const input = ref('')
const loading = ref(false)
const error = ref('')

function authHeaders() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

async function loadConversations() {
  const { data } = await axios.get('/api/chat/conversations', { headers: authHeaders() })
  conversations.value = data
  if (!selectedId.value && data.length) {
    selectedId.value = data[0].id
  }
}

async function createConversation() {
  const { data } = await axios.post('/api/chat/conversations', {}, { headers: authHeaders() })
  await loadConversations()
  selectedId.value = data.id
  messages.value = []
}

async function loadMessages() {
  if (!selectedId.value) return
  const { data } = await axios.get(`/api/chat/conversations/${selectedId.value}`, { headers: authHeaders() })
  messages.value = data?.messages || []
}

async function sendMessage() {
  if (!input.value || !selectedId.value) return
  loading.value = true
  error.value = ''
  const msg = input.value
  input.value = ''
  try {
    const { data } = await axios.post(`/api/chat/conversations/${selectedId.value}/messages`, { message: msg }, { headers: authHeaders() })
    messages.value.push({ userMsg: msg, botMsg: data.botMsg })
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to send message'
  } finally {
    loading.value = false
  }
}

watch(selectedId, loadMessages)
onMounted(async () => {
  await loadConversations()
  await loadMessages()
})
</script>

<template>
  <div style="display:flex;height:calc(100vh - 60px)">
    <aside style="width:280px;border-right:1px solid #ddd;padding:12px;overflow:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Conversations</strong>
        <button @click="createConversation">New</button>
      </div>
      <ul style="list-style:none;padding:0;margin:0">
        <li v-for="c in conversations" :key="c.id">
          <button @click="selectedId = c.id" :style="{width:'100%',textAlign:'left',padding:'8px',background:selectedId===c.id?'#eef':'#fff'}">
            {{ c.summary }}
          </button>
        </li>
      </ul>
    </aside>
    <main style="flex:1;display:flex;flex-direction:column">
      <div style="flex:1;overflow:auto;padding:16px">
        <div v-for="(m,idx) in messages" :key="idx" style="margin-bottom:12px">
          <div><strong>You:</strong> {{ m.userMsg }}</div>
          <div><strong>Bot:</strong> {{ m.botMsg }}</div>
        </div>
        <div v-if="!messages.length" style="color:#666">No messages yet</div>
      </div>
      <form @submit.prevent="sendMessage" style="display:flex;gap:8px;padding:12px;border-top:1px solid #ddd">
        <input v-model="input" placeholder="Type a message" style="flex:1" />
        <button :disabled="loading || !selectedId" type="submit">Send</button>
      </form>
      <div v-if="error" style="color:#c00;padding:0 12px 12px">{{ error }}</div>
    </main>
  </div>
  
</template>


