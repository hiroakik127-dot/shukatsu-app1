import { useEffect, useRef } from 'react'

// 3回タップで完了したときに、タスクを大きく出して「完了」と見せる演出です。
export function CompleteBurst({ task, onClose }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const t = setTimeout(() => close.current(), 1300)
    return () => clearTimeout(t)
  }, [task.id])

  return (
    <div className="burst-back" onClick={onClose} role="status" aria-live="polite">
      <div className="burst-card">
        <div className="burst-stamp">完了</div>
        <div className="burst-name">{task.name}</div>
        {task.event && <div className="muted">{task.event}</div>}
      </div>
    </div>
  )
}

// 画面下に少しだけ出るお知らせです。「取り消す」も押せます。
export function Toast({ toast, onClose }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const t = setTimeout(() => close.current(), toast.undo ? 4500 : 2500)
    return () => clearTimeout(t)
  }, [toast.key])

  return (
    <div className={toast.error ? 'toast error-toast' : 'toast'} role="status" aria-live="polite">
      <span>{toast.text}</span>
      {toast.undo && (
        <button
          className="toast-undo"
          onClick={() => {
            onClose()
            toast.undo()
          }}
        >
          取り消す
        </button>
      )}
    </div>
  )
}
