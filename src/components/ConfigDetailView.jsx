/* eslint-disable react/prop-types */
// 配置详情（纯展示）：「我的配置」详情与他人主页配置详情共用同一套渲染，
// 区别只在外层头部按钮（我的：编辑/删除；他人：只读）。
import { CONFIG_SLOTS } from '../data.js'
import { yuan } from '../format.js'
import { normalizePlan } from '../configTable.js'
import { SlotIcon } from './Icons.jsx'
import CompatPanel from './CompatPanel.jsx'

export default function ConfigDetailView({ detail, footer }) {
  const plan = (detail && detail.planJson) || {}
  // 兼容槽位格式与清单格式（parts[]），两种都要能看全
  const { rows } = normalizePlan(plan)
  // 总价以后端落库的为准；清单格式可能没算过总价，用明细合计兜底
  const totalCents = Number(detail && detail.totalPriceCents) || 0
  const totalText = totalCents
    ? yuan(totalCents)
    : rows.length
      ? '¥' + rows.reduce((s, r) => s + (Number(r.price) || 0), 0).toLocaleString('zh-CN')
      : '¥0'

  return (
    <div className="cfg-detail">
      <div className="cfg-detail-title">{detail ? detail.title : ''}</div>
      <div className="cfg-detail-total">
        <span>配置总价</span>
        <b>{totalText}</b>
      </div>
      {detail && detail.remark ? <p className="cfg-detail-remark">{detail.remark}</p> : null}

      <div className="cfg-detail-rows">
        {rows.length === 0 ? (
          <div className="cfg-detail-empty">这套配置还没有填配件</div>
        ) : (
          rows.map((r, i) => (
            <div className="cfg-detail-row" key={(r.slot || 'x') + '-' + i}>
              <span className="cfg-dr-ic">
                <SlotIcon slot={r.slot || 'cpu'} size={18} />
              </span>
              <span className="cfg-dr-name">{r.cn}</span>
              <span className="cfg-dr-model">{r.model}</span>
              <span className="cfg-dr-price">{r.price ? '¥' + Number(r.price) : '—'}</span>
            </div>
          ))
        )}
      </div>

      {footer ? <div className="cfg-detail-footer">{footer}</div> : null}

      <CompatPanel parts={rows.map((r) => ({ slot: r.slot, model: r.model }))} />
    </div>
  )
}

// 列表卡片预览用：返回前 n 件的 { cn, slot, model }
export function planPreview(planJson, n) {
  const { rows } = normalizePlan(planJson)
  return typeof n === 'number' ? rows.slice(0, n) : rows
}

// 槽位 key → 中文名（列表卡片与编辑器共用）
export function slotCn(key) {
  const s = CONFIG_SLOTS.find((x) => x.key === key)
  return s ? s.cn : '配件'
}
