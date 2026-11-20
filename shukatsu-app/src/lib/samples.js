import { isoFromToday } from './dates'

// 動作確認用のサンプルデータです（企業名はすべて架空）。
// 日付は「今日から何日後か」で持ち、入れるときに実際の日付にします。

const TASKS = [
  ['あおば商事', '総合職', 'es', 'ES締切 23:59', 2, 5, false],
  ['ひかり銀行', 'オープン', 'interview', '一次面接 14:00（オンライン）', 1, 4, false],
  ['ミナト製薬', 'MR職', 'briefing', '会社説明会 10:00', 6, 3, false],
  ['そらテック', 'エンジニア職', 'result', '二次面接の結果連絡', 4, 5, false],
  ['こだま食品', '商品企画', 'es', 'ES提出（Webテストあり）', -1, 2, false],
  ['ほしの電機', '技術系総合職', 'interview', '最終面接 15:30', 12, 4, false],
  ['つばさ航空', 'グランドスタッフ', 'briefing', 'オンライン座談会 19:00', 20, 3, false],
  ['みどり不動産', '営業職', 'es', 'ES締切 12:00', 0, null, false],
  ['ゆずはコンサル', 'ビジネスアナリスト', 'interview', 'グループディスカッション', null, 4, false],
  ['あかつき出版', '編集職', 'result', 'ES通過の連絡待ち', null, 2, false],
  ['なぎさ物流', '総合職', 'briefing', '会社説明会 13:00', -7, 1, true],
  ['いろは化粧品', 'マーケティング', 'es', 'ES提出済み', -3, 3, true],
]

const ES = [
  {
    title: '学生時代に力を入れたこと',
    company: '',
    char_limit: 400,
    body: 'カフェのアルバイトで、新人スタッフの定着率を上げる取り組みに力を入れました。当時は入って3か月以内に辞める人が半数近くいました。原因を探るため、辞めた人と今いる人の両方に話を聞くと、「最初の1か月で何を覚えればよいかわからない」という声が多くありました。そこで、覚える順番をまとめたチェックリストと、先輩が1対1で付く仕組みを店長に提案し、自分も教える側に立ちました。その結果、半年後には3か月以内の退職者が2人から0人になりました。この経験から、問題の原因を人の声から確かめ、仕組みで解決する大切さを学びました。',
  },
  {
    title: '自己PR',
    company: '',
    char_limit: 300,
    body: '私の強みは、周りを巻き込みながら物事を前に進める力です。ゼミの共同研究では、5人のメンバーの予定が合わず、作業が止まりがちでした。私は進み具合を共有する表を作り、週1回15分だけの短い打ち合わせを提案しました。役割と締切がはっきりしたことで作業が進み、学内の発表会では優秀賞をいただきました。',
  },
  {
    title: '志望動機',
    company: 'あおば商事',
    char_limit: 400,
    body: '私は、人と人をつなぎ、新しい価値を生む仕事がしたいと考え、貴社を志望します。アルバイトで、お客様の声をもとにメニューを変える提案をした経験から、現場の声を形にすることにやりがいを感じました。幅広い事業を持つ貴社であれば、国内外の取引先をつなぎ、新しいビジネスを生み出す仕事に挑戦できると考えています。',
  },
  { title: '入社後にやりたいこと', company: 'そらテック', char_limit: 200, body: '' },
]

// いくつかのタスクに、進捗率・メモ・チェックリストの例を付けます
const id = () => Math.random().toString(36).slice(2, 10)
const c = (text, done = false) => ({ id: id(), text, done })
const list = (title, items) => ({ id: id(), title, items })
const EXTRA = {
  あおば商事: () => ({
    percent: 67,
    memo: '志望動機は「人と人をつなぐ」で書く。字数400字。',
    checklist: [list('ESの準備', [c('自己分析を見直す', true), c('志望動機を書く', true), c('先輩に読んでもらう')])],
  }),
  ひかり銀行: () => ({
    percent: 50,
    memo: '面接官は人事の方2名の予定。逆質問を3つ用意する。',
    checklist: [
      list('面接の準備', [c('企業研究ノートを読む', true), c('逆質問を考える'), c('志望動機を声に出して練習')]),
      list('当日の確認', [c('カメラと音声の確認', true), c('服装の準備'), c('URLを開いておく', true)]),
    ],
  }),
  そらテック: () => ({ percent: 30, memo: '結果は1週間以内にメールで届く予定。' }),
  ほしの電機: () => ({ percent: 10, checklist: [list('最終面接の準備', [c('研究内容を1分で話す練習'), c('志望理由を見直す')])] }),
}

export const sampleTasks = () =>
  TASKS.map(([name, role, type, event, offset, priority, done]) => ({
    name,
    role,
    type,
    event,
    due: isoFromToday(offset),
    priority,
    done,
    ...(EXTRA[name]?.() || {}),
  }))

export const sampleEs = () => ES.map((e) => ({ ...e }))

// サンプルかどうかの見分け（企業名・設問で判定）
const TASK_NAMES = new Set(TASKS.map((t) => t[0]))
const ES_KEYS = new Set(ES.map((e) => `${e.title}|${e.company}`))
export const isSampleTask = (t) => TASK_NAMES.has(t.name)
export const isSampleEs = (e) => ES_KEYS.has(`${e.title}|${e.company}`)
