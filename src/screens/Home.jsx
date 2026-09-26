import { useState, useRef, useEffect, useCallback } from 'react'
import {
  IconChip,
  IconSearch,
  IconSliders,
  IconBook,
  IconUser,
  IconPencil,
  IconSwap,
  IconBolt,
  IconHeart,
  IconChevron,
} from '../components/Icons.jsx'
import { quickEntries } from '../data.js'
import { api } from '../apiClient.js'
import { yuan } from '../format.js'

const QUICK_ICONS = { chip: IconChip, book: IconBook, swap: IconSwap, bolt: IconBolt }
const FALLBACK_BANNER = 'linear-gradient(135deg, #0D245C 0%, #1476AD 55%, #2199FF 100%)'

// 搜索筛选维度：全部 / 用户 / 帖子 / 文章 / 配置
const FILTERS = [
  { key: 'all', label: '全部', Icon: IconSearch },
  { key: 'user', label: '用户', Icon: IconUser },
  { key: 'post', label: '帖子', Icon: IconPencil },
  { key: 'article', label: '文章', Icon: IconBook },
  { key: 'config', label: '配置', Icon: IconChip },
]

// 02 首页
export default function Home({ onOpenEntry, onOpenSearch }) {
  const [banners, setBanners] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  // 全局搜索：关键词 + 当前筛选维度 + 筛选弹层开关
  const [kw, setKw] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const doSearch = useCallback(() => {
    if (!onOpenSearch) return
    onOpenSearch(kw.trim(), filterType)
    setFilterOpen(false)
  }, [kw, filterType, onOpenSearch])

  const pickFilter = (key) => {
    setFilterType(key)
    if (onOpenSearch) onOpenSearch(kw.trim(), key)
    setFilterOpen(false)
  }

  // 轮播：当前激活索引 + 自动轮播
  const [active, setActive] = useState(0)
  const trackRef = useRef(null)
  const activeRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [b, p] = await Promise.all([
          api.get('banners', { auth: false }),
          api.get('plans?pageSize=20', { auth: false }),
        ])
        if (!alive) return
        setBanners(Array.isArray(b) ? b : [])
        setPlans(p && p.items ? p.items : [])
      } catch (e) {
        if (!alive) return
        setBanners([])
        setPlans([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const goTo = useCallback((i) => {
    const el = trackRef.current
    const len = banners.length || 1
    const idx = (i + len) % len
    if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    activeRef.current = idx
    setActive(idx)
  }, [banners.length])

  // 自动轮播：每次切到新图都重置计时，与进度条动画对齐
  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => {
      goTo((activeRef.current + 1) % banners.length)
    }, 3500)
    return () => clearInterval(timerRef.current)
  }, [active, goTo, banners.length])

  const onScroll = (e) => {
    const el = e.currentTarget
    const len = banners.length || 1
    const i = Math.round(el.scrollLeft / el.clientWidth)
    const idx = (i + len) % len
    if (idx !== activeRef.current) {
      activeRef.current = idx
      setActive(idx)
    }
  }

  return (
    <div className="home">
      <div className="banner-section">
        <div className="banner-carousel" ref={trackRef} onScroll={onScroll}>
          {banners.length === 0 ? (
            <div className="banner" style={{ background: FALLBACK_BANNER }}>
              <div className="banner-art">
                <IconChip size={112} color="rgba(255,255,255,0.13)" strokeWidth={1.1} />
              </div>
              <span className="banner-chip">精选</span>
              <h3 className="banner-title">{loading ? '加载中…' : '暂无轮播'}</h3>
              <p className="banner-sub" />
            </div>
          ) : (
            banners.map((b, bi) => (
              <div
                className="banner"
                key={b.id ?? bi}
                style={
                  b.imageUrl
                    ? {
                        backgroundImage: `url(${b.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : { background: FALLBACK_BANNER }
                }
              >
                <div className="banner-art">
                  <IconChip size={112} color="rgba(255,255,255,0.13)" strokeWidth={1.1} />
                </div>
                <span className="banner-chip">精选</span>
                <h3 className="banner-title">{b.title}</h3>
                <p className="banner-sub">{b.subtitle || ''}</p>
                <div className="banner-dots">
                  {banners.map((_, di) => (
                    <i
                      key={di}
                      className={di === active ? 'on' : ''}
                      onClick={() => goTo(di)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {banners.length > 1 && (
          <>
            <button
              className="banner-arrow prev"
              type="button"
              aria-label="上一张"
              onClick={() => goTo(active - 1)}
            >
              <IconChevron size={20} color="#fff" strokeWidth={2.4} />
            </button>
            <button
              className="banner-arrow next"
              type="button"
              aria-label="下一张"
              onClick={() => goTo(active + 1)}
            >
              <IconChevron size={20} color="#fff" strokeWidth={2.4} />
            </button>
            <div className="banner-counter">
              {active + 1} / {banners.length}
            </div>
          </>
        )}
      </div>

      <div className="searchbar">
        <IconSearch
          size={18}
          color="#ADB5BF"
          strokeWidth={1.9}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={doSearch}
        />
        <input
          className="search-input"
          placeholder="搜索用户 / 帖子 / 文章 / 配置"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') doSearch()
          }}
        />
        <button
          type="button"
          className={'search-filter' + (filterOpen ? ' on' : '')}
          aria-label="筛选搜索范围"
          onClick={() => setFilterOpen((v) => !v)}
        >
          <IconSliders size={18} color="#1C7DFF" strokeWidth={1.9} />
        </button>
      </div>

      {filterOpen && (
        <div className="search-filter-pop">
          {FILTERS.map((f) => {
            const Ico = f.Icon
            return (
              <button
                type="button"
                key={f.key}
                className={'sf-chip' + (filterType === f.key ? ' is-active' : '')}
                onClick={() => pickFilter(f.key)}
              >
                <Ico size={16} color="currentColor" strokeWidth={2} />
                {f.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="quick">
        {quickEntries.map((q) => {
          const Ico = QUICK_ICONS[q.icon]
          return (
            <button
              type="button"
              className="quick-item"
              key={q.label}
              onClick={() => onOpenEntry && onOpenEntry(q.icon)}
            >
              <span className={'quick-ic qi-' + q.tone}>
                <Ico size={26} strokeWidth={1.9} />
              </span>
              <span className="quick-label">{q.label}</span>
            </button>
          )
        })}
      </div>

      <div className="sec-head">
        <h2>为你推荐</h2>
        <span className="sec-more">
          更多
          <IconChevron size={13} color="#8A8F99" strokeWidth={2} />
        </span>
      </div>

      <div className="rec-list">
        {plans.length === 0 ? (
          <div className="rec-empty">{loading ? '加载中…' : '暂无推荐方案'}</div>
        ) : (
          plans.map((p) => (
            <div className="rec-card" key={p.id}>
              <span
                className="rec-thumb"
                style={
                  p.coverUrl
                    ? {
                        backgroundImage: `url(${p.coverUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : { background: FALLBACK_BANNER }
                }
              >
                <IconChip size={40} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
              </span>
              <div className="rec-info">
                <div className="rec-title">{p.title}</div>
                <div className="rec-tags">
                  {(p.tagsJson || []).map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="rec-price">{yuan(p.priceCents)}</div>
              </div>
              <IconHeart size={20} color="#ADB5BF" strokeWidth={1.9} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
