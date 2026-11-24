import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// データの保存先を切り替える層です。
// Supabaseが設定されていればクラウド、なければこの端末のブラウザ内に保存します。

const localStore = (key) => {
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
      return []
    }
  }
  const write = (rows) => localStorage.setItem(key, JSON.stringify(rows))
  return {
    async list() {
      return read()
    },
    async add(item) {
      const row = { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() }
      write([...read(), row])
      return row
    },
    async update(id, patch) {
      write(read().map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    async remove(id) {
      write(read().filter((r) => r.id !== id))
    },
  }
}

const remoteStore = (table) => ({
  async list() {
    const { data, error } = await supabase.from(table).select('*').order('created_at')
    if (error) throw error
    return data
  },
  async add(item) {
    const { data, error } = await supabase.from(table).insert(item).select().single()
    if (error) throw error
    return data
  },
  async update(id, patch) {
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) throw error
  },
  async remove(id) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  },
})

const makeStore = (table, localKey) => (supabase ? remoteStore(table) : localStore(localKey))

export const isCloud = Boolean(supabase)
export const taskStore = makeStore('tasks', 'shukatsu.tasks.v1')
export const esStore = makeStore('es_entries', 'shukatsu.es.v1')
export const noteStore = makeStore('notes', 'shukatsu.notes.v1')

// Supabaseのよくあるエラーを、やることがわかる日本語にします
export const friendlyError = (e, fallback) => {
  const m = (e && e.message) || ''
  if (/could not find the table/i.test(m) || /relation .* does not exist/i.test(m))
    return 'Supabaseに必要な表がまだありません。supabase/schema.sql をSQL Editorですべて実行してください。'
  if (/could not find the .* column/i.test(m) || /column .* does not exist/i.test(m))
    return 'Supabaseの表に新しい列がまだありません。supabase/schema.sql をSQL Editorですべて実行してください。'
  if (/tasks_type_check/i.test(m))
    return 'Supabaseが新しい種類（GD・Webテスト・インターン・選コミュ）にまだ対応していません。supabase/schema.sql をSQL Editorですべて実行してください。'
  if (/bucket not found/i.test(m) || /row-level security.*storage|storage.*row-level/i.test(m))
    return '写真の置き場がまだありません。supabase/schema.sql をSQL Editorですべて実行してください。'
  if (/quota|exceeded the quota/i.test(m))
    return 'この端末の保存できる量がいっぱいです。写真を減らしてください。'
  if (/permission denied/i.test(m))
    return 'Supabaseの権限が足りません。supabase/schema.sql をSQL Editorですべて実行してください。'
  return m || fallback
}

// 一覧の読み込みと、追加・更新・削除をまとめたフックです。
// 追加・更新・削除は失敗すると例外を投げるので、呼び出し側で表示してください。
export function useCollection(store) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setItems(await store.list())
      setError('')
    } catch (e) {
      setError(friendlyError(e, '読み込みに失敗しました'))
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    reload()
  }, [reload])

  const wrap = (fn) => async (...args) => {
    await fn(...args)
    await reload()
  }

  // まとめて追加・削除（終わってから1回だけ読み直します）
  const addMany = async (rows) => {
    try {
      for (const row of rows) await store.add(row)
    } finally {
      await reload()
    }
  }
  const updateMany = async (ids, patch) => {
    try {
      for (const id of ids) await store.update(id, patch)
    } finally {
      await reload()
    }
  }
  const removeMany = async (ids) => {
    try {
      for (const id of ids) await store.remove(id)
    } finally {
      await reload()
    }
  }

  return {
    items,
    loading,
    error,
    add: wrap(store.add),
    update: wrap(store.update),
    remove: wrap(store.remove),
    addMany,
    updateMany,
    removeMany,
  }
}
