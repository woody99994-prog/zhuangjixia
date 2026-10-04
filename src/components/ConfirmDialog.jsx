import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * 通用二次确认弹层（居中卡片，非底部 sheet）
 *
 * 用于删帖、删配置、清空记录这类不可逆操作：点删除先弹确认，避免误触即删。
 * 用法：
 *   <ConfirmDialog
 *     open={!!pending}
 *     title="删除这篇帖子？"
 *     desc="删除后不可恢复…"
 *     confirmText="删除"
 *     onCancel={() => setPending(null)}
 *     onConfirm={() => doDelete(pending)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title = '确认操作？',
  desc = '',
  confirmText = '确认',
  cancelText = '取消',
  danger = true,
  busy = false,
  onCancel,
  onConfirm
}) {
  const deviceEl = typeof document !== 'undefined' ? document.querySelector('.device') : null

  // Esc 取消，与关闭按钮等价（C 端弹层的统一习惯）
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel && onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open || !deviceEl) return null

  return createPortal(
    <div className="cf-mask" onClick={() => !busy && onCancel && onCancel()}>
      <div
        className="cf-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cf-title">{title}</div>
        {desc ? <div className="cf-desc">{desc}</div> : null}
        <div className="cf-actions">
          <button type="button" className="cf-btn" onClick={onCancel} disabled={busy}>
            {cancelText}
          </button>
          <button
            type="button"
            className={'cf-btn ' + (danger ? 'is-danger' : 'is-primary')}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? '处理中…' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    deviceEl,
  )
}
