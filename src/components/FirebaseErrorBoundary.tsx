import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class FirebaseErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    let message = error.message || "Ocorreu um erro inesperado.";
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && parsed.error && parsed.operationType) {
        message = `Erro de permissão ou comunicação com o servidor (${parsed.operationType}).`;
      }
    } catch {
      // Not a JSON Firestore error
    }
    return { hasError: true, errorMessage: message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[FirebaseErrorBoundary] Caught error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 elite-gradient text-gold">
          <div className="max-w-md w-full bg-card border-2 border-gold/40 rounded-xl p-6 text-center space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold uppercase tracking-wider text-gold">
              Algo deu errado
            </h2>
            <p className="text-sm text-muted-foreground">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-lg gold-gradient text-primary font-bold uppercase text-xs tracking-wider hover:opacity-90 transition-opacity"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
