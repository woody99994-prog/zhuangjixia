import { CONFIG_SLOTS } from './data.js'

// 配置表 ↔ Markdown 表格互转
// 为什么要转成 Markdown 表格而不是存 id：正文是「自包含」的，
// 别人看你的帖子时不依赖你那套配置是否还存在（换个账号也照样能看到表）

export function planToMarkdownTable(title, planJson) {
  const plan = planJson || {}
  const rows = CONFIG_SLOTS.map((s) => {
    const it = plan[s.key] || {}
    const model = (it.model || '').trim() || '—'
    const price = Number(it.price)
    // 表格正文用中文名（cn），保证复制 / 分享出去也是中文；图标由前端渲染时叠加
    return `| ${s.cn} | ${model} | ${Number.isFinite(price) && price > 0 ? '¥' + price : '—'} |`
  })
  return [
    `**配置清单：${title}**`,
    '',
    '| 配件 | 型号 | 价格 |',
    '| --- | --- | --- |',
    ...rows,
    ''
  ].join('\n')
}

// 配置表格首列表头固定为「配件」，详情页据此识别并叠加图标 / 总价
export const CONFIG_TABLE_FIRST_HEADER = '配件'

export function isConfigTable(headers) {
  return Array.isArray(headers) && headers[0] && String(headers[0]).trim() === CONFIG_TABLE_FIRST_HEADER
}

// 表格首列单元格 → 槽位 key（兼容中文名 cn 与旧英文/中文 label，便于识别历史帖子里的表）
export function slotKeyFromCell(text) {
  const t = String(text || '').trim()
  const slot = CONFIG_SLOTS.find((s) => s.cn === t || s.label === t)
  return slot ? slot.key : null
}

// 价格单元格 → 数值（元）：兼容「¥1,299」「1299 元」「—」等
export function priceFromCell(text) {
  const raw = String(text || '').replace(/[^\d.]/g, '')
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n) : 0
}

// 从表格行反解出 11 槽位（用于详情页「存入我的配置」）
export function rowsToPlan(rows) {
  const plan = {}
  for (const r of rows) {
    const key = slotKeyFromCell(r[0])
    if (!key) continue
    const model = String(r[1] || '').trim()
    plan[key] = {
      model: model === '—' ? '' : model,
      price: priceFromCell(r[2])
    }
  }
  return plan
}

export function planTotalYuan(planJson) {
  const plan = planJson || {}
  return CONFIG_SLOTS.reduce((sum, s) => {
    const p = Number((plan[s.key] || {}).price)
    return sum + (Number.isFinite(p) ? p : 0)
  }, 0)
}
