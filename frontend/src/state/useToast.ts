import { useCallback, useState } from "react";

type ToastState = {
  open: boolean;
  title: string;
  message?: string;
  tone: "info" | "success" | "error";
};

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: "",
    tone: "info",
  });

  const dismiss = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  const show = useCallback((next: Omit<ToastState, "open">) => {
    setToast({ ...next, open: true });
  }, []);

  return { toast, show, dismiss };
}
