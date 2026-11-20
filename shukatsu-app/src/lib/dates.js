// 日付まわりの小さな関数です。日付は "YYYY-MM-DD" の文字列で扱います。

export const todayStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const parse = (due) => {
  const [y, m, d] = due.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// 今日からの日数（日付がなければ null）
export const daysLeft = (due) => {
  if (!due) return null
  return Math.round((parse(due) - todayStart()) / 86400000)
}

export const formatDue = (due) => {
  if (!due) return '日付なし'
  const date = parse(due)
  const w = '日月火水木金土'[date.getDay()]
  return `${date.getMonth() + 1}/${date.getDate()}（${w}）`
}

export const leftText = (n) => {
  if (n === null) return ''
  if (n < 0) return `${-n}日超過`
  if (n === 0) return '今日'
  return `あと${n}日`
}

// 今日から offset 日後の "YYYY-MM-DD"（この端末の日付で計算します）
export const isoFromToday = (offset) => {
  if (offset === null) return null
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const todayISO = () => isoFromToday(0)

export const formatToday = () => {
  const d = new Date()
  const w = '日月火水木金土'[d.getDay()]
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}（${w}）`
}

// 日付の近い順。日付なしは最後
export const byDue = (a, b) => {
  if (!a.due && !b.due) return 0
  if (!a.due) return 1
  if (!b.due) return -1
  return a.due.localeCompare(b.due)
}
