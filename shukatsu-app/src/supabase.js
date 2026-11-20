import { createClient } from '@supabase/supabase-js'

// public/config.js（実行時の設定）を優先し、なければ .env の値を使います。
const cfg = (typeof window !== 'undefined' && window.__CONFIG__) || {}
const url = cfg.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const key = cfg.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// 接続情報がなければ null（= この端末内だけに保存するモード）
export const supabase = url && key ? createClient(url, key) : null
