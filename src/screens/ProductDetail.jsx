/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { IconChevron, IconCheck, IconSwap } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { yuan } from '../format.js'
import { CONFIG_SLOTS } from '../data.js'
import CompatPanel from '../components/CompatPanel.jsx'

const FALLBACK = 'linear-gradient(135deg, #0D245C 0%, #2184F2 100%)'

// 整机详情页：统一风格（返回 / 渐变封面 / 评分 / 亮点 / 配件清单 / 操作）
export default function ProductDetail({ product, onBack, onOpenCompare }) {
  const [detail, setDetail] = useState(null)
  const [flash, setFlash] = useState('')
  // 配件清单优先取后端返回的 detail.parts（方案配件明细）；C 端传入的 specs 作为兜底
  const parts = (detail && detail.planParts) || (detail && detail.parts) || []
  // 兼容性分析入参：只要三大件的槽位与型号，其余槽位也能参与校验（机箱/散热/硬盘）
  const compatParts = parts
    .filter((p) => p && p.model)
    .map((p) => ({ slot: p.slot, brand: p.brand, model: p.model }))
  const specs =
    parts.length > 0
      ? parts.map((p) => {
          const slotDef = CONFIG_SLOTS.find((s) => s.key === p.slot)
          const name = (slotDef && slotDef.cn) || p.slot || '配件'
          const v = [p.brand, p.model].filter(Boolean).join(' ')
          return { k: name, v, p: p.priceCents ? yuan(p.priceCents) : '' }
        })
      : product.specs || []

  useEffect(() => {
    if (!product || !product.id) return
    let alive = true
    api
      .get('plans/' + product.id, { auth: false })
      .then((d) => alive && setDetail(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [product && product.id])

  // 后端 BuildPlan 已含 planParts（配件明细）；detail 接口返回后展示真实清单
  const v = detail || product || {}
  const viewTitle = v.title || (product && product.title) || ''
  const viewThumb = v.coverUrl || (product && product.thumb) || FALLBACK
  const viewTags = v.tagsJson || (product && product.tags) || []
  const viewPrice = v.priceCents ? yuan(v.priceCents) : (product && product.price) || ''
  const viewDesc = v.subtitle || v.summary || (product && product.desc) || '暂无介绍'
  const viewScore = (product && product.score) || '—'

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  const saveToConfig = async () => {
    try {
      await api.post('my/configs', {
        title: viewTitle || '我的整机配置',
        planJson: {},
        totalPriceCents: v.priceCents ? Math.round(v.priceCents) : 0,
        remark: (viewTags || []).join(' / '),
      })
      toast('已保存到「我的配置」')
    } catch (e) {
      toast((e && e.message) || '保存失败')
    }
  }

  return (
    <div className="pd">
      <div className="pd-top">
        <button className="pd-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.4} />
        </button>
        <span className="pd-top-title">整机详情</span>
      </div>

      <div className="pd-hero" style={{ background: viewThumb }}>
        <span className="pd-hero-score">{viewScore}</span>
        <div className="pd-hero-name">{viewTitle}</div>
        <div className="pd-hero-tags">
          {(viewTags || []).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      <p className="pd-desc">{viewDesc}</p>

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
          <span className="pd-spec-p total">{viewPrice}</span>
        </div>
      </div>

      <CompatPanel parts={compatParts} />

      <div className="pd-actions">
        <button className="pd-btn primary" type="button" onClick={saveToConfig}>
          保存到我的配置
        </button>
        <button
          className="pd-btn ghost"
          type="button"
          onClick={() => onOpenCompare && onOpenCompare()}
        >
          <IconSwap size={17} color="var(--brand)" strokeWidth={1.9} />
          加入对比
        </button>
      </div>
      {flash && <div className="pd-flash">{flash}</div>}
    </div>
  )
}
