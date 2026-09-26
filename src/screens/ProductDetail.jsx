/* eslint-disable react/prop-types */
import { IconChevron, IconCheck, IconSwap } from '../components/Icons.jsx'

const FALLBACK = 'linear-gradient(135deg, #0D245C 0%, #2184F2 100%)'

// 整机详情页：统一风格（返回 / 渐变封面 / 评分 / 亮点 / 配件清单 / 操作）
export default function ProductDetail({ product, onBack }) {
  const specs = product.specs || []
  return (
    <div className="pd">
      <div className="pd-top">
        <button className="pd-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.4} />
        </button>
        <span className="pd-top-title">整机详情</span>
      </div>

      <div className="pd-hero" style={{ background: product.thumb || FALLBACK }}>
        <span className="pd-hero-score">{product.score || '—'}</span>
        <div className="pd-hero-name">{product.title}</div>
        <div className="pd-hero-tags">
          {(product.tags || []).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      <p className="pd-desc">{product.desc || '暂无介绍'}</p>

      <div className="pd-highlights">
        {(product.highlights || []).map((h) => (
          <span className="pd-hl" key={h}>
            <IconCheck size={13} color="var(--brand)" strokeWidth={2.6} />
            {h}
          </span>
        ))}
      </div>

      <div className="pd-sec-head">配件清单</div>
      <div className="pd-specs">
        {specs.length === 0 ? (
          <div className="pd-spec pd-spec-empty">完整配件清单筹备中</div>
        ) : (
          specs.map((s) => (
            <div className="pd-spec" key={s.k}>
              <span className="pd-spec-k">{s.k}</span>
              <span className="pd-spec-v">{s.v}</span>
              <span className="pd-spec-p">{s.p}</span>
            </div>
          ))
        )}
        <div className="pd-spec pd-spec-total">
          <span className="pd-spec-k">整机参考价</span>
          <span className="pd-spec-v" />
          <span className="pd-spec-p total">{product.price}</span>
        </div>
      </div>

      <div className="pd-actions">
        <button className="pd-btn primary" type="button">
          保存到我的配置
        </button>
        <button className="pd-btn ghost" type="button">
          <IconSwap size={17} color="var(--brand)" strokeWidth={1.9} />
          加入对比
        </button>
      </div>
    </div>
  )
}
