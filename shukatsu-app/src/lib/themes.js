// アプリのデザイン（雰囲気）と配色です。
// ・デザイン：文字の形、角の丸み、光り方、背景の模様などを決めます（styles.css の [data-design] で切り替え）
// ・配色：色だけを決めます。どのデザインとも組み合わせられます
// 選んだものはこの端末に保存し、ログイン画面でだけ変えられます。

const KEY = 'shukatsu.theme.v1'

export const DESIGNS = [
  {
    id: 'cyber',
    name: 'サイバー',
    desc: '光るラインの近未来',
    palette: 'neon-cyan',
    fonts: ['Orbitron:wght@500;700'],
  },
  {
    id: 'girly',
    name: 'ガーリー',
    desc: '丸くてやわらか、ハートとドット',
    palette: 'sakura',
    fonts: ['Zen+Maru+Gothic:wght@400;500;700', 'Quicksand:wght@500;700'],
  },
  {
    id: 'magic',
    name: '魔法の学校',
    desc: '羊皮紙と金の飾り、星の夜空',
    palette: 'bordeaux',
    fonts: ['Shippori+Mincho:wght@400;600;700', 'Cinzel:wght@500;700'],
  },
  {
    id: 'simple',
    name: 'シンプル',
    desc: '飾りなし、すっきり見やすい',
    palette: 'mono-light',
    fonts: [],
  },
  {
    id: 'wa',
    name: '和風',
    desc: '明朝体と青海波の模様',
    palette: 'washi-shu',
    fonts: ['Zen+Old+Mincho:wght@400;600;700'],
  },
  {
    id: 'amekaji',
    name: 'アメカジ',
    desc: 'デニムとステッチ、太い見出し',
    palette: 'denim',
    fonts: ['Bebas+Neue'],
  },
  {
    id: 'natural',
    name: 'ナチュラル',
    desc: '木と葉っぱ、やさしい丸み',
    palette: 'wakakusa',
    fonts: ['Zen+Kaku+Gothic+New:wght@400;500;700', 'Josefin+Sans:wght@500;700'],
  },
]

// 配色。dark は暗い背景かどうか。
// bg 背景／glow 背景の明るい部分／surface カードなどの面／surface2 フローのカードの明るい側
// a メインの色／soft 見出しやラベルの色／text 文字／text2 本文／muted 補足の文字
// warn 締切が近い・注意／ok 完了／star 志望度の星
const P = (id, name, dark, c) => ({ id, name, dark, ...c })
export const PALETTES = [
  // ---- 暗い背景 ----
  P('neon-cyan', 'ネオンシアン', true, { bg: '#020a10', glow: '#06222d', surface: '#071b24', surface2: '#0a303e', a: '#7df9ff', soft: '#9be8f5', text: '#e6fcff', text2: '#cff8ff', muted: '#8cc9d4', warn: '#ff9f43', ok: '#6dffb0', star: '#ffd66b' }),
  P('neon-pink', 'ネオンピンク', true, { bg: '#0d0410', glow: '#2a0a2e', surface: '#1a0a1f', surface2: '#2c1033', a: '#ff6ad5', soft: '#f7a8e6', text: '#ffeefa', text2: '#f9d6ef', muted: '#c79abb', warn: '#ffb347', ok: '#7dffc4', star: '#ffe26b' }),
  P('violet', 'ミッドナイトパープル', true, { bg: '#0b0618', glow: '#1f1340', surface: '#150d2b', surface2: '#22164a', a: '#b18cff', soft: '#cdb6ff', text: '#f1ebff', text2: '#ddd2ff', muted: '#a597c9', warn: '#ffa65c', ok: '#7af0b4', star: '#ffd66b' }),
  P('ocean', 'ディープオーシャン', true, { bg: '#031018', glow: '#082a3d', surface: '#06202f', surface2: '#0a3248', a: '#4cc3ff', soft: '#9ed9f7', text: '#eaf7ff', text2: '#cde9f7', muted: '#87b2c7', warn: '#ffa94d', ok: '#6ee7b7', star: '#ffd66b' }),
  P('emerald', 'エメラルド', true, { bg: '#03110c', glow: '#0a2c20', surface: '#072018', surface2: '#0c3326', a: '#4ff0b0', soft: '#9ef0cf', text: '#e8fff6', text2: '#c9f5e3', muted: '#86c2aa', warn: '#ffb054', ok: '#a8ff6b', star: '#ffe07a' }),
  P('navy-gold', '夜空とゴールド', true, { bg: '#060b1c', glow: '#13204a', surface: '#0d1633', surface2: '#18244d', a: '#f2c86b', soft: '#f5dca0', text: '#fbf6e9', text2: '#e9e1c8', muted: '#a9a58f', warn: '#ff8f6b', ok: '#8be3b0', star: '#ffd66b' }),
  P('bordeaux', 'ボルドーとゴールド', true, { bg: '#14060a', glow: '#3a0f1a', surface: '#240a12', surface2: '#3a121e', a: '#e0b65a', soft: '#ecd08f', text: '#fbf1e1', text2: '#f0dfc4', muted: '#b99c86', warn: '#ff8a5c', ok: '#9fe0a0', star: '#ffd66b' }),
  P('forest-silver', '深緑とシルバー', true, { bg: '#050f0b', glow: '#0f2a1f', surface: '#0a1d16', surface2: '#123126', a: '#c9d6d2', soft: '#a8c9bc', text: '#eef5f2', text2: '#d5e3dd', muted: '#8fa89f', warn: '#ffb066', ok: '#6fe3a0', star: '#e8d27a' }),
  P('rose-gold', 'ローズゴールド', true, { bg: '#1a1012', glow: '#3a2428', surface: '#261a1d', surface2: '#3a2629', a: '#f0b3a5', soft: '#e8c3b8', text: '#fdf1ee', text2: '#f0dcd6', muted: '#b89c96', warn: '#ffae5c', ok: '#9fe0b0', star: '#ffd66b' }),
  P('sumi-shu', '墨と朱', true, { bg: '#0f0d0c', glow: '#241e1b', surface: '#1a1614', surface2: '#2a2320', a: '#e8553e', soft: '#f0a08f', text: '#f6efe6', text2: '#e8ddd0', muted: '#a89a8c', warn: '#f5b341', ok: '#8cc98f', star: '#f5c542' }),
  P('matcha-night', '夜の抹茶', true, { bg: '#0b100a', glow: '#1d2a18', surface: '#141d11', surface2: '#21301b', a: '#a8c97f', soft: '#c8dca8', text: '#f1f5e9', text2: '#dde6cf', muted: '#9aa88b', warn: '#f0a35e', ok: '#b5e08a', star: '#f2d16b' }),
  P('denim', 'デニム', true, { bg: '#0c1524', glow: '#1b2c47', surface: '#13213a', surface2: '#1d3152', a: '#e3a857', soft: '#efc98f', text: '#f4f1ea', text2: '#e3dccd', muted: '#9fa8b6', warn: '#e8674a', ok: '#8fcf9a', star: '#f2c14e' }),
  P('charcoal', 'チャコール', true, { bg: '#111214', glow: '#1e2024', surface: '#1a1b1e', surface2: '#26282c', a: '#e6e6e6', soft: '#c4c4c4', text: '#f5f5f5', text2: '#dddddd', muted: '#9a9a9a', warn: '#ff9f43', ok: '#7fd99a', star: '#ffd66b' }),
  // ---- 明るい背景 ----
  P('sakura', 'さくら', false, { bg: '#fff5f8', glow: '#ffe1eb', surface: '#ffffff', surface2: '#fff0f5', a: '#e85d8f', soft: '#b44a75', text: '#4a2433', text2: '#5e3a48', muted: '#a07a88', warn: '#e07a2e', ok: '#2fa874', star: '#f0a020' }),
  P('lavender', 'ラベンダー', false, { bg: '#f7f4ff', glow: '#e8e0ff', surface: '#ffffff', surface2: '#f3efff', a: '#8a63d2', soft: '#6c4fb0', text: '#2e2448', text2: '#45395f', muted: '#8a80a3', warn: '#e0782e', ok: '#2e9e6e', star: '#e8a317' }),
  P('peach', 'ピーチ', false, { bg: '#fff6f0', glow: '#ffe4d4', surface: '#ffffff', surface2: '#fff1e8', a: '#f07f5a', soft: '#c4603f', text: '#4a2a1f', text2: '#5d3d31', muted: '#a2836f', warn: '#d9534f', ok: '#3a9e6a', star: '#e8a317' }),
  P('lemon', 'レモン', false, { bg: '#fffdf0', glow: '#fff3b8', surface: '#ffffff', surface2: '#fffbe0', a: '#d4a514', soft: '#9c7a0c', text: '#3d3517', text2: '#514825', muted: '#8f866a', warn: '#e0632e', ok: '#3a9e6a', star: '#e0a010' }),
  P('mint', 'ミント', false, { bg: '#f1fbf7', glow: '#d6f3e7', surface: '#ffffff', surface2: '#eefaf5', a: '#2bb38a', soft: '#1f8a6a', text: '#1d3a31', text2: '#2f4d43', muted: '#6f8f84', warn: '#e0782e', ok: '#3a8fd9', star: '#e8a317' }),
  P('sky', 'スカイ', false, { bg: '#f2f8ff', glow: '#d9ebff', surface: '#ffffff', surface2: '#eef5ff', a: '#3a8ee6', soft: '#2a6db5', text: '#1c2f45', text2: '#2f4560', muted: '#7088a3', warn: '#e0782e', ok: '#2e9e6e', star: '#e8a317' }),
  P('wakakusa', '若草', false, { bg: '#f4f8ee', glow: '#e3edd2', surface: '#fffff9', surface2: '#f3f8ea', a: '#5f8f3e', soft: '#4a7031', text: '#26321c', text2: '#38472b', muted: '#7f8c70', warn: '#d27a2c', ok: '#3a8fb0', star: '#d9a521' }),
  P('washi-shu', '和紙と朱', false, { bg: '#f7f2e7', glow: '#efe5cf', surface: '#fffdf7', surface2: '#faf4e6', a: '#c0392b', soft: '#9a3a2a', text: '#2b2420', text2: '#43382f', muted: '#8a7d6b', warn: '#d9822b', ok: '#4f7f52', star: '#c99a2e' }),
  P('ai', '生成りと藍', false, { bg: '#f5f1e8', glow: '#e6e0d0', surface: '#fffdf8', surface2: '#f7f3ea', a: '#24477a', soft: '#33507f', text: '#1f2430', text2: '#353c4a', muted: '#7d7f86', warn: '#c0562b', ok: '#4f7f52', star: '#c99a2e' }),
  P('parchment', '羊皮紙', false, { bg: '#f3e7c9', glow: '#e8d6a8', surface: '#fbf3dc', surface2: '#f6ebcd', a: '#7a1f1f', soft: '#6b3b1b', text: '#2e1f10', text2: '#44311e', muted: '#8a7356', warn: '#b5481f', ok: '#4a7a3a', star: '#b8860b' }),
  P('earth', 'ベージュとブラウン', false, { bg: '#f6efe6', glow: '#eadccb', surface: '#fffaf3', surface2: '#f8f0e5', a: '#8b5e3c', soft: '#6e4a2f', text: '#33261b', text2: '#47372a', muted: '#8f7d6c', warn: '#c8562b', ok: '#5a8a4a', star: '#d19a2a' }),
  P('terracotta', 'テラコッタ', false, { bg: '#fbf1ea', glow: '#f2dccd', surface: '#fffaf6', surface2: '#fbefe6', a: '#c2603d', soft: '#9a4a2e', text: '#3a231a', text2: '#4f352a', muted: '#957a6c', warn: '#b23a2a', ok: '#4f8a5a', star: '#d9962a' }),
  P('mono-light', 'モノクロ', false, { bg: '#f6f6f6', glow: '#ececec', surface: '#ffffff', surface2: '#f8f8f8', a: '#222222', soft: '#444444', text: '#111111', text2: '#333333', muted: '#808080', warn: '#d0632e', ok: '#2e9e6e', star: '#e0a010' }),
]

export const DEFAULT_THEME = { design: 'cyber', palette: 'neon-cyan' }

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}
// 明るい色の上には黒、暗い色の上には白の文字を使います
const onColor = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111111' : '#ffffff'
}

export const findDesign = (id) => DESIGNS.find((d) => d.id === id) || DESIGNS[0]
export const findPalette = (id) => PALETTES.find((p) => p.id === id) || PALETTES[0]

export function loadTheme() {
  try {
    const t = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (t && DESIGNS.some((d) => d.id === t.design) && PALETTES.some((p) => p.id === t.palette)) return t
  } catch {
    // 壊れていたら最初の見た目に戻します
  }
  return DEFAULT_THEME
}

export function saveTheme(theme) {
  localStorage.setItem(KEY, JSON.stringify(theme))
}

// 文字の形（Googleのフォント）を、使うときだけ読み込みます
const loaded = new Set(['Orbitron:wght@500;700'])
export function loadFonts(families) {
  const todo = families.filter((f) => !loaded.has(f))
  if (!todo.length) return
  todo.forEach((f) => loaded.add(f))
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${todo.map((f) => `family=${f}`).join('&')}&display=swap`
  document.head.appendChild(link)
}

// 画面全体に、デザインと配色を当てます
export function applyTheme({ design, palette }) {
  const d = findDesign(design)
  const p = findPalette(palette)
  const root = document.documentElement
  root.dataset.design = d.id
  root.dataset.mode = p.dark ? 'dark' : 'light'
  const vars = {
    '--bg': p.bg,
    '--bg-rgb': rgb(p.bg),
    '--glow-bg': p.glow,
    '--surface': p.surface,
    '--surface-rgb': rgb(p.surface),
    '--surface2': p.surface2,
    '--cy': p.a,
    '--a-rgb': rgb(p.a),
    '--on-a': onColor(p.a),
    '--cy-soft': p.soft,
    '--text': p.text,
    '--text-rgb': rgb(p.text),
    '--text2': p.text2,
    '--muted': p.muted,
    '--muted-rgb': rgb(p.muted),
    '--or': p.warn,
    '--warn-rgb': rgb(p.warn),
    '--ok': p.ok,
    '--ok-rgb': rgb(p.ok),
    '--star': p.star,
    '--star-rgb': rgb(p.star),
    '--scheme': p.dark ? 'dark' : 'light',
    '--error': p.dark ? '#ffb4a8' : '#c0392b',
    '--sun': p.dark ? '#ff8a8a' : '#d64545',
    '--sat': p.dark ? '#8ab8ff' : '#3a6fd6',
    // 明るい背景では、光（にじみ）を控えめにします
    '--glow-mode': p.dark ? 1 : 0.45,
  }
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, String(v)))
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg)
  loadFonts(d.fonts)
}
