/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { api } from '../apiClient.js'

// 装机兼容性面板：接口/规格校验 + 电源瓦数推荐
// 由后端统一计算（lib/compat.ts），配置单详情与「我的配置」详情共用本组件。
//
// props:
//   parts  [{ slot, brand, model }] —— 待校验的配件
//   title  可选，默认「兼容性检查」

const LEVEL_TEXT = {
  ok: { label: '兼容', cls: 'ok' },
  warn: { label: '注意', cls: 'warn' },
  error: { label: '不兼容', cls: 'error' },
  unknown: { label: '未知', cls: 'unknown' }
}

function LevelIcon({ level }) {
  const color = `var(--cp-${level})`
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }
  if (level === 'ok') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M7.5 12.5l3 3 6-6.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (level === 'warn') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M12 7.5v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.6" r="1.1" fill={color} />
      </svg>
    )
  }
  if (level === 'error') {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <path d="M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <path d="M9.8 9.6a2.3 2.3 0 114.1 1.4c-.8 1.1-1.9 1.6-1.9 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.1" fill={color} />
    </svg>
  )
}

// 左右两侧取值一致时只显示一次，避免「AM5 ⇄ AM5」这种冗余占宽
function rowValue(it) {
  const l = it.left && it.left.value
  const r = it.right && it.right.value
  if (l && r) return l === r ? l : `${l} ⇄ ${r}`
  return l || r || '—'
}

// 纯展示层：与取数解耦，便于 SSR 冒烟直接拿接口数据渲染验证
export function CompatView({ data, title = '兼容性检查' }) {
  const { summary, items, psu } = data
  const [open, setOpen] = useState(false)
  // 进度条基准：让「推荐值」与「当前电源」都能在条内体现
  const base = Math.max(psu.recommendWatt, psu.currentWatt || 0, psu.loadWatt)
  const pct = (w) => (base > 0 ? Math.min(100, Math.round((w / base) * 100)) : 0)
  const hasCur = psu.currentWatt != null
  // 异常项的详情默认展开（用户最需要看到原因），通过项折叠，按需一次性展开
  const folded = items.filter((it) => it.level === 'ok' && it.detail).length

  return (
    <div className="cp">
      <div className="cp-card">
        <div className="cp-head">
          <span className="cp-head-title">{title}</span>
          <span className={`cp-badge cp-badge-${summary.level}`}>{LEVEL_TEXT[summary.level].label}</span>
        </div>

        <div className={`cp-summary cp-summary-${summary.level}`}>
          <LevelIcon level={summary.level} />
          <span className="cp-summary-text">{summary.text}</span>
        </div>

        {items.length > 0 && (
          <div className="cp-rows">
            {items.map((it) => {
              const showDetail = it.detail && (open || it.level !== 'ok')
              return (
                <div className={`cp-row cp-row-${it.level}`} key={it.key}>
                  <div className="cp-row-line">
                    <span className="cp-row-ic">
                      <LevelIcon level={it.level} />
                    </span>
                    <span className="cp-row-t">{it.title}</span>
                    <span className="cp-row-v">{rowValue(it)}</span>
                  </div>
                  {showDetail && <div className="cp-row-detail">{it.detail}</div>}
                </div>
              )
            })}
            {folded > 0 && (
              <button className="cp-more" type="button" onClick={() => setOpen((v) => !v)}>
                {open ? '收起检查详情' : `展开 ${folded} 项检查详情`}
              </button>
            )}
          </div>
        )}

        <div className="cp-psu">
          <div className="cp-psu-head">
            <span className="cp-psu-num">{psu.recommendWatt}</span>
            <span className="cp-psu-unit">W</span>
            <span className="cp-psu-label">推荐额定功率</span>
            {hasCur && <span className="cp-psu-cur">当前 {psu.currentWatt}W</span>}
          </div>

          <div className="cp-psu-bar">
            <div className="cp-bar-track">
              <div className="cp-bar-load" style={{ width: `${pct(psu.loadWatt)}%` }} />
              {hasCur && <div className="cp-bar-cur" style={{ width: `${pct(psu.currentWatt)}%` }} />}
              <div className="cp-bar-mark" style={{ left: `${pct(psu.recommendWatt)}%` }} />
            </div>
          </div>

          <div className="cp-psu-meta">
            <span>
              <i className="cp-dot cp-dot-load" />
              满载约 {psu.loadWatt}W
            </span>
            <span>
              <i className="cp-dot cp-dot-rec" />
              推荐 {psu.recommendWatt}W
            </span>
            <span className="cp-psu-calc">
              处理器 {psu.cpuWatt}W + 显卡 {psu.gpuWatt}W + 其他 {psu.baseWatt}W
            </span>
          </div>

          {psu.text && <div className={`cp-psu-verdict cp-v-${psu.verdict}`}>{psu.text}</div>}
          {psu.estimated && <div className="cp-psu-note">部分配件未匹配到参数库，功耗为估算值</div>}
        </div>
      </div>
    </div>
  )
}

export default function CompatPanel({ parts, title = '兼容性检查' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const list = useMemo(() => (Array.isArray(parts) ? parts.filter((p) => p && p.model) : []), [parts])
  // 配件签名：型号变了才重新请求，避免父组件重渲染导致反复打接口
  const sig = useMemo(() => list.map((p) => `${p.slot}:${p.model}`).join('|'), [list])

  useEffect(() => {
    if (!list.length) {
      setData(null)
      return
    }
    let alive = true
    setLoading(true)
    setErr('')
    api
      .post('hardware/compat', { parts: list.map((p) => ({ slot: p.slot, brand: p.brand, model: p.model })) }, { auth: false })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr((e && e.message) || '兼容性分析失败'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  if (!list.length) return null
  if (err) return <div className="cp-empty">{err}</div>
  if (loading && !data) return <div className="cp-empty">正在分析兼容性…</div>
  if (!data) return null

  return <CompatView data={data} title={title} />
}
