// ============================================================
// components/shared/ErrorBoundary.tsx
// ============================================================
import * as React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react';

interface IErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public state: IErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): IErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <MessageBar messageBarType={MessageBarType.error} isMultiline>
          Er is een onverwachte fout opgetreden. Herlaad de pagina om opnieuw te proberen.
        </MessageBar>
      );
    }
    return this.props.children;
  }
}
