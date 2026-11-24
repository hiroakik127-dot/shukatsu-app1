import { useRef, useState } from 'react'
import Sheet from './Sheet'
import { friendlyError } from '../store'
import { MAX_PHOTOS, removePhotos, uploadPhoto, usePhotoUrls } from '../lib/photos'

// 学びメモの追加・編集（タイトル・本文・写真）です。
export default function NoteEditor({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: item?.title || '',
    body: item?.body || '',
    photos: Array.isArray(item?.photos) ? item.photos : [],
    done: Boolean(item?.done),
  })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')
  const [viewing, setViewing] = useState(-1) // 大きく見ている写真の番号
  const added = useRef([]) // この画面で新しく置いた写真（保存しなかったら消します）
  const fileRef = useRef(null)
  const urls = usePhotoUrls(form.photos)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // 保存せずに閉じたら、新しく置いた写真を片付けます
  const close = () => {
    removePhotos(added.current)
    onClose()
  }

  const pick = async (e) => {
    const files = [...(e.target.files || [])].slice(0, MAX_PHOTOS - form.photos.length)
    e.target.value = ''
    if (!files.length) return
    setError('')
    setUploading(files.length)
    for (const file of files) {
      try {
        const p = await uploadPhoto(file)
        added.current.push(p)
        setForm((f) => ({ ...f, photos: [...f.photos, p] }))
      } catch (err) {
        setError(friendlyError(err, '写真を追加できませんでした'))
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const dropPhoto = (i) => {
    const p = form.photos[i]
    // 新しく置いたばかりの写真は、すぐ置き場から消します（前からある写真は、保存したときに消します）
    if (added.current.includes(p)) {
      added.current = added.current.filter((x) => x !== p)
      removePhotos([p])
    }
    set(
      'photos',
      form.photos.filter((_, j) => j !== i),
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() && !form.body.trim()) return setError('タイトルか本文を入れてください。')
    setBusy(true)
    setError('')
    try {
      await onSave({ ...form, title: form.title.trim() || form.body.trim().split('\n')[0].slice(0, 30) })
      // 保存できたら、消した写真を置き場からも消します
      const before = Array.isArray(item?.photos) ? item.photos : []
      removePhotos(before.filter((p) => !form.photos.includes(p)))
      added.current = []
      onClose()
    } catch (err) {
      setError(friendlyError(err, '保存に失敗しました'))
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('このメモを削除しますか？（写真も消えます）')) return
    setBusy(true)
    try {
      await onDelete()
      removePhotos([...(item?.photos || []), ...added.current])
      onClose()
    } catch (err) {
      setError(friendlyError(err, '削除に失敗しました'))
      setBusy(false)
    }
  }

  return (
    <Sheet title={item ? 'メモ' : 'メモを追加'} onClose={close} onSubmit={submit} noValidate>
      <label>
        タイトル
        <input
          autoFocus={!item}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="例：面接は結論から話す"
        />
      </label>
      <label>
        本文
        <textarea
          className="note-body"
          rows={8}
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="例：一次面接で、理由から話したら途中で止められた。まず結論を一言で、そのあと理由を2つまで。"
        />
      </label>

      <div className="field">
        <span className="label-row">
          写真
          <span className="count">
            {form.photos.length} / {MAX_PHOTOS}
          </span>
        </span>
        {form.photos.length > 0 && (
          <div className="photo-grid">
            {form.photos.map((p, i) => (
              <div key={p.slice(-40) + i} className="photo-cell">
                <button type="button" className="photo-open" aria-label={`写真${i + 1}を大きく見る`} onClick={() => setViewing(i)}>
                  {urls[i] ? <img src={urls[i]} alt="" /> : <span className="muted">読み込み中…</span>}
                </button>
                <button type="button" className="photo-del" aria-label={`写真${i + 1}を外す`} onClick={() => dropPhoto(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pick} />
        <button
          type="button"
          className="btn ghost small photo-add"
          disabled={uploading > 0 || form.photos.length >= MAX_PHOTOS}
          onClick={() => fileRef.current?.click()}
        >
          {uploading > 0 ? `写真を追加中…（あと${uploading}枚）` : '＋ 写真を追加'}
        </button>
      </div>

      {item && (
        <div className="field">
          <span>状態</span>
          <div className="seg two">
            <button type="button" className={!form.done ? 'on' : ''} onClick={() => set('done', false)}>
              未完了
            </button>
            <button type="button" className={form.done ? 'on' : ''} onClick={() => set('done', true)}>
              完了
            </button>
          </div>
        </div>
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
        <button className="btn primary" disabled={busy || uploading > 0}>
          {busy ? '保存中…' : '保存'}
        </button>
      </div>

      {viewing >= 0 && urls[viewing] && (
        <div className="photo-view" role="dialog" aria-label="写真" onClick={() => setViewing(-1)}>
          <img src={urls[viewing]} alt="" />
          <button type="button" className="icon-btn" aria-label="閉じる">
            ×
          </button>
        </div>
      )}
    </Sheet>
  )
}
