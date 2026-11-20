// タスクの進捗（進捗率・チェックリスト）の小さな関数です。
//
// チェックリストは、1つのタスクにいくつでも作れます（Trello のように）。
// 保存する形： [{ id, title, items: [{ id, text, done }] }]
// ※ 前のバージョンの [{ id, text, done }]（項目だけの並び）も読めるようにしています。

export const newCheckId = () => Math.random().toString(36).slice(2, 10)

// 進捗率（0〜100）。完了したタスクは 100% として扱います
export const percentOf = (t) => (t.done ? 100 : Math.max(0, Math.min(100, Number(t.percent) || 0)))

// チェックリストの一覧（形をそろえて返します）
export const checklistsOf = (t) => {
  const raw = Array.isArray(t?.checklist) ? t.checklist : []
  if (!raw.length) return []
  // 前の形（項目だけ）なら、1つのリストにまとめます
  if (!Array.isArray(raw[0]?.items)) return [{ id: 'list-1', title: 'チェックリスト', items: raw }]
  return raw.map((l) => ({ id: l.id || newCheckId(), title: l.title ?? 'チェックリスト', items: Array.isArray(l.items) ? l.items : [] }))
}

// 全部のリストを合わせた、済み／全部 の数
export const checkCount = (t) => countItems(checklistsOf(t))
export const countItems = (lists) => {
  const items = lists.flatMap((l) => l.items)
  return { done: items.filter((c) => c.done).length, total: items.length }
}

// 「・」「-」「1.」などの箇条書きの印を取って、1行ずつの項目にします
export const splitLines = (text) =>
  text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*(?:[-*・•●○◦‣▪□☐✓✔]|\d+[.)、．]|\[[ xX]?\])\s*/, '').trim())
    .filter(Boolean)
