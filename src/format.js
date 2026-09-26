// C 端通用格式化工具

// 金额：分 → ¥1,234.00
export function yuan(cents) {
  const n = Number(cents || 0) / 100
  return (
    '¥' +
    n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  )
}

// 手机号打码：138****0000
export function maskPhone(p) {
  if (!p) return ''
  return String(p).replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 / 日期
export function relTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const s = Math.floor((now - d) / 1000)
  if (s < 60) return '刚刚'
  if (s < 3600) return Math.floor(s / 60) + ' 分钟前'
  if (s < 86400) return Math.floor(s / 3600) + ' 小时前'
  if (s < 86400 * 30) return Math.floor(s / 86400) + ' 天前'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 方案等级中文
export function levelLabel(level) {
  return { entry: '入门', mainstream: '主流', high: '高端' }[level] || level || ''
}

// 认证状态中文
export function authStatusLabel(status) {
  return (
    { approved: '认证玩家', pending: '认证中', rejected: '未通过', none: '未认证' }[
      status
    ] || '未认证'
  )
}
