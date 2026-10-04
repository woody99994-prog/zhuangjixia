/**
 * 渲染冒烟：用 Vite SSR 把每个页面真正渲染一遍。
 *
 * 为什么需要它（血泪教训）：
 *   `vite build` **抓不到未声明标识符** —— 在 JS 里引用一个没声明/没 import 的变量，
 *   Rollup 会当成全局变量静默放过，构建 0 错误。但用户一点到那个页面就 ReferenceError 白屏。
 *   实测踩过：Square 用了没声明的 `tagPanel`、Profile 用了没 import 的 `IconEdit`/`IconLogout`、
 *   Login 用了没解构的 `onOpenLegal`、LegalDoc 用了没声明的 `foot` → 四个页面全崩。
 *   这类 bug 只有「真渲染一遍」才能暴露。
 *
 * 跑法（在 zhuangjixia-app 目录）：
 *   node render-smoke.mjs
 * 输出：render-report.txt（PASS/FAIL 逐页列出）
 */
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import fs from 'node:fs'

const ROOT = process.cwd()
const out = []
let pass = 0
let fail = 0

// 通用 props 袋：覆盖各页面会用到的回调，缺这个会误报
const PROPS = {
  onBack: () => {},
  onClose: () => {},
  onOpen: () => {},
  onOpenArticle: () => {},
  onOpenLegal: () => {},
  onOpenSearch: () => {},
  onOpenProduct: () => {},
  onOpenEntry: () => {},
  onLogin: () => {},
  onLogout: () => {},
  onToggleTheme: () => {},
  theme: 'light',
  kind: 'post',
  id: '1',
  doc: { title: '用户协议', contentMd: '# 标题\n\n## 章节\n正文', updatedAt: new Date().toISOString() },
  loading: false,
  item: { id: '1', title: '演示', contentMd: '正文', coverUrl: '' },
  // ProductDetail 走 product（整机方案），specs 需给真实结构否则渲染抛错
  product: {
    id: '1',
    title: '演示整机',
    coverUrl: '',
    totalPriceCents: 599900,
    specs: [
      { k: 'CPU', v: 'Intel i5-13400F', p: '¥1099' },
      { k: '显卡', v: 'RTX 4060', p: '¥2299' }
    ]
  },
}

const SCREENS = [
  'Home', 'Square', 'AIBuild', 'MyConfigs', 'Profile',
  'Messages', 'Favorites', 'MyPosts', 'BrowseHistory', 'AccountSecurity',
  'EditProfile', 'AboutSheet', 'LegalDoc', 'Login', 'Search',
  // 积分体系
  'MyPoints', 'RedeemMall', 'RedeemDetail', 'RedeemCheckout', 'MyRedeemOrders', 'MyAddresses',
  // 应用设置（收纳收货地址 / 账号与安全）
  'Settings',
  // 内容详情（帖子详情内含内嵌抽奖模块）
  'ArticleDetail', 'ProductDetail', 'UserProfile',
]

// 组件单独渲染：像 PostLottery 这类内嵌模块不在 screens 列表里，但同样会白屏
const COMPONENTS = [
  ['PostLottery', { postId: '1' }],
  // 配置详情：分别验证槽位格式与清单格式（parts[]）两种 planJson 都能渲染
  ['ConfigDetailView', { detail: { id: '1', title: '槽位格式配置', totalPriceCents: 899900, planJson: { cpu: { model: 'i5-13400F', price: 1099 }, gpu: { model: 'RTX 4060', price: 2299 } } } }],
  ['ConfigDetailView', {
    detail: {
      id: '2',
      title: '清单格式配置',
      remark: '种子数据',
      totalPriceCents: 1799900,
      planJson: { parts: [{ name: 'Intel Core Ultra 7 265K', category: 'CPU', priceCents: 279900 }, { name: '华硕 ROG STRIX Z890-E', category: '主板', priceCents: 369900 }] }
    }
  }],
]

const server = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
})

for (const name of SCREENS) {
  try {
    const mod = await server.ssrLoadModule('/src/screens/' + name + '.jsx')
    const C = mod.default
    if (typeof C !== 'function') {
      out.push('x ' + name + ' 默认导出不是组件')
      fail++
      continue
    }
    const html = renderToString(React.createElement(C, PROPS))
    out.push('OK ' + name + ' 渲染成功 (' + html.length + ' 字节)')
    pass++
  } catch (e) {
    out.push('XX ' + name + ' 渲染抛错 -> ' + (e && e.message ? e.message.split('\n')[0] : String(e)))
    fail++
  }
}

for (const [name, extra] of COMPONENTS) {
  try {
    const mod = await server.ssrLoadModule('/src/components/' + name + '.jsx')
    const C = mod.default
    if (typeof C !== 'function') {
      out.push('x ' + name + ' 默认导出不是组件')
      fail++
      continue
    }
    const html = renderToString(React.createElement(C, { ...PROPS, ...extra }))
    out.push('OK ' + name + ' 渲染成功 (' + html.length + ' 字节)')
    pass++
  } catch (e) {
    out.push('XX ' + name + ' 渲染抛错 -> ' + (e && e.message ? e.message.split('\n')[0] : String(e)))
    fail++
  }
}

await server.close()
out.push('')
out.push('RENDER PASS=' + pass + ' FAIL=' + fail)
fs.writeFileSync(ROOT + '/render-report.txt', out.join('\n'), 'utf8')
console.log('RENDER PASS=' + pass + ' FAIL=' + fail)
process.exit(fail > 0 ? 1 : 0)
