import { useEffect, useMemo, useRef, useState } from 'react'
import TaskCard from '../components/TaskCard'
import { TYPES } from '../lib/constants'
import { byDue } from '../lib/dates'

// 選考ボード：タスクを種類で絞り込んで一覧表示します。
export default function Board({ tasks, openTask, actions, initialFilter = 'all' }) {
  const [filter, setFilter] = useState(initialFilter)
  const { items, loading } = tasks

  const active = items.filter((i) => !i.done)
  const counts = useMemo(() => {
    const c = { all: active.length, done: items.length - active.length }
    TYPES.forEach((t) => (c[t.key] = active.filter((i) => i.type === t.key).length))
    return c
  }, [items])

  const visible = useMemo(() => {
    const rows =
      filter === 'done'
        ? items.filter((i) => i.done)
        : active.filter((i) => filter === 'all' || i.type === filter)
    return [...rows].sort(byDue)
  }, [items, filter])

  const chips = [{ key: 'all', label: 'すべて' }, ...TYPES, { key: 'done', label: '完了' }]

  // ホームから種類を指定して開いたとき、選ばれた絞り込みが見えるように横へスクロールします
  const chipsRef = useRef(null)
  // （スマホでは画面の準備や文字の読み込みが遅れることがあるので、少し時間をおいて何度か合わせ直します）
  useEffect(() => {
    if (initialFilter === 'all') return
    const box = chipsRef.current
    if (!box) return
    let touched = false
    const stop = () => (touched = true) // 自分で横にスクロールし始めたら、合わせ直すのをやめます
    const center = () => {
      const on = box.querySelector('.chip.on')
      if (touched || !on) return
      const gap = on.getBoundingClientRect().left - box.getBoundingClientRect().left
      const left = box.scrollLeft + gap - (box.clientWidth - on.offsetWidth) / 2
      box.scrollTo({ left: Math.max(0, left), behavior: 'auto' })
    }
    box.addEventListener('pointerdown', stop)
    center()
    const raf = requestAnimationFrame(center)
    const timers = [120, 400, 1000].map((ms) => setTimeout(center, ms))
    document.fonts?.ready.then(center)
    return () => {
      touched = true
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      box.removeEventListener('pointerdown', stop)
    }
  }, [])

  return (
    <>
      <div className="chips" role="tablist" aria-label="種類で絞り込み" ref={chipsRef}>
        {chips.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={filter === t.key}
            className={filter === t.key ? 'chip on' : 'chip'}
            onClick={() => setFilter(t.key)}
          >
            {t.label} {counts[t.key]}
          </button>
        ))}
      </div>

      <p className="gesture-hint">右スワイプで今日のToDoへ ・ 3回タップで完了</p>

      <main className="list">
        {loading && <p className="muted">読み込み中…</p>}
        {!loading && visible.length === 0 && (
          <div className="empty">
            <p>{items.length === 0 ? 'まだタスクがありません' : 'ここに出るタスクはありません'}</p>
            {items.length === 0 && <p className="muted">右下の「＋」から、最初の企業を追加しましょう。</p>}
          </div>
        )}
        {visible.map((it) => (
          <TaskCard
            key={it.id}
            item={it}
            onOpen={() => openTask(it)}
            onTriple={() => actions.complete(it)}
            onSwipeRight={() => actions.addToday(it)}
          />
        ))}
      </main>

      <button className="fab" aria-label="タスクを追加" onClick={() => openTask('new')}>
        <span className="ring" />
        <span className="core">＋</span>
      </button>
    </>
  )
}
