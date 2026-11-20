// 画面の真ん中に出る入力シート（ポップアップ）の枠です。
export default function Sheet({ title, onClose, onSubmit, noValidate, children }) {
  return (
    <div className="sheet-back" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit} noValidate={noValidate}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="閉じる" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </form>
    </div>
  )
}
