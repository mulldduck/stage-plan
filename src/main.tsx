import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: 오프라인 실행을 위한 서비스 워커 등록 (GitHub Pages 서브패스에서도 상대경로로 동작)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* 등록 실패는 앱 동작에 영향 없음 */
    });
  });
}
