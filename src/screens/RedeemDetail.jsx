import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconCoin } from '../components/Icons.jsx'
import { api } from '../apiClient.js'

// 兑换商品详情：按电商详情页组织信息层级——
// 轮播图 → 积分价格带 → 标题/卖点 → 商品详情图文 → 底部常驻兑换栏。
// 实物商品需要收货信息，虚拟商品（CDK / 京东卡）下单后直接发卡密。

// 轻量解析详情正文：图片 / 小标题 / 段落
function parseDetail(md) {
  if (!md) return []
  const out = []
  for (const raw of String(md).split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const img = line.match(/^!\[(.*?)\]\((.*?)\)/)
    if (img) {
      out.push({ type: 'img', alt: img[1], url: img[2] })
    } else if (line.startsWith('## ')) {
      out.push({ type: 'h3', text: line.slice(3).trim() })
    } else {
      out.push({ type: 'p', text: line })
    }
  }
  return out
}

export default function RedeemDetail({ itemId, onBack, onOpenPage }) {
  const [item, setItem] = useState(null)
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')

  const load = useCallback(() => {
    if (!itemId) {
      setLoading(false)
      setErr('商品不存在')
      return () => {}
    }
    let alive = true
    setLoading(true)
    Promise.all([api.get('my/redeems/' + itemId), api.get('my/points')])
      .then(([d, p]) => {
        if (!alive) return
        setItem(d || null)
        setBalance(p && typeof p.balance === 'number' ? p.balance : 0)
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

  if (loading) {
    return (
      <div className="sp">
        <div className="sp-head">
          <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <span className="sp-title">商品详情</span>
          <span className="sp-act sp-act-static" />
        </div>
        <div className="sp-empty">加载中…</div>
      </div>
    )
  }

  if (err || !item) {
    return (
      <div className="sp">
        <div className="sp-head">
          <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <span className="sp-title">商品详情</span>
          <span className="sp-act sp-act-static" />
        </div>
        <div className="sp-empty">{err || '商品不存在'}</div>
      </div>
    )
  }

  const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : item.coverUrl ? [item.coverUrl] : []
  const blocks = parseDetail(item.detailMd)
  const soldOut = item.stock > 0 && item.stock <= 0
  const limited = item.limitPerUser > 0 && (item.myRedeemed || 0) >= item.limitPerUser
  const enough = balance >= item.pointsPrice
  const canBuy = !soldOut && !limited && enough

  const ctaText = soldOut
    ? '已兑完'
    : limited
      ? `已达限兑 ${item.limitPerUser} 件`
      : enough
        ? '立即兑换'
        : `还差 ${(item.pointsPrice - balance).toLocaleString()} 积分`

  const goCheckout = () => {
    if (!canBuy) {
      toast(ctaText)
      return
    }
    if (onOpenPage) onOpenPage('redeemCheckout', { itemId: item.id })
  }

  return (
    <div className="sp rd">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">商品详情</span>
        <button className="sp-act" type="button" onClick={() => onOpenPage && onOpenPage('redeemOrders')}>
          我的订单
        </button>
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="rd-body">
        {/* 轮播图：横向滚动吸附，多图时可滑 */}
        <div className="rd-gallery">
          {images.length === 0 ? (
            <div className="rd-gallery-ph">暂无商品图</div>
          ) : (
            images.map((url, i) => (
              <div className="rd-gallery-item" key={i}>
                <img src={url} alt={item.title || '商品图'} />
              </div>
            ))
          )}
        </div>

        {/* 价格带：积分价 + 商品类型 */}
        <div className="rd-price-band">
          <div className="rd-price">
            <IconCoin size={20} color="#F59E0B" strokeWidth={2} />
            <b>{item.pointsPrice.toLocaleString()}</b>
            <span>积分</span>
          </div>
          <span className={'rd-type is-' + item.type}>{item.type === 'virtual' ? '虚拟商品' : '实物商品'}</span>
        </div>

        <div className="rd-main">
          <h1 className="rd-title">{item.title}</h1>
          {item.subtitle ? <div className="rd-sub">{item.subtitle}</div> : null}
          <div className="rd-meta-row">
            <span>{item.stock > 0 ? `库存 ${item.stock} 件` : '不限量'}</span>
            <span>已兑换 {item.redeemedCount || 0} 件</span>
            {item.limitPerUser > 0 ? <span>每人限兑 {item.limitPerUser} 件</span> : null}
          </div>
        </div>

        {/* 商品详情图文 */}
        <div className="rd-section-title">商品详情</div>
        <div className="rd-detail">
          {blocks.length === 0 ? (
            <div className="sp-empty sp-empty-sm">暂无详细描述</div>
          ) : (
            blocks.map((b, i) => {
              if (b.type === 'img')
                return (
                  <div className="rd-detail-img" key={i}>
                    <img src={b.url} alt={b.alt} />
                  </div>
                )
              if (b.type === 'h3') return <h3 className="rd-detail-h3" key={i}>{b.text}</h3>
              return <p className="rd-detail-p" key={i}>{b.text}</p>
            })
          )}
        </div>

        {/* 兑换须知：实物要收货，虚拟发卡密 */}
        <div className="rd-section-title">兑换须知</div>
        <div className="rd-note">
          {item.type === 'physical' ? (
            <>
              <p>· 本商品为实物，下单需填写收货人、联系电话与收货地址。</p>
              <p>· 提交后由后台发货，可在「我的订单」查看物流状态。</p>
            </>
          ) : (
            <>
              <p>· 本商品为虚拟商品（如游戏 CDK / 京东卡），下单后即时发放卡密。</p>
              <p>· 卡密可在「我的订单」中查看，请及时使用。</p>
            </>
          )}
          <p>· 兑换成功后扣除相应积分，取消订单将原路退回积分。</p>
        </div>
      </div>

      {/* 底部常驻兑换栏 */}
      <div className="rd-bar">
        <div className="rd-bar-bal">
          <span>当前积分</span>
          <b>{balance.toLocaleString()}</b>
        </div>
        <button className={'rd-bar-btn' + (canBuy ? '' : ' is-off')} type="button" onClick={goCheckout}>
          {ctaText}
        </button>
      </div>
    </div>
  )
}
