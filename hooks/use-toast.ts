import { useToastStore } from "@/store";

export function useToast() {
  const { addToast } = useToastStore();

  return {
    toast: addToast,
    success: (title: string, message?: string) =>
      addToast({ title, message, type: "success" }),
    error: (title: string, message?: string) =>
      addToast({ title, message, type: "error" }),
    warning: (title: string, message?: string) =>
      addToast({ title, message, type: "warning" }),
    info: (title: string, message?: string) =>
      addToast({ title, message, type: "info" }),
  };
}
