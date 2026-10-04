import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { api, getUser } from '../apiClient.js'
import { relTime } from '../format.js'
import { IconGift, IconClose, IconCoin } from './Icons.jsx'

// 帖子详情页内嵌的积分抽奖模块（与「插入配置表」同层级的内容模块）。
// 数据来源 /my/lotteries?postId=xxx —— 后端严格按 postId 匹配，
// 只有作者在发布帖子时插入过的抽奖才会出现在这里（不是每篇帖子都带抽奖）。
//
// 关键行为（按产品要求）：
// 1) 只有作者在发布帖子时插入了抽奖，本模块才会出现 —— 不是每篇帖子都显示。
// 2) 不预先展示奖品池：抽中什么才显示什么，避免剧透。
// 3) 「已参与 X 人次」前叠 3 个参与者头像，点开可查看全部参与者（默认前 50，半隐藏可展开）。

const TYPE_LABEL = {
  points: '积分',
  virtual: '虚拟奖品',
  physical: '实物奖品',
  none: '谢谢参与'
}

// 参与者列表一次取的条数：卡片头像取前 3，弹层默认展示前 50
const PREVIEW = 50

function Avatar({ url, name, size = 24 }) {
  const initial = (name || '?').trim().slice(0, 1)
  const style = { width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.42)) }
  if (url) {
    return <span className="lot-av" style={style}>
      <img src={url} alt="" />
    </span>
  }
  return (
    <span className="lot-av is-ph" style={style}>
      {initial}
    </span>
  )
}

export default function PostLottery({ postId }) {
  const [items, setItems] = useState([])
  const [privileged, setPrivileged] = useState(false)
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(null) // 当前打开的抽奖活动
  const [drawing, setDrawing] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')

  // 实物奖品中奖后补填收货
  const [shipFor, setShipFor] = useState(null)
  const [shipForm, setShipForm] = useState({ receiver: '', phone: '', region: '', address: '' })
  const [savingShip, setSavingShip] = useState(false)

  // 参与者：{ [lotteryId]: { items, total } }
  const [parts, setParts] = useState({})
  const [peopleFor, setPeopleFor] = useState(null)
  const [expanding, setExpanding] = useState(false)

  const loggedIn = !!getUser()

  const loadParticipants = useCallback((ids) => {
    ;(ids || []).forEach((id) => {
      api
        .get(`my/lotteries/${id}/participants?page=1&pageSize=${PREVIEW}`)
        .then((d) => {
          const list = (d && d.items) || []
          setParts((p) => ({ ...p, [id]: { items: list, total: (d && d.total) || list.length } }))
        })
        .catch(() => {})
    })
  }, [])

  const load = useCallback(() => {
    if (!loggedIn) {
      setLoading(false)
      return () => {}
    }
    let alive = true
    setLoading(true)
    api
      .get('my/lotteries' + (postId ? '?postId=' + encodeURIComponent(postId) : ''))
      .then((d) => {
        if (!alive) return
        setPrivileged(!!(d && d.privileged))
        const list = d && Array.isArray(d.items) ? d.items : []
        setItems(list)
        // 卡片头像墙：给每个活动取前 50 位参与者
        loadParticipants(list.map((l) => l.id))
      })
      .catch(() => {
        if (alive) setItems([])
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [postId, loggedIn, loadParticipants])

  useEffect(() => {
    const c = load()
    return c
  }, [load])

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  const openLottery = (l) => {
    // 已参与过的直接展示上次结果；无权限的只展示说明
    setErr('')
    setResult(l.myRecord ? { ...l.myRecord, already: true, points: null } : null)
    setOpen(l)
  }
  const close = () => {
    if (drawing || savingShip) return
    setOpen(null)
    setShipFor(null)
  }

  const doDraw = async () => {
    if (drawing || !open) return
    setDrawing(true)
    setErr('')
    try {
      const d = await api.post('my/lotteries/' + open.id + '/draw')
      setResult(d || {})
      load()
    } catch (e) {
      setErr((e && e.message) || '抽奖失败，请稍后重试')
    } finally {
      setDrawing(false)
    }
  }

  const submitShip = async () => {
    if (!shipFor || savingShip) return
    if (!shipForm.receiver.trim() || !shipForm.address.trim()) {
      setErr('请填写收货人与详细地址')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(shipForm.phone.trim())) {
      setErr('联系电话格式不正确')
      return
    }
    setSavingShip(true)
    setErr('')
    try {
      await api.put('my/lottery-records/' + shipFor + '/ship', {
        receiver: shipForm.receiver.trim(),
        phone: shipForm.phone.trim(),
        region: shipForm.region.trim(),
        address: shipForm.address.trim()
      })
      toast('收货信息已提交，等待发货')
      setShipFor(null)
      load()
    } catch (e) {
      setErr((e && e.message) || '提交失败，请重试')
    } finally {
      setSavingShip(false)
    }
  }

  // 展开全部参与者：按 100 一页翻完（上限 20 页，避免超大活动拖垮前端）
  const expandAll = async (id) => {
    const cur = parts[id]
    if (!cur || expanding) return
    setExpanding(true)
    try {
      const map = new Map()
      cur.items.forEach((p) => map.set(p.id, p))
      const pages = Math.min(20, Math.ceil(cur.total / 100))
      for (let pg = 1; pg <= pages; pg++) {
        const d = await api.get(`my/lotteries/${id}/participants?page=${pg}&pageSize=100`)
        ;((d && d.items) || []).forEach((p) => map.set(p.id, p))
        if (map.size >= cur.total) break
      }
      setParts((p) => ({ ...p, [id]: { items: [...map.values()], total: cur.total, expanded: true } }))
    } catch {
      toast('加载失败，请稍后重试')
    } finally {
      setExpanding(false)
    }
  }

  const deviceEl = typeof document !== 'undefined' ? document.querySelector('.device') : null

  // 未登录 / 无数据 / 加载中都不占位，避免在详情页里留空块
  if (!loggedIn) return null
  if (loading) return null
  if (items.length === 0) return null

  const l = open || {}

  const sheet =
    open &&
    deviceEl &&
    createPortal(
      <div className="modal-mask" onClick={close}>
        <div className="modal lc-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <span className="modal-title">{l.title || '积分抽奖'}</span>
            <button
              className="modal-close"
              type="button"
              aria-label="关闭"
              onClick={close}
              disabled={drawing || savingShip}
            >
              <IconClose size={20} color="currentColor" strokeWidth={2} />
            </button>
          </div>

          <div className="lc-hero">
            <IconGift size={44} color={result && result.isWin ? '#F59E0B' : '#ADB5BF'} strokeWidth={1.8} />
          </div>

          {result ? (
            <div className="lc-result">
              <div className={'lc-result-title' + (result.isWin ? ' is-win' : '')}>
                {result.isWin ? '恭喜中奖' : '很遗憾，未中奖'}
              </div>
              {result.isWin ? (
                <>
                  <div className="lc-result-prize">
                    {result.prizeType === 'points'
                      ? `${result.prizePoints || 0} 积分`
                      : result.prizeName || '惊喜好礼'}
                  </div>
                  {/* 虚拟奖品：直接展示卡密 */}
                  {result.prizeType === 'virtual' && result.cardNo ? (
                    <div className="lc-card">
                      <span className="lc-card-label">卡密</span>
                      <b className="lc-card-no">{result.cardNo}</b>
                    </div>
                  ) : null}
                  {/* 实物奖品：引导补填收货信息 */}
                  {result.prizeType === 'physical' ? (
                    result.receiver ? (
                      <div className="lc-ship-done">
                        收货信息已提交：{result.receiver} · {result.phone}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="modal-submit"
                        onClick={() => {
                          setErr('')
                          setShipFor(result.recordId || result.id)
                        }}
                      >
                        填写收货信息
                      </button>
                    )
                  ) : null}
                </>
              ) : null}
              {typeof result.points === 'number' && result.points !== null ? (
                <div className="lc-result-pts">
                  <IconCoin size={14} color="currentColor" strokeWidth={2} />
                  <span>当前积分余额 {result.points}</span>
                </div>
              ) : null}
              {result.already ? <div className="lc-result-note">你已参与过本次活动</div> : null}
            </div>
          ) : privileged ? (
            <>
              {/* 奖品池不预先展示：抽中什么才显示什么 */}
              <div className="lc-blind">中奖结果将在抽奖后揭晓</div>
              <button className="modal-submit" type="button" onClick={doDraw} disabled={drawing}>
                {drawing ? '抽奖中…' : '立即抽奖'}
              </button>
            </>
          ) : (
            <div className="lc-nopriv">仅特殊权限用户可参与积分抽奖</div>
          )}

          {/* 实物收货表单 */}
          {shipFor ? (
            <div className="lc-ship">
              <div className="lc-ship-title">填写收货信息</div>
              <input
                className="f-input"
                placeholder="收货人"
                value={shipForm.receiver}
                onChange={(e) => setShipForm({ ...shipForm, receiver: e.target.value })}
              />
              <input
                className="f-input"
                placeholder="联系电话"
                inputMode="numeric"
                maxLength={11}
                value={shipForm.phone}
                onChange={(e) => setShipForm({ ...shipForm, phone: e.target.value })}
              />
              <input
                className="f-input"
                placeholder="所在地区（如：广东省 深圳市 南山区）"
                value={shipForm.region}
                onChange={(e) => setShipForm({ ...shipForm, region: e.target.value })}
              />
              <textarea
                className="f-input f-textarea"
                placeholder="详细地址"
                rows={2}
                value={shipForm.address}
                onChange={(e) => setShipForm({ ...shipForm, address: e.target.value })}
              />
              <div className="lc-ship-acts">
                <button className="btn-ghost" type="button" onClick={() => setShipFor(null)} disabled={savingShip}>
                  取消
                </button>
                <button className="modal-submit" type="button" onClick={submitShip} disabled={savingShip}>
                  {savingShip ? '提交中…' : '提交'}
                </button>
              </div>
            </div>
          ) : null}

          {err ? <div className="modal-err">{err}</div> : null}
        </div>
      </div>,
      deviceEl,
    )

  // 参与者弹层
  const people =
    peopleFor &&
    deviceEl &&
    createPortal(
      <div className="modal-mask" onClick={() => setPeopleFor(null)}>
        <div className="modal lotp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <span className="modal-title">
              参与用户 {parts[peopleFor] ? parts[peopleFor].total : 0}
            </span>
            <button
              className="modal-close"
              type="button"
              aria-label="关闭"
              onClick={() => setPeopleFor(null)}
            >
              <IconClose size={20} color="currentColor" strokeWidth={2} />
            </button>
          </div>
          <div className="lotp-sub">
            默认展示前 {PREVIEW} 位，点击底部按钮可展开全部
          </div>
          <div className="lotp-list">
            {!parts[peopleFor] || parts[peopleFor].items.length === 0 ? (
              <div className="lotp-empty">还没有人参与，快来抢第一个</div>
            ) : (
              (parts[peopleFor].expanded
                ? parts[peopleFor].items
                : parts[peopleFor].items.slice(0, PREVIEW)
              ).map((p) => (
                <div className="lotp-row" key={p.id}>
                  <Avatar url={p.avatarUrl} name={p.nickname} size={36} />
                  <span className="lotp-name">{p.nickname}</span>
                  {p.isWin ? (
                    <span className="lotp-win">中奖 · {p.prizeName || '好礼'}</span>
                  ) : (
                    <span className="lotp-time">{relTime(p.createdAt)}参与</span>
                  )}
                </div>
              ))
            )}
          </div>
          {parts[peopleFor] &&
          !parts[peopleFor].expanded &&
          parts[peopleFor].total > PREVIEW ? (
            <div className="lotp-fade">
              <span>下方还有 {parts[peopleFor].total - PREVIEW} 位参与者</span>
              <button
                type="button"
                className="lotp-more"
                onClick={() => expandAll(peopleFor)}
                disabled={expanding}
              >
                {expanding ? '加载中…' : `显示全部 ${parts[peopleFor].total} 位参与者`}
              </button>
            </div>
          ) : null}
        </div>
      </div>,
      deviceEl,
    )

  return (
    <div className="ad-lottery">
      {items.map((it) => {
        const my = it.myRecord
        const canDraw = !!privileged && !my
        const btnText = !privileged
          ? '仅特殊权限可参与'
          : my
            ? my.isWin
              ? '已中奖 · 查看'
              : '已参与 · 查看'
            : '立即抽奖'
        const p = parts[it.id]
        const avatars = (p && p.items ? p.items : []).slice(0, 3)
        const quotaText =
          it.totalQuota != null
            ? `已参与 ${it.drawnCount || 0}/${it.totalQuota} · ${it.winCount || 0} 人中奖`
            : `已参与 ${it.drawnCount || 0} 人次 · ${it.winCount || 0} 人中奖`
        return (
          <div className="ad-lot-card" key={it.id}>
            <div className="ad-lot-head">
              <span className="ad-lot-badge">
                <IconGift size={14} color="currentColor" strokeWidth={2} />
                <span>积分抽奖</span>
              </span>
              <h3 className="ad-lot-title">{it.title}</h3>
            </div>
            {it.description ? <div className="ad-lot-desc">{it.description}</div> : null}

            {/* 只显示「我抽中的奖品」：抽之前不剧透奖品池 */}
            {my ? (
              <div className="ad-lot-mywin">
                <span className="ad-lot-mywin-label">{my.isWin ? '我抽中的奖品' : '我的抽奖结果'}</span>
                {my.isWin ? (
                  <div className="ad-lot-mywin-row">
                    <span className="ad-lot-mywin-name">
                      {my.prizeType === 'points'
                        ? `${my.prizePoints || 0} 积分`
                        : my.prizeName || '惊喜好礼'}
                    </span>
                    <span className={'ad-lot-prize-tag is-' + (my.prizeType || 'none')}>
                      {TYPE_LABEL[my.prizeType] || '奖品'}
                    </span>
                  </div>
                ) : (
                  <div className="ad-lot-mywin-row is-none">
                    <span className="ad-lot-mywin-name">谢谢参与</span>
                  </div>
                )}
                {my.prizeType === 'virtual' && my.cardNo ? (
                  <div className="ad-lot-mywin-card">卡密 {my.cardNo}</div>
                ) : null}
                {my.prizeType === 'physical' ? (
                  <div className="ad-lot-mywin-ship">
                    {my.receiver ? `已提交收货：${my.receiver}` : '待填写收货信息'}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="ad-lot-blind">参与后揭晓奖品 · 抽中什么显示什么</div>
            )}

            <div className="ad-lot-people">
              <button
                type="button"
                className="ad-lot-avs"
                onClick={() => setPeopleFor(it.id)}
                aria-label="查看参与用户"
              >
                {avatars.length === 0 ? (
                  <span className="lot-av is-ph" style={{ width: 24, height: 24, fontSize: 10 }}>
                    待
                  </span>
                ) : (
                  avatars.map((a, i) => (
                    <Avatar key={a.id || i} url={a.avatarUrl} name={a.nickname} size={24} />
                  ))
                )}
              </button>
              <span className="ad-lot-meta">
                {quotaText}
                {!privileged ? ' · 需特殊权限' : ''}
              </span>
              <button type="button" className="ad-lot-people-more" onClick={() => setPeopleFor(it.id)}>
                查看全部 ›
              </button>
            </div>

            <div className="ad-lot-foot">
              <button
                type="button"
                className={'ad-lot-btn' + (canDraw ? '' : ' is-off')}
                onClick={() => openLottery(it)}
              >
                {btnText}
              </button>
            </div>
          </div>
        )
      })}
      {flash ? <div className="ad-flash">{flash}</div> : null}
      {sheet}
      {people}
    </div>
  )
}
