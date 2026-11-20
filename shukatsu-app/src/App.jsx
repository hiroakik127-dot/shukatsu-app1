import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import { store, isCloud } from './store'

const TYPES = [
  { key: 'es', label: 'ES' },
  { key: 'interview', label: '面接' },
  { key: 'result', label: '結果待ち' },
  { key: 'briefing', label: '説明会' },
]
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.key, t.label]))
const URGENT_DAYS = 5

const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

// "YYYY-MM-DD" → 今日からの日数（日付がなければ null）
const daysLeft = (due) => {
  if (!due) return null
  const [y, m, d] = due.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d) - todayStart()) / 86400000)
}

const formatDue = (due) => {
  if (!due) return '日付なし'
  const [y, m, d] = due.split('-').map(Number)
  const w = '日月火水木金土'[new Date(y, m - 1, d).getDay()]
  return `${m}/${d}（${w}）`
}

const leftText = (n) => {
  if (n === null) return ''
  if (n < 0) return `${-n}日超過`
  if (n === 0) return '今日'
  return `あと${n}日`
}

function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split('#')[0] },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="app center">
      <div className="eyebrow">LOGIN</div>
      <h1>就活ボード</h1>
      {sent ? (
        <p className="muted">
          {email} にログイン用のリンクを送りました。メールのリンクを開くと、ログインが完了します。
        </p>
      ) : (
        <form className="panel login" onSubmit={submit}>
          <label>
            メールアドレス
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <button className="btn primary" disabled={busy}>
            {busy ? '送信中…' : 'ログイン用リンクを送る'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  )
}

const emptyForm = { name: '', role: '', type: 'es', event: '', due: '' }

function Editor({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    item ? { name: item.name, role: item.role, type: item.type, event: item.event, due: item.due || '' } : emptyForm,
  )
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({ ...form, name: form.name.trim(), due: form.due || null })
    setSaving(false)
  }

  return (
    <div className="sheet-back" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet-head">
          <h2>{item ? 'タスクを編集' : 'タスクを追加'}</h2>
          <button type="button" className="icon-btn" aria-label="閉じる" onClick={onClose}>
            ×
          </button>
        </div>

        <label>
          企業名
          <input
            required
            autoFocus
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="例：サンプル商事"
          />
        </label>
        <label>
          職種
          <input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="例：総合職（営業）" />
        </label>

        <div className="field">
          <span>種類</span>
          <div className="seg">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.key}
                className={form.type === t.key ? 'on' : ''}
                onClick={() => set('type', t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label>
          内容
          <input
            value={form.event}
            onChange={(e) => set('event', e.target.value)}
            placeholder="例：ES締切 23:59"
          />
        </label>
        <label>
          日付
          <input type="date" value={form.due} onChange={(e) => set('due', e.target.value)} />
        </label>

        <div className="sheet-actions">
          {item && (
            <button type="button" className="btn danger" onClick={onDelete}>
              削除
            </button>
          )}
          <button className="btn primary" disabled={saving}>
            保存
          </button>
        </div>
      </form>
    </div>
  )
}

function Board({ session }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // null | 'new' | item

  const load = async () => {
    try {
      setItems(await store.list())
      setError('')
    } catch (e) {
      setError(e.message || '読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const c = { all: items.length }
    TYPES.forEach((t) => (c[t.key] = items.filter((i) => i.type === t.key).length))
    return c
  }, [items])

  const visible = useMemo(() => {
    const rows = items.filter((i) => filter === 'all' || i.type === filter)
    // 日付の近い順。日付なしは最後
    return rows.sort((a, b) => {
      if (!a.due && !b.due) return 0
      if (!a.due) return 1
      if (!b.due) return -1
      return a.due.localeCompare(b.due)
    })
  }, [items, filter])

  const save = async (values) => {
    try {
      if (editing && editing !== 'new') await store.update(editing.id, values)
      else await store.add(values)
      setEditing(null)
      await load()
    } catch (e) {
      setError(e.message || '保存に失敗しました')
    }
  }

  const remove = async () => {
    if (!window.confirm('このタスクを削除しますか？')) return
    try {
      await store.remove(editing.id)
      setEditing(null)
      await load()
    } catch (e) {
      setError(e.message || '削除に失敗しました')
    }
  }

  return (
    <div className="app">
      <header>
        <div>
          <div className="eyebrow">TASK BOARD</div>
          <h1>選考ボード</h1>
        </div>
        {session && (
          <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>
            ログアウト
          </button>
        )}
      </header>

      {!isCloud && (
        <p className="notice">
          いまはこの端末内だけに保存されています。スマホとPCで同期するには、READMEの手順でSupabaseを設定してください。
        </p>
      )}

      <div className="chips" role="tablist" aria-label="種類で絞り込み">
        {[{ key: 'all', label: 'すべて' }, ...TYPES].map((t) => (
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

      {error && <p className="error">{error}</p>}

      <main className="list">
        {loading && <p className="muted">読み込み中…</p>}
        {!loading && visible.length === 0 && (
          <div className="empty">
            <p>{items.length === 0 ? 'まだタスクがありません' : 'この種類のタスクはありません'}</p>
            {items.length === 0 && <p className="muted">右下の「＋」から、最初の企業を追加しましょう。</p>}
          </div>
        )}
        {visible.map((it) => {
          const n = daysLeft(it.due)
          const urgent = n !== null && n <= URGENT_DAYS
          const gauge = n === null ? 0 : Math.max(8, Math.min(100, 100 - Math.max(n, 0) * 6))
          return (
            <button
              key={it.id}
              className={urgent ? 'card urgent' : 'card'}
              onClick={() => setEditing(it)}
            >
              <span className="corner tl" />
              <span className="corner br" />
              <span className="row">
                <span className="tag">{TYPE_LABEL[it.type]}</span>
                <span className="left">{leftText(n)}</span>
              </span>
              <span className="name">
                {it.name}
                {it.role && <small>{it.role}</small>}
              </span>
              <span className="event">
                {it.event || '内容なし'} ・ {formatDue(it.due)}
              </span>
              <span className="gauge">
                <span style={{ width: `${gauge}%` }} />
              </span>
            </button>
          )
        })}
      </main>

      <button className="fab" aria-label="タスクを追加" onClick={() => setEditing('new')}>
        <span className="ring" />
        <span className="core">＋</span>
      </button>

      {editing && (
        <Editor
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined=確認中

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <div className="app center muted">読み込み中…</div>
  if (supabase && !session) return <Login />
  return <Board session={session} />
}
