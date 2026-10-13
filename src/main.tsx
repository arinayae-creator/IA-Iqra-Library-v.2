import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const filename = event.filename || '';
    const message = event.message || '';
    if (filename.includes('@vite/client') || message.includes('WebSocket') || message.includes('@vite/client')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (msg.includes('WebSocket') || msg.includes('vite:ws') || msg.includes('@vite/client')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการโหลดระบบห้องสมุด">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
