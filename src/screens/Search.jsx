import { useState, useEffect, useCallback } from 'react'
import {
  IconSearch,
  IconUser,
  IconPencil,
  IconBook,
  IconChip,
  IconChevron,
} from '../components/Icons.jsx'
import { api } from '../apiClient.js'

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'user', label: '用户' },
  { key: 'post', label: '帖子' },
  { key: 'article', label: '文章' },
  { key: 'config', label: '配置' },
]

const KIND_META = {
  user: { label: '用户', Icon: IconUser, tone: 'qi-blue' },
  post: { label: '帖子', Icon: IconPencil, tone: 'qi-green' },
  article: { label: '文章', Icon: IconBook, tone: 'qi-amber' },
  config: { label: '配置', Icon: IconChip, tone: 'qi-purple' },
}

// 08 全局搜索结果屏
export default function Search({ initialKeyword = '', initialType = 'all', onBack, onOpenProduct, onOpenArticle }) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [type, setType] = useState(initialType)
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState(null)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searched, setSearched] = useState(false)

  const runSearch = useCallback(
    async (kw, t, pg = 1, append = false) => {
      const q = String(kw || '').trim()
      if (!q) {
        setGroups(null)
        setItems([])
        setTotal(0)
        setSearched(false)
        return
      }
      setLoading(true)
      try {
        const qs =
          t === 'all'
            ? `search?type=all&keyword=${encodeURIComponent(q)}`
            : `search?type=${t}&keyword=${encodeURIComponent(q)}&page=${pg}&pageSize=20`
        const d = await api.get(qs, { auth: false })
        setSearched(true)
        if (t === 'all') {
          setGroups(d && d.groups ? d.groups : { user: [], post: [], article: [], config: [] })
        } else {
          const list = d && d.items ? d.items : []
          setItems(append ? [...items, ...list] : list)
          setTotal(d && typeof d.total === 'number' ? d.total : list.length)
        }
        if (pg === 1) setPage(1)
      } catch {
        setGroups(null)
        setItems([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [items],
  )

  // 初次进入：用外部传入的关键词/类型立即检索一次
  useEffect(() => {
    if (initialKeyword && initialKeyword.trim()) {
      runSearch(initialKeyword, initialType, 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onTypeChange = (t) => {
    setType(t)
    setPage(1)
    runSearch(keyword, t, 1)
  }

  const onSubmit = () => {
    setPage(1)
    runSearch(keyword, type, 1)
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    runSearch(keyword, type, next, true)
  }

  const renderHit = (h, i) => {
    const meta = KIND_META[h.kind] || { label: h.kind, Icon: IconSearch, tone: 'qi-blue' }
    const Ico = meta.Icon
    const clickable = h.kind === 'article' || h.kind === 'post' || h.kind === 'config'
    const openTarget = h.kind === 'config' ? onOpenProduct : onOpenArticle
    const onClick =
      clickable && openTarget
        ? () => openTarget({ kind: h.kind, id: String(h.id), ...h })
        : undefined
    return (
      <div
        className={'sr-item' + (clickable ? ' is-click' : '')}
        key={h.kind + '-' + h.id + '-' + i}
        onClick={onClick}
      >
        <span className={'sr-thumb ' + meta.tone}>
          {h.coverUrl ? (
            <img src={h.coverUrl} alt="" />
          ) : (
            <Ico size={26} color="currentColor" strokeWidth={1.8} />
          )}
        </span>
        <div className="sr-info">
          <div className="sr-title">{h.title}</div>
          {h.subtitle ? <div className="sr-sub">{h.subtitle}</div> : null}
          <div className="sr-foot">
            <span className="sr-kind">{meta.label}</span>
            <span className="sr-meta">{h.meta}</span>
          </div>
        </div>
        <IconChevron size={16} color="#c2c7cf" strokeWidth={2} />
      </div>
    )
  }

  const renderGroup = (key) => {
    const list = (groups && groups[key]) || []
    if (!list.length) return null
    const meta = KIND_META[key]
    return (
      <div className="sr-group" key={key}>
        <div className="sr-gh">
          <span className={'sr-gh-ic ' + meta.tone}>
            <meta.Icon size={15} color="currentColor" strokeWidth={2} />
          </span>
          {meta.label}
          <span className="sr-gh-n">{list.length}</span>
        </div>
        {list.map((h, i) => renderHit(h, i))}
      </div>
    )
  }

  const emptyHint =
    searched && !loading
      ? `未找到与“${keyword}”相关的${type === 'all' ? '内容' : TABS.find((t) => t.key === type).label}`
      : '输入关键词，搜索用户 / 帖子 / 文章 / 配置'

  return (
    <div className="search">
      <div className="sr-top">
        <button type="button" className="sr-back" aria-label="返回" onClick={onBack}>
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <div className="sr-bar">
          <IconSearch size={17} color="#ADB5BF" strokeWidth={1.9} />
          <input
            className="sr-input"
            placeholder="搜索用户 / 帖子 / 文章 / 配置"
            value={keyword}
            autoFocus
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit()
            }}
          />
        </div>
        <button type="button" className="sr-go" onClick={onSubmit}>
          搜索
        </button>
      </div>

      <div className="sr-seg">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            className={'sr-tab' + (type === t.key ? ' is-active' : '')}
            onClick={() => onTypeChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sr-body">
        {loading ? (
          <div className="sr-empty">搜索中…</div>
        ) : type === 'all' ? (
          groups ? (
            groups.user.length + groups.post.length + groups.article.length + groups.config.length ===
            0 ? (
              <div className="sr-empty">{emptyHint}</div>
            ) : (
              ['user', 'post', 'article', 'config'].map((k) => renderGroup(k))
            )
          ) : (
            <div className="sr-empty">{emptyHint}</div>
          )
        ) : items.length === 0 ? (
          <div className="sr-empty">{emptyHint}</div>
        ) : (
          <>
            {items.map((h, i) => renderHit(h, i))}
            {page * 20 < total && (
              <button type="button" className="sr-more" onClick={loadMore}>
                加载更多
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
