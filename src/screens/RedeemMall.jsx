import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconCoin } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

// 积分兑换商城：后台营销活动维护的兑换商品，以电商卡片网格呈现。
// 入口在「我的积分」页；顶部常驻当前积分余额，方便用户判断能否兑换。
export default function RedeemMall({ onBack, onOpenPage }) {
  const [balance, setBalance] = useState(0)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [flash, setFlash] = useState('')

  const loadBalance = useCallback(() => {
    let alive = true
    api
      .get('my/points')
      .then((d) => alive && setBalance(d && typeof d.balance === 'number' ? d.balance : 0))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const load = useCallback(
    (pg = 1, append = false) => {
      let alive = true
      if (pg === 1) setLoading(true)
      else setLoadingMore(true)
      api
        .get('my/redeems?page=' + pg + '&pageSize=20')
        .then((d) => {
          if (!alive) return
          const list = (d && d.items) || []
          const t = d && typeof d.total === 'number' ? d.total : list.length
          setItems(append ? (prev) => [...prev, ...list] : list)
          setTotal(t)
          setPage(pg)
        })
        .catch(() => {
          if (alive && !append) setItems([])
        })
        .finally(() => {
          if (!alive) return
          if (pg === 1) setLoading(false)
          else setLoadingMore(false)
        })
      return () => {
        alive = false
      }
    },
    [],
  )

  useEffect(() => {
    const c1 = loadBalance()
    const c2 = load()
    return () => {
      c1()
      c2()
    }
  }, [loadBalance, load])

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">积分兑换</span>
        <button className="sp-act" type="button" onClick={() => onOpenPage && onOpenPage('redeemOrders')}>
          我的订单
        </button>
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      {/* 当前积分：决定能换什么，放在商城顶部常驻 */}
      <div className="rm-balance">
        <IconCoin size={18} color="#F59E0B" strokeWidth={2} />
        <span className="rm-balance-label">当前积分</span>
        <b className="rm-balance-num">{balance.toLocaleString()}</b>
      </div>

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty sp-empty-sm">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-title">暂无可兑换商品</div>
            <div className="sp-empty-sub">去「赚积分」参与活动攒积分吧</div>
          </div>
        ) : (
          <>
            <div className="rm-grid">
              {items.map((it) => {
                const soldOut = it.stock > 0 && it.stock <= 0
                const affordable = balance >= it.pointsPrice
                return (
                  <div
                    className="rm-card"
                    key={it.id}
                    onClick={() => onOpenPage && onOpenPage('redeemDetail', { itemId: it.id })}
                  >
                    <div className={'rm-thumb' + (it.coverUrl ? ' has-img' : '')}>
                      {it.coverUrl ? (
                        <img src={it.coverUrl} alt="" />
                      ) : (
                        <span className="rm-thumb-ph">积分</span>
                      )}
                      {it.type === 'virtual' ? <span className="rm-badge">虚拟</span> : null}
                      {soldOut ? <span className="rm-badge is-out">已兑完</span> : null}
                    </div>
                    <div className="rm-body">
                      <div className="rm-title">{it.title}</div>
                      {it.subtitle ? <div className="rm-sub">{it.subtitle}</div> : null}
                      <div className="rm-price">
                        <IconCoin size={14} color="#F59E0B" strokeWidth={2} />
                        <b>{it.pointsPrice.toLocaleString()}</b>
                        <span className="rm-price-unit">积分</span>
                      </div>
                      <div className="rm-meta">
                        {it.stock > 0 ? <span>剩 {it.stock} 件</span> : <span>不限量</span>}
                        <span>已兑 {it.redeemedCount || 0}</span>
                      </div>
                      <span className={'rm-go' + (affordable ? '' : ' is-short')}>
                        {affordable ? '立即兑换' : `还差 ${(it.pointsPrice - balance).toLocaleString()} 积分`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {items.length < total && (
              <button
                className="sr-more"
                type="button"
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
