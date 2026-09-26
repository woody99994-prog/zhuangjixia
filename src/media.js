// 图片选择 → 压缩 → 上传（本机没有对象存储，走「前端压缩 + base64 入库 + /assets/:id 直出」）
// 目的：绝不能把原图 base64 直接塞进业务字段（几 MB 一张会把数据库/接口拖垮）
import { api } from './apiClient.js'

export const MAX_IMAGE_EDGE = 1280
export const JPEG_QUALITY = 0.82

// 把 File 压成 dataURL：最长边缩到 maxEdge，统一转 JPEG
export function compressImage(file, maxEdge = MAX_IMAGE_EDGE, quality = JPEG_QUALITY) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片解析失败，换一张试试'))
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// 上传后返回可直出的 URL（形如 /api/app/assets/12）；失败抛出可读错误
export async function uploadImage(file) {
  const data = await compressImage(file)
  const r = await api.post('my/assets', { data })
  if (!r || !r.url) throw new Error('上传失败，未返回图片地址')
  return r.url
}
