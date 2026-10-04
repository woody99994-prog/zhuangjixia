import { useState, useEffect, useCallback } from 'react'
import { IconChevron, IconClose } from '../components/Icons.jsx'
import { api } from '../apiClient.js'
import { yuan } from '../format.js'
import { HERO_BGS } from '../data.js'
import { normalizePlan } from '../configTable.js'
import ConfigDetailView from '../components/ConfigDetailView.jsx'

// 一级分类：帖子 / 配置 同行并列
const MAIN_TABS = [
  { key: 'posts', label: '帖子' },
  { key: 'configs', label: '配置' },
]
// 二级排序 tab：随一级分类切换
const POST_TABS = [
  { key: 'latest', label: '最新' },
  { key: 'essence', label: '精选' },
]
const CFG_TABS = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '最热' },
]

// 查看其他用户的主页：
// 背景图(风景) + 居中头像 → 关注/粉丝/获赞 → 帖子·配置 同行一级 tab → 各自二级 tab → 列表
export default function UserProfile({ userId, onBack, onOpenArticle }) {
  const [profile, setProfile] = useState(null)
  const [avatarErr, setAvatarErr] = useState(false)

  // 一级 tab：posts | configs
  const [mainTab, setMainTab] = useState('posts')

  // 帖子列表（tab: latest | essence）
  const [postTab, setPostTab] = useState('latest')
  const [posts, setPosts] = useState([])
  const [postPage, setPostPage] = useState(1)
  const [postTotal, setPostTotal] = useState(0)
  const [postLoading, setPostLoading] = useState(true)
  const [postLoadingMore, setPostLoadingMore] = useState(false)

  // 配置列表（tab: latest | hot）
  const [cfgTab, setCfgTab] = useState('latest')
  const [cfgs, setCfgs] = useState([])
  const [cfgPage, setCfgPage] = useState(1)
  const [cfgTotal, setCfgTotal] = useState(0)
  const [cfgLoading, setCfgLoading] = useState(true)
  const [cfgLoadingMore, setCfgLoadingMore] = useState(false)

  const [followBusy, setFollowBusy] = useState(false)

  // 配置详情：点卡片进入（公开只读接口 configs/:id），返回回到本主页
  const [cfgDetail, setCfgDetail] = useState(null)
  const [cfgDetailLoading, setCfgDetailLoading] = useState(false)

  const openCfg = (c) => {
    // 先用列表已有数据兜底渲染，接口回来再覆盖，避免点击后白屏等待
    setCfgDetail(c)
    setCfgDetailLoading(true)
    api
      .get('configs/' + c.id, { auth: false })
      .then((d) => setCfgDetail((prev) => (prev && String(prev.id) === String(c.id) ? d : prev)))
      .catch(() => {})
      .finally(() => setCfgDetailLoading(false))
  }

  // 资料（含统计 + isFollowing + heroBg）
  useEffect(() => {
    let alive = true
    setProfile(null)
    setAvatarErr(false)
    api
      .get('users/' + userId)
      .then((d) => alive && setProfile(d))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [userId])

  const loadPosts = useCallback(
    (pg = 1, append = false) => {
      if (pg === 1) setPostLoading(true)
      else setPostLoadingMore(true)
      api
        .get(`users/${userId}/posts?tab=${postTab}&page=${pg}&pageSize=20`)
        .then((d) => {
          const list = (d && d.items) || []
          const t = d && typeof d.total === 'number' ? d.total : list.length
          setPosts(append ? (prev) => [...prev, ...list] : list)
          setPostTotal(t)
          setPostPage(pg)
        })
        .catch(() => {
          if (pg === 1) setPosts([])
        })
        .finally(() => {
          if (pg === 1) setPostLoading(false)
          else setPostLoadingMore(false)
        })
    },
    [userId, postTab],
  )

  const loadCfgs = useCallback(
    (pg = 1, append = false) => {
      if (pg === 1) setCfgLoading(true)
      else setCfgLoadingMore(true)
      api
        .get(`users/${userId}/configs?tab=${cfgTab}&page=${pg}&pageSize=20`)
        .then((d) => {
          const list = (d && d.items) || []
          const t = d && typeof d.total === 'number' ? d.total : list.length
          setCfgs(append ? (prev) => [...prev, ...list] : list)
          setCfgTotal(t)
          setCfgPage(pg)
        })
        .catch(() => {
          if (pg === 1) setCfgs([])
        })
        .finally(() => {
          if (pg === 1) setCfgLoading(false)
          else setCfgLoadingMore(false)
        })
    },
    [userId, cfgTab],
  )

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])
  useEffect(() => {
    loadCfgs(1)
  }, [loadCfgs])

  const loadMorePosts = () => {
    if (postLoadingMore) return
    loadPosts(postPage + 1, true)
  }
  const loadMoreCfgs = () => {
    if (cfgLoadingMore) return
    loadCfgs(cfgPage + 1, true)
  }

  const toggleFollow = async () => {
    if (followBusy || !profile) return
    setFollowBusy(true)
    try {
      const res = profile.isFollowing
        ? await api.del('my/follow/' + userId)
        : await api.post('my/follow/' + userId)
      setProfile((p) => ({ ...p, isFollowing: res.isFollowing, followerCount: res.followerCount }))
    } catch {
      /* 忽略：保持原状态 */
    } finally {
      setFollowBusy(false)
    }
  }

  const initial = (profile && profile.nickname ? profile.nickname : '?').trim().charAt(0)
  const heroIdx = profile && typeof profile.heroBg === 'number' ? profile.heroBg : 0
  const heroBg = HERO_BGS[((heroIdx % HERO_BGS.length) + HERO_BGS.length) % HERO_BGS.length]

  // 当前一级分类下的二级 tab
  const subTabs = mainTab === 'posts' ? POST_TABS : CFG_TABS
  const subActive = mainTab === 'posts' ? postTab : cfgTab
  const setSubActive = mainTab === 'posts' ? setPostTab : setCfgTab

  const listLoading = mainTab === 'posts' ? postLoading : cfgLoading
  const emptyText = mainTab === 'posts' ? '暂无帖子' : '暂无配置'

  // 配置详情（只读）：整屏覆盖主页，返回按钮回主页 —— 别人主页里的配置也要能看全清单 + 兼容性
  if (cfgDetail) {
    const au = cfgDetail.author
    return (
      <div className="up">
        <div className="up-head">
          <button className="up-back" type="button" aria-label="返回" onClick={() => setCfgDetail(null)}>
            <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <h1>配置详情</h1>
          {cfgDetailLoading ? <span className="up-head-state">加载中…</span> : null}
        </div>

        {au ? (
          <div className="up-cfg-author">
            {au.avatarUrl ? (
              <img className="up-cfg-av" src={au.avatarUrl} alt="" />
            ) : (
              <span className="up-cfg-av as-fallback">{(au.nickname || '?').trim().charAt(0)}</span>
            )}
            <span className="up-cfg-author-name">{au.nickname || '装机匣玩家'}</span>
            <span className="up-cfg-author-tag">的配置</span>
          </div>
        ) : null}

        <ConfigDetailView detail={cfgDetail} />
      </div>
    )
  }

  return (
    <div className="up">
      <div className="up-head">
        <button className="up-back" type="button" aria-label="返回" onClick={onBack}>
          <IconChevron size={22} color="var(--ink)" strokeWidth={2.2} />
        </button>
        <h1>个人主页</h1>
      </div>

      {/* 背景图（可为风景照）+ 居中头像 + 关注/粉丝/获赞 */}
      <div className="up-hero" style={{ background: heroBg }}>
        <div className="up-hero-inner">
          <div className="up-avatar">
            {profile && profile.avatarUrl && !avatarErr ? (
              <img src={profile.avatarUrl} alt="头像" onError={() => setAvatarErr(true)} />
            ) : (
              <span className="up-avatar-fallback">{initial}</span>
            )}
          </div>

          <div className="up-name">{profile ? profile.nickname : '加载中…'}</div>
          {profile && profile.bio ? <p className="up-bio">{profile.bio}</p> : null}

          <div className="up-stats">
            <div className="up-stat">
              <b>{profile ? profile.followingCount : 0}</b>
              <span>关注</span>
            </div>
            <div className="up-stat">
              <b>{profile ? profile.followerCount : 0}</b>
              <span>粉丝</span>
            </div>
            <div className="up-stat">
              <b>{profile ? profile.likeCount : 0}</b>
              <span>获赞</span>
            </div>
          </div>

          {profile && !profile.isSelf ? (
            <button
              className={'up-follow' + (profile.isFollowing ? ' is-following' : '')}
              type="button"
              onClick={toggleFollow}
              disabled={followBusy}
            >
              {profile.isFollowing ? '已关注' : '关注'}
            </button>
          ) : null}
        </div>
      </div>

      {/* 一级：帖子 / 配置（同行） */}
      <div className="up-maintabs">
        {MAIN_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'up-maintab' + (mainTab === t.key ? ' is-active' : '')}
            onClick={() => setMainTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 二级：最新/精选 或 最新/最热 */}
      <div className="up-sec">
        <div className="up-sec-tabs">
          {subTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={'up-sectab' + (subActive === t.key ? ' is-active' : '')}
              onClick={() => setSubActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="up-list">
          {listLoading ? (
            <div className="feed-empty">加载中…</div>
          ) : mainTab === 'posts' ? (
            posts.length === 0 ? (
              <div className="feed-empty">{emptyText}</div>
            ) : (
              <>
                {/* 帖子：不显示封面，仅 标题 + 点赞数 + 浏览数 */}
                {posts.map((p, i) => (
                  <article
                    className="post up-post"
                    key={p.id != null ? String(p.id) : i}
                    onClick={() => onOpenArticle && onOpenArticle({ kind: 'post', id: String(p.id), ...p })}
                  >
                    <h3 className="post-title">{p.title}</h3>
                    <div className="post-foot">
                      <span>{p.likeCount || 0} 赞</span>
                      <span className="up-dot">·</span>
                      <span>{p.viewCount || 0} 浏览</span>
                    </div>
                  </article>
                ))}
                {posts.length < postTotal && (
                  <button className="sr-more" type="button" onClick={loadMorePosts} disabled={postLoadingMore}>
                    {postLoadingMore ? '加载中…' : '加载更多'}
                  </button>
                )}
              </>
            )
          ) : cfgs.length === 0 ? (
            <div className="feed-empty">{emptyText}</div>
          ) : (
            <>
              {cfgs.map((c, i) => {
                const parts = normalizePlan(c.planJson).rows.length
                return (
                  <article
                    className="post up-cfg"
                    key={c.id != null ? String(c.id) : i}
                    role="button"
                    tabIndex={0}
                    onClick={() => openCfg(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openCfg(c)
                    }}
                  >
                    <h3 className="post-title">{c.title}</h3>
                    {c.remark ? <p className="up-cfg-remark">{c.remark}</p> : null}
                    <div className="post-foot">
                      <span>{`${parts} 个配件 · 总价 ${yuan(c.totalPriceCents)}`}</span>
                      <span className="up-cfg-more">查看详情</span>
                    </div>
                  </article>
                )
              })}
              {cfgs.length < cfgTotal && (
                <button className="sr-more" type="button" onClick={loadMoreCfgs} disabled={cfgLoadingMore}>
                  {cfgLoadingMore ? '加载中…' : '加载更多'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
