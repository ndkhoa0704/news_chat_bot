import { createRouter, createWebHistory } from 'vue-router'

const Login = () => import('../views/Login.vue')
const Register = () => import('../views/Register.vue')
const Chat = () => import('../views/Chat.vue')
const Admin = () => import('../views/Admin.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: Register },
    { path: '/', redirect: { name: 'chat' } },
    { path: '/chat', name: 'chat', component: Chat },
    { path: '/admin', name: 'admin', component: Admin },
  ]
})

router.beforeEach((to, _from, next) => {
  const publicPages = ['login', 'register']
  const authRequired = !publicPages.includes(to.name)
  const token = localStorage.getItem('token')
  if (authRequired && !token) {
    return next({ name: 'login' })
  }
  next()
})

export default router


