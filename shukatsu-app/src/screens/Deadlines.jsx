import { useState } from 'react'
import TaskCard from '../components/TaskCard'
import { byDue, daysLeft, formatDue, todayISO } from '../lib/dates'

const GROUPS = [
  { key: 'over', label: '期限切れ', test: (n) => n < 0 },
  { key: 'today', label: '今日', test: (n) => n === 0 },
  { key: 'tomorrow', label: '明日', test: (n) => n === 1 },
  { key: 'week', label: '7日以内', test: (n) => n >= 2 && n <= 7 },
  { key: 'month', label: '30日以内', test: (n) => n >= 8 && n <= 30 },
  { key: 'later', label: 'それ以降', test: (n) => n > 30 },
]

const p2 = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${p2(m + 1)}-${p2(d)}`

function Cards({ rows, openTask, actions }) {
  return (
    <div className="list">
      {rows.map((it) => (
        <TaskCard
          key={it.id}
          item={it}
          onOpen={() => openTask(it)}
          onTriple={() => actions.complete(it)}
          onSwipeRight={() => actions.addToday(it)}
        />
      ))}
    </div>
  )
}

// カレンダー表示：月ごとに、締切のある日に印を付けます。日付をタップすると、その日のタスクが下に出ます。
function Calendar({ dated, openTask, actions }) {
  const today = todayISO()
  const now = new Date()
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [picked, setPicked] = useState(today)

  const { y, m } = month
  const first = new Date(y, m, 1).getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]

  const byDay = {}
  dated.forEach((t) => (byDay[t.due] ||= []).push(t))

  const shift = (k) => {
    const d = new Date(y, m + k, 1)
    setMonth({ y: d.getFullYear(), m: d.getMonth() })
  }
  const rows = byDay[picked] || []

  return (
    <>
      <section className="cal panel">
        <div className="cal-head">
          <button className="icon-btn small" aria-label="前の月" onClick={() => shift(-1)}>
            ‹
          </button>
          <b>
            {y}年{m + 1}月
          </b>
          <button className="icon-btn small" aria-label="次の月" onClick={() => shift(1)}>
            ›
          </button>
        </div>
        <div className="cal-grid">
          {'日月火水木金土'.split('').map((w, i) => (
            <span key={w} className={`cal-w${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />
            const key = iso(y, m, d)
            const list = byDay[key] || []
            const cls = [
              'cal-day',
              key === today && 'today',
              key === picked && 'picked',
              list.length && key < today && 'over',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={key}
                className={cls}
                aria-label={`${m + 1}月${d}日${list.length ? `、${list.length}件` : ''}`}
                aria-pressed={key === picked}
                onClick={() => setPicked(key)}
              >
                <span className="cal-num">{d}</span>
                {list.length > 0 && <span className="cal-count">{list.length}</span>}
              </button>
            )
          })}
        </div>
        <button
          className="btn ghost small"
          onClick={() => {
            setMonth({ y: now.getFullYear(), m: now.getMonth() })
            setPicked(today)
          }}
        >
          今日に戻る
        </button>
      </section>

      <h3 className="group-head">
        {formatDue(picked)}
        <span>{rows.length}件</span>
      </h3>
      {rows.length ? (
        <Cards rows={rows} openTask={openTask} actions={actions} />
      ) : (
        <p className="muted center-text">この日の締切はありません。</p>
      )}
    </>
  )
}

// 締切：進行中のタスクを、締切までの近さでまとめて表示します。カレンダー表示にも切り替えられます。
export default function Deadlines({ tasks, openTask, actions }) {
  const { items, loading } = tasks
  const [view, setView] = useState('list')
  const active = items.filter((i) => !i.done)
  const dated = active.filter((i) => i.due).sort(byDue)
  const undated = active.length - dated.length

  return (
    <main className="list">
      <div className="seg two" role="radiogroup" aria-label="表示の切り替え">
        <button role="radio" aria-checked={view === 'list'} className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
          リスト
        </button>
        <button role="radio" aria-checked={view === 'cal'} className={view === 'cal' ? 'on' : ''} onClick={() => setView('cal')}>
          カレンダー
        </button>
      </div>
      <p className="gesture-hint">右スワイプで今日のToDoへ ・ 3回タップで完了</p>
      {loading && <p className="muted">読み込み中…</p>}

      {view === 'cal' && <Calendar dated={dated} openTask={openTask} actions={actions} />}

      {view === 'list' && (
        <>
          {!loading && dated.length === 0 && (
            <div className="empty">
              <p>日付の入った予定はありません</p>
              <p className="muted">タスクに日付を入れると、ここに締切順で並びます。</p>
            </div>
          )}
          {GROUPS.map((g) => {
            const rows = dated.filter((i) => g.test(daysLeft(i.due)))
            if (!rows.length) return null
            return (
              <section key={g.key} className="group">
                <h3 className={g.key === 'over' || g.key === 'today' ? 'group-head warn' : 'group-head'}>
                  {g.label}
                  <span>{rows.length}件</span>
                </h3>
                <Cards rows={rows} openTask={openTask} actions={actions} />
              </section>
            )
          })}
        </>
      )}

      {undated > 0 && <p className="muted center-text">日付なしのタスクが{undated}件あります（ボードで確認できます）。</p>}
    </main>
  )
}
