import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconCoin, IconPlus } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

// 兑换下单页：确认商品与数量 → 选择/新增收货地址（实物必填）→ 扣积分提交订单。
// 地址直接在本页内联读取与新增，避免跳页带来的回退栈问题。

const EMPTY_FORM = { receiver: '', phone: '', region: '', address: '', isDefault: false }

export default function RedeemCheckout({ itemId, onBack, onOpenPage }) {
  const [item, setItem] = useState(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')

  const [qty, setQty] = useState(1)
  const [addresses, setAddresses] = useState([])
  const [addrId, setAddrId] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)

  const load = useCallback(() => {
    if (!itemId) {
      setLoading(false)
      setErr('商品不存在')
      return () => {}
    }
    let alive = true
    setLoading(true)
    Promise.all([
      api.get('my/redeems/' + itemId),
      api.get('my/points'),
      api.get('my/addresses')
    ])
      .then(([d, p, a]) => {
        if (!alive) return
        setItem(d || null)
        setBalance(p && typeof p.balance === 'number' ? p.balance : 0)
        const list = (a && a.items) || []
        setAddresses(list)
        const def = list.find((x) => x.isDefault) || list[0]
        setAddrId(def ? String(def.id) : '')
        if (list.length === 0) setAdding(true)
      })
      .catch((e) => alive && setErr((e && e.message) || '加载失败'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [itemId])

  useEffect(() => {
    const c = load()
    return c
  }, [load])

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  const saveAddress = async () => {
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
    try {
      await api.post('my/addresses', {
        receiver,
        phone,
        region: form.region.trim(),
        address,
        isDefault: form.isDefault || addresses.length === 0
      })
      const a = await api.get('my/addresses')
      const list = (a && a.items) || []
      setAddresses(list)
      const def = list.find((x) => x.isDefault) || list[0]
      setAddrId(def ? String(def.id) : '')
      setForm(EMPTY_FORM)
      setAdding(false)
      toast('收货地址已保存')
    } catch (e) {
      setErr((e && e.message) || '保存失败，请重试')
    }
  }

  const submit = async () => {
    if (!item || submitting) return
    const cost = item.pointsPrice * qty
    if (balance < cost) {
      setErr(`积分不足，还需 ${(cost - balance).toLocaleString()} 积分`)
      return
    }
    if (item.type === 'physical') {
      const picked = addresses.find((x) => String(x.id) === String(addrId))
      if (!picked) {
        setErr('请选择或新增收货地址')
        return
      }
    }
    setErr('')
    setSubmitting(true)
    try {
      const picked = addresses.find((x) => String(x.id) === String(addrId))
      const r = await api.post('my/redeems/' + item.id + '/order', {
        quantity: qty,
        ...(item.type === 'physical' && picked
          ? { receiver: picked.receiver, phone: picked.phone, region: picked.region, address: picked.address }
          : {})
      })
      setDone(r || {})
      if (onOpenPage) setTimeout(() => onOpenPage('redeemOrders'), 1200)
    } catch (e) {
      setErr((e && e.message) || '兑换失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="sp">
        <div className="sp-head">
          <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <span className="sp-title">确认兑换</span>
          <span className="sp-act sp-act-static" />
        </div>
        <div className="sp-empty">加载中…</div>
      </div>
    )
  }

  if (err && !item) {
    return (
      <div className="sp">
        <div className="sp-head">
          <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <span className="sp-title">确认兑换</span>
          <span className="sp-act sp-act-static" />
        </div>
        <div className="sp-empty">{err}</div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="sp">
        <div className="sp-head">
          <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <span className="sp-title">兑换成功</span>
          <span className="sp-act sp-act-static" />
        </div>
        <div className="rc-done">
          <div className="rc-done-ic">
            <IconCoin size={40} color="#F59E0B" strokeWidth={1.9} />
          </div>
          <div className="rc-done-title">兑换成功</div>
          <div className="rc-done-sub">
            已扣除 {done.pointsCost ? done.pointsCost.toLocaleString() : 0} 积分
          </div>
          {done.cardNo ? (
            <div className="rc-done-card">
              <span>卡密</span>
              <b>{done.cardNo}</b>
            </div>
          ) : null}
          <div className="rc-done-no">订单号 {done.orderNo}</div>
          <div className="rc-done-tip">正在前往「我的订单」…</div>
        </div>
      </div>
    )
  }

  const maxQty = item && item.stock > 0 ? Math.min(item.stock, 10) : 10
  const cost = item ? item.pointsPrice * qty : 0
  const short = Math.max(0, cost - balance)

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">确认兑换</span>
        <span className="sp-act sp-act-static" />
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="sp-body">
        {/* 商品摘要 */}
        <div className="rc-item">
          <div className={'rc-item-thumb' + (item && item.coverUrl ? ' has-img' : '')}>
            {item && item.coverUrl ? <img src={item.coverUrl} alt="" /> : <span>积分</span>}
          </div>
          <div className="rc-item-main">
            <div className="rc-item-title">{item && item.title}</div>
            <div className="rc-item-price">
              <IconCoin size={14} color="#F59E0B" strokeWidth={2} />
              <b>{(item && item.pointsPrice || 0).toLocaleString()}</b>
              <span>积分</span>
            </div>
            <span className={'rc-type is-' + (item && item.type)}>
              {item && item.type === 'virtual' ? '虚拟商品' : '实物商品'}
            </span>
          </div>
          <div className="rc-qty">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="减少"
            >
              －
            </button>
            <span>{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              aria-label="增加"
            >
              ＋
            </button>
          </div>
        </div>

        {/* 收货地址：仅实物商品需要 */}
        {item && item.type === 'physical' ? (
          <div className="rc-block">
            <div className="rc-block-title">
              收货信息
              <button
                type="button"
                className="rc-add"
                onClick={() => {
                  setAdding((v) => !v)
                  setErr('')
                }}
              >
                <IconPlus size={14} color="currentColor" strokeWidth={2} />
                <span>{adding ? '收起' : '新增地址'}</span>
              </button>
            </div>

            {addresses.length === 0 && !adding ? (
              <div className="sp-empty sp-empty-sm">还没有收货地址，请先新增</div>
            ) : null}

            {addresses.map((a) => (
              <label className={'rc-addr' + (String(a.id) === String(addrId) ? ' on' : '')} key={a.id}>
                <input
                  type="radio"
                  name="rc-addr"
                  checked={String(a.id) === String(addrId)}
                  onChange={() => setAddrId(String(a.id))}
                />
                <div className="rc-addr-main">
                  <div className="rc-addr-top">
                    <b>{a.receiver}</b>
                    <span>{a.phone}</span>
                    {a.isDefault ? <em className="rc-addr-def">默认</em> : null}
                  </div>
                  <div className="rc-addr-text">
                    {a.region ? a.region + ' ' : ''}
                    {a.address}
                  </div>
                </div>
              </label>
            ))}

            {adding ? (
              <div className="rc-form">
                <input
                  className="f-input"
                  placeholder="收货人"
                  value={form.receiver}
                  onChange={(e) => setForm({ ...form, receiver: e.target.value })}
                />
                <input
                  className="f-input"
                  placeholder="联系电话"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <input
                  className="f-input"
                  placeholder="所在地区（如：广东省 深圳市 南山区）"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                />
                <textarea
                  className="f-input f-textarea"
                  placeholder="详细地址"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <label className="rc-check">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  <span>设为默认地址</span>
                </label>
                <button className="modal-submit" type="button" onClick={saveAddress}>
                  保存地址
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rc-block">
            <div className="rc-block-title">发货方式</div>
            <div className="rc-tip">虚拟商品将在兑换成功后即时发放卡密，可在「我的订单」查看。</div>
          </div>
        )}

        {/* 结算 */}
        <div className="rc-block">
          <div className="rc-block-title">结算</div>
          <div className="rc-line">
            <span>当前积分</span>
            <b>{balance.toLocaleString()}</b>
          </div>
          <div className="rc-line">
            <span>商品积分 × {qty}</span>
            <b>-{cost.toLocaleString()}</b>
          </div>
          <div className="rc-line is-total">
            <span>兑换后余额</span>
            <b>{Math.max(0, balance - cost).toLocaleString()}</b>
          </div>
          {short > 0 ? <div className="rc-short">积分不足，还需 {short.toLocaleString()} 积分</div> : null}
        </div>

        {err ? <div className="modal-err">{err}</div> : null}

        <button
          className={'rc-submit' + (short > 0 || submitting ? ' is-off' : '')}
          type="button"
          onClick={submit}
          disabled={short > 0 || submitting}
        >
          {submitting ? '提交中…' : `确认兑换 · ${cost.toLocaleString()} 积分`}
        </button>
      </div>
    </div>
  )
}
