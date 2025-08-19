<script setup>
import axios from 'axios'
import { onMounted, ref, watch, nextTick } from 'vue'

const conversations = ref([])
const selectedId = ref('')
const messages = ref([])
const input = ref('')
const loading = ref(false)
const error = ref('')
const sidebarCollapsed = ref(false)
const messagesContainer = ref(null)

function authHeaders() {
  const token = localStorage.getItem('token')
  return { Authorization: `Bearer ${token}` }
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
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
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatBotMessage(text) {
  if (!text) return ''
  // Basic markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

async function sendMessage() {
  if (!input.value || !selectedId.value) return
  loading.value = true
  error.value = ''
  const msg = input.value
  input.value = ''
  const headers = { ...authHeaders(), 'Content-Type': 'application/json' }
  const controller = new AbortController()
  try {
    // Optimistically add a placeholder for streaming bot reply
    messages.value.push({ userMsg: msg, botMsg: '' })
    const idx = messages.value.length - 1
    await nextTick()
    scrollToBottom()
    
    const resp = await fetch(`/api/chat/conversations/${selectedId.value}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: msg }),
      signal: controller.signal,
    })
    if (!resp.ok) {
      throw new Error('Request failed')
    }
    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() || ''
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue
        const json = part.slice(6)
        if (json === '[DONE]') continue
        try {
          const evt = JSON.parse(json)
          if (evt.delta) {
            messages.value[idx].botMsg += evt.delta
            scrollToBottom()
          } else if (evt.event === 'end') {
            // server will persist; reload list/title lazily
          } else if (evt.event === 'error') {
            throw new Error(evt.message || 'Generation error')
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
  } catch (e) {
    error.value = e?.message || 'Failed to send message'
  } finally {
    loading.value = false
    // refresh conversations to get updated summary/title
    try { await loadConversations() } catch {}
  }
}

watch(selectedId, loadMessages)
onMounted(async () => {
  await loadConversations()
  await loadMessages()
})
</script>

<template>
  <div class="chat-container">
    <!-- Sidebar -->
    <aside 
      class="sidebar"
      :class="{ 'collapsed': sidebarCollapsed }"
    >
      <div class="sidebar-header">
        <h3 v-if="!sidebarCollapsed">Conversations</h3>
        <button @click="createConversation" class="new-chat-btn" :title="sidebarCollapsed ? 'New Chat' : ''">
          <svg v-if="sidebarCollapsed" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14m-7-7h14"/>
          </svg>
          <span v-else>New Chat</span>
        </button>
      </div>
      
      <div class="conversations-list">
        <div 
          v-for="c in conversations" 
          :key="c.id"
          class="conversation-item"
          :class="{ 'active': selectedId === c.id }"
          @click="selectedId = c.id"
          :title="sidebarCollapsed ? c.summary : ''"
        >
          <div class="conversation-summary">
            {{ sidebarCollapsed ? (c.summary?.substring(0, 2) || '••') : c.summary }}
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Chat Area -->
    <main class="chat-main">
      <!-- Chat Header -->
      <div class="chat-header">
        <button @click="toggleSidebar" class="sidebar-toggle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18m-9-9l9 9-9 9"/>
          </svg>
        </button>
        <h2>News Chat Assistant</h2>
      </div>

      <!-- Messages Area -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="!messages.length" class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>Start a conversation</h3>
          <p>Ask me anything about the news or current events!</p>
        </div>
        
        <div v-for="(m, idx) in messages" :key="idx" class="message-pair">
          <!-- User Message -->
          <div class="message user-message">
            <div class="message-avatar user-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text">{{ m.userMsg }}</div>
            </div>
          </div>

          <!-- Bot Message -->
          <div class="message bot-message">
            <div class="message-avatar bot-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="formatBotMessage(m.botMsg)"></div>
              <div v-if="loading && idx === messages.length - 1 && !m.botMsg" class="typing-indicator">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div v-if="error" class="error-message">{{ error }}</div>
        <form @submit.prevent="sendMessage" class="input-form">
          <div class="input-wrapper">
            <input 
              v-model="input" 
              placeholder="Type your message..." 
              class="message-input"
              :disabled="loading || !selectedId"
            />
            <button 
              type="submit" 
              class="send-btn"
              :disabled="loading || !selectedId || !input.trim()"
            >
              <svg v-if="loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: calc(100vh - 73px);
  background: #f8fafc;
}

/* Sidebar Styles */
.sidebar {
  width: 300px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 2px 0 4px rgba(0,0,0,0.1);
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
}

.sidebar-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.new-chat-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-chat-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.conversation-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.conversation-item.active {
  background: #eff6ff;
  border-color: #3b82f6;
}

.conversation-summary {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar.collapsed .conversation-summary {
  text-align: center;
  font-weight: 600;
  font-size: 12px;
}

/* Main Chat Area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.sidebar-toggle {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.sidebar-toggle:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.chat-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

/* Messages Area */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e293b;
}

.empty-state p {
  font-size: 16px;
  color: #64748b;
}

.message-pair {
  margin-bottom: 24px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  max-width: 85%;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.bot-message {
  margin-right: auto;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: #3b82f6;
  color: white;
}

.bot-avatar {
  background: #10b981;
  color: white;
}

.message-content {
  flex: 1;
}

.message-text {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #1e293b;
  word-wrap: break-word;
}

.user-message .message-text {
  background: #3b82f6;
  color: white;
}

.typing-indicator {
  padding: 12px 16px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1);
  }
}

/* Input Area */
.input-area {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
}

.input-form {
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: end;
  background: #f8fafc;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.message-input {
  flex: 1;
  border: none;
  background: none;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  resize: none;
  min-height: 20px;
  max-height: 120px;
  color: #1e293b;
}

.message-input::placeholder {
  color: #94a3b8;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.send-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 250px;
  }
  
  .sidebar.collapsed {
    width: 50px;
  }
  
  .message {
    max-width: 95%;
  }
  
  .input-area {
    padding: 12px;
  }
}
</style>
