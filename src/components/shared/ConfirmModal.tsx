import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
}: ConfirmModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onCancel();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onCancel]);

    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                onClick={onCancel}
            />

            {/* Modal Card */}
            <div
                className={`
          relative w-full max-w-md p-6 rounded-xl 
          bg-[#0f0f1a]/95 border border-primary/20
          shadow-[0_0_40px_rgba(0,0,0,0.5)]
          transform transition-all duration-300 ease-out
          ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}
        `}
            >
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {title}
                    </h3>

                    <p className="text-muted-foreground mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] font-medium"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
