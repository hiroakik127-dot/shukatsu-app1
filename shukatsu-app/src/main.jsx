import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, loadTheme } from './lib/themes'
import './styles.css'
import './themes.css'

// 画面を出す前に、選んであるデザインと配色を当てます（一瞬だけ別の色に見えるのを防ぎます）
applyTheme(loadTheme())

createRoot(document.getElementById('root')).render(<App />)
