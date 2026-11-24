// 新しい版が公開されていたら、自動で読み込み直します。
// スマホ（とくにホーム画面に追加したアプリ）は古い画面を覚えていることがあるため、
// 開いたとき・アプリに戻ってきたときに、公開中の版と見比べます。

const KEY = 'shukatsu.updateReloads'

export function startAutoUpdate() {
  // いま動いている版のファイル名（開発中は無いので何もしません）
  const mine = document.querySelector('script[type="module"][src*="assets/index-"]')?.getAttribute('src') || ''
  const name = mine.match(/index-[^/]+\.js/)?.[0]
  if (!name) return

  // 読み込み直したあとで、同じ版のままなら止めます（何度も読み込み直さないように）
  const tries = Number(sessionStorage.getItem(KEY) || 0)

  const check = async () => {
    try {
      const res = await fetch(`./?check=${Date.now()}`, { cache: 'no-store' })
      const latest = (await res.text()).match(/index-[^"'/]+\.js/)?.[0]
      if (!latest) return
      if (latest === name) return sessionStorage.removeItem(KEY)
      if (tries >= 2) return
      sessionStorage.setItem(KEY, String(tries + 1))
      // URLを少し変えて、覚えている古い画面ではなく新しい画面を読み込みます
      location.replace(`${location.pathname}?v=${Date.now()}${location.hash}`)
    } catch {
      // 電波がないときなどは、そのまま使えるようにします
    }
  }

  check()
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
}
