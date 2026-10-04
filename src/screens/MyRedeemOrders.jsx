import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconCoin } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

const STATUS = {
  pending: { label: '待发货', cls: 'is-pending' },
  shipped: { label: '已发货', cls: 'is-shipped' },
  done: { label: '已完成', cls: 'is-done' },
  cancelled: { label: '已取消', cls: 'is-cancelled' }
}

function fmtDate(d) {
  if (!d) return ''
  const t = new Date(d)
  const p = (n) => String(n).padStart(2, '0')
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`
}

// 我的兑换订单：展示积分消耗、卡密（虚拟）、物流（实物）与状态
export default function MyRedeemOrders({ onBack }) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(
    (pg = 1, append = false) => {
      let alive = true
      if (pg === 1) setLoading(true)
      else setLoadingMore(true)
      api
        .get('my/redeem-orders?page=' + pg + '&pageSize=20')
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
    const c = load()
    return c
  }, [load])

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">我的兑换订单</span>
        <span className="sp-act sp-act-static" />
      </div>

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty sp-empty-sm">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-title">还没有兑换订单</div>
            <div className="sp-empty-sub">去积分兑换商城看看有什么好物</div>
          </div>
        ) : (
          <>
            {items.map((o) => {
              const s = STATUS[o.status] || { label: o.status, cls: '' }
              return (
                <div className="ro-card" key={o.id}>
                  <div className="ro-head">
                    <span className={'ro-status ' + s.cls}>{s.label}</span>
                    <span className="ro-no">{o.orderNo}</span>
                  </div>
                  <div className="ro-main">
                    <div className={'ro-thumb' + (o.itemCover ? ' has-img' : '')}>
                      {o.itemCover ? <img src={o.itemCover} alt="" /> : <span>积分</span>}
                    </div>
                    <div className="ro-info">
                      <div className="ro-title">{o.itemTitle}</div>
                      <div className="ro-meta">
                        {o.itemType === 'virtual' ? '虚拟商品' : '实物商品'} × {o.quantity}
                      </div>
                      <div className="ro-cost">
                        <IconCoin size={13} color="#F59E0B" strokeWidth={2} />
                        <b>{o.pointsCost.toLocaleString()}</b>
                        <span>积分</span>
                      </div>
                    </div>
                  </div>

                  {o.cardNo ? (
                    <div className="ro-card-no">
                      <span>卡密</span>
                      <b>{o.cardNo}</b>
                    </div>
                  ) : null}

                  {o.itemType === 'physical' ? (
                    <div className="ro-ship">
                      <div>
                        {o.receiver} · {o.phone}
                      </div>
                      <div className="ro-ship-addr">
                        {o.region ? o.region + ' ' : ''}
                        {o.address}
                      </div>
                      {o.expressNo ? (
                        <div className="ro-express">
                          {o.expressCompany ? o.expressCompany + ' ' : ''}
                          {o.expressNo}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="ro-time">{fmtDate(o.createdAt)}</div>
                </div>
              )
            })}
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
