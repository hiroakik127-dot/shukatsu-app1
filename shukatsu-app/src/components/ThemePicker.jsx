import { useEffect, useState } from 'react'
import { DESIGNS, PALETTES, applyTheme, findDesign, findPalette, loadFonts, loadTheme, saveTheme } from '../lib/themes'

// 見本に使う文字の形（デザインごと）
const PREVIEW_FONT = {
  cyber: 'Orbitron, sans-serif',
  girly: "'Zen Maru Gothic', sans-serif",
  magic: "'Shippori Mincho', serif",
  simple: "system-ui, 'Hiragino Sans', sans-serif",
  wa: "'Zen Old Mincho', serif",
  amekaji: "'Bebas Neue', 'Noto Sans JP', sans-serif",
  natural: "'Zen Kaku Gothic New', sans-serif",
}

// ログイン画面だけに出す、デザインと配色を選ぶ部品です。
// 選ぶとすぐ画面に反映され、この端末に保存されます。
export default function ThemePicker() {
  const [theme, setTheme] = useState(loadTheme)
  const [open, setOpen] = useState(false)

  // 開いたら、見本のためにすべてのデザインの文字を読み込みます
  useEffect(() => {
    if (open) loadFonts(DESIGNS.flatMap((d) => d.fonts))
  }, [open])

  const change = (next) => {
    setTheme(next)
    applyTheme(next)
    saveTheme(next)
  }
  // デザインを選んだら、そのデザインに合う配色も一緒に選びます（あとで配色だけ変えられます）
  const pickDesign = (d) => change({ design: d.id, palette: d.palette })
  const pickPalette = (p) => change({ ...theme, palette: p.id })

  const design = findDesign(theme.design)
  const palette = findPalette(theme.palette)

  return (
    <section className="panel theme-picker">
      <button type="button" className="theme-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>
          <span className="theme-toggle-title">デザインと色</span>
          <span className="muted">
            {design.name} ・ {palette.name}
          </span>
        </span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div className="field">
            <span>デザイン</span>
            <div className="design-grid" role="radiogroup" aria-label="デザイン">
              {DESIGNS.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  role="radio"
                  aria-checked={theme.design === d.id}
                  className={theme.design === d.id ? 'design-opt on' : 'design-opt'}
                  onClick={() => pickDesign(d)}
                >
                  <b style={{ fontFamily: PREVIEW_FONT[d.id] }}>{d.name}</b>
                  <small>{d.desc}</small>
                </button>
              ))}
            </div>
          </div>

          {[
            ['暗い背景', true],
            ['明るい背景', false],
          ].map(([label, dark]) => (
            <div className="field" key={label}>
              <span>配色（{label}）</span>
              <div className="palette-grid" role="radiogroup" aria-label={`配色（${label}）`}>
                {PALETTES.filter((p) => p.dark === dark).map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    role="radio"
                    aria-checked={theme.palette === p.id}
                    className={theme.palette === p.id ? 'palette-opt on' : 'palette-opt'}
                    onClick={() => pickPalette(p)}
                  >
                    <span className="swatch" style={{ background: p.bg, borderColor: p.a }} aria-hidden="true">
                      <i style={{ background: p.a }} />
                      <i style={{ background: p.ok }} />
                      <i style={{ background: p.warn }} />
                    </span>
                    <small>{p.name}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="muted theme-note">ログインしたあとは変えられません。変えたいときは、ログアウトしてからこの画面で選び直してください。</p>
        </>
      )}
    </section>
  )
}
