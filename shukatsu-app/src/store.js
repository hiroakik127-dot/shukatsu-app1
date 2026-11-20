import { supabase } from './supabase'

// タスク（= 企業ごとの次の予定）の保存先を切り替える層です。
// Supabaseが設定されていればクラウド、なければこの端末のブラウザ内に保存します。

const KEY = 'shukatsu.tasks.v1'

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}
const writeLocal = (rows) => localStorage.setItem(KEY, JSON.stringify(rows))

const local = {
  async list() {
    return readLocal()
  },
  async add(item) {
    const row = { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    writeLocal([...readLocal(), row])
    return row
  },
  async update(id, patch) {
    writeLocal(readLocal().map((r) => (r.id === id ? { ...r, ...patch } : r)))
  },
  async remove(id) {
    writeLocal(readLocal().filter((r) => r.id !== id))
  },
}

const remote = {
  async list() {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at')
    if (error) throw error
    return data
  },
  async add(item) {
    const { data, error } = await supabase.from('tasks').insert(item).select().single()
    if (error) throw error
    return data
  },
  async update(id, patch) {
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) throw error
  },
  async remove(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },
}

export const store = supabase ? remote : local
export const isCloud = Boolean(supabase)
