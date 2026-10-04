// C 端统一 API 客户端：同源 /api/app 代理到后端 3000
// 鉴权：登录拿 accessToken(Bearer) + app_refresh(httpOnly cookie)
// 401 时自动凭 refresh cookie 换 token 重试一次；刷新失败抛 UNAUTHORIZED

import { Capacitor } from '@capacitor/core'

// 是否运行在 Capacitor 原生壳（安卓 APK）内
export const IS_NATIVE = Capacitor.isNativePlatform()
// API 基地址：CI 构建时由 VITE_API_BASE 注入（真机可达的后端）；
// 本地开发与同源 Web 回退到 /api/app（由 Vite proxy 转发到后端 3000）
const API_BASE = import.meta.env.VITE_API_BASE || '/api/app'
const TOKEN_KEY = 'zjx_app_token'
const USER_KEY = 'zjx_app_user'
const REFRESH_TOKEN_KEY = 'zjx_app_refresh_token'

// 仅在原生壳内使用：httpOnly cookie 在原生 WebView 中无法被前端读取，
// 因此 refresh token 由前端自行持久化，并通过 X-Refresh-Token 头回传
function getRefreshToken() {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null
}
function setRefreshToken(t) {
  if (typeof localStorage === 'undefined') return
  if (t) localStorage.setItem(REFRESH_TOKEN_KEY, t)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function safeParse(s) {
  try {
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

let accessToken =
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
let currentUser =
  typeof localStorage !== 'undefined' ? safeParse(localStorage.getItem(USER_KEY)) : null

export function getToken() {
  return accessToken
}
export function setToken(t) {
  accessToken = t
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export function getUser() {
  return currentUser
}
export function setUser(u) {
  currentUser = u
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
  else localStorage.removeItem(USER_KEY)
}
export function clearAuth() {
  setToken(null)
  setUser(null)
  if (IS_NATIVE) setRefreshToken(null)
}

export class ApiError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

async function tryRefresh() {
  try {
    const headers = {}
    let credentials = 'same-origin'
    if (IS_NATIVE) {
      const rt = getRefreshToken()
      if (!rt) return false
      headers['X-Refresh-Token'] = rt
      credentials = 'omit'
    }
    const res = await fetch(API_BASE + '/auth/refresh', {
      method: 'POST',
      credentials,
      headers,
    })
    if (!res.ok) return false
    const json = await res.json()
    if (json && json.code === 0 && json.data && json.data.accessToken) {
      setToken(json.data.accessToken)
      if (IS_NATIVE && json.data.refreshToken) setRefreshToken(json.data.refreshToken)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function request(
  path,
  { method = 'GET', body, auth = true, _retry = false } = {},
) {
  const url = API_BASE + '/' + String(path).replace(/^\//, '')
  // 无 body 的请求绝不能带 Content-Type: application/json
  // 否则 Fastify 会直接 400「Body cannot be empty when content-type is set to 'application/json'」
  // （POST /my/messages/read-all、DELETE 等无参请求都踩过这个坑）
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers['Authorization'] = 'Bearer ' + accessToken

  // 原生壳内前后端不同源，不依赖 cookie（用 Bearer + X-Refresh-Token），故 omit；
  // 同源 Web 保留 same-origin 以携带 refresh httpOnly cookie
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: IS_NATIVE ? 'omit' : 'same-origin',
  })

  let json
  try {
    json = await res.json()
  } catch {
    json = {}
  }

  if (res.status === 401 && auth && !_retry && path !== 'auth/refresh') {
    const ok = await tryRefresh()
    if (ok) return request(path, { method, body, auth, _retry: true })
    throw new ApiError('登录已失效，请重新登录', 'UNAUTHORIZED')
  }

  if (json.code !== 0) {
    throw new ApiError(json.message || '请求失败 (' + res.status + ')', json.code)
  }
  // 原生壳内：登录/刷新等响应里的 refreshToken 由前端自存（httpOnly cookie 读不到）
  if (IS_NATIVE && json.data && json.data.refreshToken) setRefreshToken(json.data.refreshToken)
  return json.data
}

export const api = {
  get: (path, opts = {}) => request(path, { method: 'GET', ...opts }),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body, opts = {}) => request(path, { method: 'PUT', body, ...opts }),
  del: (path, opts = {}) => request(path, { method: 'DELETE', ...opts }),
}

export default api
