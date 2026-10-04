import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconPlus } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

const EMPTY = { id: '', receiver: '', phone: '', region: '', address: '', isDefault: false }

// 收货地址：独立模块。兑换实物商品时由下单页直接读取这里的地址列表。
export default function MyAddresses({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null=列表 / 对象=编辑表单
  const [form, setForm] = useState(EMPTY)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingDel, setPendingDel] = useState(null)

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    api
      .get('my/addresses')
      .then((d) => alive && setItems((d && d.items) || []))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const c = load()
    return c
  }, [load])

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  const openNew = () => {
    setErr('')
    setForm(EMPTY)
    setEditing({ new: true })
  }
  const openEdit = (a) => {
    setErr('')
    setForm({
      id: a.id,
      receiver: a.receiver || '',
      phone: a.phone || '',
      region: a.region || '',
      address: a.address || '',
      isDefault: !!a.isDefault
    })
    setEditing({ new: false })
  }

  const save = async () => {
    const receiver = form.receiver.trim()
    const phone = form.phone.trim()
    const address = form.address.trim()
    if (!receiver || !address) {
      setErr('请填写收货人与详细地址')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setErr('联系电话格式不正确')
      return
    }
    setErr('')
    setSaving(true)
    try {
      if (editing && editing.new) {
        await api.post('my/addresses', {
          receiver,
          phone,
          region: form.region.trim(),
          address,
          isDefault: form.isDefault || items.length === 0
        })
        toast('地址已添加')
      } else {
        await api.put('my/addresses/' + form.id, {
          receiver,
          phone,
          region: form.region.trim(),
          address,
          isDefault: form.isDefault
        })
        toast('地址已更新')
      }
      setEditing(null)
      load()
    } catch (e) {
      setErr((e && e.message) || '保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    const backup = items
    setItems((list) => list.filter((a) => String(a.id) !== String(id)))
    setPendingDel(null)
    try {
      await api.del('my/addresses/' + id)
      toast('地址已删除')
    } catch {
      setItems(backup)
      toast('删除失败，请重试')
    }
  }

  const setDefault = async (a) => {
    const backup = items
    setItems((list) => list.map((x) => ({ ...x, isDefault: String(x.id) === String(a.id) })))
    try {
      await api.put('my/addresses/' + a.id, { isDefault: true })
      toast('已设为默认地址')
    } catch {
      setItems(backup)
      toast('设置失败，请重试')
    }
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button
          className="sp-back"
          type="button"
          onClick={() => (editing ? setEditing(null) : onBack())}
          aria-label="返回"
        >
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">{editing ? (editing.new ? '新增地址' : '编辑地址') : '收货地址'}</span>
        {editing ? (
          <span className="sp-act sp-act-static" />
        ) : (
          <button className="sp-act" type="button" onClick={openNew}>
            <IconPlus size={16} color="var(--brand)" strokeWidth={2} />
            <span>新增</span>
          </button>
        )}
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="sp-body">
        {editing ? (
          <div className="ma-form">
            <label className="ma-field">
              <span>收货人</span>
              <input
                className="f-input"
                value={form.receiver}
                onChange={(e) => setForm({ ...form, receiver: e.target.value })}
                placeholder="请输入收货人姓名"
              />
            </label>
            <label className="ma-field">
              <span>联系电话</span>
              <input
                className="f-input"
                value={form.phone}
                inputMode="numeric"
                maxLength={11}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="11 位手机号"
              />
            </label>
            <label className="ma-field">
              <span>所在地区</span>
              <input
                className="f-input"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="如：广东省 深圳市 南山区"
              />
            </label>
            <label className="ma-field">
              <span>详细地址</span>
              <textarea
                className="f-input f-textarea"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="街道、楼牌号等"
              />
            </label>
            <label className="ma-check">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              />
              <span>设为默认地址</span>
            </label>
            {err && <div className="modal-err">{err}</div>}
            <button className="modal-submit" type="button" onClick={save} disabled={saving}>
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        ) : loading ? (
          <div className="sp-empty sp-empty-sm">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-title">还没有收货地址</div>
            <div className="sp-empty-sub">兑换实物商品前先添加一个吧</div>
          </div>
        ) : (
          items.map((a) => (
            <div className="ma-card" key={a.id}>
              <div className="ma-top">
                <b>{a.receiver}</b>
                <span>{a.phone}</span>
                {a.isDefault ? <em className="ma-def">默认</em> : null}
              </div>
              <div className="ma-addr">
                {a.region ? a.region + ' ' : ''}
                {a.address}
              </div>
              <div className="ma-acts">
                {!a.isDefault ? (
                  <button type="button" onClick={() => setDefault(a)}>
                    设为默认
                  </button>
                ) : null}
                <button type="button" onClick={() => openEdit(a)}>
                  编辑
                </button>
                {pendingDel === a.id ? (
                  <>
                    <button type="button" onClick={() => setPendingDel(null)}>
                      取消
                    </button>
                    <button type="button" className="is-danger" onClick={() => remove(a.id)}>
                      确认删除
                    </button>
                  </>
                ) : (
                  <button type="button" className="is-danger" onClick={() => setPendingDel(a.id)}>
                    删除
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
