/* eslint-disable react/prop-types */
// 全部图标基于 24x24 网格的线性/填充 SVG，严格对应设计稿中的图标语义。
// 通过 size / color / strokeWidth 控制尺寸与着色，颜色统一走 currentColor。

const wrap = (size, children, extra = {}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...extra}
  >
    {children}
  </svg>
)

export function IconHome({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M3 10.5 12 3l9 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

export function IconCompass({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="12" r="7.2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M15 9l-1.7 4.3L9 15l1.7-4.3L15 9Z" fill={color} />
    </>,
  )
}

export function IconSpark({ size = 24, color = 'currentColor' }) {
  return wrap(
    size,
    <>
      <path d="M12 3.2l1.7 4.6 4.6 1.7-4.6 1.7L12 15.8l-1.7-4.6-4.6-1.7 4.6-1.7L12 3.2Z" fill={color} />
      <path d="M18.3 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" fill={color} />
    </>,
  )
}

export function IconMonitor({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 20h8M12 16v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconUser({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="8" r="3.6" stroke={color} strokeWidth={strokeWidth} />
      <path d="M4.6 20c0-3.7 3.5-5.8 7.4-5.8s7.4 2.1 7.4 5.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconChip({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.6" stroke={color} strokeWidth={strokeWidth} />
      <rect x="10" y="10" width="4" height="4" rx="1" fill={color} />
      <path
        d="M9.6 3.4v3.1M14.4 3.4v3.1M9.6 17.5v3.1M14.4 17.5v3.1M3.4 9.6h3.1M3.4 14.4h3.1M17.5 9.6h3.1M17.5 14.4h3.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </>,
  )
}

// ===================== 配置表 11 槽位图标（处理器 / 主板 / 显卡 …） =====================
export function IconSlotCpu({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="7" y="7" width="10" height="10" rx="2.2" stroke={color} strokeWidth={strokeWidth} />
    <rect x="10" y="10" width="4" height="4" rx="1" fill={color} />
    <path d="M10 4.2v2.8M14 4.2v2.8M10 17v2.8M14 17v2.8M4.2 10h2.8M4.2 14h2.8M17 10h2.8M17 14h2.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotMainboard({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="3.5" y="5" width="17" height="14" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <rect x="6" y="7.6" width="5.4" height="4.4" rx="1" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="16" cy="9" r="1.7" stroke={color} strokeWidth={strokeWidth} />
    <path d="M6 15h12M14.5 14.4h3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotGpu({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="3.5" y="6" width="17" height="9" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="9" cy="10.5" r="2.1" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="15" cy="10.5" r="2.1" stroke={color} strokeWidth={strokeWidth} />
    <path d="M3.5 17h17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotRam({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="4" y="8" width="16" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
    <path d="M6.5 8V5.4M10 8V5.4M13.5 8V5.4M17 8V5.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M7 13h10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotStorage({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="4.5" y="5" width="15" height="14" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <rect x="7" y="8" width="10" height="5" rx="1" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="17" cy="16" r="1" fill={color} />
  </>)
}
export function IconSlotPsu({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="5" y="5" width="14" height="14" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 8.6v3.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M9.9 11.2a2.3 2.3 0 1 0 4.2 0" stroke={color} strokeWidth={strokeWidth} />
  </>)
}
export function IconSlotCooler({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="12" cy="12" r="2.1" fill={color} />
    <path d="M12 9.9V4M14.5 13.1 19 15.5M9.5 13.1 5 15.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotCase({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="6.5" y="3.5" width="11" height="17" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <rect x="9" y="6" width="6" height="7.5" rx="1" stroke={color} strokeWidth={strokeWidth} />
    <circle cx="12" cy="16.6" r="1.1" fill={color} />
  </>)
}
export function IconSlotMonitor({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="3" y="4" width="18" height="12" rx="2" stroke={color} strokeWidth={strokeWidth} />
    <path d="M8 20h8M12 16v4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotPeripheral({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <rect x="8" y="3.5" width="8" height="13" rx="4" stroke={color} strokeWidth={strokeWidth} />
    <path d="M12 6.5v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </>)
}
export function IconSlotAccessory({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <path d="M12 3.4 19.6 7v10L12 20.6 4.4 17V7L12 3.4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    <path d="M4.4 7 12 10.6 19.6 7M12 10.6V20.6" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </>)
}

// 槽位 key → 图标组件映射，供配置表 / 硬件弹层 / 我的配置统一取用
export const SLOT_ICON_MAP = {
  cpu: IconSlotCpu,
  mainboard: IconSlotMainboard,
  gpu: IconSlotGpu,
  ram: IconSlotRam,
  storage: IconSlotStorage,
  psu: IconSlotPsu,
  cooler: IconSlotCooler,
  case: IconSlotCase,
  monitor: IconSlotMonitor,
  peripheral: IconSlotPeripheral,
  accessory: IconSlotAccessory,
}

export function SlotIcon({ slot, size = 20, color = 'currentColor', strokeWidth = 1.9 }) {
  const C = SLOT_ICON_MAP[slot] || IconSlotCpu
  return <C size={size} color={color} strokeWidth={strokeWidth} />
}

export function IconWechat({ size = 24, color = 'currentColor' }) {
  return wrap(
    size,
    <>
      <path
        d="M8.9 3.6C5.2 3.6 2.2 6.1 2.2 9.2c0 1.8.9 3.3 2.4 4.4l-.6 1.9 2.2-1.2c.6.2 1.2.3 1.8.3h.5c-.1-.4-.2-.9-.2-1.4 0-3 2.9-5.4 6.4-5.4h.5C14.6 5.4 12 3.6 8.9 3.6Zm-2.3 3a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9Zm4.7 0a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9Z"
        fill={color}
      />
      <path
        d="M21.8 13.2c0-2.6-2.5-4.7-5.6-4.7s-5.6 2.1-5.6 4.7 2.5 4.7 5.6 4.7c.6 0 1.2-.1 1.8-.3l1.9 1-.5-1.7c1.4-.9 2.4-2.2 2.4-3.7Zm-7.4-1.5a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Zm3.7 0a.82.82 0 1 1 0 1.64.82.82 0 0 1 0-1.64Z"
        fill={color}
      />
    </>,
  )
}

// 价格趋势（折线图）小图标
export function IconTrend({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(size, <>
    <path d="M4 5v14h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 14l3.5-4 3 2.5L20 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </>)
}

export function IconLock({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M8 10V7.2a4 4 0 0 1 8 0V10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconEye({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M2.4 12S6 6.6 12 6.6 21.6 12 21.6 12 18 17.4 12 17.4 2.4 12 2.4 12Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" stroke={color} strokeWidth={strokeWidth} />
    </>,
  )
}

export function IconSearch({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="11" cy="11" r="6.2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M15.6 15.6 20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconSliders({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path
        d="M6 20v-5.6M6 9.6V4M12 20v-4.2M12 11.6V4M18 20v-5.6M18 9.6V4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle cx="6" cy="11.9" r="2.1" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="12" cy="13.9" r="2.1" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="18" cy="11.9" r="2.1" stroke={color} strokeWidth={strokeWidth} />
    </>,
  )
}

export function IconBook({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M12 6.4C10.4 5.2 8.5 4.6 6 4.6c-1.1 0-2.1.14-2.9.42V19c.8-.28 1.8-.42 2.9-.42 2.5 0 4.4.6 6 1.82" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 6.4c1.6-1.2 3.5-1.8 6-1.8 1.1 0 2.1.14 2.9.42V19c-.8-.28-1.8-.42-2.9-.42-2.5 0-4.4.6-6 1.82" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 6.4v14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconSwap({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M3.6 8.2h13.2M13.8 5.2l3 3-3 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.4 15.8H7.2M10.2 12.8l-3 3 3 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

export function IconBolt({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <path d="M13.2 3.2 5.4 13.6h5.1l-.7 7.2 7.8-10.4h-5.1l.7-7.2Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />,
  )
}

export function IconHeart({ size = 24, color = 'currentColor', strokeWidth = 2, fill = 'none' }) {
  return wrap(
    size,
    <path
      d="M12 20.2s-7.2-4.4-7.2-9.4a3.95 3.95 0 0 1 7.2-2.32A3.95 3.95 0 0 1 19.2 10.8c0 5-7.2 9.4-7.2 9.4Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill={fill}
      strokeLinejoin="round"
    />,
  )
}

export function IconPlus({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />,
  )
}

export function IconChevron({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <path d="M9.2 5.4 15.8 12l-6.6 6.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />,
  )
}

/* ---------- 广场标签 / 编辑资料 ---------- */

// 标签（价签造型）：用于广场的「标签」展开按钮
export function IconTag({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path
        d="M11.5 3.6H5.4c-1 0-1.8.8-1.8 1.8v6.1c0 .48.19.94.53 1.27l7.2 7.2a1.8 1.8 0 0 0 2.55 0l6.1-6.1a1.8 1.8 0 0 0 0-2.55l-7.2-7.2a1.8 1.8 0 0 0-1.28-.52Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="7.9" cy="7.9" r="1.35" fill={color} />
    </>,
  )
}

// 编辑资料（方框 + 铅笔）：用于头像右上角的入口
export function IconEdit({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path
        d="M20 12.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19V5.6A1.6 1.6 0 0 1 5.6 4h6.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M17.7 3.9a1.85 1.85 0 0 1 2.6 2.6l-7.2 7.2-3.4.8.8-3.4 7.2-7.2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </>,
  )
}

export function IconHistory({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M4.4 12a7.6 7.6 0 1 0 2.24-5.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4.4 4.6v3.6h3.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.4V12l2.5 1.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

export function IconSend({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M20.6 3.4 3.6 10.2l6.2 2.4 2.4 6.2L20.6 3.4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M9.8 12.6 20.6 3.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconBookmark({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <path d="M7 4h10a1.1 1.1 0 0 1 1.1 1.1V20l-6.1-3.6L6 20V5.1A1.1 1.1 0 0 1 7 4Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />,
  )
}

export function IconCheck({ size = 24, color = 'currentColor' }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M7.5 12.3l3 2.9 6-6.1" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

export function IconOrder({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M3.6 7.6 12 3.6l8.4 4v8.8L12 20.4l-8.4-4V7.6Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M3.6 7.6 12 11.6l8.4-4M12 11.6v8.8" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </>,
  )
}

export function IconPin({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M12 20.8s6.4-6.1 6.4-10.4A6.4 6.4 0 0 0 5.6 10.4C5.6 14.7 12 20.8 12 20.8Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx="12" cy="10.4" r="2.4" stroke={color} strokeWidth={strokeWidth} />
    </>,
  )
}

export function IconBell({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M18.2 16.2H5.8l1.5-2.2v-4a4.7 4.7 0 0 1 9.4 0v4l1.5 2.2Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M10 19.2a2 2 0 0 0 4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconHelp({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="12" r="8.4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9.6 9.7a2.5 2.5 0 1 1 3.5 2.3c-.7.35-1.1.85-1.1 1.7v.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="16.4" r="1" fill={color} />
    </>,
  )
}

export function IconInfo({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="12" r="8.4" stroke={color} strokeWidth={strokeWidth} />
      <path d="M12 11.2v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <circle cx="12" cy="8.2" r="1.05" fill={color} />
    </>,
  )
}

export function IconLogout({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M14.6 5H6.6A1.6 1.6 0 0 0 5 6.6v10.8A1.6 1.6 0 0 0 6.6 19h8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 12h8M17.2 8.6 20.6 12l-3.4 3.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

/* ---------- 主题 / 我的页 图标 ---------- */

export function IconSun({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="12" r="4.1" stroke={color} strokeWidth={strokeWidth} />
      <path
        d="M12 2.4v2.3M12 19.3v2.3M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.4 12h2.3M19.3 12h2.3M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </>,
  )
}

export function IconMoon({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <path
      d="M20.4 14.2A8.6 8.6 0 0 1 9.8 3.6a8.6 8.6 0 1 0 10.6 10.6Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />,
  )
}

export function IconImage({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect x="3" y="4.6" width="18" height="14.8" rx="3" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="8.4" cy="9.6" r="1.7" stroke={color} strokeWidth={strokeWidth} />
      <path
        d="M3.7 16.6l4.6-3.9 3.9 3.3 3-2.5 4.1 3.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  )
}

export function IconStar({ size = 24, color = 'currentColor', strokeWidth = 2, fill = 'none' }) {
  return wrap(
    size,
    <path
      d="M12 3.5l2.62 5.3 5.85.85-4.23 4.13 1 5.82L12 16.85l-5.24 2.75 1-5.82L3.53 9.65l5.85-.85L12 3.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill={fill}
      strokeLinejoin="round"
    />,
  )
}

export function IconCoin({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
      <path d="M9 10l3-3 3 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7v8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M9.5 13h5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

// 礼物盒：积分抽奖卡片与中奖结果使用
export function IconGift({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M4 10h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M3 7h18v3H3z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M12 7v14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 7S10.5 3 8 3a2.2 2.2 0 0 0 0 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7s1.5-4 4-4a2.2 2.2 0 0 1 0 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

// 货车：收货地址 / 物流相关入口
export function IconTruck({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M3 7h10v9H3z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d="M13 10h4l3 3v3h-7z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" stroke={color} strokeWidth={strokeWidth} />
      <circle cx="17" cy="18" r="1.6" stroke={color} strokeWidth={strokeWidth} />
      <path d="M3 16h2M8.6 18h6.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconComment({ size = 24, color = 'currentColor', strokeWidth = 2, fill = 'none' }) {
  return wrap(
    size,
    <path
      d="M20 4H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2v4l4.5-4H20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill={fill}
      strokeLinejoin="round"
    />,
  )
}

export function IconPencil({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path
        d="M4 20.2h3.6L18.1 9.7a2.05 2.05 0 0 0-2.9-2.9L4.7 17.3v2.9Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M14.4 7.6l2.4 2.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconShield({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path
        d="M12 3.2 5 6.1v5.3c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6.1L12 3.2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M9.3 12.1l2 2 3.5-3.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </>,
  )
}

export function IconClose({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconTrash({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path
        d="M4 7h16M9.5 7V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V7M6.5 7l.8 11.2c0 .5.4.8.9.8h7.6c.5 0 .9-.3.9-.8L17.5 7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.5 11v5M13.5 11v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

// 显示模式切换：四宫格（瀑布）视图
export function IconGrid({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" stroke={color} strokeWidth={strokeWidth} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" stroke={color} strokeWidth={strokeWidth} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" stroke={color} strokeWidth={strokeWidth} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" stroke={color} strokeWidth={strokeWidth} />
    </>,
  )
}

// 显示模式切换：单列（表列）视图
export function IconList({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <path d="M8 6h12M8 12h12M8 18h12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconPhone({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect
        x="7"
        y="2.5"
        width="10"
        height="19"
        rx="2.6"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path d="M10.8 5.4h2.4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

export function IconIdCard({ size = 24, color = 'currentColor', strokeWidth = 2 }) {
  return wrap(
    size,
    <>
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="2.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="10.5" r="2" stroke={color} strokeWidth={strokeWidth} />
      <path d="M5.5 15.2c.6-1.5 1.7-2.2 3-2.2s2.4.7 3 2.2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M15 10h4M15 13h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </>,
  )
}

// 状态栏右侧图标（信号 / Wi-Fi / 电池），严格按设计稿比例绘制
export function StatusIcons({ color = 'currentColor' }) {
  return (
    <div className="sb-icons">
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="9" width="3" height="5" rx="1" fill={color} />
        <rect x="5" y="6.5" width="3" height="7.5" rx="1" fill={color} />
        <rect x="10" y="3.5" width="3" height="10.5" rx="1" fill={color} />
        <rect x="15" y="0" width="3" height="14" rx="1" fill={color} />
      </svg>
      <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 4.4C3.2 2.4 5.9 1.3 8.5 1.3s5.3 1.1 7.5 3.1" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
        <path d="M3.7 7.6c1.4-1.3 3.1-2 4.8-2s3.4.7 4.8 2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="8.5" cy="11.6" r="1.8" fill={color} />
      </svg>
      <svg width="25" height="13" viewBox="0 0 25 13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.7" y="0.7" width="20.1" height="11.1" rx="3.2" stroke={color} strokeWidth="1.4" />
        <rect x="2.5" y="2.5" width="15" height="7.5" rx="2" fill={color} />
        <rect x="22.2" y="4.2" width="2" height="4.6" rx="1" fill={color} />
      </svg>
    </div>
  )
}
