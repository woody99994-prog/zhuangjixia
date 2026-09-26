import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconBell, IconTrash } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { relTime } from '../format.js'

const TYPE_LABEL = {
  system: '系统通知',
  like: '收到的赞',
  comment: '评论',
  follow: '关注',
  content: '内容动态',
}

// 消息中心：列表 / 标记已读 / 删除 / 全部已读
export default function Messages({ onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  const load = useCallback(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      api.get('my/messages?pageSize=50'),
      api.get('my/messages/unread-count'),
    ])
      .then(([d, u]) => {
        if (!alive) return
        setItems((d && d.items) || [])
        setUnread((u && u.unread) || 0)
      })
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

  const markRead = async (m) => {
    if (m.isRead) return
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, isRead: true } : x)))
    setUnread((n) => Math.max(0, n - 1))
    try {
      await api.post('my/messages/' + m.id + '/read', {})
    } catch {
      /* 已读失败不回滚，下次进入会重新标记 */
    }
  }

  const readAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
    setUnread(0)
    try {
      await api.post('my/messages/read-all')
    } catch {
      /* ignore */
    }
  }

  const remove = async (m) => {
    const backup = items
    setItems((prev) => prev.filter((x) => x.id !== m.id))
    if (!m.isRead) setUnread((n) => Math.max(0, n - 1))
    try {
      await api.del('my/messages/' + m.id)
    } catch {
      setItems(backup)
      load()
    }
  }

  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">消息中心</span>
        <button className="sp-act" type="button" onClick={readAll} disabled={unread === 0}>
          全部已读
        </button>
      </div>

      <div className="sp-sub">未读 {unread} 条</div>

      <div className="sp-body">
        {loading ? (
          <div className="sp-empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="sp-empty">暂无消息</div>
        ) : (
          items.map((m) => (
            <div
              className={'msg-item' + (m.isRead ? '' : ' is-unread')}
              key={m.id}
              onClick={() => markRead(m)}
              role="button"
              tabIndex={0}
            >
              <span className="msg-ic">
                <IconBell size={18} color="#1C7DFF" strokeWidth={1.9} />
              </span>
              <div className="msg-main">
                <div className="msg-title-row">
                  <span className="msg-title">{m.title}</span>
                  <button
                    className="msg-del"
                    type="button"
                    aria-label="删除该消息"
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(m)
                    }}
                  >
                    <IconTrash size={15} color="var(--muted)" strokeWidth={1.9} />
                  </button>
                </div>
                <div className="msg-content">{m.content}</div>
                <div className="msg-meta">
                  <span className="msg-type">{TYPE_LABEL[m.type] || '通知'}</span>
                  <span>{relTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
