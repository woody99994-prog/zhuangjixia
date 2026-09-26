import { StatusIcons } from './Icons.jsx'

// 状态栏：高 62px，左右内边距 28px，两端对齐（时间 / 系统图标）
export default function StatusBar({ time = '9:41' }) {
  return (
    <div className="statusbar">
      <span className="sb-time">{time}</span>
      <StatusIcons />
    </div>
  )
}
