/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { IconChevron, IconEdit } from '../components/Icons.jsx'
import { api, setUser, getUser } from '../apiClient.js'
import { compressImage } from '../media.js'
import { PROVINCES } from '../data.js'

// 编辑资料：头像 / 用户名 / 生日 / 邮箱 / 所在省份 / 城市
// 这里填的每一项都会写到后端 User / UserProfile，并在管理后台「用户列表」里同步可见
export default function EditProfile({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    nickname: '',
    birthday: '',
    email: '',
    province: '',
    city: '',
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  // 本地压缩后的预览（上传成功后会被服务端地址替换）
  const [localPreview, setLocalPreview] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef(null)

  const toast = (msg) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2600)
  }

  useEffect(() => {
    let alive = true
    api
      .get('my/me')
      .then((d) => {
        if (!alive || !d) return
        const p = d.profile || {}
        setForm({
          nickname: d.nickname || '',
          birthday: p.birthday ? String(p.birthday).slice(0, 10) : '',
          email: p.email || '',
          province: p.province || '',
          city: p.city || '',
        })
        setAvatarUrl(d.avatarUrl || '')
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const pickAvatar = () => fileRef.current && fileRef.current.click()

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\//.test(f.type)) {
      setErr('请选择图片文件')
      return
    }
    setErr('')
    setFile(f)
    try {
      // 头像用 512 足够，别把 4K 原图塞进库里
      setLocalPreview(await compressImage(f, 512, 0.86))
    } catch {
      setErr('这张图读不出来，换一张试试')
      setFile(null)
    }
  }

  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const save = async () => {
    if (saving) return
    const nickname = form.nickname.trim()
    if (!nickname) {
      setErr('用户名不能为空')
      return
    }
    const email = form.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('邮箱格式不正确')
      return
    }
    if (form.birthday && form.birthday > today) {
      setErr('生日不能晚于今天')
      return
    }
    setSaving(true)
    setErr('')
    try {
      let url = avatarUrl
      if (file) {
        const compressed = await compressImage(file, 512, 0.86)
        const up = await api.post('my/assets', { data: compressed })
        if (!up || !up.url) throw new Error('头像上传失败')
        url = up.url
      }
      const res = await api.put('my/profile', {
        nickname,
        avatarUrl: url,
        birthday: form.birthday || '',
        email: email || '',
        province: form.province || '',
        city: form.city || '',
      })
      setAvatarUrl(url)
      setFile(null)
      setLocalPreview('')
      // 本地登录缓存同步一份（保留 id/phone），免得「我的」页还显示旧昵称/头像
      setUser({
        ...(getUser() || {}),
        nickname: (res && res.nickname) || nickname,
        avatarUrl: (res && res.avatarUrl) || url,
      })
      toast('保存成功，资料已同步到平台用户档案')
      setTimeout(() => onBack && onBack(), 1000)
    } catch (e) {
      setErr((e && e.message) || '保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const shownAvatar = localPreview || avatarUrl

  return (
    <div className="ep">
      <div className="ep-top">
        <button className="ep-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.4} />
        </button>
        <span className="ep-title">编辑资料</span>
      </div>

      {loading ? (
        <div className="ad-loading">加载中…</div>
      ) : (
        <div className="ep-body">
          <button className="ep-avatar-row" type="button" onClick={pickAvatar} disabled={saving}>
            <span className="ep-avatar">
              {shownAvatar ? <img src={shownAvatar} alt="头像预览" /> : <em>{(form.nickname || '游')[0]}</em>}
              <span className="ep-avatar-edit">
                <IconEdit size={13} color="#FFFFFF" strokeWidth={2.1} />
              </span>
            </span>
            <span className="ep-avatar-tip">
              <b>点击更换头像</b>
              <i>支持 jpg / png，会自动压缩后上传</i>
            </span>
            <span className="ep-chev">
              <IconChevron size={16} strokeWidth={2.2} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

          <div className="ep-group">
            <label className="ep-field">
              <span className="ep-label">用户名</span>
              <input
                className="ep-input"
                value={form.nickname}
                maxLength={24}
                placeholder="给自己起个名字"
                disabled={saving}
                onChange={(e) => setForm((s) => ({ ...s, nickname: e.target.value }))}
              />
            </label>

            <label className="ep-field">
              <span className="ep-label">生日</span>
              <input
                className="ep-input"
                type="date"
                max={today}
                value={form.birthday}
                disabled={saving}
                onChange={(e) => setForm((s) => ({ ...s, birthday: e.target.value }))}
              />
            </label>

            <label className="ep-field">
              <span className="ep-label">邮箱</span>
              <input
                className="ep-input"
                type="email"
                inputMode="email"
                value={form.email}
                maxLength={128}
                placeholder="用于接收通知与找回账号"
                disabled={saving}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              />
            </label>

            <label className="ep-field">
              <span className="ep-label">所在省份</span>
              <select
                className="ep-input ep-select"
                value={form.province}
                disabled={saving}
                onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))}
              >
                <option value="">请选择</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="ep-field">
              <span className="ep-label">所在城市</span>
              <input
                className="ep-input"
                value={form.city}
                maxLength={32}
                placeholder="如：深圳市"
                disabled={saving}
                onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              />
            </label>
          </div>

          <p className="ep-note">
            以上资料会保存到你的平台账号，管理员在后台「用户列表」中可查看；<br />
            手机号属于账号凭证，请在「账号与安全」里更换。
          </p>

          {err && <div className="ep-err">{err}</div>}
          {flash && <div className="ep-flash">{flash}</div>}

          <button className="ep-submit" type="button" disabled={saving} onClick={save}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      )}
    </div>
  )
}
