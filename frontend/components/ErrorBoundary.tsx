'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from '@/components/ui/Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 text-6xl">⚠️</div>
          <h2 className="font-heading text-text-dark mb-4 text-3xl font-bold">
            Noe gikk galt
          </h2>
          <p className="text-text-muted mb-8 max-w-md italic opacity-80">
            Vi beklager, men det oppsto en uventet feil. Vennligst prøv å laste
            siden på nytt.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="rounded-2xl px-8 py-4"
          >
            Last siden på nytt
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
