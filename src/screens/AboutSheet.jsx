/* eslint-disable react/prop-types */
import { createPortal } from 'react-dom'
import { IconClose, IconChevron } from '../components/Icons.jsx'
import { APP_VERSION, APP_BUILD } from '../data.js'

// 「关于我们」向上弹出层：版本号 + 用户协议 + 隐私协议
export default function AboutSheet({ onClose, onOpenLegal }) {
  const deviceEl = typeof document !== 'undefined' ? document.querySelector('.device') : null
  if (!deviceEl) return null

  return createPortal(
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-bar" />
        <div className="sheet-head">
          <span className="sheet-title">关于我们</span>
          <button className="sheet-close" type="button" aria-label="关闭" onClick={onClose}>
            <IconClose size={18} color="currentColor" strokeWidth={2} />
          </button>
        </div>

        <div className="sheet-brand">
          <span className="sheet-logo">
            <img src="/logo.png" alt="装机匣" />
          </span>
          <div>
            <div className="sheet-app">装机匣</div>
            <div className="sheet-slogan">智选硬件 · 按需配机</div>
          </div>
        </div>

        <div className="sheet-rows">
          <div className="sheet-row is-static">
            <span>版本号</span>
            <b>
              v{APP_VERSION}（{APP_BUILD}）
            </b>
          </div>
          <button
            className="sheet-row"
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('user')}
          >
            <span>用户协议</span>
            <span className="sheet-chev">
              <IconChevron size={16} strokeWidth={2} />
            </span>
          </button>
          <button
            className="sheet-row"
            type="button"
            onClick={() => onOpenLegal && onOpenLegal('privacy')}
          >
            <span>隐私协议</span>
            <span className="sheet-chev">
              <IconChevron size={16} strokeWidth={2} />
            </span>
          </button>
        </div>

        <p className="sheet-note">协议内容由管理后台「法务文档」维护，修改后立即生效。</p>
      </div>
    </div>,
    deviceEl,
  )
}
