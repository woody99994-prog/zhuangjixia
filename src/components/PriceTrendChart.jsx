// C 端价格走势图：零依赖 SVG 折线图，官方 / 京东 / 淘宝三来源同图对比。
// 入参 series = { range, sources: { official: [{t, priceCents}], jd: [...], taobao: [...] } }
// 数据为后端按「天桶」聚合后的价格序列；1d 窗口天然只有 1 个点（稀疏）。
import { useMemo } from 'react'

// 三来源颜色与图例（与后台 PriceTrendChart / 价格走势弹层设计稿一致）
export const PRICE_SOURCES = [
  { key: 'official', label: '官方', color: '#1C7DFF' },
  { key: 'jd', label: '京东', color: '#E1251B' },
  { key: 'taobao', label: '淘宝', color: '#FF5000' },
]

const W = 640
const H = 260
const PAD = { l: 50, r: 12, t: 16, b: 28 }
const PLOT_L = PAD.l
const PLOT_R = W - PAD.r
const PLOT_T = PAD.t
const PLOT_B = H - PAD.b
const PLOT_W = PLOT_R - PLOT_L
const PLOT_H = PLOT_B - PLOT_T

// 给价格区间上下留 12% 余量，避免折线贴边
function niceBounds(min, max) {
  if (min === max) {
    const d = Math.max(1, Math.abs(min) * 0.05)
    return [min - d, max + d]
  }
  const pad = (max - min) * 0.12
  return [min - pad, max + pad]
}

function fmtYuan(cents) {
  return '¥' + Math.round(cents / 100).toLocaleString('zh-CN')
}

function fmtDate(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.getMonth() + 1 + '/' + d.getDate()
}

// 点数均分横轴（天桶已是等距，按索引铺开最稳）
const xOf = (i, n) => (n <= 1 ? PLOT_R : PLOT_L + (i / (n - 1)) * PLOT_W)

export default function PriceTrendChart({ series }) {
  const { lines, yTicks, bounds, hasData } = useMemo(() => {
    const sources = (series && series.sources) || {}
    const all = []
    const out = []
    for (const s of PRICE_SOURCES) {
      const pts = sources[s.key] || []
      if (!pts.length) continue
      out.push({ ...s, pts })
      for (const p of pts) all.push(p.priceCents)
    }
    const has = all.length > 0
    const b = has ? niceBounds(Math.min(...all), Math.max(...all)) : [0, 1]
    const ticks = []
    for (let i = 0; i <= 4; i++) {
      const v = b[0] + ((b[1] - b[0]) * i) / 4
      const y = PLOT_B - ((v - b[0]) / (b[1] - b[0])) * PLOT_H
      ticks.push({ v, y })
    }
    return { lines: out, yTicks: ticks, bounds: b, hasData: has }
  }, [series])

  if (!hasData) return null

  const yScale = (cents) => PLOT_B - ((cents - bounds[0]) / (bounds[1] - bounds[0])) * PLOT_H
  const basePts = lines[0].pts
  const baseN = basePts.length

  // 横轴标签：起点 / 中点 / 终点（终点标「今天」）
  const xLabels = [
    { x: xOf(0, baseN), t: basePts[0].t, anchor: 'start', today: false },
    {
      x: xOf(Math.floor((baseN - 1) / 2), baseN),
      t: basePts[Math.floor((baseN - 1) / 2)].t,
      anchor: 'middle',
      today: false,
    },
    { x: xOf(baseN - 1, baseN), t: basePts[baseN - 1].t, anchor: 'end', today: true },
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="ptc-svg"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="价格走势图"
    >
      {/* 网格线 + 纵轴价格标签 */}
      {yTicks.map((tk, i) => (
        <g key={'y' + i}>
          <line x1={PLOT_L} y1={tk.y} x2={PLOT_R} y2={tk.y} stroke="#EEF1F4" strokeWidth="1" />
          <text x={PLOT_L - 6} y={tk.y + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">
            {fmtYuan(tk.v)}
          </text>
        </g>
      ))}

      {/* 横轴日期标签 */}
      {xLabels.map((lb, i) => (
        <text
          key={'x' + i}
          x={lb.x}
          y={H - 8}
          textAnchor={lb.anchor}
          fontSize="11"
          fill="#9CA3AF"
        >
          {lb.today ? '今天' : fmtDate(lb.t)}
        </text>
      ))}

      {/* 各来源折线 + 末点圆点 */}
      {lines.map((ln) => {
        const n = ln.pts.length
        const d = ln.pts
          .map((p, i) => {
            const x = xOf(i, n)
            const y = yScale(p.priceCents)
            return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1)
          })
          .join(' ')
        const lx = xOf(n - 1, n)
        const ly = yScale(ln.pts[n - 1].priceCents)
        return (
          <g key={ln.key}>
            <path
              d={d}
              fill="none"
              stroke={ln.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <circle cx={lx} cy={ly} r="3.5" fill={ln.color} />
          </g>
        )
      })}
    </svg>
  )
}
