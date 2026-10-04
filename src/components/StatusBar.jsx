import { useEffect } from 'react'
import { StatusIcons } from './Icons.jsx'
import { StatusBar as CapStatusBar, Style } from '@capacitor/status-bar'
import { IS_NATIVE } from '../apiClient.js'

// 状态栏：高 62px，左右内边距 28px，两端对齐（时间 / 系统图标）
// 原生壳内不渲染假状态栏，改用系统状态栏并随主题切换样式
export default function StatusBar({ time = '9:41', theme = 'light' }) {
  useEffect(() => {
    if (!IS_NATIVE) return
    // 关闭 webview 覆盖，让系统状态栏独立占用一行（避免内容被状态栏压住）
    CapStatusBar.setOverlaysWebView({ overlay: false }).catch(() => {})
    // 背景与文字色随主题：浅色背景 → 深字，深色背景 → 浅字
    CapStatusBar.setBackgroundColor({ color: theme === 'dark' ? '#0b0c0f' : '#f5f5f7' }).catch(() => {})
    CapStatusBar.setStyle({ style: theme === 'dark' ? Style.Light : Style.Dark }).catch(() => {})
  }, [theme])

  // 原生壳内交由系统状态栏显示，这里不再画
  if (IS_NATIVE) return null

  return (
    <div className="statusbar">
      <span className="sb-time">{time}</span>
      <StatusIcons />
    </div>
  )
}
