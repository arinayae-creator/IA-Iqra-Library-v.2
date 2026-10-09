import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="เกิดข้อผิดพลาดในการโหลดระบบห้องสมุด">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
