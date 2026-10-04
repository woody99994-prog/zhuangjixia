/**
 * 兼容性面板渲染冒烟：拿后端真实返回，用 Vite SSR 真渲染一遍再断言文本。
 *
 * 为什么需要它：vite build 抓不到运行时错误（渲染时访问 undefined 才会炸），
 * 而兼容性面板的数据全部来自接口，字段缺失会导致白屏。只有真渲染才能暴露。
 *
 * 跑法（在 zhuangjixia-app 目录，需后端 3000 已启动）：
 *   node compat-smoke.mjs
 * 输出：compat-report.txt
 */
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import fs from 'node:fs'

const API = process.env.API_BASE || 'http://127.0.0.1:3000/api/app'
const out = []
let pass = 0
let fail = 0

const check = (name, ok, extra = '') => {
  if (ok) {
    pass++
    out.push(`✓ ${name}${extra ? ' — ' + extra : ''}`)
  } else {
    fail++
    out.push(`✗ ${name}${extra ? ' — ' + extra : ''}`)
  }
}

const postCompat = async (parts) => {
  const res = await fetch(`${API}/hardware/compat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parts })
  })
  const json = await res.json()
  return json.code === 0 ? json.data : null
}

// 三组用例：自洽配置 / 接口冲突 / 极端高功耗
const CASES = [
  {
    name: '自洽配置 i5-14600KF + Z790 + RTX 4070',
    parts: [
      { slot: 'cpu', model: 'Core i5-14600KF' },
      { slot: 'mainboard', model: '华硕 TUF GAMING Z790 ATX' },
      { slot: 'gpu', model: 'RTX 4070' },
      { slot: 'ram', model: '32GB DDR5 6000' },
      { slot: 'psu', model: '750W 金牌全模' },
      { slot: 'cooler', model: '利民 FC140 165mm 8热管 ARGB' },
      { slot: 'case', model: '追风者 P400A ATX中塔' },
      { slot: 'storage', model: '1TB PCIe 4.0' }
    ],
    // 官方建议：i5-14600KF + RTX 4070 ≈ 650W
    expect: { level: 'ok', hasSocket: 'LGA1700', minWatt: 600 }
  },
  {
    name: '接口冲突 AM5 CPU + Intel 主板',
    parts: [
      { slot: 'cpu', model: '锐龙 R5 7500F' },
      { slot: 'mainboard', model: 'B760M 重炮手' },
      { slot: 'gpu', model: 'RTX 4060' },
      { slot: 'ram', model: '32GB DDR5 6000' },
      { slot: 'psu', model: '650W 金牌全模' }
    ],
    expect: { level: 'error', hasSocket: 'AM5', minWatt: 0 }
  },
  {
    name: '旗舰高功耗 i9-14900K + RTX 4090',
    parts: [
      { slot: 'cpu', model: 'Core i9-14900K' },
      { slot: 'mainboard', model: '华硕 ROG STRIX Z790 ATX' },
      { slot: 'gpu', model: 'RTX 4090' },
      { slot: 'ram', model: '32GB DDR5 6000' },
      { slot: 'psu', model: '850W 金牌全模' }
    ],
    // 官方建议：i9-14900K + RTX 4090 ≈ 850~1000W
    expect: { level: 'ok', hasSocket: 'LGA1700', minWatt: 850 }
  }
]

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const mod = await server.ssrLoadModule('/src/components/CompatPanel.jsx')
const CompatView = mod.CompatView

for (const c of CASES) {
  const data = await postCompat(c.parts)
  if (!data) {
    check(c.name, false, '接口未返回数据')
    continue
  }
  // 接口层断言
  check(`${c.name}｜汇总等级`, data.summary.level === c.expect.level, `${data.summary.level} → ${data.summary.text}`)
  const socketItem = data.items.find((i) => i.key === 'cpu-mb-socket')
  check(`${c.name}｜接口解析`, !!socketItem && socketItem.left.value === c.expect.hasSocket, socketItem ? `${socketItem.left.value} ⇄ ${socketItem.right.value}` : '无该项')
  check(`${c.name}｜电源推荐`, data.psu.recommendWatt >= c.expect.minWatt, `满载 ${data.psu.loadWatt}W → 推荐 ${data.psu.recommendWatt}W`)

  // 渲染层断言：真渲染一遍，确认不炸且关键文本在 DOM 里
  let html = ''
  let renderErr = ''
  try {
    html = renderToString(React.createElement(CompatView, { data }))
  } catch (e) {
    renderErr = String(e && e.message)
  }
  check(`${c.name}｜渲染无异常`, !renderErr, renderErr || `${html.length} 字符`)
  if (html) {
    // React SSR 会在插值之间插入 <!-- --> 分隔符，比对前先去掉
    const text = html.replace(/<!-- -->/g, '')
    check(`${c.name}｜DOM 含推荐瓦数`, text.includes(`>${data.psu.recommendWatt}<`), `推荐 ${data.psu.recommendWatt}W`)
    check(`${c.name}｜DOM 含接口对比`, text.includes(c.expect.hasSocket), c.expect.hasSocket)
    check(`${c.name}｜DOM 含功耗构成`, text.includes(`处理器 ${data.psu.cpuWatt}W`) && text.includes(`显卡 ${data.psu.gpuWatt}W`), `${data.psu.cpuWatt}W + ${data.psu.gpuWatt}W`)
    check(`${c.name}｜DOM 含检查项`, c.name.includes('冲突') || text.includes('处理器与主板接口'), '')
  }
}

await server.close()
out.push('')
out.push(`PASS=${pass} FAIL=${fail}`)
fs.writeFileSync('compat-report.txt', out.join('\n'))
console.log(out.join('\n'))
process.exit(fail ? 1 : 0)
