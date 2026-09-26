/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react'
import { IconChevron, IconLock, IconPhone, IconIdCard } from '../components/Icons.jsx'
import { api, getUser } from '../apiClient.js'

const AUTH_LABEL = { none: '未认证', pending: '审核中', approved: '已认证', rejected: '未通过' }

// 账号与安全：登录密码修改 / 手机号码修改 / 实名认证（三项都走真接口）
export default function AccountSecurity({ onBack }) {
  const [view, setView] = useState('menu') // menu | password | phone | realname

  if (view === 'password') return <PasswordView onBack={() => setView('menu')} />
  if (view === 'phone') return <PhoneView onBack={() => setView('menu')} />
  if (view === 'realname') return <RealNameView onBack={() => setView('menu')} />

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">账号与安全</span>
        <span className="sp-count" />
      </div>

      <div className="sp-body">
        <button className="pf-row" type="button" onClick={() => setView('password')}>
          <span className="pf-row-ic tone-purple">
            <IconLock size={20} />
          </span>
          <span className="pf-row-label">登录密码修改</span>
          <span className="pf-row-chev">
            <IconChevron size={17} strokeWidth={2} />
          </span>
        </button>
        <button className="pf-row" type="button" onClick={() => setView('phone')}>
          <span className="pf-row-ic tone-blue">
            <IconPhone size={20} />
          </span>
          <span className="pf-row-label">手机号码修改</span>
          <span className="pf-row-chev">
            <IconChevron size={17} strokeWidth={2} />
          </span>
        </button>
        <button className="pf-row" type="button" onClick={() => setView('realname')}>
          <span className="pf-row-ic tone-green">
            <IconIdCard size={20} />
          </span>
          <span className="pf-row-label">实名认证</span>
          <span className="pf-row-chev">
            <IconChevron size={17} strokeWidth={2} />
          </span>
        </button>
      </div>
    </div>
  )
}

function SubHead({ title, onBack }) {
  return (
    <div className="sp-head">
      <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
        <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
      </button>
      <span className="sp-title">{title}</span>
      <span className="sp-count" />
    </div>
  )
}

function PasswordView({ onBack }) {
  const [form, setForm] = useState({ old: '', next: '', again: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ ok: false, text: '' })

  const submit = async () => {
    if (busy) return
    if (form.next.length < 6) return setMsg({ ok: false, text: '新密码至少 6 位' })
    if (form.next !== form.again) return setMsg({ ok: false, text: '两次输入的新密码不一致' })
    setBusy(true)
    setMsg({ ok: false, text: '' })
    try {
      await api.post('my/password', { oldPassword: form.old, newPassword: form.next })
      setMsg({ ok: true, text: '密码已更新，下次登录请用新密码' })
      setForm({ old: '', next: '', again: '' })
    } catch (e) {
      setMsg({ ok: false, text: (e && e.message) || '修改失败' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sp">
      <SubHead title="登录密码修改" onBack={onBack} />
      <div className="sp-form">
        <label className="sp-field">
          <span>当前密码</span>
          <input
            type="password"
            value={form.old}
            autoComplete="current-password"
            placeholder="请输入当前登录密码"
            onChange={(e) => setForm({ ...form, old: e.target.value })}
          />
        </label>
        <label className="sp-field">
          <span>新密码</span>
          <input
            type="password"
            value={form.next}
            autoComplete="new-password"
            placeholder="至少 6 位"
            onChange={(e) => setForm({ ...form, next: e.target.value })}
          />
        </label>
        <label className="sp-field">
          <span>确认新密码</span>
          <input
            type="password"
            value={form.again}
            autoComplete="new-password"
            placeholder="再输入一次新密码"
            onChange={(e) => setForm({ ...form, again: e.target.value })}
          />
        </label>
        {msg.text && <div className={'sp-msg' + (msg.ok ? ' is-ok' : '')}>{msg.text}</div>}
        <button
          className="sp-submit"
          type="button"
          onClick={submit}
          disabled={busy || !form.old || !form.next || !form.again}
        >
          {busy ? '提交中…' : '确认修改'}
        </button>
      </div>
    </div>
  )
}

function PhoneView({ onBack }) {
  const current = (getUser() && getUser().phone) || ''
  const [form, setForm] = useState({ phone: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ ok: false, text: '' })

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(form.phone)) return setMsg({ ok: false, text: '请先填写正确的手机号' })
    try {
      const r = await api.post('my/phone/code', { phone: form.phone })
      setMsg({ ok: true, text: `演示环境验证码：${r.code}（接入短信后这里不再回显）` })
    } catch (e) {
      setMsg({ ok: false, text: (e && e.message) || '发送失败' })
    }
  }

  const submit = async () => {
    if (busy) return
    setBusy(true)
    setMsg({ ok: false, text: '' })
    try {
      await api.post('my/phone', { phone: form.phone, code: form.code })
      setMsg({ ok: true, text: '手机号已更新为 ' + form.phone })
      const u = getUser() || {}
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('zjx_app_user', JSON.stringify({ ...u, phone: form.phone }))
      }
    } catch (e) {
      setMsg({ ok: false, text: (e && e.message) || '修改失败' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sp">
      <SubHead title="手机号码修改" onBack={onBack} />
      <div className="sp-form">
        <div className="sp-current">当前绑定：{current || '—'}</div>
        <label className="sp-field">
          <span>新手机号</span>
          <input
            value={form.phone}
            inputMode="numeric"
            maxLength={11}
            placeholder="11 位手机号"
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
          />
        </label>
        <label className="sp-field">
          <span>验证码</span>
          <div className="sp-code-row">
            <input
              value={form.code}
              inputMode="numeric"
              maxLength={6}
              placeholder="6 位验证码"
              onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
            />
            <button className="sp-code-btn" type="button" onClick={sendCode}>
              获取验证码
            </button>
          </div>
        </label>
        {msg.text && <div className={'sp-msg' + (msg.ok ? ' is-ok' : '')}>{msg.text}</div>}
        <button
          className="sp-submit"
          type="button"
          onClick={submit}
          disabled={busy || !form.phone || !form.code}
        >
          {busy ? '提交中…' : '确认修改'}
        </button>
      </div>
    </div>
  )
}

function RealNameView({ onBack }) {
  const [status, setStatus] = useState(null)
  const [form, setForm] = useState({ realName: '', idNo: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ ok: false, text: '' })

  const load = useCallback(() => {
    let alive = true
    api
      .get('my/realname')
      .then((d) => alive && setStatus(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [load])

  const submit = async () => {
    if (busy) return
    if (form.realName.trim().length < 2) return setMsg({ ok: false, text: '请填写真实姓名' })
    if (!/^\d{17}[\dXx]$/.test(form.idNo)) return setMsg({ ok: false, text: '身份证号格式不正确' })
    setBusy(true)
    setMsg({ ok: false, text: '' })
    try {
      await api.post('my/realname', { realName: form.realName.trim(), idNo: form.idNo })
      setMsg({ ok: true, text: '已提交，等待审核' })
      setForm({ realName: '', idNo: '' })
      load()
    } catch (e) {
      setMsg({ ok: false, text: (e && e.message) || '提交失败' })
    } finally {
      setBusy(false)
    }
  }

  const done = status && (status.authStatus === 'approved' || status.authStatus === 'pending')

  return (
    <div className="sp">
      <SubHead title="实名认证" onBack={onBack} />
      <div className="sp-form">
        <div className="sp-current">
          当前状态：{AUTH_LABEL[(status && status.authStatus) || 'none']}
          {status && status.idNoMask ? ` · 证件号 ${status.idNoMask}` : ''}
        </div>
        <label className="sp-field">
          <span>真实姓名</span>
          <input
            value={form.realName}
            placeholder="与身份证一致"
            onChange={(e) => setForm({ ...form, realName: e.target.value })}
          />
        </label>
        <label className="sp-field">
          <span>身份证号</span>
          <input
            value={form.idNo}
            maxLength={18}
            placeholder="18 位身份证号（仅存哈希，不存明文）"
            onChange={(e) => setForm({ ...form, idNo: e.target.value.toUpperCase() })}
          />
        </label>
        {msg.text && <div className={'sp-msg' + (msg.ok ? ' is-ok' : '')}>{msg.text}</div>}
        <button
          className="sp-submit"
          type="button"
          onClick={submit}
          disabled={busy || done}
        >
          {busy ? '提交中…' : done ? '已提交，等待审核' : '提交认证'}
        </button>
        <p className="sp-note">
          身份证号经 HMAC-SHA256 哈希后存储，系统不保存明文，也不会在任何接口回显。
        </p>
      </div>
    </div>
  )
}
