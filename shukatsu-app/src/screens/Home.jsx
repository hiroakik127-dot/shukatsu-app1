import { friendlyError } from '../store'
import { useMemo, useState } from 'react'
import { TYPES } from '../lib/constants'
import { byDue, daysLeft, formatDue, formatToday, leftText, todayISO } from '../lib/dates'
import { isSampleEs, isSampleNote, isSampleTask, sampleEs, sampleNotes, sampleTasks } from '../lib/samples'
import { usePhotoUrls } from '../lib/photos'

// メモを3つ、ランダムに選びます
const pickRandom = (list, k) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, k)
}

// ホームに出すメモの1行（写真があれば小さく出します）
function MemoItem({ note, onOpen }) {
  const photos = Array.isArray(note.photos) ? note.photos : []
  const [url] = usePhotoUrls(photos.slice(0, 1))
  return (
    <li>
      <button onClick={onOpen}>
        {photos.length > 0 && <span className="memo-photo">{url && <img src={url} alt="" />}</span>}
        <span className="memo-text">
          <b>{note.title || '（タイトルなし）'}</b>
          <small>{(note.body || '').split(/\r?\n/).find((x) => x.trim()) || '本文なし'}</small>
        </span>
      </button>
    </li>
  )
}

// サンプルデータの追加・削除ボタン
function SampleTools({ tasks, es, notes }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const sampleTaskIds = tasks.items.filter(isSampleTask).map((t) => t.id)
  const sampleEsIds = es.items.filter(isSampleEs).map((e) => e.id)
  const sampleNoteIds = notes.items.filter(isSampleNote).map((n) => n.id)
  const hasSamples = sampleTaskIds.length + sampleEsIds.length + sampleNoteIds.length > 0
  // まだ入っていない種類だけを入れます（タスクとESのサンプルが入っていても、メモだけ足せます）
  const missing = { tasks: !sampleTaskIds.length, es: !sampleEsIds.length, notes: !sampleNoteIds.length }
  const canAdd = missing.tasks || missing.es || missing.notes

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

  const add = () => {
    const parts = []
    if (missing.tasks) parts.push('タスク12件')
    if (missing.es) parts.push('ES4件')
    if (missing.notes) parts.push('メモ6件')
    run(async () => {
      if (missing.tasks) await tasks.addMany(sampleTasks())
      if (missing.es) await es.addMany(sampleEs())
      if (missing.notes) await notes.addMany(sampleNotes())
    }, `サンプルを追加しました（${parts.join('・')}）`)
  }

  const remove = () => {
    if (!window.confirm('サンプルのタスク・ES・メモを削除しますか？（自分で追加したものは消えません）')) return
    run(async () => {
      await tasks.removeMany(sampleTaskIds)
      await es.removeMany(sampleEsIds)
      await notes.removeMany(sampleNoteIds)
    }, 'サンプルを削除しました')
  }

  return (
    <section className="sample-tools">
      <div className="sample-row">
        <button className="btn ghost small" onClick={add} disabled={busy || !canAdd}>
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
export default function Home({ tasks, es, notes, openTask, openNote, go }) {
  const { items, loading } = tasks
  const esCount = es.items.length
  const active = items.filter((i) => !i.done)
  const doneCount = items.length - active.length
  const rate = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const dated = active.filter((i) => i.due).sort(byDue)
  const next = dated[0]
  const thisWeek = dated.filter((i) => daysLeft(i.due) <= 7).length
  const overdue = dated.filter((i) => daysLeft(i.due) < 0).length
  // 今日のToDo（メモの画面から入れたメモも数えます）
  const todayList = [...items, ...(notes?.items || [])].filter((i) => i.todo_date === todayISO())
  const todayDone = todayList.filter((i) => i.done).length

  // メモをランダムに3つ（「入れ替える」を押すと選び直します）
  const noteItems = notes?.items || []
  const [shuffle, setShuffle] = useState(0)
  const memoIds = noteItems.map((m) => m.id).join(',')
  const memos = useMemo(() => pickRandom(noteItems, 3), [memoIds, shuffle])

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
        <p className="muted">まだ終わっていないタスクの、種類ごとの件数（押すと一覧へ）</p>
        <div className="type-grid">
          {TYPES.map((t) => (
            <button key={t.key} className="type-cell" onClick={() => go('board', t.key)}>
              <b>{active.filter((i) => i.type === t.key).length}</b>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel block">
        <div className="row memo-head">
          <span className="eyebrow">MEMO</span>
          {noteItems.length > 3 && (
            <button className="btn ghost small" onClick={() => setShuffle((v) => v + 1)}>
              入れ替える
            </button>
          )}
        </div>
        {memos.length ? (
          <ul className="memo-list">
            {memos.map((m) => (
              <MemoItem key={m.id} note={m} onOpen={() => openNote(m)} />
            ))}
          </ul>
        ) : (
          <p className="muted">
            就活の中で学んだことや、忘れたくないことを「メモ」に書くと、ここにランダムで3つ出ます。
          </p>
        )}
        <button className="btn ghost small memo-more" onClick={() => go('flow')}>
          メモを開く
        </button>
      </section>

      <button className="btn primary wide" onClick={() => go('todo')}>
        今日のToDoを開く
      </button>

      <SampleTools tasks={tasks} es={es} notes={notes} />
    </main>
  )
}
