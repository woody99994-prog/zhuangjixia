/**
 * AI 配置单冒烟：解析（纯函数）+ 渲染（Vite SSR 真渲染）双层断言。
 *
 * 为什么需要它：AI 回复是模型自由文本，表格格式一变「保存到我的配置 / 再来一条」就失效，
 * 而这类失效在 build 阶段完全看不出来（纯运行时）。解析正则或槽位映射改坏必须能被抓住。
 *
 * 跑法（在 zhuangjixia-app 目录）：
 *   node ai-smoke.mjs
 * 输出：ai-report.txt
 */
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import fs from 'node:fs'

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

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const mod = await server.ssrLoadModule('/src/screens/AIBuild.jsx')
const { parsePlan, AiPlanCard } = mod

// —— ① 解析层 ——
const TABLE = `这套主打 2K 游戏，预算 8000：

| 配件 | 型号 | 参考价(元) |
| --- | --- | --- |
| 处理器 | AMD 锐龙 R5 7500F | 899 |
| 主板 | 华硕 TUF GAMING B650M-PLUS | 1099 |
| 显卡 | 影驰 RTX 4060 金属大师 | 2299 |
| 内存 | 金士顿 FURY 32GB DDR5 6000 | 699 |
| 硬盘 | 三星 990 PRO 1TB | 599 |
| 电源 | 海韵 FOCUS 650W 金牌全模组 | 649 |
| 散热 | 利民 PA120 SE | 129 |
| 机箱 | 追风者 P400A | 299 |

合计 6672 元，剩下的预算可以加到显卡上。`

const plan = parsePlan(TABLE)
check('解析｜识别到配置表', !!plan && plan.rows.length === 8, plan ? `${plan.rows.length} 行` : 'null')
check('解析｜槽位映射完整', !!plan && plan.rows.every((r) => r.slot), (plan ? plan.rows.filter((r) => !r.slot).map((r) => r.cn).join(',') : '') || '全部命中')
check('解析｜合计金额', !!plan && plan.total === 6672, plan ? `¥${plan.total}` : '-')
check('解析｜表前正文保留', !!plan && plan.before.includes('2K 游戏'))
check('解析｜表后正文保留', !!plan && plan.after.includes('剩下的预算'))

// 非配置回复不能误判成配置单
check('解析｜无表格返回 null', parsePlan('先告诉我你的显示器分辨率？') === null)
check('解析｜普通对比表不误判', parsePlan('| 项 | A | B |\n| --- | --- | --- |\n| 帧数 | 60 | 90 |') === null)

// 价格写法：¥1,899 / 1899 元 / 无价格
const p2 = parsePlan('| 配件 | 型号 | 参考价(元) |\n| --- | --- | --- |\n| 处理器 | Intel Core i5-14600KF | ¥1,899 |\n| 显卡 | RTX 4070 | 4599 元 |\n| 机箱 | 追风者 P400A | 待定 |')
check('解析｜价格符号容错', !!p2 && p2.rows[0].price === 1899 && p2.rows[1].price === 4599, p2 ? `${p2.rows[0].price} / ${p2.rows[1].price}` : '-')
check('解析｜无价格回落 0', !!p2 && p2.rows[2].price === 0)

// —— ② 渲染层 ——
let html = ''
let renderErr = ''
try {
  html = renderToString(
    React.createElement(AiPlanCard, { plan, after: plan.after, showAgain: true })
  )
} catch (e) {
  renderErr = String(e && e.message)
}
check('渲染｜无异常', !renderErr, renderErr || `${html.length} 字符`)
const text = html.replace(/<!-- -->/g, '')
check('渲染｜含保存到我的配置', text.includes('保存到我的配置'))
check('渲染｜含再来一条', text.includes('再来一条'))
check('渲染｜含型号与价格', text.includes('AMD 锐龙 R5 7500F') && text.includes('¥899'))
check('渲染｜含合计', text.includes('¥6672'))
check('渲染｜含表后说明', text.includes('剩下的预算'))

// 已保存态：按钮变「已保存」且禁用，不能再提交
const doneHtml = renderToString(React.createElement(AiPlanCard, { plan, done: true }))
check('渲染｜已保存态', doneHtml.includes('已保存') && doneHtml.includes('disabled'))
// 历史消息：不显示「再来一条」
const histHtml = renderToString(React.createElement(AiPlanCard, { plan, showAgain: false }))
check('渲染｜历史消息无再来一条', !histHtml.includes('再来一条'))

await server.close()
out.push('')
out.push(`PASS=${pass} FAIL=${fail}`)
fs.writeFileSync('ai-report.txt', out.join('\n'))
console.log(out.join('\n'))
process.exit(fail ? 1 : 0)
