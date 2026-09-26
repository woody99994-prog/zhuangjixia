import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconTrash, IconPlus } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { relTime } from '../format.js'

const STATUS_LABEL = {
  published: '已发布',
  pending: '审核中',
  draft: '草稿',
  rejected: '未通过',
}

// 我的发布：自己发过的帖子，可删除、可点开看详情
export default function MyPosts({ onBack, onOpenArticle, onCompose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState('')

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    api
      .get('my/posts?pageSize=50')
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

  const remove = async (p) => {
    const backup = items
    setItems((prev) => prev.filter((x) => x.id !== p.id))
    try {
      await api.del('my/posts/' + p.id)
      setFlash('已删除')
      setTimeout(() => setFlash(''), 2200)
    } catch (e) {
      setItems(backup)
      setFlash((e && e.message) || '删除失败')
      setTimeout(() => setFlash(''), 2200)
    }
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">我的发布</span>
        {onCompose ? (
          <button className="sp-act" type="button" onClick={onCompose}>
            <IconPlus size={15} color="var(--brand)" strokeWidth={2.2} />
            <span>发帖</span>
          </button>
        ) : (
          <span className="sp-count">{items.length} 条</span>
        )}
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">还没有发布过内容</div>
        ) : (
          items.map((p) => (
            <div className="myp-item" key={p.id}>
              <div
                className="myp-main"
                onClick={() => onOpenArticle && onOpenArticle({ kind: 'post', id: String(p.id), ...p })}
                role="button"
                tabIndex={0}
              >
                <div className="myp-title">{p.title}</div>
                {p.summary && <div className="myp-sum">{p.summary}</div>}
                <div className="myp-meta">
                  <span className={'myp-status s-' + (p.status || 'published')}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                  <span>{p.viewCount || 0} 浏览</span>
                  <span>{p.likeCount || 0} 赞</span>
                  <span>{relTime(p.publishedAt || p.createdAt)}</span>
                </div>
              </div>
              <button
                className="myp-del"
                type="button"
                aria-label="删除该内容"
                onClick={() => remove(p)}
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
