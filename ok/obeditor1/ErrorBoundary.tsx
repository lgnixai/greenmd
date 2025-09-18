import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../packages/ui/src/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError 
}) => (
  <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background">
    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
    <h2 className="text-xl font-semibold text-destructive mb-2">
      编辑器出现错误
    </h2>
    <p className="text-muted-foreground mb-4 max-w-md">
      很抱歉，编辑器遇到了一个意外错误。您可以尝试重置编辑器或刷新页面。
    </p>
    
    <details className="mb-4 text-left max-w-lg w-full">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
        查看错误详情
      </summary>
      <div className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-40">
        <div className="text-destructive font-semibold mb-2">错误信息:</div>
        <div className="mb-3">{error.message}</div>
        
        <div className="text-destructive font-semibold mb-2">错误堆栈:</div>
        <pre className="whitespace-pre-wrap">{error.stack}</pre>
        
        {errorInfo.componentStack && (
          <>
            <div className="text-destructive font-semibold mb-2 mt-3">组件堆栈:</div>
            <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
          </>
        )}
      </div>
    </details>
    
    <div className="flex gap-2">
      <Button onClick={resetError} variant="outline" size="sm">
        <RotateCcw className="w-4 h-4 mr-2" />
        重置编辑器
      </Button>
      <Button 
        onClick={() => window.location.reload()} 
        variant="default" 
        size="sm"
      >
        刷新页面
      </Button>
    </div>
  </div>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
