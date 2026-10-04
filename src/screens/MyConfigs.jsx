import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  IconMonitor,
  IconPlus,
  IconClose,
  IconTrash,
  IconSearch,
  IconTrend,
  IconChip,
  SlotIcon,
} from '../components/Icons.jsx'
import { CONFIG_SLOTS } from '../data.js'
import { api } from '../apiClient.js'
import { yuan } from '../format.js'
import { planTotalYuan, normalizePlan } from '../configTable.js'
import PriceTrendChart, { PRICE_SOURCES } from '../components/PriceTrendChart.jsx'
import ConfigDetailView, { planPreview } from '../components/ConfigDetailView.jsx'

// 列表卡片只露前 3 件配件，其余折叠成「+N 项」：
// 11 个槽位全铺开会把卡片撑得很高，完整清单点进卡片看详情
const PREVIEW_SLOTS = 3
const MODEL_MAX = 12

// 价格走势时间窗（与后端 RANGE_DAYS 对齐）
const RANGES = [
  { k: '1d', label: '1天' },
  { k: '7d', label: '7天' },
  { k: '1m', label: '1月' },
  { k: '6m', label: '半年' },
  { k: '1y', label: '1年' },
]
const RANGE_LABEL = { '1d': '1天', '7d': '7天', '1m': '1月', '6m': '半年', '1y': '1年' }

// 取某来源最新价（分）；优先 official，无则回退任一来源
const trendCurrent = (data, key) => {
  const arr = (data && data.sources && data.sources[key]) || []
  return arr.length ? arr[arr.length - 1].priceCents : null
}
// 区间涨跌百分比：用首个有数据的来源（official>jd>taobao）的首末点计算
const trendChangePct = (data) => {
  const primary =
    (data && data.sources && (data.sources.official || data.sources.jd || data.sources.taobao)) || []
  if (primary.length < 2 || !primary[0].priceCents) return null
  return ((primary[primary.length - 1].priceCents - primary[0].priceCents) / primary[0].priceCents) * 100
}

const shortModel = (m) => {
  const t = String(m || '')
  return t.length > MODEL_MAX ? t.slice(0, MODEL_MAX) + '…' : t
}

const emptyPlan = () =>
  CONFIG_SLOTS.reduce((acc, s) => {
    acc[s.key] = { model: '', price: 0 }
    return acc
  }, {})

// 05 我的配置（列表 + 详情 + 新建 / 编辑 / 删除，11 个固定槽位）
export default function MyConfigs({ onLogout }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [cfgTotal, setCfgTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState('')
  // 编辑器：null=列表；{ id?, title, plan }=编辑中（id 为空即新建）
  const [editing, setEditing] = useState(null)
  // 详情页：选中查看的配置（点击列表卡片进入）
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)

  // 硬件选择弹层：{ key, cn }=当前在挑的槽位
  const [picker, setPicker] = useState(null)
  const [hwQuery, setHwQuery] = useState('')
  const [hwTab, setHwTab] = useState('hot') // hot | latest | value
  const [hwList, setHwList] = useState([])
  const [hwLoading, setHwLoading] = useState(false)

  // 价格走势弹层：{ hardware, range, data, loading, err } | null
  const [trend, setTrend] = useState(null)

  const load = useCallback((pg = 1, append = false) => {
    let alive = true
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    api
      .get('my/configs?page=' + pg + '&pageSize=20')
      .then((d) => {
        if (!alive) return
        const items = d && d.items ? d.items : []
        const t = d && typeof d.total === 'number' ? d.total : items.length
        setList(append ? (prev) => [...prev, ...items] : items)
        setCfgTotal(t)
        setPage(pg)
      })
      .catch((e) => {
        if (!alive) return
        if (pg === 1) {
          if (e.code === 'UNAUTHORIZED' && onLogout) onLogout()
          else setErr(e.message || '加载失败')
        }
      })
      .finally(() => {
        if (!alive) return
        if (pg === 1) setLoading(false)
        else setLoadingMore(false)
      })
    return () => {
      alive = false
    }
  }, [onLogout])

  const loadMore = () => {
    if (loadingMore) return
    load(page + 1, true)
  }

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [load])

  const toast = (m) => {
    setFlash(m)
    setTimeout(() => setFlash(''), 2400)
  }

  const openNew = () => setEditing({ id: null, title: '', plan: emptyPlan() })

  const openEdit = (c) => {
    const plan = emptyPlan()
    // 清单格式（parts[]）的配置也要能编辑：先归一化，再回填到 11 个槽位
    for (const r of normalizePlan(c.planJson || {}).rows) {
      if (plan[r.slot]) plan[r.slot] = { model: r.model, price: Number(r.price) || 0 }
    }
    setEditing({ id: c.id, title: c.title || '', plan })
  }

  const setSlot = (key, patch) =>
    setEditing((e) => (e ? { ...e, plan: { ...e.plan, [key]: { ...e.plan[key], ...patch } } } : e))

  const totalYuan = editing ? planTotalYuan(editing.plan) : 0

  const save = async () => {
    if (!editing || saving) return
    const title = (editing.title || '').trim()
    if (!title) {
      toast('给这套配置起个名字')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title,
        planJson: editing.plan,
        totalPriceCents: Math.round(totalYuan * 100),
        remark: CONFIG_SLOTS.map((s) => (editing.plan[s.key] || {}).model)
          .filter(Boolean)
          .slice(0, 3)
          .join(' / '),
      }
      if (editing.id) await api.put('my/configs/' + editing.id, payload)
      else await api.post('my/configs', payload)
      setEditing(null)
      setDetail(null)
      load()
      toast(editing.id ? '配置已更新' : '配置已保存')
    } catch (e) {
      toast((e && e.message) || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (c) => {
    try {
      await api.del('my/configs/' + c.id)
      setList((prev) => prev.filter((x) => String(x.id) !== String(c.id)))
      toast('已删除')
    } catch (e) {
      toast((e && e.message) || '删除失败')
    }
  }

  const total = list.reduce((s, c) => s + (Number(c.totalPriceCents) || 0), 0)

  // —— 硬件选择弹层 ——
  const openPicker = (s) => {
    setPicker({ key: s.key, cn: s.cn, category: s.category })
    setHwQuery('')
    setHwTab('hot')
    setHwLoading(true)
    api
      .get('hardware?category=' + s.category, { auth: false })
      .then((d) => setHwList(Array.isArray(d) ? d : []))
      .catch(() => setHwList([]))
      .finally(() => setHwLoading(false))
  }

  const chooseHw = (h) => {
    if (!picker) return
    setSlot(picker.key, { model: h.model, price: Math.round((h.priceCents || 0) / 100) })
    setPicker(null)
  }

  // —— 价格走势弹层 ——（公开接口，无需登录）
  const loadTrend = (hardware, range, keepData) => {
    setTrend((prev) => ({
      hardware,
      range,
      data: keepData && prev ? prev.data : null,
      loading: true,
      err: '',
    }))
    api
      .get('hardware/' + hardware.id + '/price-history?range=' + range, { auth: false })
      .then((d) => setTrend({ hardware, range, data: d, loading: false, err: '' }))
      .catch((e) => setTrend({ hardware, range, data: null, loading: false, err: (e && e.message) || '加载失败' }))
  }
  const openTrend = (h) => loadTrend(h, '1y', false)
  const changeTrendRange = (r) => {
    if (trend) loadTrend(trend.hardware, r, true)
  }
  const closeTrend = () => setTrend(null)

  // 搜索 + 排序（热门=评分降序 / 最新=创建时间降序 / 性价比=评分÷价格）
  const displayedHw = useMemo(() => {
    const q = hwQuery.trim().toLowerCase()
    let arr = hwList
    if (q) arr = arr.filter((h) => (h.model + ' ' + (h.brand || '')).toLowerCase().includes(q))
    const sorted = [...arr]
    if (hwTab === 'latest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    else if (hwTab === 'value')
      sorted.sort((a, b) => b.score / (b.priceCents || 1) - a.score / (a.priceCents || 1))
    else sorted.sort((a, b) => b.score - a.score)
    return sorted
  }, [hwList, hwQuery, hwTab])

  // —— 详情页 ——
  // editing 时让位给编辑器：详情分支写在编辑器之前，不加这个判断会出现
  // 「点了编辑没反应，要再关一次详情才进编辑器」（detail 一直为真，抢先 return）
  if (detail && !editing) {
    return (
      <div className="configs">
        <div className="mc-head">
          <button className="mc-back" type="button" onClick={() => setDetail(null)}>
            <IconClose size={18} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <h1>配置详情</h1>
          <div className="cfg-detail-acts">
            <button className="btn-ghost sm" type="button" onClick={() => openEdit(detail)}>
              编辑
            </button>
            <button
              className="btn-ghost sm danger"
              type="button"
              onClick={() => {
                const c = detail
                setDetail(null)
                remove(c)
              }}
            >
              删除
            </button>
          </div>
        </div>

        <ConfigDetailView detail={detail} />
      </div>
    )
  }

  // —— 编辑器视图 ——
  if (editing) {
    return (
      <div className="configs">
        <div className="mc-head">
          <button className="mc-back" type="button" onClick={() => setEditing(null)} disabled={saving}>
            <IconClose size={18} color="var(--ink)" strokeWidth={2.2} />
          </button>
          <h1>{editing.id ? '编辑配置' : '新建配置'}</h1>
          <button
            className="btn-new"
            type="button"
            onClick={save}
            disabled={saving || !(editing.title || '').trim()}
          >
            <span>{saving ? '保存中…' : '保存'}</span>
          </button>
        </div>

        <div className="cfg-editor">
          <label className="cfg-field">
            <span className="cfg-label">配置名称</span>
            <input
              className="cfg-input"
              value={editing.title}
              placeholder="例如：2K 游戏主机 · 8000 预算"
              maxLength={40}
              onChange={(e) => setEditing((v) => ({ ...v, title: e.target.value }))}
            />
          </label>

          {CONFIG_SLOTS.map((s) => {
            const slot = editing.plan[s.key] || {}
            return (
              <div className="cfg-slot" key={s.key}>
                <div className="cfg-slot-head">
                  <span className="cfg-slot-name">
                    <SlotIcon slot={s.key} size={18} />
                    {s.cn}
                  </span>
                  <button className="cfg-pick" type="button" onClick={() => openPicker(s)}>
                    <IconChip size={15} color="currentColor" strokeWidth={2} />
                    <span>从硬件库选择</span>
                  </button>
                </div>
                <div className="cfg-slot-row">
                  <input
                    className="cfg-input"
                    value={slot.model || ''}
                    placeholder="型号（可手填）"
                    onChange={(e) => setSlot(s.key, { model: e.target.value })}
                  />
                  <div className="cfg-price-wrap">
                    <span className="cfg-yuan">¥</span>
                    <input
                      className="cfg-input cfg-slot-price"
                      type="number"
                      min="0"
                      step="1"
                      value={slot.price || ''}
                      placeholder="0"
                      onChange={(e) => setSlot(s.key, { price: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="cfg-total-bar">
          <span>合计</span>
          <b>{yuan(Math.round(totalYuan * 100))}</b>
        </div>

        {/* 硬件选择弹层 */}
        {picker && (
          <div className="hw-mask" onClick={() => setPicker(null)}>
            <div className="hw-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hw-head">
                <div className="hw-title">
                  <SlotIcon slot={picker.key} size={18} />
                  <span>选择{picker.cn}</span>
                </div>
                <button className="hw-close" type="button" onClick={() => setPicker(null)}>
                  <IconClose size={18} color="var(--ink)" strokeWidth={2.2} />
                </button>
              </div>
              <div className="hw-search">
                <IconSearch size={16} color="var(--muted)" strokeWidth={2} />
                <input
                  className="hw-search-input"
                  placeholder="搜索型号 / 品牌"
                  value={hwQuery}
                  onChange={(e) => setHwQuery(e.target.value)}
                />
              </div>
              <div className="hw-tabs">
                <button className={'hw-tab' + (hwTab === 'hot' ? ' on' : '')} onClick={() => setHwTab('hot')}>
                  当前热门
                </button>
                <button className={'hw-tab' + (hwTab === 'latest' ? ' on' : '')} onClick={() => setHwTab('latest')}>
                  最新
                </button>
                <button className={'hw-tab' + (hwTab === 'value' ? ' on' : '')} onClick={() => setHwTab('value')}>
                  性价比
                </button>
              </div>
              <div className="hw-list">
                {hwLoading ? (
                  <div className="hw-empty">加载中…</div>
                ) : displayedHw.length === 0 ? (
                  <div className="hw-empty">没有匹配的硬件</div>
                ) : (
                  displayedHw.map((h) => (
                    <button className="hw-item" type="button" key={String(h.id)} onClick={() => chooseHw(h)}>
                      <div className="hw-item-main">
                        <div className="hw-item-model">{h.model}</div>
                        <div className="hw-item-brand">
                          {h.brand || '通用'} · 评分 {h.score}
                        </div>
                      </div>
                      <div className="hw-item-right">
                        <div className="hw-item-price">¥{Math.round((h.priceCents || 0) / 100)}</div>
                        <button
                          className="hw-trend"
                          type="button"
                          title="价格走势"
                          onClick={(e) => {
                            e.stopPropagation()
                            openTrend(h)
                          }}
                        >
                          <IconTrend size={15} color="var(--muted)" strokeWidth={2} />
                        </button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 价格走势弹层（公开接口，无需登录） */}
        {trend && (
          <div className="hw-mask trend-mask" onClick={closeTrend}>
            <div className="hw-modal trend-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hw-head">
                <div className="hw-title">
                  <IconTrend size={18} color="var(--brand)" strokeWidth={2} />
                  <span>价格走势</span>
                </div>
                <button className="hw-close" type="button" onClick={closeTrend}>
                  <IconClose size={18} color="var(--ink)" strokeWidth={2.2} />
                </button>
              </div>

              <div className="trend-meta">
                <span className="trend-hw-name">{trend.hardware.model}</span>
                <span className="trend-hw-brand">
                  {trend.hardware.brand || '通用'} · 评分 {trend.hardware.score}
                </span>
              </div>

              <div className="trend-ranges">
                {RANGES.map((r) => (
                  <button
                    key={r.k}
                    className={'trend-chip' + (trend.range === r.k ? ' on' : '')}
                    type="button"
                    onClick={() => changeTrendRange(r.k)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="trend-legend">
                {PRICE_SOURCES.map((s) => {
                  const has = ((trend.data && trend.data.sources && trend.data.sources[s.key]) || []).length
                  return (
                    <span className="trend-leg" key={s.key} style={{ opacity: has ? 1 : 0.4 }}>
                      <i className="trend-dot" style={{ background: s.color }} />
                      {s.label}
                    </span>
                  )
                })}
              </div>

              <div className="trend-chart-wrap">
                {trend.loading ? (
                  <div className="trend-empty">加载中…</div>
                ) : trend.err ? (
                  <div className="trend-empty">{trend.err}</div>
                ) : trend.data &&
                  (trend.data.sources.official?.length ||
                    trend.data.sources.jd?.length ||
                    trend.data.sources.taobao?.length) ? (
                  <PriceTrendChart series={trend.data} />
                ) : (
                  <div className="trend-empty">暂无价格数据</div>
                )}
              </div>

              {!trend.loading && trend.data && (
                <div className="trend-summary">
                  <span className="ts-cur">
                    {PRICE_SOURCES.filter((s) => trendCurrent(trend.data, s.key) != null).map((s, idx, arr) => (
                      <span key={s.key} className="ts-item">
                        <i className="trend-dot" style={{ background: s.color }} />
                        {s.label} {yuan(trendCurrent(trend.data, s.key))}
                        {idx < arr.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </span>
                  {trendChangePct(trend.data) != null && (
                    <span className={'ts-chg ' + (trendChangePct(trend.data) >= 0 ? 'up' : 'down')}>
                      近{RANGE_LABEL[trend.range]} {trendChangePct(trend.data) >= 0 ? '↑' : '↓'}
                      {Math.abs(trendChangePct(trend.data)).toFixed(1)}%
                    </span>
                  )}
                </div>
              )}

              {trend.range === '1d' && (
                <div className="trend-note">
                  提示：1 天窗口数据较稀疏（同一天多次采集仅保留最新一条）。京东 / 淘宝为参考价，可在后台录入或对接比价 API 同步。
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // —— 列表视图 ——
  return (
    <div className="configs">
      <div className="mc-head">
        <h1>我的配置</h1>
        <button className="btn-new" type="button" onClick={openNew}>
          <IconPlus size={16} color="#FFFFFF" strokeWidth={2.2} />
          <span>新建</span>
        </button>
      </div>

      <div className="mc-stats">
        <span className="l">已保存 {list.length} 套配置</span>
        <span className="r">总预算 {yuan(total)}</span>
      </div>

      {err && <div className="mc-empty">{err}</div>}
      {flash && <div className="mc-flash">{flash}</div>}

      <div className="cfg-list">
        {loading ? (
          <div className="cfg-end">加载中…</div>
        ) : list.length === 0 ? (
          <div className="cfg-end">还没有保存的配置，点右上角「新建」建一套</div>
        ) : (
          list.map((c) => {
            const filled = planPreview(c.planJson)
            return (
              <div
                className="cfg-card"
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetail(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setDetail(c)
                }}
              >
                <div className="cfg-top">
                  <span className="cfg-ic">
                    <IconMonitor size={20} color="#1C7DFF" strokeWidth={1.9} />
                  </span>
                  <div className="cfg-info">
                    <div className="cfg-title">{c.title}</div>
                    <div className="cfg-spec">{c.remark || '—'}</div>
                  </div>
                  <div className="cfg-price">{yuan(c.totalPriceCents)}</div>
                </div>

                <div className="cfg-slots-preview">
                  {filled.length === 0 ? (
                    <span className="chip-soft empty">暂无配件</span>
                  ) : (
                    <>
                      {filled.slice(0, PREVIEW_SLOTS).map((r, ri) => (
                        <span className="chip-soft" key={(r.slot || r.cn) + '-' + ri}>
                          <SlotIcon slot={r.slot || 'cpu'} size={13} />
                          {r.cn}·{shortModel(r.model)}
                        </span>
                      ))}
                      {filled.length > PREVIEW_SLOTS && (
                        <span className="chip-soft more">+{filled.length - PREVIEW_SLOTS} 项</span>
                      )}
                    </>
                  )}
                </div>

                <div className="cfg-foot">
                  <button
                    className="cfg-edit"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(c)
                    }}
                  >
                    编辑配置
                  </button>
                  <button
                    className="cfg-del"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      remove(c)
                    }}
                  >
                    <IconTrash size={15} color="var(--danger, #D54941)" strokeWidth={1.9} />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            )
          })
        )}

        {!loading && list.length > 0 && list.length < cfgTotal && (
          <button className="sr-more" type="button" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? '加载中…' : '加载更多'}
          </button>
        )}
        {!loading && list.length > 0 && list.length >= cfgTotal && (
          <div className="cfg-end">已经到底啦 · 共 {list.length} 套配置</div>
        )}
      </div>
    </div>
  )
}
