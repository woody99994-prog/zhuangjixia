/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from 'react'
import { IconChevron, IconHeart, IconStar, IconSend, IconCheck, SlotIcon } from '../components/Icons.jsx'
import { api, getUser } from '../apiClient.js'
import PostLottery from '../components/PostLottery.jsx'
import { rowsToPlan, planTotalYuan, isConfigTable, slotKeyFromCell, priceFromCell } from '../configTable.js'
import { relTime } from '../format.js'


// 配置表默认只露出前 5 行，其余用渐隐遮住——想看全部再点「查看全部」
const TABLE_PREVIEW_ROWS = 5

// 解析轻量 Markdown：标题 / 引用 / 图片 / 表格 / 段落
// 表格用于「配置表」：| 配件 | 型号 | 价格 |
function parseMd(md) {
  if (!md) return []
  const blocks = []
  let table = null
  const flush = () => {
    if (table && table.length) blocks.push({ type: 'table', rows: table })
    table = null
  }
  for (const raw of String(md).split('\n')) {
    const line = raw.trim()
    if (line.startsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
      // 跳过 | --- | --- | 分隔行
      if (!/^:?-{2,}:?$/.test(cells[0] || '')) {
        if (!table) table = []
        table.push(cells)
      }
      continue
    }
    flush()
    const img = line.match(/^!\[(.*?)\]\((.*?)\)/)
    if (img) {
      blocks.push({ type: 'img', alt: img[1], url: img[2] })
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'h2', text: line.slice(2).trim() })
    } else if (line.startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.slice(2).trim() })
    } else if (line.trim() !== '') {
      blocks.push({ type: 'p', text: line })
    }
  }
  flush()
  return blocks
}

function formatDate(d) {
  if (!d) return ''
  try {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
      dt.getDate(),
    ).padStart(2, '0')}`
  } catch {
    return ''
  }
}

// 头像：有图用图，没有就用昵称首字（不依赖外部占位图服务）
function Avatar({ url, name, className }) {
  return (
    <span className={className}>
      {url ? <img src={url} alt="" /> : <em>{(name || '游')[0]}</em>}
    </span>
  )
}

// 文章 / 帖子详情页：返回 / 标题 / 作者 / 正文（封面图在顶部 + 配置表半遮掩）/ 评论区 / 底部评论框
export default function ArticleDetail({ article, onBack, onOpenUser }) {
  const [data, setData] = useState(article || {})
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [flash, setFlash] = useState('')
  const [savedCfg, setSavedCfg] = useState(false)
  // 已展开的配置表（按 block 下标记录）
  const [openTables, setOpenTables] = useState({})
  // 评论区
  const [cms, setCms] = useState([])
  const [cmTotal, setCmTotal] = useState(0)
  const [cmLoading, setCmLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingDel, setPendingDel] = useState(null)
  // 评论排序：hot=最热（点赞多的排最前）/ new=最新
  const [cmSort, setCmSort] = useState('hot')
  // 正在回复的目标评论：{ id, nickname }
  const [replyTo, setReplyTo] = useState(null)
  // 每条评论的回复默认折叠（最多露 6 条），按评论 id 记录是否展开
  const [replyExpand, setReplyExpand] = useState({})
  const toggleReplyExpand = (cid) =>
    setReplyExpand((s) => ({ ...s, [cid]: !s[cid] }))

  const kind = (article && article.kind) || 'article'
  const id = article && article.id
  const targetType = kind === 'post' ? 'post' : 'article'
  const tags = data.tags || (data.extra && data.extra.tags) || []
  const myId = (() => {
    const u = getUser()
    return u && u.id != null ? String(u.id) : ''
  })()

  const toast = useCallback((msg) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2400)
  }, [])

  useEffect(() => {
    if (!id) return
    if (data && data.contentMd) return
    let alive = true
    setLoading(true)
    const path = kind === 'post' ? 'posts/' + id : 'articles/' + id
    api
      .get(path, { auth: false })
      .then((d) => alive && setData((prev) => ({ ...prev, ...d })))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 评论列表（匿名可读）：只有帖子有评论，文章详情不请求
  const loadComments = useCallback(() => {
    if (!id || kind !== 'post') return () => {}
    let alive = true
    setCmLoading(true)
    api
      .get('posts/' + id + '/comments?sort=' + cmSort + '&pageSize=50', { auth: false })
      .then((d) => {
        if (!alive) return
        setCms(d && d.items ? d.items : [])
        setCmTotal((d && d.total) || 0)
      })
      .catch(() => alive && setCms([]))
      .finally(() => alive && setCmLoading(false))
    return () => {
      alive = false
    }
  }, [id, kind, cmSort])

  useEffect(() => {
    const cancel = loadComments()
    return cancel
  }, [loadComments])

  // 进入详情 = 记一条浏览足迹；并回查是否已收藏
  useEffect(() => {
    if (!id) return
    let alive = true
    api
      .get('my/favorites?pageSize=100')
      .then((d) => {
        if (!alive) return
        const hit = (d && d.items ? d.items : []).some(
          (f) => f.targetType === targetType && String(f.targetId) === String(id),
        )
        setCollected(hit)
      })
      .catch(() => {})
    api
      .post('my/history', {
        targetType,
        targetId: id,
        title: (article && article.title) || data.title || '',
        coverUrl: (article && article.coverUrl) || data.coverUrl || '',
      })
      .catch(() => {})
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const blocks = parseMd(data.contentMd)
  const likeCount = data.likeCount || (data.extra && data.extra.likeCount) || 0
  const viewCount = data.viewCount || 0
  const showComments = kind === 'post'

  // 作者信息：列表进入时 article 自带 author；直接打开详情时由 GET posts/:id 返回 author
  const authorId =
    data.authorId != null
      ? String(data.authorId)
      : data.author && data.author.id != null
        ? String(data.author.id)
        : ''
  const authorName = (data.author && data.author.nickname) || data.authorName || '装机匣'
  const authorAvatar = (data.author && data.author.avatarUrl) || ''

  const toggleCollect = async () => {
    if (!id) return
    if (collected) {
      setCollected(false)
      try {
        await api.del('my/favorites/target/' + targetType + '/' + id)
      } catch {
        setCollected(true)
        toast('取消收藏失败，稍后再试')
      }
      return
    }
    setCollected(true)
    try {
      await api.post('my/favorites', {
        targetType,
        targetId: id,
        title: data.title || '',
        coverUrl: data.coverUrl || '',
        summary: data.summary || '',
      })
    } catch {
      setCollected(false)
      toast('收藏失败，稍后再试')
    }
  }

  // 把正文里的配置表存成「我的配置」
  const saveTableAsConfig = async (rows) => {
    const plan = rowsToPlan(rows)
    if (!Object.keys(plan).length) {
      toast('这张表不是配置清单格式，无法存入')
      return
    }
    try {
      await api.post('my/configs', {
        title: (data.title || '收藏的配置') + ' · 配置清单',
        planJson: plan,
        totalPriceCents: Math.round(planTotalYuan(plan) * 100),
        remark: '来自内容详情的配置表',
      })
      setSavedCfg(true)
      toast('已存入「我的配置」')
    } catch (e) {
      toast((e && e.message) || '存入失败')
    }
  }

  // 对一个评论（或某条回复）做原地更新，返回新的 cms 数组
  const patchComment = (list, cid, updater) =>
    list.map((c) => {
      if (String(c.id) === String(cid)) return updater(c)
      if (Array.isArray(c.replies)) {
        let hit = false
        const replies = c.replies.map((r) => {
          if (String(r.id) === String(cid)) {
            hit = true
            return updater(r)
          }
          return r
        })
        if (hit) return { ...c, replies }
      }
      return c
    })

  // 最热排序：仅对顶层评论按点赞数降序，稳定排序保留并列顺序（回复内部顺序不动）
  const resortHot = (list) => [...list].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))

  // 评论点赞：乐观更新，失败用原快照回滚（后端是幂等切换，再点一次即取消）。
  // 既能定位顶层评论，也能定位某条回复（之前只查顶层导致回复点赞失效）。
  // 顶层评论在「最热」tab 下点赞成功后，立即按最新点赞数重排。
  const toggleLike = async (cid) => {
    let found = null
    for (const c of cms) {
      if (String(c.id) === String(cid)) {
        found = c
        break
      }
      if (Array.isArray(c.replies)) {
        const r = c.replies.find((x) => String(x.id) === String(cid))
        if (r) {
          found = r
          break
        }
      }
    }
    if (!found) return
    const next = !found.isLiked
    const snapshot = cms
    setCms((list) =>
      patchComment(list, cid, (n) => ({
        ...n,
        isLiked: next,
        likeCount: Math.max(0, (n.likeCount || 0) + (next ? 1 : -1)),
      }))
    )
    try {
      const r = await api.post('my/comments/' + cid + '/like')
      // 以服务端返回的计数为准，避免并发时本地算错；最热 tab 下即时重排顶层
      setCms((list) => {
        const updated = patchComment(list, cid, (n) => ({
          ...n,
          likeCount: r && typeof r.likeCount === 'number' ? r.likeCount : n.likeCount,
          isLiked: r ? !!r.liked : n.isLiked,
        }))
        if (cmSort === 'hot') return resortHot(updated)
        return updated
      })
    } catch (e) {
      setCms(snapshot)
      toast((e && e.message) || '点赞失败，请重试')
    }
  }

  // 帖子 / 文章主赞：真实接入后端（POST /my/{type}s/:id/like 幂等切换）
  const togglePostLike = async () => {
    if (!id) return
    const next = !liked
    const snapshot = liked
    setLiked(next)
    try {
      const r = await api.post('my/' + targetType + 's/' + id + '/like')
      setLiked(!!r.liked)
      if (typeof r.likeCount === 'number') setData((prev) => ({ ...prev, likeCount: r.likeCount }))
    } catch (e) {
      setLiked(snapshot)
      toast((e && e.message) || '操作失败，请重试')
    }
  }
  // 进入详情即回查当前用户是否已点赞，避免刷新后本地态丢失
  useEffect(() => {
    if (!id) return
    let alive = true
    api.get('my/' + targetType + 's/' + id + '/like')
      .then((d) => alive && setLiked(!!(d && d.liked)))
      .catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 发表评论 / 回复：统一走同一个输入框，回复时带上 parentId
  const sendComment = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    const target = replyTo
    try {
      await api.post('my/comments', {
        postId: id,
        content: text,
        ...(target ? { parentId: target.id } : {})
      })
      setDraft('')
      setReplyTo(null)
      toast(target ? '回复已发布' : '评论已发布')
      loadComments()
    } catch (e) {
      toast((e && e.message) || '评论发送失败')
    } finally {
      setSending(false)
    }
  }

  const removeComment = async (cid) => {
    const prev = cms
    setCms((list) => list.filter((c) => String(c.id) !== String(cid)))
    setCmTotal((t) => Math.max(0, t - 1))
    setPendingDel(null)
    try {
      await api.del('my/comments/' + cid)
    } catch (e) {
      setCms(prev)
      setCmTotal((t) => t + 1)
      toast((e && e.message) || '删除失败，请重试')
    }
  }

  return (
    <div className="ad">
      <div className="ad-top">
        <button className="ad-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.4} />
        </button>
        <span className="ad-top-title">{kind === 'post' ? '帖子详情' : '文章详情'}</span>
      </div>

      <div className="ad-head">
        <h1 className="ad-title">{data.title}</h1>
        {/* 作者行：有作者 id 就整行可点（进 TA 的主页），没有就是普通展示 */}
        <div
          className={'ad-author' + (authorId ? ' is-clickable' : '')}
          role={authorId ? 'button' : undefined}
          tabIndex={authorId ? 0 : undefined}
          onClick={() => authorId && onOpenUser && onOpenUser(authorId)}
          onKeyDown={(e) => {
            if (authorId && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onOpenUser && onOpenUser(authorId)
            }
          }}
        >
          {authorAvatar ? (
            <img className="ad-av" src={authorAvatar} alt="" />
          ) : (
            <span className="ad-av as-fallback">{authorName.trim().charAt(0)}</span>
          )}
          <div className="ad-author-meta">
            <div className="ad-author-name">{authorName}</div>
            <div className="ad-author-sub">
              {viewCount > 0 ? `${viewCount} 阅读` : ''}
              {viewCount > 0 && formatDate(data.publishedAt || data.updatedAt) ? ' · ' : ''}
              {formatDate(data.publishedAt || data.updatedAt)}
              {showComments && cmTotal > 0 ? ` · ${cmTotal} 评论` : ''}
            </div>
          </div>
          {authorId ? (
            <span className="ad-author-chev" aria-hidden="true">
              <IconChevron size={16} strokeWidth={2} />
            </span>
          ) : null}
        </div>
        {tags.length > 0 && (
          <div className="ad-tags">
            {tags.map((t, i) => (
              <span className="chip-soft" key={i}>
                {typeof t === 'string' ? t : t.tag ? t.tag.name : t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && !data.contentMd ? (
        <div className="ad-loading">加载中…</div>
      ) : blocks.length === 0 ? (
        <p className="ad-p">{data.summary || '暂无正文内容'}</p>
      ) : (
        <div className="ad-body">
          {/* 封面图：放在文章内顶部（而不是当标题背景） */}
          {data.coverUrl && (
            <div className="ad-cover">
              <img src={data.coverUrl} alt={data.title || '封面'} />
            </div>
          )}
          {blocks.map((b, i) => {
            if (b.type === 'h2') return <h2 className="ad-h2" key={i}>{b.text}</h2>
            if (b.type === 'quote')
              return (
                <div className="ad-quote" key={i}>
                  {b.text}
                </div>
              )
            if (b.type === 'img')
              return (
                <div className="ad-img" key={i}>
                  <img src={b.url} alt={b.alt} />
                </div>
              )
            if (b.type === 'table') {
              const [head, ...body] = b.rows
              // 半遮掩：行数超过预览行数才遮，行数本来就少的表没必要点两下
              const maskable = body.length > TABLE_PREVIEW_ROWS
              const opened = !!openTables[i]
              const masked = maskable && !opened
              const rows = masked ? body.slice(0, TABLE_PREVIEW_ROWS) : body
              // 配置表：首列表头为「配件」，叠加槽位图标 + 底部总价
              const isCfg = isConfigTable(head)
              const total = isCfg
                ? body.reduce((s, row) => s + priceFromCell(row[2]), 0)
                : 0
              return (
                <div className={'ad-table-wrap' + (masked ? ' is-masked' : '') + (isCfg ? ' is-config' : '')} key={i}>
                  <div className="ad-table-clip">
                    <table className="ad-table">
                      <thead>
                        <tr>
                          {head.map((c, ci) => (
                            <th key={ci}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((c, ci) => (
                              <td key={ci}>
                                {isCfg && ci === 0 ? (
                                  <span className="ad-cfg-cell">
                                    <SlotIcon slot={slotKeyFromCell(c) || 'cpu'} size={16} />
                                    <span>{c}</span>
                                  </span>
                                ) : (
                                  c
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {masked && (
                      <button
                        type="button"
                        className="ad-table-more"
                        onClick={() => setOpenTables((s) => ({ ...s, [i]: true }))}
                      >
                        <span>查看全部 {body.length} 项配置</span>
                        <span className="ad-table-more-chev">
                          <IconChevron size={14} strokeWidth={2.2} />
                        </span>
                      </button>
                    )}
                  </div>
                  {isCfg && total > 0 && (
                    <div className="ad-cfg-total">
                      <span>配置总价</span>
                      <b>¥{total.toLocaleString('zh-CN')}</b>
                    </div>
                  )}
                  {!savedCfg && (
                    <button
                      type="button"
                      className="ad-save-cfg"
                      onClick={() => saveTableAsConfig(b.rows)}
                    >
                      <IconCheck size={15} color="currentColor" strokeWidth={2} />
                      <span>存入我的配置</span>
                    </button>
                  )}
                </div>
              )
            }
            return <p className="ad-p" key={i}>{b.text}</p>
          })}
        </div>
      )}

      {/* 帖子详情内嵌的积分抽奖模块（与配置表同层级的内容模块；仅帖子有） */}
      {showComments && id ? <PostLottery postId={String(id)} /> : null}

      {/* 评论区：只读真实数据，作者可删自己的评论 */}
      {showComments && (
        <div className="ad-cms">
          <div className="ad-cms-head">
            <h2>
              全部评论 <span>{cmTotal}</span>
            </h2>
            <div className="ad-cms-tabs">
              <button
                type="button"
                className={'ad-cms-tab' + (cmSort === 'hot' ? ' on' : '')}
                onClick={() => setCmSort('hot')}
              >
                最热
              </button>
              <button
                type="button"
                className={'ad-cms-tab' + (cmSort === 'new' ? ' on' : '')}
                onClick={() => setCmSort('new')}
              >
                最新
              </button>
            </div>
          </div>

          {cmLoading ? (
            <div className="ad-cms-empty">评论加载中…</div>
          ) : cms.length === 0 ? (
            <div className="ad-cms-empty">还没有人评论，来说两句</div>
          ) : (
            cms.map((c) => {
              const mine = !!myId && String(c.userId) === myId
              return (
                <div className="ad-cm" key={c.id}>
                  {/* 评论者头像同样可点：直接进 TA 的主页 */}
                  {c.userId && onOpenUser ? (
                    <button
                      type="button"
                      className="ad-cm-av-btn"
                      aria-label={'查看 ' + c.nickname + ' 的主页'}
                      onClick={() => onOpenUser(c.userId)}
                    >
                      <Avatar url={c.avatarUrl} name={c.nickname} className="ad-cm-av" />
                    </button>
                  ) : (
                    <Avatar url={c.avatarUrl} name={c.nickname} className="ad-cm-av" />
                  )}
                  <div className="ad-cm-main">
                    <div className="ad-cm-top">
                      <b>{c.nickname}</b>
                      {mine && <em className="ad-cm-me">我</em>}
                      <i>{relTime(c.createdAt)}</i>
                      {mine &&
                        (pendingDel === c.id ? (
                          <span className="ad-cm-acts">
                            <button type="button" onClick={() => setPendingDel(null)}>
                              取消
                            </button>
                            <button
                              type="button"
                              className="is-danger"
                              onClick={() => removeComment(c.id)}
                            >
                              确认删除
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="ad-cm-del"
                            onClick={() => setPendingDel(c.id)}
                          >
                            删除
                          </button>
                        ))}
                    </div>
                    <p className="ad-cm-text">{c.content}</p>

                    <div className="ad-cm-bar">
                      <button
                        type="button"
                        className={'ad-cm-like' + (c.isLiked ? ' is-on' : '')}
                        onClick={() => toggleLike(c.id)}
                        aria-label="点赞"
                      >
                        <IconHeart
                          size={14}
                          color={c.isLiked ? 'var(--price)' : 'var(--ink-sub)'}
                          strokeWidth={c.isLiked ? 0 : 1.8}
                          fill={c.isLiked ? 'var(--price)' : 'none'}
                        />
                        <span>{c.likeCount || ''}</span>
                      </button>
                      <button
                        type="button"
                        className="ad-cm-reply"
                        onClick={() => {
                          setReplyTo({ id: c.id, nickname: c.nickname })
                          setDraft('')
                        }}
                      >
                        回复
                      </button>
                    </div>

                    {/* 回复列表：按要求只显示昵称，不显示头像 */}
                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                      <div className="ad-cm-replies">
                        {(replyExpand[c.id] ? c.replies : c.replies.slice(0, 6)).map((r) => {
                          const replyMine = !!myId && String(r.userId) === myId
                          return (
                            <div className="ad-cm-re" key={r.id}>
                              <b className="ad-cm-re-name">{r.nickname}</b>
                              {r.replyToNickname ? (
                                <span className="ad-cm-re-to">回复 @{r.replyToNickname}</span>
                              ) : null}
                              <span className="ad-cm-re-text">{r.content}</span>
                              <i className="ad-cm-re-time">{relTime(r.createdAt)}</i>
                              <span className="ad-cm-re-acts">
                                <button
                                  type="button"
                                  className={'ad-cm-like' + (r.isLiked ? ' is-on' : '')}
                                  onClick={() => toggleLike(r.id)}
                                >
                                  <IconHeart
                                    size={13}
                                    color={r.isLiked ? 'var(--price)' : 'var(--ink-sub)'}
                                    strokeWidth={r.isLiked ? 0 : 1.8}
                                    fill={r.isLiked ? 'var(--price)' : 'none'}
                                  />
                                  <span>{r.likeCount || ''}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyTo({ id: r.id, nickname: r.nickname })
                                    setDraft('')
                                  }}
                                >
                                  回复
                                </button>
                                {replyMine && (
                                  <button
                                    type="button"
                                    className="is-danger"
                                    onClick={() => removeComment(r.id)}
                                  >
                                    删除
                                  </button>
                                )}
                              </span>
                            </div>
                          )
                        })}
                        {c.replies.length > 6 && (
                          <button
                            type="button"
                            className="ad-cm-re-more"
                            onClick={() => toggleReplyExpand(c.id)}
                          >
                            {replyExpand[c.id]
                              ? '收起回复'
                              : `查看更多 ${c.replies.length - 6} 条回复`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {flash && <div className="ad-flash">{flash}</div>}

      <div className="ad-actions">
        {showComments ? (
          <>
            {replyTo && (
              <div className="ad-reply-bar">
                <span>
                  回复 <b>{replyTo.nickname}</b>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null)
                    setDraft('')
                  }}
                >
                  取消
                </button>
              </div>
            )}
            <div className="ad-input">
              <input
                className="ad-input-field"
                placeholder={replyTo ? '回复 @' + replyTo.nickname : '说点什么...'}
                value={draft}
                maxLength={1000}
                disabled={sending}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendComment()
                  }
                }}
              />
              <button
                type="button"
                className="ad-send"
                disabled={!draft.trim() || sending}
                onClick={sendComment}
                aria-label="发送评论"
              >
                <IconSend size={16} color="currentColor" strokeWidth={1.9} />
              </button>
            </div>
          </>
        ) : (
          <div className="ad-input is-plain">
            <span className="ad-input-field as-text">文章不支持评论</span>
          </div>
        )}
        <button
          type="button"
          className={'ad-act' + (liked ? ' is-on' : '')}
          onClick={togglePostLike}
        >
          <IconHeart
            size={20}
            color={liked ? 'var(--price)' : 'var(--ink-sub)'}
            strokeWidth={liked ? 0 : 1.8}
            fill={liked ? 'var(--price)' : 'none'}
          />
          <span>{likeCount || '赞'}</span>
        </button>
        <button
          type="button"
          className={'ad-act' + (collected ? ' is-on' : '')}
          onClick={toggleCollect}
        >
          <IconStar
            size={20}
            color={collected ? '#F59E0B' : 'var(--ink-sub)'}
            strokeWidth={collected ? 0 : 1.8}
            fill={collected ? '#F59E0B' : 'none'}
          />
          <span>{collected ? '已收藏' : '收藏'}</span>
        </button>
      </div>
    </div>
  )
}
