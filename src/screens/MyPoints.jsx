import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconCoin, IconGift, IconTruck } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

const SOURCE_LABEL = {
  activity: '活动奖励',
  signin: '每日签到',
  order: '下单返积分',
  manual: '后台调整',
  redeem: '积分兑换',
  lottery: '积分抽奖',
}

function fmtDate(d) {
  if (!d) return ''
  const t = new Date(d)
  const p = (n) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`
}

// 我的积分：余额卡 + 汇总 + 积分兑换入口 + 赚积分活动 + 积分明细分页
export default function MyPoints({ onBack, onOpenPage }) {
  const [balance, setBalance] = useState(0)
  const [summary, setSummary] = useState({ todayEarned: 0, totalEarned: 0, totalSpent: 0 })
  const [loadingBalance, setLoadingBalance] = useState(true)

  const [activities, setActivities] = useState([])
  const [loadingActs, setLoadingActs] = useState(true)

  const [ledger, setLedger] = useState([])
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerTotal, setLedgerTotal] = useState(0)
  const [loadingLedger, setLoadingLedger] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [flash, setFlash] = useState('')

  const toast = (msg) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2200)
  }

  const loadSummary = useCallback(() => {
    let alive = true
    api
      .get('my/points')
      .then((d) => {
        if (!alive) return
        setBalance(d.balance ?? 0)
        setSummary({
          todayEarned: d.todayEarned ?? 0,
          totalEarned: d.totalEarned ?? 0,
          totalSpent: d.totalSpent ?? 0,
        })
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingBalance(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const loadActivities = useCallback(() => {
    let alive = true
    api
      .get('my/points/activities')
      .then((d) => {
        if (!alive) return
        setActivities((d && d.items) || [])
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingActs(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const loadLedger = useCallback((pg = 1, append = false) => {
    let alive = true
    if (pg === 1) setLoadingLedger(true)
    else setLoadingMore(true)
    api
      .get('my/points/ledger?page=' + pg + '&pageSize=20')
      .then((d) => {
        if (!alive) return
        const list = (d && d.items) || []
        const t = d && typeof d.total === 'number' ? d.total : list.length
        setLedger(append ? (prev) => [...prev, ...list] : list)
        setLedgerTotal(t)
        setLedgerPage(pg)
      })
      .catch(() => {
        if (!alive && !append) setLedger([])
      })
      .finally(() => {
        if (!alive) return
        if (pg === 1) setLoadingLedger(false)
        else setLoadingMore(false)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const c1 = loadSummary()
    const c2 = loadActivities()
    const c3 = loadLedger()
    return () => {
      c1()
      c2()
      c3()
    }
  }, [loadSummary, loadActivities, loadLedger])

  const loadMoreLedger = () => {
    if (loadingMore) return
    loadLedger(ledgerPage + 1, true)
  }

  const joinActivity = async (act) => {
    const backup = activities
    // 乐观更新：先标记 joined + 增加余额
    setActivities((prev) => prev.map((a) => (a.id === act.id ? { ...a, joined: true } : a)))
    setBalance((b) => b + act.pointsAward)
    try {
      const r = await api.post('my/points/activities/' + act.id + '/join')
      if (r && r.alreadyJoined) {
        toast('你已参与过该活动')
      } else {
        toast(`参与成功，+${act.pointsAward} 积分`)
      }
      if (r && typeof r.points === 'number') setBalance(r.points)
      // 刷新汇总与明细，保证数据一致
      loadSummary()
      loadLedger(1)
    } catch {
      setActivities(backup)
      toast('参与失败，请重试')
    }
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">我的积分</span>
        <span className="sp-act sp-act-static">
          <IconCoin size={18} color="var(--brand)" strokeWidth={2} />
        </span>
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="sp-body">
        {/* 积分余额卡 */}
        <div className="pts-hero">
          <div className="pts-hero-label">当前积分</div>
          <div className="pts-balance-num">
            <IconCoin size={26} color="#fff" strokeWidth={2} />
            <span>{loadingBalance ? '—' : balance.toLocaleString()}</span>
          </div>
          <div className="pts-sum">
            <div>
              <b>+{summary.todayEarned.toLocaleString()}</b>
              <span>今日获得</span>
            </div>
            <div>
              <b>+{summary.totalEarned.toLocaleString()}</b>
              <span>累计获得</span>
            </div>
            <div>
              <b>-{summary.totalSpent.toLocaleString()}</b>
              <span>累计消耗</span>
            </div>
          </div>
        </div>

        {/* 积分兑换入口：兑换商城 + 我的订单 + 收货地址（三个同层快捷） */}
        <div className="pts-quick">
          <button className="pts-quick-item" type="button" onClick={() => onOpenPage && onOpenPage('redeemMall')}>
            <span className="pts-quick-ic tone-amber">
              <IconGift size={18} color="currentColor" strokeWidth={2} />
            </span>
            <span className="pts-quick-text">
              <b>积分兑换</b>
              <i>用积分换好物</i>
            </span>
          </button>
          <button className="pts-quick-item" type="button" onClick={() => onOpenPage && onOpenPage('redeemOrders')}>
            <span className="pts-quick-ic tone-blue">
              <IconCoin size={18} color="currentColor" strokeWidth={2} />
            </span>
            <span className="pts-quick-text">
              <b>兑换订单</b>
              <i>查看卡密与物流</i>
            </span>
          </button>
          <button className="pts-quick-item" type="button" onClick={() => onOpenPage && onOpenPage('addresses')}>
            <span className="pts-quick-ic tone-green">
              <IconTruck size={18} color="currentColor" strokeWidth={2} />
            </span>
            <span className="pts-quick-text">
              <b>收货地址</b>
              <i>管理收货信息</i>
            </span>
          </button>
        </div>

        {/* 赚积分：进行中的送积分活动 */}
        <div className="pts-section-title">赚积分</div>
        {loadingActs ? (
          <div className="sp-empty sp-empty-sm">加载中…</div>
        ) : activities.length === 0 ? (
          <div className="sp-empty sp-empty-sm">暂无进行中的活动</div>
        ) : (
          activities.map((a) => (
            <div className="pts-act" key={a.id}>
              <div className="pts-act-main">
                <div className="pts-act-name">{a.name}</div>
                <div className="pts-act-meta">
                  <span className="chip-soft">+{a.pointsAward} 积分</span>
                  <span>{a.participantCount} 人已参与</span>
                </div>
              </div>
              {a.joined ? (
                <span className="pts-joined">已参与</span>
              ) : (
                <button className="pts-join" type="button" onClick={() => joinActivity(a)}>
                  参与得积分
                </button>
              )}
            </div>
          ))
        )}

        {/* 积分明细 */}
        <div className="pts-section-title">积分明细</div>
        {loadingLedger ? (
          <div className="sp-empty sp-empty-sm">加载中…</div>
        ) : ledger.length === 0 ? (
          <div className="sp-empty sp-empty-sm">还没有积分记录</div>
        ) : (
          <>
            {ledger.map((it) => {
              const earn = it.change > 0
              return (
                <div className="pts-row" key={it.id}>
                  <div className="pts-row-info">
                    <div className="pts-row-title">
                      {SOURCE_LABEL[it.source] || it.source}
                      {it.remark ? <span className="pts-row-remark"> · {it.remark}</span> : null}
                    </div>
                    <div className="pts-row-time">{fmtDate(it.createdAt)}</div>
                  </div>
                  <div className={'pts-row-change ' + (earn ? 'earn' : 'spend')}>
                    {earn ? '+' : ''}
                    {it.change.toLocaleString()}
                  </div>
                </div>
              )
            })}
            {ledger.length < ledgerTotal && (
              <button className="sr-more" type="button" onClick={loadMoreLedger} disabled={loadingMore}>
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
