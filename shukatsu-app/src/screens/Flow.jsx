import { useEffect, useMemo, useRef, useState } from 'react'
import { todayISO } from '../lib/dates'
import { usePhotoUrls } from '../lib/photos'

const CARD_W = 168 // カードの幅（styles.css の .ring-card と合わせる）
const PX_PER_STEP = 110 // 横にこれだけ動かすと、となりのメモに移ります（px）
const MOVE = 8 // これ以下の動きはタップとみなします（px）
const UP = 70 // これ以上 上に動かすと、今日のToDoに入れます（px）
const TAP_WAIT = 380 // 1回タップのあと、続けてタップされるかを待つ時間（ミリ秒）

const mod = (a, n) => ((a % n) + n) % n
// 角度を -180〜180 度にそろえます
const norm = (deg) => {
  const a = mod(deg, 360)
  return a > 180 ? a - 360 : a
}
const shortDate = (iso) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`
}
const photosOf = (n) => (Array.isArray(n.photos) ? n.photos : [])

// メモのカードの上に出す写真（1枚目）
function Thumb({ path }) {
  const [url] = usePhotoUrls([path])
  return <div className="ring-photo">{url && <img src={url} alt="" draggable="false" />}</div>
}

// 完了したメモの1行（タップで開く。「戻す」で進行中に戻す）
function DoneRow({ note, onOpen, onBack }) {
  const photos = photosOf(note)
  const [url] = usePhotoUrls(photos.slice(0, 1))
  return (
    <div className="card note-row" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      {photos.length > 0 && <div className="note-row-photo">{url && <img src={url} alt="" />}</div>}
      <div className="note-row-text">
        <span className="row">
          <span>MEMO{photos.length > 0 && ` ・ 📷${photos.length}`}</span>
          <span>{shortDate(note.created_at)}</span>
        </span>
        <span className="name">{note.title || '（タイトルなし）'}</span>
        <span className="note-row-body">{note.body || '本文なし'}</span>
      </div>
      <button
        className="btn ghost small note-back"
        onClick={(e) => {
          e.stopPropagation()
          onBack()
        }}
      >
        戻す
      </button>
    </div>
  )
}

// メモ：就活の中で学んだこと・忘れてはいけないことのメモを、奥行きのある円の上に並べます。
// （締切のあるタスクとは別の、自分のためのメモです）
// ・左右にスワイプ（またはスクロール）で回して、手前のメモを選びます
// ・手前のメモを1回タップで開く、3回タップで完了
// ・上にスワイプで、選んでいるメモを今日のToDoへ
export default function Flow({ notes, actions, openNote }) {
  const today = todayISO()
  const [view, setView] = useState('open') // 'open'（進行中：円） | 'done'（完了：リスト）
  const newest = (a, b) => String(b.created_at).localeCompare(String(a.created_at)) // 新しい順
  const queue = useMemo(() => notes.items.filter((m) => !m.done).sort(newest), [notes.items])
  const doneList = useMemo(() => notes.items.filter((m) => m.done).sort(newest), [notes.items])
  const openCount = queue.length
  const n = queue.length
  const isOpen = view === 'open'

  const [pos, setPos] = useState(0) // 何番目のメモが手前にあるか（回転中は小数）
  const posRef = useRef(0)
  const anim = useRef(null)
  const drag = useRef(null)
  const taps = useRef({ idx: -1, n: 0, t: null })
  const [tapInfo, setTapInfo] = useState({ idx: -1, n: 0 })
  const [lift, setLift] = useState(0) // 上スワイプ中の持ち上がり
  const [fly, setFly] = useState(null) // 今日のToDoへ飛んでいくメモのID
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
      clearTimeout(taps.current.t)
    },
    [],
  )

  // 未完了／完了を切り替えたら、いちばん手前（新しいメモ）から見せます
  useEffect(() => {
    cancelAnimationFrame(anim.current)
    setP(0)
    prevN.current = n
  }, [view])

  // メモの数が変わったら（完了したときなど）、同じ位置のメモを選んだままにします
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
    if (!current || !isOpen) return
    setFly(current.id)
    setTimeout(() => setFly(null), 650)
    actions.addToday(current)
  }

  const tap = (idx) => {
    const t = taps.current
    const wasFront = idx === sel
    if (t.idx !== idx) {
      t.idx = idx
      t.n = 0
    }
    t.n += 1
    clearTimeout(t.t)
    if (!wasFront) goToIdx(idx) // 奥のメモをタップしたら、手前に持ってきます
    if (t.n >= 3 && isOpen) {
      const note = queue[idx]
      t.idx = -1
      t.n = 0
      setTapInfo({ idx: -1, n: 0 })
      actions.complete(note)
      return
    }
    setTapInfo({ idx, n: t.n })
    t.t = setTimeout(() => {
      // 手前のメモを1回だけタップしたときは、メモを開きます
      if (t.n === 1 && wasFront) openNote(queue[idx])
      t.idx = -1
      t.n = 0
      setTapInfo({ idx: -1, n: 0 })
    }, TAP_WAIT)
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
    if (d.mode === 'v' && isOpen) setLift(Math.min(0, my))
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
    // 回している間は連続して動かし、止めたら近いメモにぴたっと合わせます
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
    else if (e.key === 'Enter' && current) openNote(current)
    else return
    e.preventDefault()
  }

  const toolbar = (
    <div className="flow-bar">
      <div className="seg two flow-view" role="radiogroup" aria-label="表示の切り替え">
        <button role="radio" aria-checked={isOpen} className={isOpen ? 'on' : ''} onClick={() => setView('open')}>
          進行中 {openCount}
        </button>
        <button role="radio" aria-checked={!isOpen} className={!isOpen ? 'on' : ''} onClick={() => setView('done')}>
          完了 {doneList.length}
        </button>
      </div>
      <button className="btn primary small flow-add" onClick={() => openNote('new')}>
        ＋ メモ
      </button>
    </div>
  )

  if (notes.loading) return <p className="muted">読み込み中…</p>

  // 完了したメモは、円ではなくリストで見ます
  if (!isOpen)
    return (
      <main className="flow">
        {toolbar}
        {doneList.length === 0 ? (
          <div className="empty">
            <p className="muted">完了したメモはまだありません。進行中のメモを3回タップすると、ここに入ります。</p>
          </div>
        ) : (
          <div className="list">
            {doneList.map((m) => (
              <DoneRow key={m.id} note={m} onOpen={() => openNote(m)} onBack={() => actions.toggleDone(m)} />
            ))}
          </div>
        )}
      </main>
    )

  if (!n)
    return (
      <main className="flow">
        {toolbar}
        <div className="empty">
          {
            <>
              <p>進行中のメモはありません</p>
              <p className="muted">
                就活の中で学んだこと、忘れたくないことを残しておく場所です。面接のふり返りや、説明会で気づいたことなどを書いておきましょう。
              </p>
              <button className="btn primary small" onClick={() => openNote('new')}>
                ＋ 最初のメモを書く
              </button>
            </>
          }
        </div>
      </main>
    )

  const inToday = current.todo_date === today
  const firstLine = (current.body || '').split('\n').find((s) => s.trim()) || '本文なし'

  return (
    <main className="flow">
      {toolbar}
      <p className="gesture-hint">
        {isOpen ? 'タップで開く ・ 上スワイプでToDoへ ・ 3回タップで完了' : '左右で選ぶ ・ タップで開く'}
      </p>

      <div
        ref={stageRef}
        className="ring-stage"
        tabIndex={0}
        aria-label={`メモの円。いま選んでいるのは「${current.title}」。左右の矢印キーで選べます`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={(e) => onUp(e, false)}
        onPointerCancel={(e) => onUp(e, true)}
        onKeyDown={onKey}
      >
        <div className="ring-floor" style={{ width: Math.min(R * 2 + CARD_W, 900) }} aria-hidden="true" />
        {queue.map((m, i) => {
          const a = (norm((i - pos) * step) * Math.PI) / 180
          const x = R * Math.sin(a)
          const z = R * Math.cos(a) - R
          const y = z * 0.18 // 奥のものほど上に見せて、床に並んでいるように見せます
          const front = (Math.cos(a) + 1) / 2 // 手前=1、いちばん奥=0
          const isSel = i === sel
          const photos = photosOf(m)
          const cls = ['ring-card', 'note-card', isSel && 'sel', fly === m.id && 'fly', m.todo_date === today && 'today']
            .filter(Boolean)
            .join(' ')
          return (
            <div
              key={m.id}
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
                  <span>MEMO</span>
                  <span>
                    {photos.length > 0 && `📷${photos.length} `}
                    {shortDate(m.created_at)}
                  </span>
                </div>
                {photos.length > 0 && <Thumb path={photos[0]} />}
                <div className="ring-name note-title">{m.title || '（タイトルなし）'}</div>
                <div className="ring-event note-excerpt">{m.body || '本文なし'}</div>
                {m.todo_date === today && <span className="today-badge">今日</span>}
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
          {inToday && <span className="today-badge">今日のToDo</span>}
        </div>
        <div className="next-name flow-title">{current.title || '（タイトルなし）'}</div>
        <div className="muted flow-sub">{firstLine}</div>
        <div className="flow-actions">
          <button className="btn ghost arrow" aria-label="前のメモ" onClick={() => move(-1)}>
            ←
          </button>
          <button className="btn ghost" onClick={() => openNote(current)}>
            開く
          </button>
          {isOpen && (
            <button className="btn primary" onClick={sendUp} disabled={inToday}>
              {inToday ? 'ToDo追加済み' : 'ToDoへ ↑'}
            </button>
          )}
          <button className="btn ghost arrow" aria-label="次のメモ" onClick={() => move(1)}>
            →
          </button>
        </div>
      </section>
    </main>
  )
}
