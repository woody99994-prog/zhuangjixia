import { useState, useEffect, useRef } from 'react'
import {
  IconWechat,
  IconUser,
  IconLock,
  IconEye,
  IconShield,
} from '../components/Icons.jsx'
import { api, setToken, setUser } from '../apiClient.js'

// 01 登录 / 注册
export default function Login({ onLogin, onOpenLegal }) {
  const [mode, setMode] = useState('pwd')
  const [phone, setPhone] = useState('')
  const [pwd, setPwd] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [smsCode, setSmsCode] = useState('')
  // 演示模式服务端会回显验证码，方便本地联调；生产真通道不回显
  const [devCode, setDevCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  // 中国大陆手机号：1 开头，第二位 3-9，共 11 位
  const validPhone = /^1[3-9]\d{9}$/.test(phone)

  const sendCode = async () => {
    if (countdown > 0 || !validPhone || loading) return
    setErr('')
    try {
      const r = await api.post('auth/sms/send', { phone }, { auth: false })
      // 演示通道把验证码回显；真实通道只回 maskedPhone
      if (r && r.demo && r.code) setDevCode(r.code)
      else setDevCode('')
      setSmsSent(true)
      setCountdown(60)
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return c - 1
        })
      }, 1000)
    } catch (e) {
      setErr(e.message || '发送失败，请重试')
    }
  }

  const doLogin = async () => {
    setErr('')
    if (mode === 'sms') {
      if (!validPhone) {
        setErr('请输入正确的 11 位手机号')
        return
      }
      if (smsCode.length < 4) {
        setErr('请输入验证码')
        return
      }
      setLoading(true)
      try {
        const data = await api.post('auth/sms/login', { phone, code: smsCode }, { auth: false })
        setToken(data.accessToken)
        setUser(data.user)
        onLogin(true)
      } catch (e) {
        setErr(e.message || '登录失败，请重试')
      } finally {
        setLoading(false)
      }
      return
  }
  if (!validPhone) {
    setErr('请输入正确的 11 位手机号')
    return
  }
  if (pwd.length < 6) {
      setErr('密码至少 6 位')
      return
    }
    setLoading(true)
    try {
      const data = await api.post('auth/login', { phone, password: pwd }, { auth: false })
      setToken(data.accessToken)
      setUser(data.user)
      onLogin(true)
    } catch (e) {
      setErr(e.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-logo">
          <img src="/logo.png" alt="装机匣" />
        </div>
        <h1 className="login-title">装机匣</h1>
        <p className="login-sub">为 PC 玩家打造的一站式安卓装机助手</p>
      </div>

      <button className="btn-wechat" type="button" disabled>
        <IconWechat size={19} color="#FFFFFF" />
        <span>本机号码一键登录</span>
      </button>

      <div className="divider">
        <i />
        <span>其他登录方式</span>
        <i />
      </div>

      <div className="segmented">
        <button
          type="button"
          className={'seg' + (mode === 'sms' ? ' is-active' : '')}
          onClick={() => setMode('sms')}
        >
          短信验证码登录
        </button>
        <button
          type="button"
          className={'seg' + (mode === 'pwd' ? ' is-active' : '')}
          onClick={() => setMode('pwd')}
        >
          账号密码登录
        </button>
      </div>

      <div className="login-card">
        {mode === 'sms' ? (
          <>
            <div className="field">
              <IconUser size={18} strokeWidth={1.9} />
              <input
                placeholder="请输入手机号"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="field-divider" />
            <div className="field field-code">
              <IconShield size={18} strokeWidth={1.9} />
              <input
                placeholder="请输入验证码"
                inputMode="numeric"
                maxLength={6}
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
              />
              <i className="field-vline" />
              <button
                type="button"
                className="code-btn"
                onClick={sendCode}
                disabled={countdown > 0 || !validPhone || loading}
              >
                {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
              </button>
            </div>
            {devCode && (
              <div className="login-dev-code">演示验证码：{devCode}（未配置真实短信通道，仅本地联调用）</div>
            )}
          </>
        ) : (
          <>
            <div className="field">
              <IconUser size={18} strokeWidth={1.9} />
              <input
                placeholder="请输入手机号"
                inputMode="numeric"
                maxLength={11}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="field-divider" />
            <div className="field">
              <IconLock size={18} strokeWidth={1.9} />
              <input
                placeholder="请输入登录密码"
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
              <IconEye size={18} strokeWidth={1.9} />
            </div>
          </>
        )}
      </div>

      {mode === 'pwd' && <div className="forgot">忘记密码？</div>}

      {err && <div className="login-err">{err}</div>}

      <button className="btn-primary" type="button" onClick={doLogin} disabled={loading}>
        {loading ? '登录中…' : '登 录'}
      </button>

      <p className="login-foot">
        登录即代表同意
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
