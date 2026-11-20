import { friendlyError } from '../store'
import { useMemo, useState } from 'react'
import Sheet from '../components/Sheet'

const emptyForm = { title: '', company: '', body: '', char_limit: '' }

function EsEditor({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    item
      ? { title: item.title, company: item.company, body: item.body, char_limit: item.char_limit ?? '' }
      : emptyForm,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const limit = Number(form.char_limit) || null
  const len = form.body.length

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      onClose()
    } catch (e) {
      setError(friendlyError(e, '保存に失敗しました'))
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    run(() =>
      onSave({ title: form.title.trim(), company: form.company.trim(), body: form.body, char_limit: limit }),
    )
  }

  const remove = () => {
    if (!window.confirm('このESを削除しますか？')) return
    run(onDelete)
  }

  return (
    <Sheet title={item ? 'ESを編集' : 'ESを追加'} onClose={onClose} onSubmit={submit}>
      <label>
        設問・タイトル
        <input
          required
          autoFocus={!item}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="例：学生時代に力を入れたこと"
        />
      </label>
      <label>
        企業名（任意）
        <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="例：サンプル商事" />
      </label>
      <label>
        文字数の上限（任意）
        <input
          type="number"
          inputMode="numeric"
          min="1"
          value={form.char_limit}
          onChange={(e) => set('char_limit', e.target.value)}
          placeholder="例：400"
        />
      </label>
      <label>
        <span className="label-row">
          本文
          <span className={limit && len > limit ? 'count over' : 'count'}>
            {len}
            {limit ? ` / ${limit}字` : '字'}
          </span>
        </span>
        <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={9} />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="sheet-actions">
        {item && (
          <button type="button" className="btn danger" onClick={remove} disabled={busy}>
            削除
          </button>
        )}
        <button className="btn primary" disabled={busy}>
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
    </Sheet>
  )
}

// ESストック：書いたESの回答をためておき、使い回せるようにします。
export default function EsStock({ es }) {
  const { items, loading, add, update, remove } = es
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [copied, setCopied] = useState(null)

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rows = s
      ? items.filter((i) => [i.title, i.company, i.body].some((v) => (v || '').toLowerCase().includes(s)))
      : items
    return [...rows].reverse() // 新しい順
  }, [items, q])

  const copy = async (e, it) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(it.body)
      setCopied(it.id)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      window.alert('コピーできませんでした')
    }
  }

  return (
    <>
      <input
        type="search"
        className="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="設問・企業名・本文で検索"
        aria-label="ESを検索"
      />

      <main className="list">
        {loading && <p className="muted">読み込み中…</p>}
        {!loading && visible.length === 0 && (
          <div className="empty">
            <p>{items.length === 0 ? 'まだESがありません' : '見つかりませんでした'}</p>
            {items.length === 0 && (
              <p className="muted">ガクチカや自己PRなど、書いた回答をためておくと次のESで使い回せます。</p>
            )}
          </div>
        )}
        {visible.map((it) => {
          const len = (it.body || '').length
          return (
            <div key={it.id} className="card es-card" role="button" tabIndex={0} onClick={() => setEditing(it)}
              onKeyDown={(e) => e.key === 'Enter' && setEditing(it)}>
              <span className="corner tl" />
              <span className="corner br" />
              <span className="row">
                <span className="tag">{it.company || '共通'}</span>
                <span className={it.char_limit && len > it.char_limit ? 'count over' : 'count'}>
                  {len}
                  {it.char_limit ? ` / ${it.char_limit}字` : '字'}
                </span>
              </span>
              <span className="name">{it.title}</span>
              <span className="es-body">{it.body || '本文なし'}</span>
              <button className="btn ghost small copy" onClick={(e) => copy(e, it)} disabled={!it.body}>
                {copied === it.id ? 'コピーしました' : '本文をコピー'}
              </button>
            </div>
          )
        })}
      </main>

      <button className="fab" aria-label="ESを追加" onClick={() => setEditing('new')}>
        <span className="ring" />
        <span className="core">＋</span>
      </button>

      {editing && (
        <EsEditor
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(values) => (editing === 'new' ? add(values) : update(editing.id, values))}
          onDelete={() => remove(editing.id)}
        />
      )}
    </>
  )
}
