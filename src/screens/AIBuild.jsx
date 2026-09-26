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

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages((prev) => [...prev, { id: 'local-' + Date.now(), role: 'user', content: text }])
    setSending(true)
    try {
      const d = await api.post('ai/chat', { conversationId, content: text })
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

  const renderMessage = (m) => {
    if (m.role === 'user') {
      return (
        <div className="msg me" key={String(m.id)}>
          <div className="bubble-me">{m.content}</div>
        </div>
      )
    }
    const isError = m.role === 'error'
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
          messages.map(renderMessage)
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
