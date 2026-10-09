import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-4 max-w-lg mx-auto shadow-sm">
          <div className="inline-flex p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {this.props.fallbackTitle || 'พบปัญหาในการแสดงผลส่วนนี้'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              ระบบป้องกันหน้าจอขาว (White Screen) ทำงานอัตโนมัติแล้ว คุณสามารถกดปุ่มด้านล่างเพื่อลองใหม่อีกครั้ง
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>ลองใหม่อีกครั้ง</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" />
              <span>รีเฟรชหน้าเว็บ</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
