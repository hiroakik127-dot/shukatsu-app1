import { useEffect, useRef, useState } from 'react'

const MOVE = 10 // これ以上動いたら「タップ」ではなく「スワイプ」とみなします（px）

// 右スワイプとタップを見分けるフックです。
// ・縦にスクロールしようとした指の動きは邪魔しません（CSSで touch-action: pan-y を付けること）
// ・中のボタンが普通に押せるように、横に動いたと分かってから指を捕まえます
export function useSwipeTap({ onSwipeRight, onTap, threshold = 80 }) {
  const [dx, setDx] = useState(0)
  const st = useRef(null)
  const cb = useRef({})
  cb.current = { onSwipeRight, onTap }

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    st.current = { x: e.clientX, y: e.clientY, id: e.pointerId, el: e.currentTarget, mode: '?' }
  }

  const onPointerMove = (e) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    const mx = e.clientX - s.x
    const my = e.clientY - s.y
    if (s.mode === '?') {
      if (Math.abs(mx) > MOVE && Math.abs(mx) > Math.abs(my) * 1.2) {
        s.mode = 'h'
        s.el.setPointerCapture?.(e.pointerId)
      } else if (Math.abs(my) > MOVE) {
        s.mode = 'v'
      }
    }
    if (s.mode === 'h') setDx(Math.max(0, mx)) // 右方向だけ動かします
  }

  const end = (e, cancelled) => {
    const s = st.current
    if (!s || s.id !== e.pointerId) return
    st.current = null
    setDx(0)
    if (cancelled) return
    const mx = e.clientX - s.x
    const my = e.clientY - s.y
    if (s.mode === 'h' && mx > threshold) cb.current.onSwipeRight?.()
    else if (s.mode === '?' && Math.abs(mx) < MOVE && Math.abs(my) < MOVE) cb.current.onTap?.(e)
  }

  return {
    dx,
    ready: dx > threshold,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e) => end(e, false),
      onPointerCancel: (e) => end(e, true),
    },
  }
}

// 1回タップと3回連続タップを見分けるフックです。
// 1回（または2回）だけのときは、少し待ってから onSingle を呼びます。
// 戻り値：[タップされたときに呼ぶ関数, いま何回目か（0〜2）]
export function useMultiTap({ onSingle, onTriple, delay = 380 }) {
  const [count, setCount] = useState(0)
  const r = useRef({ n: 0, t: null })
  const cb = useRef({})
  cb.current = { onSingle, onTriple }

  useEffect(() => () => clearTimeout(r.current.t), [])

  const tap = () => {
    const s = r.current
    s.n += 1
    clearTimeout(s.t)
    if (s.n >= 3) {
      s.n = 0
      setCount(0)
      cb.current.onTriple?.()
      return
    }
    setCount(s.n)
    s.t = setTimeout(() => {
      s.n = 0
      setCount(0)
      cb.current.onSingle?.()
    }, delay)
  }

  return [tap, count]
}
