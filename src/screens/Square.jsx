import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { IconPlus, IconClose, IconImage, IconMonitor, IconTag, IconChevron } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { uploadImage, compressImage } from '../media.js'
import { planToMarkdownTable } from '../configTable.js'
import { relTime } from '../format.js'

// 三个列表页共享同一套 .post 卡片样式，保证风格统一
const TABS = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '热门' },
  { key: 'essence', label: '精选' },
]

// 04 广场（含 最新 / 热门 / 精选 三个可切换列表页 + 标签筛选 + 发帖弹层）
export default function Square({ onOpenArticle }) {
  const [tab, setTab] = useState('latest')
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState([])
  // 标签默认收起，只显示一个「展开」按钮；点击后才铺开全部标签
  const [tagPanel, setTagPanel] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [compose, setCompose] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', tags: '', cover: '', file: null })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')
  // 发帖时插入配置表：从「我的配置」里挑一套
  const [pickCfg, setPickCfg] = useState(false)
  const [myCfgs, setMyCfgs] = useState([])
  const fileRef = useRef(null)

  const loadPosts = useCallback(() => {
    let alive = true
    setLoading(true)
    const qs = `tab=${tab}&pageSize=20${tag ? '&tag=' + encodeURIComponent(tag) : ''}`
    api
      .get('posts?' + qs, { auth: false })
      .then((d) => alive && setPosts(d && d.items ? d.items : []))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [tab, tag])

  useEffect(() => {
    const cancel = loadPosts()
    return cancel
  }, [loadPosts])

  // 标签云（一次性加载）
  useEffect(() => {
    let alive = true
    api
      .get('tags', { auth: false })
      .then((list) => alive && setTags(Array.isArray(list) ? list.map((t) => t.name) : []))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const openCompose = () => {
    setCompose(true)
    setErr('')
  }
  const closeCompose = () => {
    if (saving) return
    setCompose(false)
    setPickCfg(false)
  }

  // 真实图片选择：本地预览用压缩后的 dataURL，落库前才上传换 URL
  const onPickCover = () => fileRef.current && fileRef.current.click()
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    setForm((s) => ({ ...s, file: f }))
    try {
      const preview = await compressImage(f, 640, 0.8)
      setForm((s) => ({ ...s, cover: preview }))
    } catch {
      setErr('这张图读不出来，换一张试试')
    }
  }
  const removeCover = () => setForm((s) => ({ ...s, cover: '', file: null }))

  // 插入配置表
  const openPicker = async () => {
    setPickCfg(true)
    try {
      const d = await api.get('my/configs?pageSize=50')
      setMyCfgs(d && d.items ? d.items : [])
    } catch {
      setMyCfgs([])
    }
  }
  const insertConfig = (cfg) => {
    const md = planToMarkdownTable(cfg.title, cfg.planJson)
    setForm((s) => ({ ...s, content: (s.content ? s.content.replace(/\s*$/, '') + '\n\n' : '') + md }))
    setPickCfg(false)
  }

  const submit = async () => {
    const title = form.title.trim()
    if (!title || saving) return
    setSaving(true)
    setErr('')
    try {
      let coverUrl = ''
      if (form.file) coverUrl = await uploadImage(form.file)
      const tagList = form.tags
        .split(/[\s,，]+/)
        .map((x) => x.trim())
        .filter(Boolean)
      const created = await api.post('my/posts', {
        title,
        contentMd: form.content,
        coverUrl,
        tags: tagList
      })
      setForm({ title: '', content: '', tags: '', cover: '', file: null })
      setCompose(false)
      setPickCfg(false)
      setTab('latest')
      setTag('')
      // 用户拍板「发布后立即可见」：发完必须能在最新流里刷到自己这条
      loadPosts()
      setFlash(created && created.id ? '发布成功，已在「最新」中显示' : '发布成功')
      setTimeout(() => setFlash(''), 2600)
    } catch (e) {
      setErr((e && e.message) || '发布失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const deviceEl = typeof document !== 'undefined' ? document.querySelector('.device') : null

  return (
    <div className="square">
      <div className="sq-head">
        <h1>广场</h1>
        <button className="sq-add" type="button" aria-label="发布" onClick={openCompose}>
          <IconPlus size={20} color="#1C7DFF" strokeWidth={2} />
        </button>
      </div>

      {flash && <div className="sq-flash">{flash}</div>}

      <div className="sq-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'sq-tab' + (tab === t.key ? ' is-active' : '')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="sq-tagbar">
          <button
            type="button"
            className={'sq-tagbtn' + (tagPanel ? ' is-open' : '') + (tag ? ' has-tag' : '')}
            aria-expanded={tagPanel}
            onClick={() => setTagPanel((v) => !v)}
          >
            <IconTag size={15} color="currentColor" strokeWidth={1.9} />
            <span className="sq-tagbtn-label">{tag || '标签'}</span>
            <span className="sq-tagbtn-chev">
              <IconChevron size={13} strokeWidth={2.4} />
            </span>
          </button>
          {tag && (
            <button
              type="button"
              className="sq-tagclear"
              onClick={() => {
                setTag('')
                setTagPanel(false)
              }}
            >
              清除筛选
            </button>
          )}
          <span className="sq-tagbar-count">{tag ? '已筛选' : `共 ${tags.length} 个标签`}</span>
        </div>
      )}

      {/* 点开标签按钮后，标签以错落动画铺开 */}
      {tags.length > 0 && tagPanel && (
        <div className="sq-tagpanel">
          <button
            type="button"
            className={'sq-tag' + (tag === '' ? ' is-active' : '')}
            style={{ animationDelay: '0ms' }}
            onClick={() => {
              setTag('')
              setTagPanel(false)
            }}
          >
            全部
          </button>
          {tags.map((t, ti) => (
            <button
              key={t}
              type="button"
              className={'sq-tag' + (tag === t ? ' is-active' : '')}
              style={{ animationDelay: (ti + 1) * 26 + 'ms' }}
              onClick={() => {
                setTag(t)
                setTagPanel(false)
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="feed">
        {loading ? (
          <div className="feed-empty">加载中…</div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">暂无内容</div>
        ) : (
          posts.map((p, i) => (
            <article
              className="post"
              key={p.id != null ? String(p.id) : i}
              onClick={() => onOpenArticle && onOpenArticle({ kind: 'post', id: String(p.id), ...p })}
            >
              <div className="post-head">
                <span className="post-av" />
                <div>
                  <div className="post-name">{p.name || '装机匣玩家'}</div>
                  <div className="post-time">{relTime(p.publishedAt) || p.time || ''}</div>
                </div>
              </div>

              <h3 className="post-title">{p.title}</h3>

              <div className={'post-thumb' + (p.coverUrl || p.cover ? ' has-img' : '')}>
                {p.coverUrl || p.cover ? (
                  <img src={p.coverUrl || p.cover} alt="" />
                ) : p.thumbText || p.summary ? (
                  <span>{p.thumbText || p.summary}</span>
                ) : null}
              </div>

              <div className="post-tags">
                {(p.tags || []).map((t, ti) =>
                  typeof t === 'string' ? (
                    <span className="chip-soft" key={ti}>
                      {t}
                    </span>
                  ) : (
                    <span className="chip-soft" key={ti}>
                      {t.tag ? t.tag.name : t.name}
                    </span>
                  ),
                )}
              </div>

              <div className="post-foot">
                {typeof p.meta === 'string'
                  ? p.meta
                  : `${p.likeCount || 0} 赞 · ${p.viewCount || 0} 浏览`}
              </div>
            </article>
          ))
        )}
      </div>

      {compose &&
        deviceEl &&
        createPortal(
          <div className="modal-mask" onClick={closeCompose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <span className="modal-title">发布帖子</span>
                <button
                  className="modal-close"
                  type="button"
                  aria-label="关闭"
                  onClick={closeCompose}
                  disabled={saving}
                >
                  <IconClose size={20} color="currentColor" strokeWidth={2} />
                </button>
              </div>

              <input
                className="modal-input"
                placeholder="填个标题，让大家一眼看懂"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={30}
                disabled={saving}
              />

              <textarea
                className="modal-textarea"
                placeholder="分享你的装机作业、踩坑经验或选购心得…"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                disabled={saving}
              />

              <div className="modal-row">
                <button type="button" className="modal-mini" onClick={openPicker} disabled={saving}>
                  <IconMonitor size={15} color="currentColor" strokeWidth={1.9} />
                  <span>插入配置表</span>
                </button>
                <span className="modal-hint">从「我的配置」里挑一套，会以表格形式插进正文</span>
              </div>

              {pickCfg && (
                <div className="modal-picker">
                  {myCfgs.length === 0 ? (
                    <div className="modal-hint">还没有配置，先去「我的配置」建一套</div>
                  ) : (
                    myCfgs.map((c) => (
                      <button
                        type="button"
                        className="modal-pick"
                        key={c.id}
                        onClick={() => insertConfig(c)}
                      >
                        <span>{c.title}</span>
                        <em>插入</em>
                      </button>
                    ))
                  )}
                  <button type="button" className="modal-mini" onClick={() => setPickCfg(false)}>
                    收起
                  </button>
                </div>
              )}

              <input
                className="modal-input"
                placeholder="标签：用空格或逗号分隔，如 海景房 ITX"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                disabled={saving}
              />

              {form.cover ? (
                <div className="modal-cover">
                  <img src={form.cover} alt="封面预览" />
                  <button
                    type="button"
                    className="modal-cover-del"
                    aria-label="移除封面"
                    onClick={removeCover}
                    disabled={saving}
                  >
                    <IconClose size={16} color="#fff" strokeWidth={2.2} />
                  </button>
                </div>
              ) : (
                <button type="button" className="modal-thumb" onClick={onPickCover} disabled={saving}>
                  <IconImage size={20} color="currentColor" strokeWidth={2} />
                  <span>添加封面图</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onFile}
              />

              {err && <div className="modal-err">{err}</div>}

              <button
                type="button"
                className="modal-submit"
                disabled={!form.title.trim() || saving}
                onClick={submit}
              >
                {saving ? '发布中…' : '发布'}
              </button>
            </div>
          </div>,
          deviceEl,
        )}
    </div>
  )
}
