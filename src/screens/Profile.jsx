import { useState, useEffect, useCallback } from 'react'
import {
  IconMoon,
  IconSun,
  IconImage,
  IconStar,
  IconPencil,
  IconHistory,
  IconBell,
  IconShield,
  IconInfo,
  IconChevron,
  IconEdit,
  IconLogout,
} from '../components/Icons.jsx'
import { profileStats, profileGroups, HERO_BGS } from '../data.js'
import { api } from '../apiClient.js'
import { authStatusLabel } from '../format.js'

const MENU_ICONS = {
  star: IconStar,
  pencil: IconPencil,
  history: IconHistory,
  bell: IconBell,
  shield: IconShield,
  info: IconInfo,
}

// 头像插画（简化版 3D 角色：橙色短发 + 紫色连帽衫）
function AvatarArt() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <rect width="100" height="100" fill="#E4E1F7" />
      <path d="M14 100c0-19 16-30 36-30s36 11 36 30Z" fill="#7C5CFF" />
      <path d="M50 70l-9 30h18z" fill="#6A47E6" />
      <rect x="42.5" y="58" width="15" height="14" rx="7" fill="#E3B189" />
      <circle cx="50" cy="42" r="21" fill="#F4C79B" />
      <path d="M29 41c0-13 9-22.5 21-22.5S71 28 71 41c0-6.5-7-10-21-10s-21 3.5-21 10Z" fill="#E8622A" />
      <path d="M29 41c2-3 6-4.5 8-4-2 2-2.5 4-2.5 6.5Z" fill="#E8622A" />
      <circle cx="42.5" cy="42.5" r="2.5" fill="#2B2E5B" />
      <circle cx="57.5" cy="42.5" r="2.5" fill="#2B2E5B" />
      <circle cx="36.5" cy="47.5" r="3" fill="#F0A98C" opacity="0.7" />
      <circle cx="63.5" cy="47.5" r="3" fill="#F0A98C" opacity="0.7" />
      <path d="M44.5 50.5c1.8 2.8 9.2 2.8 11 0" stroke="#B4794F" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// 06 我的（大标题 + 深色个人卡 + 三栏数据 + 两组功能列表 + 主题切换）
// 背景、菜单角标全部走真实接口：换背景会落库，刷新不回退
export default function Profile({ onLogout, theme = 'light', onToggleTheme, onOpen, onOpenLegal }) {
  const [heroBg, setHeroBg] = useState(0)
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ unread: 0, favorites: 0, posts: 0, history: 0 })

  const loadMe = useCallback(() => {
    let alive = true
    api
      .get('my/me')
      .then((d) => {
        if (!alive) return
        setMe(d)
        if (d && d.profile && typeof d.profile.heroBg === 'number') setHeroBg(d.profile.heroBg)
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const cancel = loadMe()
    return cancel
  }, [loadMe])

  // 角标 / 数量：全部取真实条数，不再写死演示值
  useEffect(() => {
    let alive = true
    Promise.all([
      api.get('my/messages/unread-count'),
      api.get('my/favorites?pageSize=1'),
      api.get('my/posts?pageSize=1'),
      api.get('my/history?pageSize=1'),
    ])
      .then(([u, f, p, h]) => {
        if (!alive) return
        setCounts({
          unread: (u && u.unread) || 0,
          favorites: (f && f.total) || 0,
          posts: (p && p.total) || 0,
          history: (h && h.total) || 0,
        })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // 换背景：先本地生效，再落库；失败回滚并提示
  const cycleBg = async () => {
    const next = (heroBg + 1) % HERO_BGS.length
    const prev = heroBg
    setHeroBg(next)
    try {
      await api.put('my/profile', { heroBg: next })
    } catch {
      setHeroBg(prev)
    }
  }

  const name = (me && me.nickname) || '玩家'
  const verified = me ? authStatusLabel(me.profile && me.profile.authStatus) : '未认证'
  const meta = me ? `玩家ID ${me.id} · ${verified}` : ''

  const countOf = (key) => {
    if (key === 'favorites') return counts.favorites ? String(counts.favorites) : ''
    if (key === 'posts') return counts.posts ? String(counts.posts) : ''
    if (key === 'history') return counts.history ? String(counts.history) : ''
    return ''
  }

  const openMenu = (m) => {
    if (!onOpen) return
    if (m.key === 'about') onOpen('about')
    else onOpen(m.key)
  }

  return (
    <div className="profile">
      <div className="pf-top">
        <h1>我的</h1>
        <button
          className="theme-btn"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? '切换到白天模式' : '切换到暗夜模式'}
          title={theme === 'dark' ? '切换到白天模式' : '切换到暗夜模式'}
        >
          {theme === 'dark' ? <IconMoon size={22} /> : <IconSun size={22} />}
        </button>
      </div>

      <div className="pf-hero" style={{ background: HERO_BGS[heroBg % HERO_BGS.length] }}>
        <button className="hero-bgbtn" type="button" onClick={cycleBg}>
          <IconImage size={15} color="#FFFFFF" strokeWidth={1.9} />
          <span>更换背景</span>
        </button>

        <div className="hero-avatar-wrap">
          <div className="hero-avatar">
            {me && me.avatarUrl ? <img src={me.avatarUrl} alt="头像" /> : <AvatarArt />}
          </div>
          {/* 头像右上角：编辑资料入口（原先是消息提醒铃铛） */}
          <button
            className="hero-badge"
            type="button"
            aria-label="编辑资料"
            title="编辑资料"
            onClick={() => onOpen && onOpen('editProfile')}
          >
            <IconEdit size={15} color="#2B2E5B" strokeWidth={2.1} />
          </button>
        </div>

        {loading ? (
          <div className="hero-name-row">
            <span className="hero-name">加载中…</span>
          </div>
        ) : (
          <>
            <div className="hero-name-row">
              <span className="hero-name">{name}</span>
              <span className="hero-verified">{verified}</span>
            </div>
            <p className="hero-meta">{meta}</p>
          </>
        )}
      </div>

      <div className="pf-stats">
        {profileStats.map((s) => (
          <div className="pf-stat" key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="pf-stats-note">关注 / 粉丝 / 获赞为演示数据，筹备中</p>

      <div className="pf-groups">
        {profileGroups.map((group, gi) => (
          <div className="pf-group" key={gi}>
            {group.map((m) => {
              const Ico = MENU_ICONS[m.icon]
              const badge = m.key === 'messages' && counts.unread > 0 ? String(counts.unread) : ''
              return (
                <button className="pf-row" type="button" key={m.label} onClick={() => openMenu(m)}>
                  <span className={'pf-row-ic tone-' + m.tone}>
                    <Ico size={20} />
                  </span>
                  <span className="pf-row-label">{m.label}</span>
                  {countOf(m.key) ? <span className="pf-row-count">{countOf(m.key)}</span> : null}
                  {badge ? <span className="pf-row-badge">{badge}</span> : null}
                  <span className="pf-row-chev">
                    <IconChevron size={17} strokeWidth={2} />
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <button className="pf-logout" type="button" onClick={onLogout}>
        <IconLogout size={19} color="currentColor" strokeWidth={2} />
        <span>退出登录</span>
      </button>
    </div>
  )
}
