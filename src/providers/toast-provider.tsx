'use client';

import { Toaster } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts } = useToast();

  return (
    <>
      {children}
      <Toaster toasts={toasts} />
    </>
  );
}
