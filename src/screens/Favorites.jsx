import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconTrash } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { relTime, yuan } from '../format.js'

const TYPE_LABEL = { plan: '整机方案', post: '帖子', article: '文章', config: '配置' }

// 我的收藏：列表 / 取消收藏 / 点开内容
export default function Favorites({ onBack, onOpenArticle }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    api
      .get('my/favorites?pageSize=50')
      .then((d) => alive && setItems((d && d.items) || []))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [load])

  const remove = async (f) => {
    const backup = items
    setItems((prev) => prev.filter((x) => x.id !== f.id))
    try {
      await api.del('my/favorites/' + f.id)
    } catch {
      setItems(backup)
    }
  }

  const open = (f) => {
    if (!onOpenArticle) return
    if (f.targetType === 'post' || f.targetType === 'article') {
      onOpenArticle({
        kind: f.targetType,
        id: String(f.targetId),
        title: f.title,
        coverUrl: f.coverUrl,
      })
    }
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">我的收藏</span>
        <span className="sp-count">{items.length} 条</span>
      </div>

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">还没有收藏，去内容页点「收藏」试试</div>
        ) : (
          items.map((f) => (
            <div className="fav-item" key={f.id}>
              <div
                className="fav-main"
                onClick={() => open(f)}
                role={f.targetType === 'post' || f.targetType === 'article' ? 'button' : undefined}
                tabIndex={0}
              >
                {f.coverUrl && (
                  <div className="fav-thumb">
                    <img src={f.coverUrl} alt="" />
                  </div>
                )}
                <div className="fav-info">
                  <div className="fav-title">{f.title}</div>
                  {f.summary && <div className="fav-sum">{f.summary}</div>}
                  <div className="fav-meta">
                    <span className="chip-soft">{TYPE_LABEL[f.targetType] || f.targetType}</span>
                    {f.priceCents ? <b className="fav-price">{yuan(f.priceCents)}</b> : null}
                    <span>{relTime(f.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                className="fav-del"
                type="button"
                aria-label="取消收藏"
                onClick={() => remove(f)}
              >
                <IconTrash size={16} color="var(--muted)" strokeWidth={1.9} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
