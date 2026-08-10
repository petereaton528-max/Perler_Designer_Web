import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AboutPage, PrivacyPage } from './pages'

const path = window.location.pathname.replace(/\/$/, '') || '/'
const Page = path === '/about' ? AboutPage : path === '/privacy' ? PrivacyPage : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
