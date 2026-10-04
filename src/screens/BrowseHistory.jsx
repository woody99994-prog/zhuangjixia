import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconTrash } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { relTime } from '../format.js'

const TYPE_LABEL = { plan: '整机方案', post: '帖子', article: '文章' }

// 浏览足迹：看过的内容自动留痕（详情页进入即记录），可单条删或清空
export default function BrowseHistory({ onBack, onOpenArticle }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [flash, setFlash] = useState('')

  const load = useCallback((pg = 1, append = false) => {
    let alive = true
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    api
      .get('my/history?page=' + pg + '&pageSize=20')
      .then((d) => {
        if (!alive) return
        const list = (d && d.items) || []
        const t = d && typeof d.total === 'number' ? d.total : list.length
        setItems(append ? (prev) => [...prev, ...list] : list)
        setTotal(t)
        setPage(pg)
      })
      .catch(() => {
        if (!alive) return
        if (!append) setItems([])
      })
      .finally(() => {
        if (!alive) return
        if (pg === 1) setLoading(false)
        else setLoadingMore(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const loadMore = () => {
    if (loadingMore) return
    load(page + 1, true)
  }

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [load])

  const remove = async (h) => {
    const backup = items
    setItems((prev) => prev.filter((x) => x.id !== h.id))
    try {
      await api.del('my/history/' + h.id)
    } catch {
      setItems(backup)
    }
  }

  const clearAll = async () => {
    const backup = items
    if (backup.length === 0) return
    setItems([])
    try {
      await api.del('my/history')
      setFlash('已清空浏览足迹')
    } catch {
      setItems(backup)
      setFlash('清空失败')
    }
    setTimeout(() => setFlash(''), 2200)
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">浏览足迹</span>
        <button className="sp-act" type="button" onClick={clearAll} disabled={items.length === 0}>
          清空
        </button>
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">还没有浏览记录</div>
        ) : (
          <>
            {items.map((h) => (
            <div className="fav-item" key={h.id}>
              <div
                className="fav-main"
                onClick={() => {
                  if (!onOpenArticle) return
                  const kind = h.targetType === 'post' ? 'post' : 'article'
                  if (kind === 'post' || h.targetType === 'article')
                    onOpenArticle({
                      kind,
                      id: String(h.targetId),
                      title: h.title,
                      coverUrl: h.coverUrl,
                    })
                }}
                role="button"
                tabIndex={0}
              >
                {h.coverUrl && (
                  <div className="fav-thumb">
                    <img src={h.coverUrl} alt="" />
                  </div>
                )}
                <div className="fav-info">
                  <div className="fav-title">{h.title}</div>
                  <div className="fav-meta">
                    <span className="chip-soft">{TYPE_LABEL[h.targetType] || h.targetType}</span>
                    <span>{relTime(h.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                className="fav-del"
                type="button"
                aria-label="删除该记录"
                onClick={() => remove(h)}
              >
                <IconTrash size={16} color="var(--muted)" strokeWidth={1.9} />
              </button>
            </div>
            ))}
            {items.length < total && (
              <button className="sr-more" type="button" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? '加载中…' : '加载更多'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
