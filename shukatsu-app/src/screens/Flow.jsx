import { useEffect, useMemo, useRef, useState } from 'react'
import { TYPE_LABEL, starText } from '../lib/constants'
import { byDue, daysLeft, formatDue, leftText, todayISO } from '../lib/dates'
import { percentOf } from '../lib/progress'
import { ProgressLine } from '../components/TaskCard'

const CARD_W = 168 // カードの幅（styles.css の .ring-card と合わせる）
const PX_PER_STEP = 110 // 横にこれだけ動かすと、となりのタスクに移ります（px）
const MOVE = 8 // これ以下の動きはタップとみなします（px）
const UP = 70 // これ以上 上に動かすと、今日のToDoに入れます（px）

const mod = (a, n) => ((a % n) + n) % n
// 角度を -180〜180 度にそろえます
const norm = (deg) => {
  const a = mod(deg, 360)
  return a > 180 ? a - 360 : a
}

// フロー：進行中のタスクを、奥行きのある円の上に並べます。
// ・左右にスワイプ（またはスクロール）で回して、手前のタスクを選びます
// ・上にスワイプで、選んでいるタスクを今日のToDoへ
// ・3回タップで、そのタスクを完了
export default function Flow({ tasks, actions, openTask }) {
  const today = todayISO()
  const queue = useMemo(() => tasks.items.filter((t) => !t.done).sort(byDue), [tasks.items])
  const n = queue.length

  const [pos, setPos] = useState(0) // 何番目のタスクが手前にあるか（回転中は小数）
  const posRef = useRef(0)
  const anim = useRef(null)
  const drag = useRef(null)
  const taps = useRef({ idx: -1, n: 0, t: null })
  const [tapInfo, setTapInfo] = useState({ idx: -1, n: 0 })
  const [lift, setLift] = useState(0) // 上スワイプ中の持ち上がり
  const [fly, setFly] = useState(null) // 今日のToDoへ飛んでいくタスクのID
  const stageRef = useRef(null)
  const prevN = useRef(n)

  const setP = (v) => {
    posRef.current = v
    setPos(v)
  }

  // target の位置まで、はじめ速く・最後ゆっくり止まるように動かします
  const animateTo = (target, duration) => {
    cancelAnimationFrame(anim.current)
    const from = posRef.current
    const dist = Math.abs(target - from)
    if (dist < 0.001) return setP(target)
    const dur = duration ?? Math.min(720, 300 + dist * 160)
    const t0 = performance.now()
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur)
      setP(from + (target - from) * (1 - (1 - k) ** 4))
      if (k < 1) anim.current = requestAnimationFrame(tick)
    }
    anim.current = requestAnimationFrame(tick)
  }

  // 指の動きは1フレームに1回だけ画面に反映して、カクつきを減らします
  const frame = useRef({ id: 0, v: 0 })
  const setPSmooth = (v) => {
    posRef.current = v
    frame.current.v = v
    if (frame.current.id) return
    frame.current.id = requestAnimationFrame(() => {
      frame.current.id = 0
      setPos(frame.current.v)
    })
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(anim.current)
      cancelAnimationFrame(frame.current.id)
    },
    [],
  )
  useEffect(() => () => clearTimeout(taps.current.t), [])

  // タスクの数が変わったら（完了したときなど）、同じ位置のタスクを選んだままにします
  useEffect(() => {
    if (n && prevN.current && n !== prevN.current) {
      cancelAnimationFrame(anim.current)
      setP(Math.min(mod(Math.round(posRef.current), prevN.current), n - 1))
    }
    prevN.current = n
  }, [n])

  const sel = n ? mod(Math.round(pos), n) : -1
  const current = n ? queue[sel] : null
  const step = n ? 360 / n : 360
  const R = n < 3 ? 150 : Math.min(620, Math.max(150, (CARD_W / 2 + 18) / Math.tan(Math.PI / n)))

  const move = (delta) => animateTo(Math.round(posRef.current) + delta)
  const goToIdx = (idx) => {
    const cur = Math.round(posRef.current)
    let d = idx - mod(cur, n)
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    animateTo(cur + d)
  }

  const sendUp = () => {
    if (!current) return
    setFly(current.id)
    setTimeout(() => setFly(null), 650)
    actions.addToday(current)
  }

  const tap = (idx) => {
    const t = taps.current
    if (t.idx !== idx) {
      t.idx = idx
      t.n = 0
    }
    t.n += 1
    clearTimeout(t.t)
    if (idx !== sel) goToIdx(idx) // 奥のタスクをタップしたら、手前に持ってきます
    if (t.n >= 3) {
      const task = queue[idx]
      t.idx = -1
      t.n = 0
      setTapInfo({ idx: -1, n: 0 })
      actions.complete(task)
      return
    }
    setTapInfo({ idx, n: t.n })
    t.t = setTimeout(() => {
      t.idx = -1
      t.n = 0
      setTapInfo({ idx: -1, n: 0 })
    }, 450)
  }

  const onDown = (e) => {
    if (!n || (e.pointerType === 'mouse' && e.button !== 0)) return
    cancelAnimationFrame(anim.current)
    const card = e.target.closest('[data-idx]')
    drag.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      start: posRef.current,
      idx: card ? Number(card.dataset.idx) : null,
      mode: '?',
      samples: [{ t: performance.now(), p: posRef.current }],
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    if (d.mode === '?') {
      if (Math.abs(mx) > MOVE && Math.abs(mx) >= Math.abs(my)) d.mode = 'h'
      else if (Math.abs(my) > MOVE) d.mode = 'v'
    }
    if (d.mode === 'h') {
      const p = d.start - mx / PX_PER_STEP
      setPSmooth(p)
      const now = performance.now()
      d.samples.push({ t: now, p })
      while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift()
    }
    if (d.mode === 'v') setLift(Math.min(0, my))
  }

  const onUp = (e, cancelled) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    setLift(0)
    if (cancelled) return animateTo(Math.round(posRef.current))
    if (d.mode === 'h') {
      // 指を離したときの速さに合わせて、少し惰性で回してから止めます
      const a = d.samples[0]
      const b = d.samples[d.samples.length - 1]
      const v = b.t > a.t && performance.now() - b.t < 80 ? (b.p - a.p) / (b.t - a.t) : 0 // 1ミリ秒あたりの移動量
      const throwBy = Math.max(-3, Math.min(3, v * 180))
      return animateTo(Math.round(posRef.current + throwBy))
    }
    const my = e.clientY - d.y
    if (d.mode === 'v') {
      if (my < -UP) sendUp()
      return
    }
    if (d.idx !== null) tap(d.idx)
  }

  // マウスのホイールやトラックパッドの横スクロールでも回せるようにします
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    // 回している間は連続して動かし、止めたら近いタスクにぴたっと合わせます
    let snap = 0
    const onWheel = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (!d) return
      e.preventDefault()
      cancelAnimationFrame(anim.current)
      const px = e.deltaMode === 1 ? d * 40 : d // 行単位のホイールはピクセルに直します
      setPSmooth(posRef.current + Math.max(-0.6, Math.min(0.6, px / 240)))
      clearTimeout(snap)
      snap = setTimeout(() => animateTo(Math.round(posRef.current)), 140)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      clearTimeout(snap)
      el.removeEventListener('wheel', onWheel)
    }
  }, [n > 0])

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') move(-1)
    else if (e.key === 'ArrowRight') move(1)
    else if (e.key === 'ArrowUp') sendUp()
    else if (e.key === 'Enter' && current) openTask(current)
    else return
    e.preventDefault()
  }

  if (tasks.loading) return <p className="muted">読み込み中…</p>
  if (!n)
    return (
      <div className="empty">
        <p>進行中のタスクはありません</p>
        <p className="muted">ボードの「＋」からタスクを追加すると、ここに並びます。</p>
      </div>
    )

  const inToday = current.todo_date === today

  return (
    <main className="flow">
      <p className="gesture-hint">左右で選ぶ ・ 上スワイプで今日のToDoへ ・ 3回タップで完了</p>

      <div
        ref={stageRef}
        className="ring-stage"
        tabIndex={0}
        aria-label={`タスクの円。いま選んでいるのは「${current.name}」。左右の矢印キーで選べます`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => onUp(e, false)}
        onPointerCancel={(e) => onUp(e, true)}
        onKeyDown={onKey}
      >
        <div className="ring-floor" style={{ width: Math.min(R * 2 + CARD_W, 900) }} aria-hidden="true" />
        {queue.map((t, i) => {
          const a = (norm((i - pos) * step) * Math.PI) / 180
          const x = R * Math.sin(a)
          const z = R * Math.cos(a) - R
          const y = z * 0.18 // 奥のものほど上に見せて、床に並んでいるように見せます
          const front = (Math.cos(a) + 1) / 2 // 手前=1、いちばん奥=0
          const isSel = i === sel
          const cls = ['ring-card', isSel && 'sel', fly === t.id && 'fly', t.todo_date === today && 'today']
            .filter(Boolean)
            .join(' ')
          return (
            <div
              key={t.id}
              data-idx={i}
              className={cls}
              aria-hidden={!isSel}
              style={{
                transform: `translate(-50%, -50%) translate3d(${x}px, ${y + (isSel ? lift : 0)}px, ${z}px)`,
                zIndex: Math.round(front * 1000),
                opacity: 0.15 + 0.85 * front ** 1.6,
              }}
            >
              <div className="ring-inner">
                {isSel && <span className="ring-sel-label">SELECTED</span>}
                <div className="row">
                  <span>{TYPE_LABEL[t.type]}</span>
                  <span>{leftText(daysLeft(t.due))}</span>
                </div>
                <div className="ring-name">{t.name}</div>
                {t.priority && <div className="stars">{starText(t.priority)}</div>}
                <div className="ring-event">{t.event || '内容なし'}</div>
                <div className="ring-due">{formatDue(t.due)}</div>
                <div className="ring-progress">
                  <span className="pbar">
                    <span style={{ width: `${percentOf(t)}%` }} />
                  </span>
                  <b>{percentOf(t)}%</b>
                </div>
                {t.todo_date === today && <span className="today-badge">今日</span>}
                {tapInfo.idx === i && tapInfo.n > 0 && (
                  <span className="tap-dots">
                    {'●'.repeat(tapInfo.n)}
                    {'○'.repeat(3 - tapInfo.n)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <section className="panel block flow-info" aria-live="polite">
        <div className="row">
          <span className="eyebrow">
            SELECTED {sel + 1} / {n}
          </span>
          {/* 進捗は同じ行に並べて、四角の高さをおさえます */}
          <ProgressLine item={current} />
        </div>
        <div className="next-name">
          {current.name}
          {inToday && <span className="today-badge">今日のToDo</span>}
        </div>
        <div className="muted flow-sub">
          {TYPE_LABEL[current.type]} ・ {current.event || '内容なし'} ・ {formatDue(current.due)}{' '}
          {leftText(daysLeft(current.due))}
        </div>
        <div className="flow-actions">
          <button className="btn ghost arrow" aria-label="前のタスク" onClick={() => move(-1)}>
            ←
          </button>
          <button className="btn ghost" onClick={() => openTask(current)}>
            編集
          </button>
          <button className="btn primary" onClick={sendUp} disabled={inToday}>
            {inToday ? 'ToDo追加済み' : 'ToDoへ ↑'}
          </button>
          <button className="btn ghost arrow" aria-label="次のタスク" onClick={() => move(1)}>
            →
          </button>
        </div>
      </section>
    </main>
  )
}
