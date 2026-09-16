export type ToastVariant = "success" | "error" | "info";
export type ToastAction = { label: string; onClick: () => void };
export type Toast = { id: number; variant: ToastVariant; message: string; action?: ToastAction; durationMs?: number };
type ToastOptions = { action?: ToastAction; durationMs?: number };

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function push(variant: ToastVariant, message: string, options?: ToastOptions) {
  toasts = [...toasts, { id: nextId++, variant, message, action: options?.action, durationMs: options?.durationMs }];
  emit();
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (message: string, options?: ToastOptions) => push("success", message, options),
  error: (message: string, options?: ToastOptions) => push("error", message, options),
  info: (message: string, options?: ToastOptions) => push("info", message, options),
  dismiss,
};

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}
