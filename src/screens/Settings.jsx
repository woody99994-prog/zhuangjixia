/* eslint-disable react/prop-types */
import { IconChevron, IconShield, IconTruck } from '../components/Icons.jsx'

// 应用设置：把「收货地址」「账号与安全」两个偏设置的入口收在这里，
// 「我的」页只留一个入口，列表不至于越堆越长
const ITEMS = [
  { key: 'addresses', label: '收货地址', desc: '管理兑换与下单的收货信息', icon: IconTruck, tone: 'green' },
  { key: 'security', label: '账号与安全', desc: '密码 / 手机号 / 实名认证', icon: IconShield, tone: 'purple' },
]

export default function Settings({ onBack, onOpen }) {
  return (
    <div className="sp">
      <div className="sp-head">
        <button className="sp-back" type="button" onClick={onBack} aria-label="返回">
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <span className="sp-title">应用设置</span>
        <span className="sp-count" />
      </div>

      <div className="sp-body">
        {/* 与「我的」页一级菜单同一套卡片样式：白底 + 20px 圆角 + 分割线 */}
        <div className="pf-groups">
          <div className="pf-group">
            {ITEMS.map((it) => {
              const Ico = it.icon
              return (
                <button
                  className="pf-row"
                  type="button"
                  key={it.key}
                  onClick={() => onOpen && onOpen(it.key)}
                >
                  <span className={'pf-row-ic tone-' + it.tone}>
                    <Ico size={20} />
                  </span>
                  <span className="pf-row-label">
                    {it.label}
                    <em className="pf-row-desc">{it.desc}</em>
                  </span>
                  <span className="pf-row-chev">
                    <IconChevron size={17} strokeWidth={2} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
