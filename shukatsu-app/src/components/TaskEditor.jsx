import { friendlyError } from '../store'
import { useState } from 'react'
import Sheet from './Sheet'
import { TYPES } from '../lib/constants'
import { checklistsOf, countItems } from '../lib/progress'
import Checklists from './Checklists'

const emptyForm = {
  name: '',
  role: '',
  type: 'es',
  event: '',
  due: '',
  priority: null,
  done: false,
  percent: 0,
  memo: '',
  checklist: [],
}

const TABS = [
  { key: 'profile', label: 'プロフィール' },
  { key: 'progress', label: '進捗' },
]

function StarInput({ value, onChange }) {
  return (
    <div className="field">
      <span>志望度{!value && '（未設定）'}</span>
      <div className="stars-input" role="radiogroup" aria-label="志望度">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`志望度${n}`}
            className={value && n <= value ? 'on' : ''}
            // 同じ星をもう一度押すと未設定に戻します
            onClick={() => onChange(value === n ? null : n)}
          >
            {value && n <= value ? '★' : '☆'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- プロフィールのタブ（企業名・職種・志望度・種類・内容・日付） ----------
function ProfileTab({ form, set, isNew }) {
  return (
    <>
      <label>
        企業名
        <input
          required
          autoFocus={isNew}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="例：サンプル商事"
        />
      </label>
      <label>
        職種
        <input value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="例：総合職（営業）" />
      </label>

      <StarInput value={form.priority} onChange={(v) => set('priority', v)} />

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
        <input value={form.event} onChange={(e) => set('event', e.target.value)} placeholder="例：ES締切 23:59" />
      </label>
      <label>
        日付
        <input type="date" value={form.due} onChange={(e) => set('due', e.target.value)} />
      </label>
    </>
  )
}

// ---------- 進捗のタブ（状態・進捗率・チェックリスト・メモ） ----------
function ProgressTab({ form, set, setForm }) {
  const lists = form.checklist
  const count = countItems(lists)

  // チェックリストが変わったら、進捗率も（すべてのリストを合わせた）チェックの割合に合わせます
  const setLists = (next) =>
    setForm((f) => {
      const c = countItems(next)
      return { ...f, checklist: next, percent: c.total ? Math.round((c.done / c.total) * 100) : f.percent }
    })
  const shown = form.done ? 100 : form.percent

  return (
    <>
      <div className="field">
        <span>状態</span>
        <div className="seg two">
          <button type="button" className={!form.done ? 'on' : ''} onClick={() => set('done', false)}>
            進行中
          </button>
          <button type="button" className={form.done ? 'on' : ''} onClick={() => set('done', true)}>
            完了
          </button>
        </div>
      </div>

      <div className="field">
        <span className="label-row">
          進捗率
          <b className="percent-big">{shown}%</b>
        </span>
        <input
          type="range"
          className="percent-range"
          min="0"
          max="100"
          step="5"
          value={shown}
          disabled={form.done}
          aria-label="進捗率"
          style={{ '--p': `${shown}%` }}
          onChange={(e) => set('percent', Number(e.target.value))}
        />
        <div className="seg five">
          {[0, 25, 50, 75, 100].map((v) => (
            <button
              type="button"
              key={v}
              className={shown === v ? 'on' : ''}
              disabled={form.done}
              onClick={() => set('percent', v)}
            >
              {v}%
            </button>
          ))}
        </div>
        {form.done && <small className="muted">完了したタスクは 100% として表示されます。</small>}
      </div>

      <div className="field">
        <span className="label-row">
          チェックリスト
          {count.total > 0 && (
            <span className="count">
              全体 {count.done} / {count.total}
            </span>
          )}
        </span>
        <Checklists lists={lists} onChange={setLists} />
        {count.total > 0 && (
          <small className="muted">チェックを付けると、進捗率が自動で変わります（あとから手で変えることもできます）。</small>
        )}
      </div>

      <label>
        メモ
        <textarea
          rows={5}
          value={form.memo}
          onChange={(e) => set('memo', e.target.value)}
          placeholder="例：面接で聞かれたこと、次に準備すること、担当者の名前など"
        />
      </label>
    </>
  )
}

export default function TaskEditor({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    item
      ? {
          name: item.name,
          role: item.role,
          type: item.type,
          event: item.event,
          due: item.due || '',
          priority: item.priority ?? null,
          done: Boolean(item.done),
          percent: Number(item.percent) || 0,
          memo: item.memo || '',
          checklist: checklistsOf(item),
        }
      : emptyForm,
  )
  const [tab, setTab] = useState('profile')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

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
    if (!form.name.trim()) {
      setTab('profile')
      setError('企業名を入れてください。')
      return
    }
    run(() =>
      onSave({
        ...form,
        name: form.name.trim(),
        due: form.due || null,
        // 空の項目は消し、名前が空のリストは「チェックリスト」にします
        checklist: form.checklist.map((l) => ({
          ...l,
          title: l.title.trim() || 'チェックリスト',
          items: l.items.map((c) => ({ ...c, text: c.text.trim() })).filter((c) => c.text),
        })),
      }),
    )
  }

  const remove = () => {
    if (!window.confirm('このタスクを削除しますか？')) return
    run(onDelete)
  }

  return (
    <Sheet title={item ? 'タスクを編集' : 'タスクを追加'} onClose={onClose} onSubmit={submit} noValidate>
      <div className="seg two editor-tabs" role="tablist" aria-label="編集する内容">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'on' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <ProfileTab form={form} set={set} isNew={!item} />
      ) : (
        <ProgressTab form={form} set={set} setForm={setForm} />
      )}

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
