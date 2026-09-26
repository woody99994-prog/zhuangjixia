/* eslint-disable react/prop-types */
import { useState, useMemo, useEffect } from 'react'
import {
  IconChip,
  IconBook,
  IconSwap,
  IconBolt,
  IconChevron,
} from '../components/Icons.jsx'
import {
  quickEntryMeta,
  entryCourses,
  compareData,
  psuParts,
} from '../data.js'
import { api } from '../apiClient.js'
import { yuan, levelLabel } from '../format.js'

const QUICK_ICONS = { chip: IconChip, book: IconBook, swap: IconSwap, bolt: IconBolt }

// 统一外壳：返回按钮 + 配色 Icon + 标题/描述
function Shell({ kind, onBack, children }) {
  const meta = quickEntryMeta[kind]
  const Ico = QUICK_ICONS[meta.icon]
  return (
    <div className="qe">
      <div className="qe-hero">
        <button className="qe-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.4} />
        </button>
        <span className={'qe-hero-ic qi-' + meta.tone}>
          <Ico size={26} strokeWidth={1.9} />
        </span>
        <div className="qe-titles">
          <h1 className="qe-title">{meta.title}</h1>
          <p className="qe-desc">{meta.desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ---------- 精选配置：整机商品 2 列网格（点击进入详情） ---------- */
function ConfigGrid({ onOpenProduct }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .get('plans?pageSize=20', { auth: false })
      .then((d) => alive && setPlans(d && d.items ? d.items : []))
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return <div className="qe-empty">加载中…</div>
  }
  if (plans.length === 0) {
    return <div className="qe-empty">暂无整机方案</div>
  }

  return (
    <div className="qe-grid">
      {plans.map((p) => (
        <button
          type="button"
          className="qe-goods"
          key={p.id}
          onClick={() =>
            onOpenProduct({
              id: p.id,
              title: p.title,
              tags: p.tagsJson || [],
              price: yuan(p.priceCents),
              thumb: p.coverUrl || '',
              score: levelLabel(p.level),
              desc: p.subtitle || '',
              highlights: [],
              specs: [],
            })
          }
        >
          <span
            className="qe-goods-thumb"
            style={
              p.coverUrl
                ? {
                    backgroundImage: `url(${p.coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : { background: 'linear-gradient(135deg,#0D245C 0%,#2184F2 100%)' }
            }
          >
            <IconChip size={40} color="rgba(255,255,255,0.92)" strokeWidth={1.5} />
          </span>
          <div className="qe-goods-info">
            <div className="qe-goods-title">{p.title}</div>
            <div className="qe-tags">
              {(p.tagsJson || []).map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="qe-goods-foot">
              <span className="qe-goods-price">{yuan(p.priceCents)}</span>
              <span className="qe-goods-go">
                详情
                <IconChevron size={13} color="var(--brand)" strokeWidth={2.4} />
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

/* ---------- 装机学院：教程列表（点击展开正文） ---------- */
function CourseList() {
  const [open, setOpen] = useState(null)
  return (
    <div className="qe-list">
      {entryCourses.map((c, i) => {
        const isOpen = open === i
        return (
          <div className={'qe-course' + (isOpen ? ' is-open' : '')} key={c.title}>
            <button type="button" className="qe-course-head" onClick={() => setOpen(isOpen ? null : i)}>
              <span className={'qe-course-ic tone-' + c.tone}>
                <IconBook size={20} strokeWidth={1.9} />
              </span>
              <div className="qe-course-info">
                <div className="qe-course-title">{c.title}</div>
                <div className="qe-course-meta">
                  <span className="qe-level">{c.level}</span>
                  <span className="qe-dot">·</span>
                  <span>{c.time}</span>
                  <span className="qe-dot">·</span>
                  <span>{c.tag}</span>
                </div>
              </div>
              <IconChevron size={16} color="var(--muted)" strokeWidth={2.2} className="qe-course-arrow" />
            </button>
            <div className={'qe-course-body' + (isOpen ? ' show' : '')}>
              <p>{c.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- 配件对比：分类切换 + A/B 选择器 + 对比表 ---------- */
function CompareTool() {
  const cats = Object.keys(compareData)
  const [cat, setCat] = useState(cats[0])
  const data = compareData[cat]
  const keys = Object.keys(data.items)
  const [a, setA] = useState(keys[0])
  const [b, setB] = useState(keys[1] || keys[0])

  return (
    <div className="qe-cmp-wrap">
      <div className="qe-tabs">
        {cats.map((k) => (
          <button
            key={k}
            type="button"
            className={'qe-tab' + (k === cat ? ' is-active' : '')}
            onClick={() => {
              setCat(k)
              const ks = Object.keys(compareData[k].items)
              setA(ks[0])
              setB(ks[1] || ks[0])
            }}
          >
            {compareData[k].label}
          </button>
        ))}
      </div>

      <div className="qe-pick">
        <div className="qe-pick-col">
          <span className="qe-pick-tag">A</span>
          <select className="qe-select" value={a} onChange={(e) => setA(e.target.value)}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <span className="qe-pick-vs">VS</span>
        <div className="qe-pick-col">
          <span className="qe-pick-tag b">B</span>
          <select className="qe-select" value={b} onChange={(e) => setB(e.target.value)}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="qe-cmp">
        <div className="qe-cmp-row qe-cmp-head">
          <span className="qe-cmp-k">指标</span>
          <span className={'qe-cmp-v' + (a === b ? '' : '')}>{a}</span>
          <span className="qe-cmp-v">{b}</span>
        </div>
        {data.rows.map((row) => {
          const best = a !== b ? data.best[row] : null
          const av = data.items[a][data.rows.indexOf(row)]
          const bv = data.items[b][data.rows.indexOf(row)]
          return (
            <div className="qe-cmp-row" key={row}>
              <span className="qe-cmp-k">{row}</span>
              <span className={'qe-cmp-v' + (best === a ? ' is-best' : '')}>{av}</span>
              <span className={'qe-cmp-v' + (best === b ? ' is-best' : '')}>{bv}</span>
            </div>
          )
        })}
      </div>
      <p className="qe-cmp-tip">绿色高亮为该指标更优的一方</p>
    </div>
  )
}

/* ---------- 功耗计算：交互式计算器 ---------- */
function PowerCalc() {
  const [sel, setSel] = useState(() =>
    psuParts.reduce((o, p) => ((o[p.key] = p.options[0].name), o), {}),
  )
  const total = useMemo(
    () => psuParts.reduce((s, p) => s + (p.options.find((o) => o.name === sel[p.key])?.w || 0), 0),
    [sel],
  )
  const recommend = Math.ceil((total * 1.5) / 50) * 50
  const headroom = recommend - total
  const pct = recommend ? Math.min(100, Math.round((total / recommend) * 100)) : 0

  return (
    <div className="qe-calc">
      <div className="qe-parts">
        {psuParts.map((p) => (
          <div className="qe-part" key={p.key}>
            <span className="qe-part-k">{p.key}</span>
            <select
              className="qe-select"
              value={sel[p.key]}
              onChange={(e) => setSel((s) => ({ ...s, [p.key]: e.target.value }))}
            >
              {p.options.map((o) => (
                <option key={o.name} value={o.name}>
                  {o.name} · {o.w}W
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="qe-result">
        <div className="qe-result-row">
          <div className="qe-result-block">
            <span className="qe-result-label">估算整机功耗</span>
            <b className="qe-result-num">
              {total}
              <i>W</i>
            </b>
          </div>
          <div className="qe-result-block right">
            <span className="qe-result-label">建议电源 ≥</span>
            <b className="qe-result-num brand">
              {recommend}
              <i>W</i>
            </b>
          </div>
        </div>
        <div className="qe-bar">
          <span className="qe-bar-fill" style={{ width: pct + '%' }} />
        </div>
        <p className="qe-result-tip">
          已预留 <b>{headroom}W</b> 余量（约 50%），稳压更安心
        </p>
      </div>
    </div>
  )
}

// 入口组件：按 kind 分发
export default function QuickEntry({ kind, onBack, onOpenProduct }) {
  let body = null
  if (kind === 'chip') body = <ConfigGrid onOpenProduct={onOpenProduct} />
  else if (kind === 'book') body = <CourseList />
  else if (kind === 'swap') body = <CompareTool />
  else if (kind === 'bolt') body = <PowerCalc />

  return <Shell kind={kind} onBack={onBack}>{body}</Shell>
}
