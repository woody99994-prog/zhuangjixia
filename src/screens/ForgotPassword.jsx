import { useState, useEffect, useRef } from 'react'
import { IconUser, IconLock, IconShield, IconChevron, IconEye } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

// 找回密码：输入账号 → 服务端给出该账号可用的找回方式（手机验证码 / 邮箱验证码）
// → 选一种收码 → 填验证码 + 新密码。绑定了什么才给什么，避免账号被冒用改密。

export default function ForgotPassword({ onBack, onOpenLegal }) {
  const [step, setStep] = useState(1) // 1 填账号 2 选方式 3 验证码+新密码
  const [account, setAccount] = useState('')
  const [options, setOptions] = useState([])
  const [channel, setChannel] = useState('')
  const [masked, setMasked] = useState('')
  const [code, setCode] = useState('')
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState('')
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

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

  const goBack = () => {
    if (step === 1) return onBack()
    if (step === 2) {
      setStep(1)
      setOptions([])
      return
    }
    setStep(2)
  }

  // 第一步：探测该账号可用的找回方式
  const lookup = async () => {
    setErr('')
    const v = account.trim()
    if (!v) {
      setErr('请输入手机号、邮箱或用户名')
      return
    }
    setLoading(true)
    try {
      const r = await api.post('auth/password/recover/options', { account: v }, { auth: false })
      setOptions(r.options || [])
      // 只有一种方式时直接进入下一步，少一次点击
      if ((r.options || []).length === 1) {
        setChannel(r.options[0].channel)
        setMasked(r.options[0].masked)
        setStep(3)
      } else {
        setStep(2)
      }
    } catch (e) {
      setErr(e.message || '查询失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 第二步：选方式并立即发码
  const pick = async (opt) => {
    setErr('')
    setChannel(opt.channel)
    setMasked(opt.masked)
    setSending(true)
    try {
      const r = await api.post(
        'auth/password/recover/code',
        { account: account.trim(), channel: opt.channel },
        { auth: false }
      )
      setDevCode(r && r.demo && r.code ? r.code : '')
      startCountdown(r?.resendSeconds || 60)
      setStep(3)
    } catch (e) {
      setErr(e.message || '发送失败，请重试')
    } finally {
      setSending(false)
    }
  }

  const resend = async () => {
    if (countdown > 0 || sending) return
    setErr('')
    setSending(true)
    try {
      const r = await api.post(
        'auth/password/recover/code',
        { account: account.trim(), channel },
        { auth: false }
      )
      setDevCode(r && r.demo && r.code ? r.code : '')
      startCountdown(r?.resendSeconds || 60)
    } catch (e) {
      setErr(e.message || '发送失败，请重试')
    } finally {
      setSending(false)
    }
  }

  const submit = async () => {
    setErr('')
    if (code.trim().length < 4) {
      setErr('请输入验证码')
      return
    }
    if (pwd.length < 6) {
      setErr('新密码至少 6 位')
      return
    }
    setLoading(true)
    try {
      await api.post(
        'auth/password/reset',
        { account: account.trim(), channel, code: code.trim(), newPassword: pwd },
        { auth: false }
      )
      setOk('密码已重置，请使用新密码登录')
    } catch (e) {
      setErr(e.message || '重置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (ok) {
    return (
      <div className="login">
        <div className="lg-bar">
          <span className="lg-bar-title">找回密码</span>
        </div>
        <div className="login-hero">
          <div className="lg-done">✓</div>
          <h1 className="login-title lg-title-sm">重置成功</h1>
          <p className="login-sub">{ok}</p>
        </div>
        <button className="btn-primary" type="button" onClick={onBack}>
          返回登录
        </button>
      </div>
    )
  }

  return (
    <div className="login lg-page">
      <div className="lg-bar">
        <button type="button" className="lg-back" onClick={goBack} aria-label="返回">
          <IconChevron size={20} strokeWidth={2.1} />
        </button>
        <span className="lg-bar-title">找回密码</span>
      </div>

      <div className="login-hero">
        <h1 className="login-title lg-title-sm">找回密码</h1>
        <p className="login-sub">
          {step === 1
            ? '输入手机号、邮箱或用户名，我们会告诉你可用哪种方式找回'
            : step === 2
              ? '请选择一种接收验证码的方式'
              : `验证码已发送至 ${masked}`}
        </p>
      </div>

      {step === 1 && (
        <div className="login-card">
          <div className="field">
            <IconUser size={18} strokeWidth={1.9} />
            <input
              placeholder="手机号 / 邮箱 / 用户名"
              maxLength={64}
              value={account}
              onChange={(e) => setAccount(e.target.value.trim())}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="lg-opts">
          {options.map((o) => (
            <button type="button" className="lg-opt" key={o.channel} disabled={sending} onClick={() => pick(o)}>
              <span className="lg-opt-ic">
                <IconShield size={18} strokeWidth={1.9} />
              </span>
              <span className="lg-opt-tx">
                <b>{o.desc}</b>
                <i>{o.masked}</i>
              </span>
              <IconChevron size={16} strokeWidth={2} />
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="login-card">
          <div className="field field-code">
            <IconShield size={18} strokeWidth={1.9} />
            <input
              placeholder="请输入验证码"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <i className="field-vline" />
            <button type="button" className="code-btn" onClick={resend} disabled={countdown > 0 || loading}>
              {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
            </button>
          </div>
          <div className="field-divider" />
          <div className="field">
            <IconLock size={18} strokeWidth={1.9} />
            <input
              placeholder="设置新密码（至少 6 位）"
              type={showPwd ? 'text' : 'password'}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
            <button type="button" className="field-eye" onClick={() => setShowPwd((v) => !v)} aria-label="显示密码">
              <IconEye size={18} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      )}

      {devCode && <div className="login-dev-code">演示验证码：{devCode}（未配置真实通道，仅本地联调用）</div>}
      {err && <div className="login-err">{err}</div>}

      {step !== 2 && (
        <button
          className="btn-primary"
          type="button"
          disabled={loading || sending}
          onClick={step === 1 ? lookup : submit}
        >
          {loading ? '处理中…' : step === 1 ? '下一步' : '确认重置'}
        </button>
      )}

      <p className="login-foot">
        遇到问题可联系客服，重置后所有已登录设备需要重新
        <button type="button" className="foot-link" onClick={onBack}>
          登录
        </button>
      </p>
    </div>
  )
}
