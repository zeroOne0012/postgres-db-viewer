import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  // 개발 환경에서는 StrictMode 에 의해 API 두번 씩 호출
  <StrictMode> 
    <App />
  </StrictMode>,
)
