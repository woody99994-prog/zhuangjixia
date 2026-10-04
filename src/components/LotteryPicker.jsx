import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../apiClient.js'
import { IconGift, IconClose } from './Icons.jsx'

// 发帖时「插入抽奖」的弹层：与后台「新建抽奖活动」弹层同构。
// - 新建抽奖：标题 / 说明 / 中奖概率 / 总名额 / 起止日期 + 奖品池多档编辑，保存后即插入本篇
// - 选择已有：列出我名下尚未挂载到任何帖子的在线抽奖，选中即插入
// 只有具备抽奖权限（lotteryPrivilege）的用户才能新建，否则弹层只提供「选择已有」。

const TYPE_LABEL = {
  points: '积分',
  virtual: '虚拟',
  physical: '实物',
  none: '空奖'
}

const emptyPrize = (seq) => ({
  name: '',
  type: 'points',
  points: '100',
  cardPool: '',
  weight: '10',
  stock: '0',
  seq
})

const emptyForm = {
  title: '',
  description: '',
  winRate: '0.1',
  totalQuota: '',
  startAt: '',
  endAt: ''
}

export default function LotteryPicker({ open, onClose, onPick }) {
  const [tab, setTab] = useState('new')
  // 抽奖权限由接口回传决定：无权限时只能「选择已有」，不能现场新建
  const [privileged, setPrivileged] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [prizes, setPrizes] = useState([emptyPrize(0)])
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const deviceEl = typeof document !== 'undefined' ? document.querySelector('.device') : null

  // 打开时重置表单，并预加载「选择已有」候选
  useEffect(() => {
    if (!open) return
    setErr('')
    setSaving(false)
    setForm(emptyForm)
    setPrizes([emptyPrize(0)])
    setTab('new')
    let alive = true
    setLoading(true)
    api
      .get('my/lotteries/attachable')
      .then((d) => {
        if (!alive) return
        setList(d && d.items ? d.items : [])
        const p = typeof d.privileged === 'boolean' ? d.privileged : true
        setPrivileged(p)
        setTab(p ? 'new' : 'exist')
      })
      .catch(() => alive && setList([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [open])

  const setPrize = (i, patch) =>
    setPrizes((rows) => rows.map((r, xi) => (xi === i ? { ...r, ...patch } : r)))

  const addPrize = () => setPrizes((rows) => [...rows, emptyPrize(rows.length)])
  const delPrize = (i) => setPrizes((rows) => (rows.length <= 1 ? rows : rows.filter((_, xi) => xi !== i)))

  // 提交新建：字段与后台一致，奖品池一并提交（新建即 online，发帖时才能选到）
  const submitNew = async () => {
    const title = form.title.trim()
    if (!title) return setErr('请填写抽奖标题')
    const rows = prizes.filter((p) => p.name.trim())
    if (rows.length === 0) return setErr('请至少配置一档奖品')
    for (const p of rows) {
      if (p.type === 'points' && !(Number(p.points) > 0)) {
        return setErr(`奖品「${p.name}」为积分类型，必须填积分值`)
      }
      if (p.type === 'virtual' && !p.cardPool.trim()) {
        return setErr(`虚拟奖品「${p.name}」必须配置卡密池`)
      }
    }
    setErr('')
    setSaving(true)
    try {
      const payload = {
        title,
        description: form.description.trim() || undefined,
        winRate: Number(form.winRate) || 0.1,
        prizes: rows.map((p, i) => ({
          name: p.name.trim(),
          type: p.type,
          points: p.type === 'points' ? Number(p.points) || 0 : undefined,
          cardPool: p.type === 'virtual' ? p.cardPool.trim() : undefined,
          weight: Number(p.weight) || 1,
          stock: Number(p.stock) || 0,
          seq: i
        }))
      }
      if (form.totalQuota) payload.totalQuota = Number(form.totalQuota)
      if (form.startAt) payload.startAt = new Date(form.startAt + 'T00:00:00').toISOString()
      if (form.endAt) payload.endAt = new Date(form.endAt + 'T23:59:59').toISOString()
      const created = await api.post('my/lotteries', payload)
      setList((prev) => [created, ...prev])
      onPick && onPick(created)
      onClose && onClose()
    } catch (e) {
      setErr((e && e.message) || '新建抽奖失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !deviceEl) return null

  return createPortal(
    <div className="modal-mask" onClick={() => !saving && onClose && onClose()}>
      <div className="modal lotpk-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">插入抽奖</span>
          <button
            className="modal-close"
            type="button"
            aria-label="关闭"
            onClick={() => !saving && onClose && onClose()}
            disabled={saving}
          >
            <IconClose size={20} color="currentColor" strokeWidth={2} />
          </button>
        </div>

        <div className="lotpk-tabs">
          <button
            type="button"
            className={'lotpk-tab' + (tab === 'new' ? ' is-on' : '')}
            onClick={() => setTab('new')}
            disabled={!privileged}
          >
            新建抽奖
          </button>
          <button
            type="button"
            className={'lotpk-tab' + (tab === 'exist' ? ' is-on' : '')}
            onClick={() => setTab('exist')}
          >
            选择已有
          </button>
        </div>

        {!privileged ? (
          <div className="modal-hint">你没有抽奖权限，只能选择已有的抽奖活动；如需新建请联系管理员开通。</div>
        ) : null}

        {tab === 'new' ? (
          <div className="lotpk-body">
            <label className="lotpk-field">
              <span>抽奖标题</span>
              <input
                className="modal-input"
                placeholder="如：晒装机赢好礼"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={40}
                disabled={saving}
              />
            </label>
            <label className="lotpk-field">
              <span>活动说明</span>
              <input
                className="modal-input"
                placeholder="如：本篇专属粉丝抽奖"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={80}
                disabled={saving}
              />
            </label>
            <div className="lotpk-grid">
              <label className="lotpk-field">
                <span>中奖概率（0~1）</span>
                <input
                  className="modal-input"
                  placeholder="0.3"
                  value={form.winRate}
                  onChange={(e) => setForm({ ...form, winRate: e.target.value })}
                  disabled={saving}
                />
              </label>
              <label className="lotpk-field">
                <span>总名额（留空不限）</span>
                <input
                  className="modal-input"
                  placeholder="不限"
                  value={form.totalQuota}
                  onChange={(e) => setForm({ ...form, totalQuota: e.target.value })}
                  disabled={saving}
                />
              </label>
              <label className="lotpk-field">
                <span>开始日期</span>
                <input
                  className="modal-input"
                  type="date"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  disabled={saving}
                />
              </label>
              <label className="lotpk-field">
                <span>结束日期</span>
                <input
                  className="modal-input"
                  type="date"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  disabled={saving}
                />
              </label>
            </div>

            <div className="lotpk-sec">
              <span className="lotpk-sec-title">奖品池</span>
              <span className="lotpk-sec-hint">权重越大越容易中；库存 0 表示不限</span>
            </div>

            {prizes.map((p, i) => (
              <div className="lotpk-prize" key={i}>
                <div className="lotpk-prize-top">
                  <input
                    className="modal-input"
                    placeholder="奖品名称"
                    value={p.name}
                    onChange={(e) => setPrize(i, { name: e.target.value })}
                    maxLength={30}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="lotpk-del"
                    onClick={() => delPrize(i)}
                    disabled={saving || prizes.length <= 1}
                  >
                    删除
                  </button>
                </div>
                <div className="lotpk-prize-row">
                  <select
                    className="lotpk-select"
                    value={p.type}
                    onChange={(e) => setPrize(i, { type: e.target.value })}
                    disabled={saving}
                  >
                    <option value="points">积分</option>
                    <option value="virtual">虚拟</option>
                    <option value="physical">实物</option>
                    <option value="none">空奖</option>
                  </select>
                  {p.type === 'points' ? (
                    <input
                      className="modal-input lotpk-num"
                      placeholder="积分值"
                      value={p.points}
                      onChange={(e) => setPrize(i, { points: e.target.value })}
                      disabled={saving}
                    />
                  ) : null}
                  {p.type === 'virtual' ? (
                    <input
                      className="modal-input lotpk-card"
                      placeholder="卡密池（分号分隔）"
                      value={p.cardPool}
                      onChange={(e) => setPrize(i, { cardPool: e.target.value })}
                      disabled={saving}
                    />
                  ) : null}
                  <input
                    className="modal-input lotpk-num"
                    title="权重"
                    placeholder="权重"
                    value={p.weight}
                    onChange={(e) => setPrize(i, { weight: e.target.value })}
                    disabled={saving}
                  />
                  <input
                    className="modal-input lotpk-num"
                    title="库存"
                    placeholder="库存"
                    value={p.stock}
                    onChange={(e) => setPrize(i, { stock: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </div>
            ))}

            <button type="button" className="lotpk-add" onClick={addPrize} disabled={saving}>
              + 添加奖品档位
            </button>
          </div>
        ) : (
          <div className="lotpk-body">
            {loading ? (
              <div className="modal-hint">正在加载可插入的抽奖…</div>
            ) : list.length === 0 ? (
              <div className="modal-hint">暂无可插入的抽奖活动，可切换到「新建抽奖」现场建一个</div>
            ) : (
              list.map((l) => (
                <button type="button" className="lotpk-pick" key={l.id} onClick={() => { onPick && onPick(l); onClose && onClose() }}>
                  <IconGift size={16} color="#1C7DFF" strokeWidth={1.9} />
                  <span className="lotpk-pick-name">{l.title}</span>
                  <em>{l.prizeCount ? `${l.prizeCount} 档奖品` : '插入'}</em>
                </button>
              ))
            )}
          </div>
        )}

        {err ? <div className="modal-err">{err}</div> : null}

        {tab === 'new' ? (
          <button className="modal-submit" type="button" onClick={submitNew} disabled={saving || !privileged}>
            {saving ? '创建中…' : '创建并插入'}
          </button>
        ) : (
          <button className="modal-submit is-ghost" type="button" onClick={() => !saving && onClose && onClose()} disabled={saving}>
            取消
          </button>
        )}
      </div>
    </div>,
    deviceEl,
  )
}

export { TYPE_LABEL }
