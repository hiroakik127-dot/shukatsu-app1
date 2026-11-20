export const TYPES = [
  { key: 'es', label: 'ES' },
  { key: 'webtest', label: 'Webテスト' },
  { key: 'interview', label: '面接' },
  { key: 'gd', label: 'GD' },
  { key: 'intern', label: 'インターン' },
  { key: 'result', label: '結果待ち' },
  { key: 'briefing', label: '説明会' },
  { key: 'community', label: '選コミュ' },
]
export const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.key, t.label]))

// 締切がこの日数以内なら、オレンジで目立たせます
export const URGENT_DAYS = 5

// 志望度（1〜5）を ★☆ の文字列にします。未設定なら空文字
export const starText = (p) => (p ? '★'.repeat(p) + '☆'.repeat(5 - p) : '')
