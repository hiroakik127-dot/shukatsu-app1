import { friendlyError } from '../store'
import { useState } from 'react'
import { TYPES, starText } from '../lib/constants'
import { byDue, daysLeft, formatDue, formatToday, leftText, todayISO } from '../lib/dates'
import { isSampleEs, isSampleTask, sampleEs, sampleTasks } from '../lib/samples'

// サンプルデータの追加・削除ボタン
function SampleTools({ tasks, es }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const sampleTaskIds = tasks.items.filter(isSampleTask).map((t) => t.id)
  const sampleEsIds = es.items.filter(isSampleEs).map((e) => e.id)
  const hasSamples = sampleTaskIds.length + sampleEsIds.length > 0

  const run = async (fn, done) => {
    setBusy(true)
    setMsg('')
    setError('')
    try {
      await fn()
      setMsg(done)
    } catch (e) {
      setError(friendlyError(e, 'うまくいきませんでした'))
    } finally {
      setBusy(false)
    }
  }

  const add = () =>
    run(async () => {
      await tasks.addMany(sampleTasks())
      await es.addMany(sampleEs())
    }, 'サンプルを追加しました（タスク12件・ES4件）')

  const remove = () => {
    if (!window.confirm('サンプルのタスクとESを削除しますか？（自分で追加したものは消えません）')) return
    run(async () => {
      await tasks.removeMany(sampleTaskIds)
      await es.removeMany(sampleEsIds)
    }, 'サンプルを削除しました')
  }

  return (
    <section className="sample-tools">
      <div className="sample-row">
        <button className="btn ghost small" onClick={add} disabled={busy || hasSamples}>
          {busy ? '処理中…' : 'サンプルデータを入れる'}
        </button>
        {hasSamples && (
          <button className="btn ghost small" onClick={remove} disabled={busy}>
            サンプルを消す
          </button>
        )}
      </div>
      {msg && <p className="muted center-text">{msg}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

// ホロ（ホーム画面）：いまの就活の状況をひと目で見るための画面です。
export default function Home({ tasks, es, openTask, go }) {
  const { items, loading } = tasks
  const esCount = es.items.length
  const active = items.filter((i) => !i.done)
  const doneCount = items.length - active.length
  const rate = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const dated = active.filter((i) => i.due).sort(byDue)
  const next = dated[0]
  const thisWeek = dated.filter((i) => daysLeft(i.due) <= 7).length
  const overdue = dated.filter((i) => daysLeft(i.due) < 0).length
  const todayList = items.filter((i) => i.todo_date === todayISO())
  const todayDone = todayList.filter((i) => i.done).length

  // 志望度の高い順（同じ企業は1回だけ）
  const seen = new Set()
  const top = items
    .filter((i) => i.priority)
    .sort((a, b) => b.priority - a.priority)
    .filter((i) => !seen.has(i.name) && seen.add(i.name))
    .slice(0, 3)

  // 完了率のリング
  const R = 52
  const C = 2 * Math.PI * R

  return (
    <main className="home">
      <p className="today">{formatToday()}</p>

      <section className="holo" aria-label="進み具合">
        <svg viewBox="0 0 120 120" className="holo-ring" aria-hidden="true">
          <circle cx="60" cy="60" r={R} className="track" />
          <circle
            cx="60"
            cy="60"
            r={R}
            className="bar"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - rate / 100)}
          />
        </svg>
        <div className="holo-core">
          <div className="holo-num">{loading ? '–' : active.length}</div>
          <div className="holo-label">まだ終わっていないタスク</div>
          <div className="holo-sub">
            全{items.length}件中 {doneCount}件完了（{rate}%）
          </div>
        </div>
      </section>

      <div className="stats">
        <button className="stat" onClick={() => go('todo')}>
          <b>
            {todayDone}/{todayList.length}
          </b>
          <span>今日のToDo</span>
        </button>
        <button className={overdue ? 'stat warn' : 'stat'} onClick={() => go('deadline')}>
          <b>{overdue}</b>
          <span>期限切れ</span>
        </button>
        <button className="stat" onClick={() => go('deadline')}>
          <b>{thisWeek}</b>
          <span>7日以内</span>
        </button>
        <button className="stat" onClick={() => go('es')}>
          <b>{esCount}</b>
          <span>ESストック</span>
        </button>
      </div>

      <section className="panel block">
        <div className="eyebrow">NEXT</div>
        {next ? (
          <button className="next" onClick={() => openTask(next)}>
            <span className="next-left">{leftText(daysLeft(next.due))}</span>
            <span className="next-name">{next.name}</span>
            <span className="muted">
              {next.event || '内容なし'} ・ {formatDue(next.due)}
            </span>
          </button>
        ) : (
          <p className="muted">日付の入った予定はありません。</p>
        )}
      </section>

      <section className="panel block">
        <div className="eyebrow">BY TYPE</div>
        <p className="muted">まだ終わっていないタスクの、種類ごとの件数</p>
        <div className="type-grid">
          {TYPES.map((t) => (
            <div key={t.key} className="type-cell">
              <b>{active.filter((i) => i.type === t.key).length}</b>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel block">
        <div className="eyebrow">TOP CHOICES</div>
        {top.length ? (
          <ul className="top-list">
            {top.map((i) => (
              <li key={i.id}>
                <button onClick={() => openTask(i)}>
                  <span>{i.name}</span>
                  <span className="stars">{starText(i.priority)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">タスクに志望度（★）を付けると、ここに上位3社が出ます。</p>
        )}
      </section>

      <button className="btn primary wide" onClick={() => go('todo')}>
        今日のToDoを開く
      </button>

      <SampleTools tasks={tasks} es={es} />
    </main>
  )
}
