import { IconHome, IconCompass, IconSpark, IconMonitor, IconUser } from './Icons.jsx'

// 底部胶囊导航：5 个 Tab（首页 / 广场 / AI / 配置 / 我的）
// 选中态 = 品牌色实心圆(34) + 白色图标(18) + 品牌色 SemiBold 文字
// 未选中 = 20px 灰色图标 + 灰色 Medium 文字
export const TABS = [
  { key: 'home', label: '首页', Icon: IconHome },
  { key: 'square', label: '广场', Icon: IconCompass },
  { key: 'ai', label: 'AI', Icon: IconSpark },
  { key: 'config', label: '配置', Icon: IconMonitor },
  { key: 'profile', label: '我的', Icon: IconUser },
]

export default function TabBar({ active, onChange }) {
  return (
    <div className="tabbar-wrap">
      <nav className="tabbar" role="tablist">
        {TABS.map(({ key, label, Icon }) => {
          const on = key === active
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={on}
              className={'tab' + (on ? ' is-active' : '')}
              onClick={() => onChange(key)}
            >
              {on ? (
                <span className="tab-circle">
                  <Icon size={18} color="#FFFFFF" />
                </span>
              ) : (
                <span className="tab-icon">
                  <Icon size={20} color="#ADB5BF" strokeWidth={1.9} />
                </span>
              )}
              <span className="tab-label">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
