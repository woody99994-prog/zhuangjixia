/**
 * 注册 / 找回密码冒烟：通道识别 + Vite SSR 真渲染。
 *
 * 为什么要单开一个：
 *   注册页与找回页是「按输入类型切换验证方式」的分步表单，分支多（手机/邮箱/用户名 × 3 个步骤），
 *   类型判断写错或某一步少 import 一个图标，构建照样过、点进去才崩。
 *   这里把三个通道的识别结果和两个页面的首屏都渲染一遍，把这类问题挡在提交前。
 *
 * 跑法（在 zhuangjixia-app 目录）：
 *   node auth-smoke.mjs
 * 输出：auth-report.txt
 */
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import fs from 'node:fs'

const out = []
let pass = 0
let fail = 0

function check(name, cond, extra = '') {
  if (cond) {
    pass += 1
    out.push(`PASS  ${name}`)
  } else {
    fail += 1
    out.push(`FAIL  ${name}${extra ? ' — ' + extra : ''}`)
  }
}

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error'
})

try {
  // —— 1) 通道识别（与后端 detectChannel 规则一致）——
  const { detectChannel } = await server.ssrLoadModule('/src/screens/Register.jsx')
  check('识别手机号 → phone', detectChannel('13800000000') === 'phone')
  check('识别邮箱 → email', detectChannel('a@b.com') === 'email')
  check('识别用户名 → username', detectChannel('zhangsan01') === 'username')
  check('非法输入 → null', detectChannel('138') === null && detectChannel('') === null)
  check('手机号不会被误判为用户名', detectChannel('13800000000') !== 'username')
  check('不足 4 位的用户名不识别', detectChannel('abc') === null)
  const { USERNAME_TIP } = await server.ssrLoadModule('/src/screens/Register.jsx')
  check('导出用户名规则文案', typeof USERNAME_TIP === 'string' && USERNAME_TIP.includes('字母开头'))

  const Register = (await server.ssrLoadModule('/src/screens/Register.jsx')).default
  const Forgot = (await server.ssrLoadModule('/src/screens/ForgotPassword.jsx')).default
  const Login = (await server.ssrLoadModule('/src/screens/Login.jsx')).default

  const props = {
    onBack: () => {},
    onRegistered: () => {},
    onOpenLegal: () => {}
  }

  // —— 2) 注册页首屏 ——
  const r1 = renderToString(React.createElement(Register, props))
  check('注册页渲染出标题', r1.includes('注册账号'))
  check('注册页有步骤条', r1.includes('1 填写账号') && r1.includes('2 验证并设密码'))
  check('注册页第一步只问账号', r1.includes('手机号 / 邮箱 / 用户名'))
  check('注册页第一步不出现验证码框', !r1.includes('短信验证码'))
  check('注册页带协议入口', r1.includes('《用户协议》'))
  check('注册页有返回键', r1.includes('lg-back'))

  // —— 2b) 登录页：验证码模式支持手机与邮箱，密码模式支持三类账号 ——
  const loginProps = { onLogin: () => {}, onOpenLegal: () => {} }
  const l1 = renderToString(React.createElement(Login, { ...loginProps, initialMode: 'sms' }))
  check('登录页 Tab 已改为「验证码登录」', l1.includes('验证码登录'))
  check('登录页不再出现「短信验证码登录」', !l1.includes('短信验证码登录'))
  check('验证码模式输入框提示手机号或邮箱', l1.includes('请输入手机号或邮箱'))
  check('验证码模式有发送验证码按钮', l1.includes('发送验证码'))

  const l2 = renderToString(React.createElement(Login, { ...loginProps, initialMode: 'pwd' }))
  check('密码模式输入框提示三类账号', l2.includes('手机号码/用户名/邮箱'))
  check('登录页保留注册入口', l2.includes('注册账号') && l2.includes('忘记密码？'))

  // —— 3) 找回密码页首屏 ——
  const f1 = renderToString(React.createElement(Forgot, { onBack: () => {}, onOpenLegal: () => {} }))
  check('找回页渲染出标题', f1.includes('找回密码'))
  check('找回页提示可输入三类账号', f1.includes('输入手机号、邮箱或用户名'))
  check('找回页首屏是账号输入', f1.includes('手机号 / 邮箱 / 用户名'))
  check('找回页首屏不直接要验证码', !f1.includes('请输入验证码'))
} catch (e) {
  fail += 1
  out.push('FAIL  渲染异常 — ' + (e?.stack || e?.message || String(e)))
} finally {
  await server.close()
}

const text =
  out.join('\n') + `\n\n${'='.repeat(40)}\nPASS=${pass} FAIL=${fail}\n`
fs.writeFileSync('auth-report.txt', text, 'utf8')
console.log(text)
process.exit(fail ? 1 : 0)
