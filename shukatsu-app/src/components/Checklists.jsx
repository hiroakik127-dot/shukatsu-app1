import { useEffect, useRef, useState } from 'react'
import { newCheckId, splitLines } from '../lib/progress'

// 項目を足す欄。Enterで1つ足して、そのまま次の項目を書けます。
// 何行かまとめて貼り付けると、1行ずつの項目になります（箇条書きの「・」などは取ります）。
function AddItem({ onAdd, onClose, placeholder }) {
  const [text, setText] = useState('')
  const ref = useRef(null)
  useEffect(() => ref.current?.focus(), [])

  const commit = (value = text) => {
    const lines = splitLines(value)
    if (lines.length) onAdd(lines)
    setText('')
    ref.current?.focus()
  }

  return (
    <div className="cl-add">
      <textarea
        ref={ref}
        rows={2}
        value={text}
        placeholder={placeholder}
        aria-label="追加する項目"
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text')
          if (!/\n/.test(pasted)) return
          e.preventDefault()
          commit(text + pasted)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
      />
      <div className="cl-add-actions">
        <button type="button" className="btn primary small" onClick={() => commit()} disabled={!text.trim()}>
          追加
        </button>
        <button type="button" className="btn ghost small" onClick={onClose}>
          閉じる
        </button>
      </div>
      <small className="muted">Enterで追加して続けて書けます。箇条書きを貼り付けると、1行ずつ項目になります。</small>
    </div>
  )
}

function Checklist({ list, onChange, onRemove, autoAdd }) {
  const [adding, setAdding] = useState(autoAdd)
  const [hideDone, setHideDone] = useState(false)
  const doneN = list.items.filter((c) => c.done).length
  const total = list.items.length
  const rate = total ? Math.round((doneN / total) * 100) : 0
  const shown = hideDone ? list.items.filter((c) => !c.done) : list.items

  const setItems = (items) => onChange({ ...list, items })
  const update = (id, patch) => setItems(list.items.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  return (
    <section className="cl">
      <div className="cl-head">
        <span className="cl-icon" aria-hidden="true">
          ☑
        </span>
        <input
          className="cl-title"
          value={list.title}
          aria-label="チェックリストの名前"
          onChange={(e) => onChange({ ...list, title: e.target.value })}
        />
        {doneN > 0 && (
          <button type="button" className="btn ghost small" onClick={() => setHideDone((v) => !v)}>
            {hideDone ? `済みを表示（${doneN}）` : '済みを隠す'}
          </button>
        )}
        <button
          type="button"
          className="icon-btn small"
          aria-label={`チェックリスト「${list.title}」を削除`}
          onClick={() => (total === 0 || window.confirm(`「${list.title || 'チェックリスト'}」を削除しますか？`)) && onRemove()}
        >
          🗑
        </button>
      </div>

      <div className="cl-progress">
        <b>{rate}%</b>
        <span className="pbar">
          <span style={{ width: `${rate}%` }} />
        </span>
      </div>

      {total > 0 && hideDone && shown.length === 0 && <p className="muted cl-empty">すべて済みです 🎉</p>}

      <ul className="checklist">
        {shown.map((c) => (
          <li key={c.id} className={c.done ? 'done' : ''}>
            <button
              type="button"
              className="check-box"
              role="checkbox"
              aria-checked={c.done}
              aria-label={`「${c.text}」を${c.done ? '未完了に戻す' : '済みにする'}`}
              onClick={() => update(c.id, { done: !c.done })}
            >
              {c.done ? '✓' : ''}
            </button>
            <input
              className="check-text"
              value={c.text}
              aria-label="項目の名前"
              onChange={(e) => update(c.id, { text: e.target.value })}
            />
            <button
              type="button"
              className="icon-btn small"
              aria-label={`「${c.text}」を消す`}
              onClick={() => setItems(list.items.filter((x) => x.id !== c.id))}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        <AddItem
          placeholder="項目を入力（例：自己PRを400字にまとめる）"
          onClose={() => setAdding(false)}
          onAdd={(lines) => setItems([...list.items, ...lines.map((text) => ({ id: newCheckId(), text, done: false }))])}
        />
      ) : (
        <button type="button" className="btn ghost small cl-add-open" onClick={() => setAdding(true)}>
          ＋ 項目を追加
        </button>
      )}
    </section>
  )
}

// タスクのチェックリスト（いくつでも作れます）
export default function Checklists({ lists, onChange }) {
  const [naming, setNaming] = useState(false)
  const [title, setTitle] = useState('チェックリスト')
  const [fresh, setFresh] = useState(null) // 作ったばかりのリスト（すぐ項目を足せるようにします）

  const create = () => {
    const id = newCheckId()
    onChange([...lists, { id, title: title.trim() || 'チェックリスト', items: [] }])
    setFresh(id)
    setNaming(false)
    setTitle('チェックリスト')
  }

  return (
    <div className="cl-wrap">
      {lists.map((l) => (
        <Checklist
          key={l.id}
          list={l}
          autoAdd={l.id === fresh}
          onChange={(next) => onChange(lists.map((x) => (x.id === l.id ? next : x)))}
          onRemove={() => onChange(lists.filter((x) => x.id !== l.id))}
        />
      ))}

      {naming ? (
        <div className="cl-new">
          <input
            autoFocus
            value={title}
            aria-label="新しいチェックリストの名前"
            onFocus={(e) => e.target.select()}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                create()
              }
            }}
          />
          <div className="cl-add-actions">
            <button type="button" className="btn primary small" onClick={create}>
              作る
            </button>
            <button type="button" className="btn ghost small" onClick={() => setNaming(false)}>
              やめる
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn ghost cl-create" onClick={() => setNaming(true)}>
          ＋ チェックリストを追加
        </button>
      )}
    </div>
  )
}
