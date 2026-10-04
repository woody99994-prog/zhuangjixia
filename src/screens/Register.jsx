import { useState, useEffect, useRef } from 'react'
import { IconUser, IconLock, IconShield, IconChevron, IconEye } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

// 注册：先填账号 → 自动识别类型并即时提示「已注册 / 可注册」→ 下一步给出对应的验证方式。
// 手机号走短信验证码、邮箱走邮箱验证码、用户名不需要验证码（直接设密码）。
// 第二步统一再采集一个用户名，注册后手机号 / 邮箱 / 用户名都能登录。

const PHONE_RE = /^1[3-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_.-]{3,63}$/

const CHANNEL_META = {
  phone: {
    tag: '手机号',
    next: '下一步：输入短信验证码',
    codeLabel: '短信验证码',
    sendLabel: '发送验证码'
  },
  email: {
    tag: '邮箱',
    next: '下一步：输入邮箱验证码',
    codeLabel: '邮箱验证码',
    sendLabel: '发送验证码'
  },
  username: {
    tag: '用户名',
    next: '下一步：设置登录密码',
    codeLabel: '',
    sendLabel: ''
  }
}

export const USERNAME_TIP = '4-64 位，字母开头，可含数字、点、下划线、短横线'

export function detectChannel(v) {
  const s = String(v || '').trim()
  if (PHONE_RE.test(s)) return 'phone'
  if (EMAIL_RE.test(s)) return 'email'
  if (USERNAME_RE.test(s)) return 'username'
  return null
}

export default function Register({ onBack, onRegistered, onOpenLegal }) {
  const [step, setStep] = useState(1)
  const [account, setAccount] = useState('')
  const [code, setCode] = useState('')
  const [pwd, setPwd] = useState('')
  const [uname, setUname] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  // 账号可用性：idle 未查 / checking 查询中 / ok 可注册 / taken 已注册
  const [check, setCheck] = useState({ state: 'idle' })
  const [ucheck, setUcheck] = useState({ state: 'idle' })
  const timerRef = useRef(null)
  // 请求序号：输入变快时丢弃过期响应，避免旧结果盖住新结果
  const seqRef = useRef(0)
  const useqRef = useRef(0)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const channel = detectChannel(account)
  const meta = channel ? CHANNEL_META[channel] : null
  const needsCode = channel === 'phone' || channel === 'email'
  // 用用户名注册时账号本身就是用户名，无需再采集
  const needsUname = Boolean(channel) && channel !== 'username'

  // 输入停歇 450ms 后查一次是否已被注册
  useEffect(() => {
    if (!channel) {
      setCheck({ state: 'idle' })
      return
    }
    const target = account.trim()
    const my = ++seqRef.current
    setCheck({ state: 'checking' })
    const t = setTimeout(async () => {
      try {
        const r = await api.post('auth/register/check', { channel, target }, { auth: false })
        if (my !== seqRef.current) return
        setCheck({ state: r && r.exists ? 'taken' : 'ok', label: r?.label || meta.tag })
      } catch {
        // 探测失败不阻塞注册：下面的提交接口还会再查一次重名
        if (my === seqRef.current) setCheck({ state: 'idle' })
      }
    }, 450)
    return () => clearTimeout(t)
  }, [account, channel])

  useEffect(() => {
    const v = uname.trim()
    if (!USERNAME_RE.test(v)) {
      setUcheck({ state: 'idle' })
      return
    }
    const my = ++useqRef.current
    setUcheck({ state: 'checking' })
    const t = setTimeout(async () => {
      try {
        const r = await api.post('auth/register/check', { channel: 'username', target: v }, { auth: false })
        if (my !== useqRef.current) return
        setUcheck({ state: r && r.exists ? 'taken' : 'ok' })
      } catch {
        if (my === useqRef.current) setUcheck({ state: 'idle' })
      }
    }, 450)
    return () => clearTimeout(t)
  }, [uname])

  const startCountdown = (sec) => {
    setCountdown(sec)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const goNext = () => {
    setErr('')
    if (!channel) {
      setErr('请输入手机号、邮箱或 4 位以上字母开头的用户名')
      return
    }
    if (check.state === 'taken') {
      setErr(`该${check.label || meta.tag}已注册，请直接登录`)
      return
    }
    setStep(2)
  }

  const sendCode = async () => {
    if (!needsCode || countdown > 0 || loading) return
    setErr('')
    try {
      const r = await api.post('auth/register/code/send', { channel, target: account.trim() }, { auth: false })
      setDevCode(r && r.demo && r.code ? r.code : '')
      startCountdown(r?.resendSeconds || 60)
    } catch (e) {
      setErr(e.message || '发送失败，请重试')
    }
  }

  const submit = async () => {
    setErr('')
    if (pwd.length < 6) {
      setErr('密码至少 6 位')
      return
    }
    if (needsCode && code.trim().length < 4) {
      setErr('请输入验证码')
      return
    }
    const u = uname.trim()
    if (needsUname) {
      if (!USERNAME_RE.test(u)) {
        setErr('请设置用户名：' + USERNAME_TIP)
        return
      }
      if (ucheck.state === 'taken') {
        setErr('该用户名已被占用，请换一个')
        return
      }
    }
    setLoading(true)
    try {
      const data = await api.post(
        'auth/register',
        {
          channel,
          target: account.trim(),
          code: needsCode ? code.trim() : undefined,
          password: pwd,
          username: needsUname ? u : undefined
        },
        { auth: false }
      )
      onRegistered(data)
    } catch (e) {
      setErr(e.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 第一步底部提示：优先展示「已注册 / 可注册」，探测中或未查到时退回类型识别
  const step1Hint = (() => {
    if (!channel) return ''
    const label = check.label || meta.tag
    if (check.state === 'checking') return '正在检查该账号是否已注册…'
    if (check.state === 'taken') return { bad: true, text: `该${label}已注册，请直接登录` }
    if (check.state === 'ok') return { good: true, text: `该${label}可以注册，${meta.next}` }
    return `识别为${meta.tag}，${meta.next}`
  })()

  const unameHint = (() => {
    const v = uname.trim()
    if (!v) return ''
    if (!USERNAME_RE.test(v)) return { bad: true, text: '用户名格式不符：' + USERNAME_TIP }
    if (ucheck.state === 'checking') return '正在检查用户名是否可用…'
    if (ucheck.state === 'taken') return { bad: true, text: '该用户名已被占用，请换一个' }
    if (ucheck.state === 'ok') return { good: true, text: '该用户名可以使用' }
    return ''
  })()

  return (
    <div className="login lg-page">
      <div className="lg-bar">
        <button
          type="button"
          className="lg-back"
          onClick={() => (step === 1 ? onBack() : setStep(1))}
          aria-label="返回"
        >
          <IconChevron size={20} strokeWidth={2.1} />
        </button>
        <span className="lg-bar-title">注册账号</span>
      </div>

      <div className="login-hero">
        <h1 className="login-title lg-title-sm">创建账号</h1>
        <p className="login-sub">用手机号、邮箱或用户名注册，注册后自动登录</p>
      </div>

      <div className="lg-steps">
        <span className={'lg-step' + (step >= 1 ? ' on' : '')}>1 填写账号</span>
        <i className="lg-step-line" />
        <span className={'lg-step' + (step >= 2 ? ' on' : '')}>2 验证并设密码</span>
      </div>

      <div className="login-card">
        {step === 1 ? (
          <div className="field">
            <IconUser size={18} strokeWidth={1.9} />
            <input
              placeholder="手机号 / 邮箱 / 用户名"
              maxLength={128}
              value={account}
              onChange={(e) => setAccount(e.target.value.trim())}
            />
            {channel && <span className="field-tag">{meta.tag}</span>}
          </div>
        ) : (
          <>
            <div className="field">
              <IconUser size={18} strokeWidth={1.9} />
              <input value={account} readOnly />
              <span className="field-tag">{meta.tag}</span>
            </div>
            <div className="field-divider" />
            {needsCode && (
              <>
                <div className="field field-code">
                  <IconShield size={18} strokeWidth={1.9} />
                  <input
                    placeholder={meta.codeLabel}
                    inputMode="numeric"
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <i className="field-vline" />
                  <button
                    type="button"
                    className="code-btn"
                    onClick={sendCode}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : meta.sendLabel}
                  </button>
                </div>
                <div className="field-divider" />
              </>
            )}
            {needsUname && (
              <>
                <div className="field">
                  <IconUser size={18} strokeWidth={1.9} />
                  <input
                    placeholder="设置用户名（登录也可用）"
                    maxLength={64}
                    value={uname}
                    onChange={(e) => setUname(e.target.value.trim())}
                  />
                  {ucheck.state === 'ok' && <span className="field-tag field-tag-ok">可用</span>}
                </div>
                <div className="field-divider" />
              </>
            )}
            <div className="field">
              <IconLock size={18} strokeWidth={1.9} />
              <input
                placeholder="设置登录密码（至少 6 位）"
                type={showPwd ? 'text' : 'password'}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
              <button type="button" className="field-eye" onClick={() => setShowPwd((v) => !v)} aria-label="显示密码">
                <IconEye size={18} strokeWidth={1.9} />
              </button>
            </div>
          </>
        )}
      </div>

      {step === 1 && step1Hint && (
        <div
          className={
            'lg-hint' + (step1Hint.bad ? ' lg-hint-bad' : step1Hint.good ? ' lg-hint-good' : '')
          }
        >
          {step1Hint.text || step1Hint}
        </div>
      )}
      {step === 2 && unameHint && (
        <div
          className={
            'lg-hint' + (unameHint.bad ? ' lg-hint-bad' : unameHint.good ? ' lg-hint-good' : '')
          }
        >
          {unameHint.text || unameHint}
        </div>
      )}
      {devCode && <div className="login-dev-code">演示验证码：{devCode}（未配置真实通道，仅本地联调用）</div>}

      {err && <div className="login-err">{err}</div>}

      <button
        className="btn-primary"
        type="button"
        disabled={loading}
        onClick={step === 1 ? goNext : submit}
      >
        {loading ? '处理中…' : step === 1 ? '下一步' : '注册并登录'}
      </button>

      <p className="login-foot">
        注册即代表同意
        <button type="button" className="foot-link" onClick={() => onOpenLegal('user')}>
          《用户协议》
        </button>
        与
        <button type="button" className="foot-link" onClick={() => onOpenLegal('privacy')}>
          《隐私政策》
        </button>
      </p>
    </div>
  )
}
