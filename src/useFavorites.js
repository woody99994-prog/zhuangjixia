// 收藏状态共享钩子：以 "type:id" 为 key 的集合，在 App 顶层挂载一次，
// 首页方案卡 / 广场帖子卡 共用同一份收藏态，避免各屏重复拉取、状态不一致。
// 后端已支持：POST /my/favorites（幂等 upsert）、DELETE /my/favorites/target/:type/:id

import { useState, useEffect, useCallback } from 'react'
import { api, getToken, ApiError } from './apiClient.js'

export function useFavorites() {
  const [favSet, setFavSet] = useState(() => new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get('my/favorites?pageSize=200', { auth: true })
      .then((d) => {
        if (!alive) return
        const items = (d && d.items) || []
        const s = new Set(items.map((f) => f.targetType + ':' + f.targetId))
        setFavSet(s)
      })
      .catch(() => {})
      .finally(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])

  const isFav = useCallback(
    (type, id) => favSet.has(type + ':' + id),
    [favSet],
  )

  // 切换收藏：返回切换后的「是否已收藏」状态
  const toggleFav = useCallback(
    async (type, id, meta = {}) => {
      // 未登录：收藏需要账号，提前抛出明确错误，避免静默回滚让用户以为「没反应」
      if (!getToken()) {
        throw new ApiError('请先登录后再收藏', 'UNAUTHORIZED')
      }
      const key = type + ':' + id
      const had = favSet.has(key)
      // 乐观更新集合
      const next = new Set(favSet)
      if (had) next.delete(key)
      else next.add(key)
      setFavSet(next)
      try {
        if (had) {
          await api.del(`my/favorites/target/${type}/${id}`)
        } else {
          await api.post('my/favorites', {
            targetType: type,
            targetId: id,
            title: meta.title || '',
            // 不传时给 undefined（JSON.stringify 会丢弃该键），避免发 null 触发 Zod「Expected string, received null」
            coverUrl: meta.coverUrl || undefined,
            summary: meta.summary || undefined,
            priceCents: meta.priceCents || 0,
          })
        }
        return !had
      } catch (e) {
        // 失败回滚
        const rollback = new Set(favSet)
        if (had) rollback.add(key)
        else rollback.delete(key)
        setFavSet(rollback)
        throw e
      }
    },
    [favSet],
  )

  return { favSet, isFav, toggleFav, ready }
}
