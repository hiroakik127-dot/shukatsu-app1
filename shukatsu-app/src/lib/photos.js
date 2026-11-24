import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

// メモの写真を扱う関数です。
// ・クラウド（Supabase）：写真置き場 note-photos の「ユーザーID/ファイル名」に置き、その場所を保存します
// ・この端末だけのモード：小さくした写真を、そのまま文字（data:〜）として保存します
// どちらも、置く前に写真を小さくして（長い辺を最大1600px）、通信と容量を節約します。

const BUCKET = 'note-photos'
export const MAX_PHOTOS = 6

// 写真を小さくした JPEG にします
async function shrink(file, maxSide, quality) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((ok, ng) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => ng(new Error('この写真は読み込めませんでした'))
      i.src = url
    })
    const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * k)
    const h = Math.round(img.naturalHeight * k)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    return await new Promise((ok) => canvas.toBlob(ok, 'image/jpeg', quality))
  } finally {
    URL.revokeObjectURL(url)
  }
}

const toDataUrl = (blob) =>
  new Promise((ok) => {
    const r = new FileReader()
    r.onload = () => ok(r.result)
    r.readAsDataURL(blob)
  })

const isData = (p) => typeof p === 'string' && p.startsWith('data:')

// 写真を置いて、保存用の値（場所 または data:〜）を返します
export async function uploadPhoto(file) {
  if (!supabase) return toDataUrl(await shrink(file, 1024, 0.7)) // 端末の容量が小さいので、さらに小さくします
  const blob = await shrink(file, 1600, 0.82)
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('ログインし直してください')
  const path = `${data.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw error
  return path
}

// 写真置き場から消します（失敗しても、メモの保存は止めません）
export async function removePhotos(paths) {
  const files = (paths || []).filter((p) => p && !isData(p))
  if (!supabase || !files.length) return
  try {
    await supabase.storage.from(BUCKET).remove(files)
  } catch {
    // 消せなかった写真は置き場に残るだけなので、無視します
  }
}

// 写真を表示するためのURL（1時間有効）。一度作ったものは使い回します
const cache = new Map()
export function usePhotoUrls(paths) {
  const list = paths || []
  const key = list.join('|')
  const [urls, setUrls] = useState(() => list.map((p) => (isData(p) ? p : cache.get(p)?.url || '')))

  useEffect(() => {
    let alive = true
    const now = Date.now()
    const need = list.filter((p) => !isData(p) && !(cache.get(p)?.until > now))
    const show = () => alive && setUrls(list.map((p) => (isData(p) ? p : cache.get(p)?.url || '')))
    show()
    if (need.length && supabase) {
      supabase.storage
        .from(BUCKET)
        .createSignedUrls(need, 3600)
        .then(({ data }) => {
          ;(data || []).forEach((d) => d.signedUrl && cache.set(d.path, { url: d.signedUrl, until: now + 3300 * 1000 }))
          show()
        })
    }
    return () => {
      alive = false
    }
  }, [key])

  return urls
}
