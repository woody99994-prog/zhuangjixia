/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  IconSpark,
  IconHistory,
  IconSend,
  IconChevron,
  IconPlus,
  IconClose,
} from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { relTime } from '../format.js'

const FALLBACK_NAME = 'AI 装机助手'

const greeting = (name) => `你好，我是${name}。告诉我预算、用途和分辨率，我来帮你配机。`

// —— AI 回复里的配置表解析 ——
// 模型按约定输出 Markdown 表格（| 配件 | 型号 | 参考价 |），这里把它还原成结构化配置单，
// 才能挂上「保存到我的配置 / 再来一条」。解析纯函数、不依赖 React，方便单独验证。
// 中文配件名 → 我的配置的槽位 key（CONFIG_SLOTS）
const SLOT_BY_CN = {
  处理器: 'cpu',
  CPU: 'cpu',
  主板: 'mainboard',
  显卡: 'gpu',
  GPU: 'gpu',
  内存: 'ram',
  内存条: 'ram',
  硬盘: 'storage',
  固态: 'storage',
  固态硬盘: 'storage',
  存储: 'storage',
  电源: 'psu',
  散热: 'cooler',
  散热器: 'cooler',
  机箱: 'case',
  显示器: 'monitor',
  外设: 'peripheral',
  键鼠: 'peripheral',
  键盘: 'peripheral',
  鼠标: 'peripheral',
  耳机: 'peripheral',
  配件: 'accessory',
}

// 配置单卡片：表格 + 两个操作。独立于 AIBuild 导出，便于 SSR 冒烟直接拿解析结果渲染验证
export function AiPlanCard({
  plan,
  after = '',
  done = false,
  busy = false,
  showAgain = true,
  againDisabled = false,
  onSave,
  onAgain,
}) {
  if (!plan || !plan.rows.length) return null
  return (
    <div className="ai-plan-wrap">
      <div className="ai-plan">
        <div className="ai-plan-head">
          <span>推荐配置</span>
          <b>{plan.total ? '¥' + plan.total : '价格待确认'}</b>
        </div>
        {plan.rows.map((r, i) => (
          <div className="ai-plan-row" key={r.cn + i}>
            <span className="ai-plan-k">{r.cn}</span>
            <span className="ai-plan-v">{r.model}</span>
            <span className="ai-plan-p">{r.price ? '¥' + r.price : '—'}</span>
          </div>
        ))}
      </div>

      {after && <div className="bubble-text ai-plan-after">{after}</div>}

      <div className="ai-plan-acts">
        <button
          className={'ai-act' + (done ? ' done' : '')}
          type="button"
          disabled={busy || done}
          onClick={onSave}
        >
          {done ? '已保存' : busy ? '保存中…' : '保存到我的配置'}
        </button>
        {showAgain && (
          <button className="ai-act ghost" type="button" disabled={againDisabled} onClick={onAgain}>
            再来一条
          </button>
        )}
      </div>
    </div>
  )
}

// 从「¥1,299 元」「1299」这类写法里取出数字
function toPrice(s) {
  const m = String(s || '').match(/\d[\d,]*(?:\.\d+)?/)
  if (!m) return 0
  const n = Number(m[0].replace(/,/g, ''))
  return n > 0 && n < 1000000 ? Math.round(n) : 0
}

export function parsePlan(text) {
  const lines = String(text || '').split('\n')
  const start = lines.findIndex((l) => /^\s*\|/.test(l))
  if (start < 0) return null
  // 表头必须像配置表，避免把别的表格（对比表）也当配置单
  if (!/配件|型号/.test(lines[start])) return null

  const rows = []
  let end = start
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (!/^\s*\|/.test(l)) break
    end = i
    if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue // 分隔行 |---|---|
    const cells = l
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim().replace(/\*\*/g, ''))
    if (cells.length < 2) continue
    const cn = cells[0] || ''
    const model = cells[1] || ''
    if (!model) continue
    rows.push({ cn, slot: SLOT_BY_CN[cn] || '', model, price: toPrice(cells[2] || '') })
  }
  if (!rows.length) return null

  return {
    rows,
    total: rows.reduce((s, r) => s + (r.price || 0), 0),
    before: lines.slice(0, start).join('\n').trim(),
    after: lines.slice(end + 1).join('\n').trim(),
  }
}

// 03 AI 装机助手：接入混元大模型（AI 名称 / 开关由管理后台配置）
export default function AIBuild() {
  const [view, setView] = useState('chat') // chat | history
  const [aiName, setAiName] = useState(FALLBACK_NAME)
  const [aiReady, setAiReady] = useState(false)
  const [messages, setMessages] = useState([])
  const [conversationId, setConversationId] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversations, setConversations] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  // 删除两步确认 + 失败可见：之前是「点 × 直接请求、失败静默吞掉」，用户看到的就是「点了没反应」
  const [pendingDel, setPendingDel] = useState(null)
  const [histErr, setHistErr] = useState('')
  // 配置单卡片：保存中 / 已保存按消息 id 记录，避免重复提交
  const [flash, setFlash] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [saved, setSaved] = useState({})
  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  // 拉取 AI 展示名与可用状态（不含任何密钥）
  useEffect(() => {
    let alive = true
    api
      .get('ai/config')
      .then((d) => {
        if (!alive) return
        if (d && d.aiName) setAiName(d.aiName)
        setAiReady(!!(d && d.enabled))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // 新消息 / 切换视图后滚到底部
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, sending, view])

  const loadConversations = useCallback(async () => {
    setHistLoading(true)
    try {
      const d = await api.get('ai/conversations?page=1&pageSize=50')
      setConversations(d && d.items ? d.items : [])
    } catch {
      setConversations([])
    } finally {
      setHistLoading(false)
    }
  }, [])

  const openHistory = () => {
    setView('history')
    loadConversations()
  }

  const startNew = () => {
    setMessages([])
    setConversationId(null)
    setInput('')
    setView('chat')
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 0)
  }

  const openConversation = async (id) => {
    try {
      const d = await api.get('ai/conversations/' + id)
      setConversationId(id)
      setMessages(
        (d && d.messages ? d.messages : []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      )
      setView('chat')
    } catch {
      /* 打不开就留在列表页 */
    }
  }

  const removeConversation = async (e, id) => {
    e.stopPropagation()
    e.preventDefault()
    setPendingDel(null)
    const backup = conversations
    setConversations((prev) => prev.filter((c) => String(c.id) !== String(id)))
    try {
      await api.del('ai/conversations/' + id)
      if (String(conversationId) === String(id)) {
        setMessages([])
        setConversationId(null)
      }
      setHistErr('')
    } catch (err) {
      setConversations(backup)
      setHistErr((err && err.message) || '删除失败，请稍后重试')
    }
  }

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  // 「再来一条」直接复用：带上原会话上下文再要一套，模型才知道预算和用途没变
  const again = () =>
    sendText('再给我一套不同的配置：预算和用途不变，但型号尽量与上一套有差异，并说明你调整的理由。')

  // 把 AI 给的配置表存进「我的配置」
  const savePlan = async (msgId, plan) => {
    if (!plan || !plan.rows.length || savingId || saved[msgId]) return
    setSavingId(msgId)
    try {
      const planJson = {}
      const extras = []
      for (const r of plan.rows) {
        if (r.slot) planJson[r.slot] = { model: r.model, price: r.price || 0 }
        else extras.push(r.cn ? `${r.cn}：${r.model}` : r.model)
      }
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      const title = `AI 推荐 · ${(lastUser && lastUser.content ? lastUser.content : '我的配置').slice(0, 24)}`
      await api.post('my/configs', {
        title,
        planJson,
        totalPriceCents: Math.round((plan.total || 0) * 100),
        remark: extras.length ? extras.join(' / ').slice(0, 255) : undefined,
      })
      setSaved((s) => ({ ...s, [msgId]: true }))
      toast('已保存到「我的配置」')
    } catch (e) {
      toast((e && e.message) || '保存失败')
    } finally {
      setSavingId(null)
    }
  }

  const sendText = async (text) => {
    const t = String(text || '').trim()
    if (!t || sending) return
    setMessages((prev) => [...prev, { id: 'local-' + Date.now(), role: 'user', content: t }])
    setSending(true)
    try {
      const d = await api.post('ai/chat', { conversationId, content: t })
      if (d && d.conversationId) setConversationId(d.conversationId)
      const reply = (d && d.reply) || {}
      setMessages((prev) => [
        ...prev,
        { id: reply.id || 'a-' + Date.now(), role: 'assistant', content: reply.content || '' },
      ])
    } catch (e) {
      // 配置缺失 / 上游失败都走这里，直接把后端给的可读提示显示出来
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'error',
          content: (e && e.message) || '发送失败，请稍后重试',
        },
      ])
    } finally {
      setSending(false)
    }
  }

  const send = () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    sendText(text)
  }

  const renderMessage = (m, isLast) => {
    if (m.role === 'user') {
      return (
        <div className="msg me" key={String(m.id)}>
          <div className="bubble-me">{m.content}</div>
        </div>
      )
    }
    const isError = m.role === 'error'
    // 带配置表的回复：正文 + 配置单卡片 + 两个操作
    const plan = !isError ? parsePlan(m.content) : null
    if (plan) {
      const done = !!saved[m.id]
      const busy = savingId === m.id
      return (
        <div className="msg" key={String(m.id)}>
          <span className="msg-av">
            <IconSpark size={18} color="#FFFFFF" />
          </span>
          <div className="bubble bubble-wide">
            <div className="bubble-name">{aiName}</div>
            {plan.before && <div className="bubble-text">{plan.before}</div>}

            {/* 「再来一条」只对最新一条给：历史消息里再挂一个，用户会以为能回到那条上下文 */}
            <AiPlanCard
              plan={plan}
              after={plan.after}
              done={done}
              busy={busy}
              showAgain={isLast}
              againDisabled={sending}
              onSave={() => savePlan(m.id, plan)}
              onAgain={again}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="msg" key={String(m.id)}>
        <span className="msg-av">
          <IconSpark size={18} color="#FFFFFF" />
        </span>
        <div className={'bubble' + (isError ? ' bubble-error' : '')}>
          {!isError && <div className="bubble-name">{aiName}</div>}
          <div className="bubble-text">{m.content}</div>
        </div>
      </div>
    )
  }

  // —— 历史记录视图 ——
  if (view === 'history') {
    return (
      <div className="ai">
        <div className="hist-head">
          <button
            className="hist-back"
            type="button"
            aria-label="返回"
            onClick={() => setView('chat')}
          >
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <span className="hist-title">历史记录</span>
          <button className="hist-new" type="button" onClick={startNew}>
            <IconPlus size={17} color="var(--brand)" strokeWidth={2.2} />
            <span>新建</span>
          </button>
        </div>

        <div className="hist-body">
          {histErr && <div className="hist-err">{histErr}</div>}
          {histLoading ? (
            <div className="hist-empty">加载中…</div>
          ) : conversations.length === 0 ? (
            <div className="hist-empty">还没有对话记录</div>
          ) : (
            conversations.map((c) => (
              <div
                className="hist-item"
                key={String(c.id)}
                onClick={() => openConversation(c.id)}
                role="button"
                tabIndex={0}
              >
                <div className="hist-item-top">
                  <span className="hist-item-title">{c.title || '新的对话'}</span>
                  {pendingDel === c.id ? (
                    <span className="hist-confirm">
                      <button
                        className="hist-cancel"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingDel(null)
                        }}
                      >
                        取消
                      </button>
                      <button
                        className="hist-yes"
                        type="button"
                        onClick={(e) => removeConversation(e, c.id)}
                      >
                        删除
                      </button>
                    </span>
                  ) : (
                    <button
                      className="hist-del"
                      type="button"
                      aria-label="删除该对话"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setPendingDel(c.id)
                      }}
                    >
                      <IconClose size={15} color="var(--muted)" strokeWidth={2} />
                    </button>
                  )}
                </div>
                <div className="hist-item-sub">
                  {relTime(c.updatedAt) || ''}
                  {c.messageCount ? ` · ${c.messageCount} 条对话` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // —— 对话视图 ——
  return (
    <div className="ai">
      <div className="ai-head">
        <div>
          <h1 className="ai-title">{aiName}</h1>
          <p className="ai-sub">智选硬件 · 按需配机</p>
        </div>
        <button className="ai-hist" type="button" aria-label="历史记录" onClick={openHistory}>
          <IconHistory size={20} color="var(--ink)" strokeWidth={1.9} />
        </button>
      </div>

      <div className="ai-body" ref={bodyRef}>
        {messages.length === 0 ? (
          <>
            <div className="msg">
              <span className="msg-av">
                <IconSpark size={18} color="#FFFFFF" />
              </span>
              <div className="bubble">
                <div className="bubble-name">{aiName}</div>
                <div className="bubble-text">{greeting(aiName)}</div>
              </div>
            </div>
            {!aiReady && (
              <div className="ai-warn">
                AI 助手尚未启用：请在管理后台「配置模块 → AI 助手」填写混元 API Key 并打开开关。
              </div>
            )}
          </>
        ) : (
          messages.map((m, i) => renderMessage(m, i === messages.length - 1))
        )}

        {sending && (
          <div className="msg">
            <span className="msg-av">
              <IconSpark size={18} color="#FFFFFF" />
            </span>
            <div className="bubble ai-typing">
              <span className="ai-dot" />
              <span className="ai-dot" />
              <span className="ai-dot" />
            </div>
          </div>
        )}
      </div>

      {flash && <div className="ai-flash">{flash}</div>}

      <div className="ai-input">
        <div className="box">
          <input
            ref={inputRef}
            className="ai-field"
            value={input}
            placeholder="描述你的装机需求，例如 2K 游戏主机…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            className="send"
            type="button"
            aria-label="发送"
            disabled={!input.trim() || sending}
            onClick={send}
          >
            <IconSend size={19} color="#FFFFFF" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  )
}
