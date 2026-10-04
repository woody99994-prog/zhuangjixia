import { useState, useEffect, useRef } from 'react'
import {
  IconWechat,
  IconUser,
  IconLock,
  IconEye,
  IconShield,
} from '../components/Icons.jsx'
import { api, setToken, setUser } from '../apiClient.js'
// 复用注册页的通道识别，保证「登录框」与「注册框」对同一串输入判定一致
import Register, { detectChannel } from './Register.jsx'
import ForgotPassword from './ForgotPassword.jsx'

// 01 登录 / 注册
// initialMode 仅为冒烟测试提供入口，业务侧不传，默认仍是密码登录
export default function Login({ onLogin, onOpenLegal, initialMode = 'pwd' }) {
  // 三个视图复用同一套登录页视觉：登录 / 注册 / 找回密码
  const [view, setView] = useState('login')
  const [mode, setMode] = useState(initialMode)
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

  // 账号框统一接受手机号 / 邮箱 / 用户名，按输入内容自动识别
  const channel = detectChannel(phone)
  // 验证码登录只支持手机号与邮箱（用户名不发码，走密码登录）
  const codeChannel = channel === 'phone' || channel === 'email' ? channel : null
  // 密码登录：三种账号都能登
  const validAccount = Boolean(channel)

  const sendCode = async () => {
    if (countdown > 0 || !codeChannel || loading) return
    setErr('')
    try {
      const r = await api.post('auth/code/send', { channel: codeChannel, target: phone.trim() }, { auth: false })
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
      if (!codeChannel) {
        setErr('请输入正确的手机号或邮箱')
        return
      }
      if (smsCode.length < 4) {
        setErr('请输入验证码')
        return
      }
      setLoading(true)
      try {
        const data = await api.post(
          'auth/code/login',
          { channel: codeChannel, target: phone.trim(), code: smsCode },
          { auth: false }
        )
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
  if (!validAccount) {
    setErr('请输入正确的手机号、用户名或邮箱')
    return
  }
  if (pwd.length < 6) {
      setErr('密码至少 6 位')
      return
    }
    setLoading(true)
    try {
      const data = await api.post('auth/login', { account: phone.trim(), password: pwd }, { auth: false })
      setToken(data.accessToken)
      setUser(data.user)
      onLogin(true)
    } catch (e) {
      setErr(e.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 注册/找回成功后直接落会话，与登录成功同路径
  const finishSession = (data) => {
    setToken(data.accessToken)
    setUser(data.user)
    onLogin(true)
  }

  if (view === 'register') {
    return (
      <Register
        onBack={() => setView('login')}
        onRegistered={finishSession}
        onOpenLegal={onOpenLegal}
      />
    )
  }
  if (view === 'forgot') {
    return <ForgotPassword onBack={() => setView('login')} onOpenLegal={onOpenLegal} />
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
          验证码登录
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
              {/* 手机号与邮箱都能收码，故不能限制成纯数字 / 11 位 */}
              <input
                placeholder="请输入手机号或邮箱"
                maxLength={128}
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
              />
              {codeChannel && <span className="field-tag">{codeChannel === 'phone' ? '手机' : '邮箱'}</span>}
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
                disabled={countdown > 0 || !codeChannel || loading}
              >
                {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
              </button>
            </div>
            {devCode && (
              <div className="login-dev-code">
                演示验证码：{devCode}（未配置真实{codeChannel === 'email' ? '邮箱' : '短信'}通道，仅本地联调用）
              </div>
            )}
          </>
        ) : (
          <>
            <div className="field">
              <IconUser size={18} strokeWidth={1.9} />
              {/* 手机号 / 用户名 / 邮箱都能登，故不能只收数字、也不能限 11 位 */}
              <input
                placeholder="手机号码/用户名/邮箱"
                maxLength={128}
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
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

      {/* 注册入口与「忘记密码」同一行：注册在左、找回在右，与输入卡片左对齐。
          验证码登录发现账号未注册时也要能一步跳注册，故两种模式都保留 */}
      <div className="login-links">
        <button type="button" className="login-link" onClick={() => setView('register')}>
          注册账号
        </button>
        <button type="button" className="login-link" onClick={() => setView('forgot')}>
          忘记密码？
        </button>
      </div>

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
