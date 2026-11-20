import { TYPE_LABEL, URGENT_DAYS, starText } from '../lib/constants'
import { daysLeft, formatDue, leftText, todayISO } from '../lib/dates'
import { useMultiTap, useSwipeTap } from '../lib/gestures'

// ボード・締切で使うタスクのカードです。
// ・1回タップ：編集
// ・3回タップ：完了
// ・右スワイプ：今日のToDoに入れる
export default function TaskCard({ item, onOpen, onTriple, onSwipeRight }) {
  const [tap, taps] = useMultiTap({ onSingle: onOpen, onTriple })
  const { dx, ready, handlers } = useSwipeTap({ onSwipeRight, onTap: tap })

  const n = daysLeft(item.due)
  const urgent = !item.done && n !== null && n <= URGENT_DAYS
  const gauge = n === null ? 0 : Math.max(8, Math.min(100, 100 - Math.max(n, 0) * 6))
  const inToday = item.todo_date === todayISO()
  const cls = ['card', 'swipeable', urgent && 'urgent', item.done && 'done'].filter(Boolean).join(' ')

  return (
    <div className={dx > 0 ? 'swipe-wrap swiping' : 'swipe-wrap'}>
      <div className={ready ? 'swipe-under ready' : 'swipe-under'} aria-hidden="true">
        {inToday ? '今日のToDoに入っています' : '＋ 今日のToDoへ'}
      </div>
      <div
        className={cls}
        role="button"
        tabIndex={0}
        aria-label={`${item.name}（タップで編集）`}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        style={dx ? { transform: `translateX(${dx}px)`, transition: 'none' } : undefined}
        {...handlers}
      >
        <span className="corner tl" />
        <span className="corner br" />
        <span className="row">
          <span className="tag">
            {TYPE_LABEL[item.type]}
            {item.priority && (
              <span className="stars" aria-label={`志望度${item.priority}`}>
                {starText(item.priority)}
              </span>
            )}
          </span>
          <span className="left">
            {inToday && <span className="today-badge">今日</span>}
            {item.done ? '完了' : leftText(n)}
          </span>
        </span>
        <span className="name">
          {item.name}
          {item.role && <small>{item.role}</small>}
        </span>
        <span className="event">
          {item.event || '内容なし'} ・ {formatDue(item.due)}
        </span>
        {!item.done && (
          <span className="gauge">
            <span style={{ width: `${gauge}%` }} />
          </span>
        )}
        {taps > 0 && (
          <span className="tap-dots" aria-hidden="true">
            {'●'.repeat(taps)}
            {'○'.repeat(3 - taps)}
          </span>
        )}
      </div>
    </div>
  )
}
