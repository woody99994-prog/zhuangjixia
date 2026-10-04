import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconTrash, IconPlus } from '../components/Icons.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
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
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [flash, setFlash] = useState('')
  const [pending, setPending] = useState(null)
  const [removing, setRemoving] = useState(false)

  const load = useCallback((pg = 1, append = false) => {
    let alive = true
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    api
      .get('my/posts?page=' + pg + '&pageSize=20')
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

  // 删除前先弹确认：帖子删掉不可恢复，避免误触
  const askRemove = (p) => setPending(p)

  const remove = async (p) => {
    setRemoving(true)
    const backup = items
    // 确认后先关弹层，再从列表里移除，避免删失败回滚时闪一下
    try {
      await api.del('my/posts/' + p.id)
      setItems((prev) => prev.filter((x) => x.id !== p.id))
      setFlash('已删除')
      setTimeout(() => setFlash(''), 2200)
    } catch (e) {
      setItems(backup)
      setFlash((e && e.message) || '删除失败')
      setTimeout(() => setFlash(''), 2200)
    } finally {
      setRemoving(false)
      setPending(null)
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
          <span className="sp-count">{total || items.length} 条</span>
        )}
      </div>

      {flash && <div className="sp-flash">{flash}</div>}

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">还没有发布过内容</div>
        ) : (
          <>
            {items.map((p) => (
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
                onClick={() => askRemove(p)}
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

      <ConfirmDialog
        open={!!pending}
        title="删除这篇帖子？"
        desc={
          (pending ? `《${pending.title || '未命名'}》` : '') +
          '删除后不可恢复，帖子下的评论、点赞会一并清除。若帖子插入过抽奖，抽奖会保留并解绑，可再插到其他帖子。'
        }
        confirmText="删除"
        busy={removing}
        onCancel={() => setPending(null)}
        onConfirm={() => remove(pending)}
      />
    </div>
  )
}
