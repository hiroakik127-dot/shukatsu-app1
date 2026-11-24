import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, loadTheme } from './lib/themes'
import { startAutoUpdate } from './lib/autoUpdate'
import './styles.css'
import './themes.css'

// 画面を出す前に、選んであるデザインと配色を当てます（一瞬だけ別の色に見えるのを防ぎます）
applyTheme(loadTheme())

// 新しい版が出ていたら、自動で読み込み直します
startAutoUpdate()

createRoot(document.getElementById('root')).render(<App />)
