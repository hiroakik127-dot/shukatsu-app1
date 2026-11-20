import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { esStore, friendlyError, isCloud, taskStore, useCollection } from './store'
import { todayISO } from './lib/dates'
import TaskEditor from './components/TaskEditor'
import ThemePicker from './components/ThemePicker'
import { CompleteBurst, Toast } from './components/Feedback'
import Home from './screens/Home'
import Todo from './screens/Todo'
import Board from './screens/Board'
import Flow from './screens/Flow'
import Deadlines from './screens/Deadlines'
import EsStock from './screens/EsStock'

const SCREENS = [
  { key: 'home', label: 'ホーム', icon: '◎', eyebrow: 'HOLO', title: 'ホーム' },
  { key: 'todo', label: '今日', icon: '☑', eyebrow: 'TODAY', title: '今日のToDo' },
  { key: 'deadline', label: '締切', icon: '◷', eyebrow: 'DEADLINE', title: '締切' },
  { key: 'flow', label: 'フロー', icon: '⇄', eyebrow: 'FLOW', title: 'フロー' },
  { key: 'board', label: 'ボード', icon: '▦', eyebrow: 'TASK BOARD', title: '選考ボード' },
  { key: 'es', label: 'ES', icon: '✎', eyebrow: 'ES STOCK', title: 'ESストック' },
]

// URLの # で画面を覚えます（再読み込みしても同じ画面に戻れるように）
const screenFromHash = () => {
  const key = window.location.hash.replace('#', '')
  return SCREENS.some((s) => s.key === key) ? key : 'home'
}

// Supabaseのエラーを、わかりやすい日本語にします
const authErrorText = (message) => {
  if (/invalid login credentials/i.test(message)) return 'メールアドレスかパスワードが違います。'
  if (/already registered|already exists/i.test(message))
    return 'このメールアドレスはすでに登録されています。「ログイン」から入ってください。'
  if (/email not confirmed/i.test(message))
    return 'メールの確認が終わっていません。READMEの「メール確認をオフにする」手順を行ってください。'
  if (/password/i.test(message) && /(6|short|least)/i.test(message))
    return 'パスワードは6文字以上にしてください。'
  if (/rate limit/i.test(message)) return '短い時間に何度も試したため、少し待ってからもう一度試してください。'
  return message
}

function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const signup = mode === 'signup'

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    const { data, error } = signup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) return setError(authErrorText(error.message))
    // 「メール確認」がオンのままだと、登録してもすぐにはログインできません
    if (signup && !data.session)
      setInfo('登録しましたが、メール確認がオンになっています。READMEの「メール確認をオフにする」手順を行ってください。')
  }

  return (
    <div className="app center">
      <div className="eyebrow">LOGIN</div>
      <h1>就活ボード</h1>
      <form className="panel login" onSubmit={submit}>
        <div className="seg two">
          <button type="button" className={!signup ? 'on' : ''} onClick={() => setMode('login')}>
            ログイン
          </button>
          <button type="button" className={signup ? 'on' : ''} onClick={() => setMode('signup')}>
            新規登録
          </button>
        </div>
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
        <label>
          パスワード{signup && '（6文字以上）'}
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
          />
        </label>
        <button className="btn primary" disabled={busy}>
          {busy ? '確認中…' : signup ? '登録してはじめる' : 'ログイン'}
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {info && <p className="muted">{info}</p>}
      </form>
      <ThemePicker />
    </div>
  )
}

function Shell({ session }) {
  const [screen, setScreen] = useState(screenFromHash)
  const [editing, setEditing] = useState(null) // null | 'new' | task
  const tasks = useCollection(taskStore)
  const es = useCollection(esStore)

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ボードを開くときの絞り込み（ホームの BY TYPE から種類を指定して開けます）
  const [boardFilter, setBoardFilter] = useState('all')
  const go = (key, filter = 'all') => {
    setBoardFilter(filter)
    window.location.hash = key
    setScreen(key)
    window.scrollTo(0, 0)
  }

  // 完了の演出と、画面下のお知らせ
  const [burst, setBurst] = useState(null)
  const [toast, setToast] = useState(null)
  const say = (text, undo) => setToast({ text, undo, key: Date.now() })
  const fail = (e) => setToast({ text: friendlyError(e, '保存に失敗しました'), error: true, key: Date.now() })
  const undoable = (fn) => () => fn().catch(fail)

  // どの画面からでも使う、タスクの操作です
  const actions = {
    async complete(task, { burst: show = true } = {}) {
      if (task.done) return say('すでに完了しています')
      try {
        await tasks.update(task.id, { done: true })
        if (show) setBurst(task)
        say(
          `「${task.name}」を完了にしました`,
          undoable(() => tasks.update(task.id, { done: false })),
        )
      } catch (e) {
        fail(e)
      }
    },
    async addToday(task) {
      if (task.todo_date === todayISO()) return say('すでに今日のToDoに入っています')
      try {
        await tasks.update(task.id, { todo_date: todayISO() })
        say(
          `「${task.name}」を今日のToDoに入れました`,
          undoable(() => tasks.update(task.id, { todo_date: task.todo_date ?? null })),
        )
      } catch (e) {
        fail(e)
      }
    },
    async addTodayMany(list) {
      try {
        await tasks.updateMany(
          list.map((t) => t.id),
          { todo_date: todayISO() },
        )
        say(`${list.length}件を今日のToDoに入れました`)
      } catch (e) {
        fail(e)
      }
    },
    async removeToday(task) {
      try {
        await tasks.update(task.id, { todo_date: null })
        say(
          `「${task.name}」を今日のToDoから外しました`,
          undoable(() => tasks.update(task.id, { todo_date: task.todo_date })),
        )
      } catch (e) {
        fail(e)
      }
    },
    // 完了 ⇔ 未完了 を切り替えます
    async toggleDone(task) {
      try {
        await tasks.update(task.id, { done: !task.done })
      } catch (e) {
        fail(e)
      }
    },
  }

  const meta = SCREENS.find((s) => s.key === screen)
  const loadError = tasks.error || es.error
  const props = { tasks, actions, openTask: setEditing }

  return (
    <div className="app">
      <header>
        <div>
          <div className="eyebrow">{meta.eyebrow}</div>
          <h1>{meta.title}</h1>
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
      {loadError && <p className="error">{loadError}</p>}

      {screen === 'home' && <Home {...props} es={es} go={go} />}
      {screen === 'todo' && <Todo {...props} go={go} />}
      {screen === 'board' && <Board key={boardFilter} {...props} initialFilter={boardFilter} />}
      {screen === 'flow' && <Flow {...props} />}
      {screen === 'deadline' && <Deadlines {...props} />}
      {screen === 'es' && <EsStock es={es} />}

      <nav className="tabbar" aria-label="画面の切り替え">
        {SCREENS.map((s) => (
          <button
            key={s.key}
            className={screen === s.key ? 'on' : ''}
            aria-current={screen === s.key ? 'page' : undefined}
            onClick={() => go(s.key)}
          >
            <span className="tab-icon" aria-hidden="true">
              {s.icon}
            </span>
            {s.label}
          </button>
        ))}
      </nav>

      {editing && (
        <TaskEditor
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(values) => (editing === 'new' ? tasks.add(values) : tasks.update(editing.id, values))}
          onDelete={() => tasks.remove(editing.id)}
        />
      )}

      {burst && <CompleteBurst task={burst} onClose={() => setBurst(null)} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
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
  return <Shell session={session} />
}
