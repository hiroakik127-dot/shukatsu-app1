import { TYPE_LABEL } from '../lib/constants'
import { byDue, daysLeft, formatDue, leftText, todayISO } from '../lib/dates'
import { useSwipeTap } from '../lib/gestures'
import { ProgressLine } from '../components/TaskCard'

function TodoRow({ item, actions, openTask }) {
  const { dx, ready, handlers } = useSwipeTap({
    onSwipeRight: () => (item.done ? null : actions.complete(item, { burst: false })),
    // ボタン以外の場所をタップしたら編集を開きます
    onTap: (e) => !e.target.closest('button') && openTask(item),
  })
  const n = daysLeft(item.due)

  return (
    <div className={dx > 0 ? 'swipe-wrap swiping' : 'swipe-wrap'}>
      <div className={ready ? 'swipe-under done-under ready' : 'swipe-under done-under'} aria-hidden="true">
        {item.done ? 'すでに完了しています' : '✓ 完了にする'}
      </div>
      <div
        className={item.done ? 'todo-row swipeable done' : 'todo-row swipeable'}
        style={dx ? { transform: `translateX(${dx}px)`, transition: 'none' } : undefined}
        {...handlers}
      >
        <div className="todo-main">
          <div className="todo-text">
            <div className="todo-name">{item.name}</div>
            <div className="todo-sub">
              {TYPE_LABEL[item.type]} ・ {item.event || '内容なし'}
              {item.due && ` ・ ${formatDue(item.due)}`}
              {!item.done && n !== null && <b className={n <= 1 ? 'warn' : ''}> {leftText(n)}</b>}
            </div>
            {!item.done && <ProgressLine item={item} />}
          </div>
          <button
            className="icon-btn small"
            aria-label={`「${item.name}」を今日のToDoから外す`}
            onClick={() => actions.removeToday(item)}
          >
            ×
          </button>
        </div>
        <button
          className={item.done ? 'btn ghost small done-btn undo' : 'btn small done-btn'}
          aria-label={`「${item.name}」を${item.done ? '未完了に戻す' : '完了にする'}`}
          onClick={() => (item.done ? actions.toggleDone(item) : actions.complete(item, { burst: false }))}
        >
          {item.done ? '戻す' : '完了'}
        </button>
      </div>
    </div>
  )
}

// 今日のToDo：ボードや締切から自分で選んだ、今日やるタスクの一覧です。
export default function Todo({ tasks, actions, openTask, go }) {
  const { items, loading } = tasks
  const today = todayISO()
  const list = items
    .filter((t) => t.todo_date === today)
    .sort((a, b) => Number(a.done) - Number(b.done) || byDue(a, b))
  // 前の日にToDoに入れたまま、終わっていないもの
  const carry = items.filter((t) => t.todo_date && t.todo_date < today && !t.done)
  const doneN = list.filter((t) => t.done).length
  const rate = list.length ? Math.round((doneN / list.length) * 100) : 0

  return (
    <main className="todo">
      {list.length > 0 && (
        <section className="todo-progress" aria-label="今日の進み具合">
          <div className="row">
            <span>
              完了 <b>{doneN}</b> / {list.length}
            </span>
            <span>{rate}%</span>
          </div>
          <span className="gauge">
            <span style={{ width: `${rate}%` }} />
          </span>
        </section>
      )}

      {carry.length > 0 && (
        <section className="panel block carry">
          <div className="eyebrow">LEFT OVER</div>
          <p className="muted">前のToDoで終わっていないタスクが{carry.length}件あります。繰り越すものを選んでください。</p>
          <ul className="carry-list">
            {carry.map((t) => (
              <li key={t.id}>
                <span className="carry-name">
                  {t.name}
                  <small>{t.event || '内容なし'}</small>
                </span>
                <button className="btn ghost small" onClick={() => actions.addToday(t)}>
                  今日へ
                </button>
                <button
                  className="icon-btn small"
                  aria-label={`「${t.name}」を繰り越さない`}
                  onClick={() => actions.removeToday(t)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {carry.length > 1 && (
            <button className="btn ghost small" onClick={() => actions.addTodayMany(carry)}>
              すべて今日へ
            </button>
          )}
        </section>
      )}

      <p className="gesture-hint">「完了」ボタンか右スワイプで完了 ・「戻す」で元に戻せます</p>

      <div className="list">
        {loading && <p className="muted">読み込み中…</p>}
        {!loading && list.length === 0 && (
          <div className="empty">
            <p>今日のToDoはまだ空です</p>
            <p className="muted">
              ボードや締切でタスクを右にスワイプするか、フローで上にスワイプすると、ここに入ります。
            </p>
            <div className="sample-row">
              <button className="btn ghost small" onClick={() => go('board')}>
                ボードから選ぶ
              </button>
              <button className="btn ghost small" onClick={() => go('deadline')}>
                締切から選ぶ
              </button>
            </div>
          </div>
        )}
        {list.map((t) => (
          <TodoRow key={t.id} item={t} actions={actions} openTask={openTask} />
        ))}
      </div>
    </main>
  )
}
