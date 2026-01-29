import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] text-white p-4">
                    <div className="glass-card p-8 max-w-md w-full text-center border-red-500/30">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2">Algo salió mal</h2>

                        <p className="text-gray-400 mb-6">
                            {this.state.error?.message?.includes("Import") || this.state.error?.name === "ChunkLoadError"
                                ? "Hubo un error al cargar la nueva versión de la aplicación."
                                : "Ha ocurrido un error inesperado en la aplicación."}
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="btn-gaming w-full flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Recargar Página
                        </button>

                        {process.env.NODE_ENV === "development" && (
                            <div className="mt-8 p-4 bg-black/40 rounded text-left overflow-auto max-h-32 text-xs font-mono text-red-400">
                                {this.state.error?.toString()}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
