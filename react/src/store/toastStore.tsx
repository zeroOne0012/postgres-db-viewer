import { create } from 'zustand';

export interface ToastMessage {
  id: number;
  message: string;
  isOk: boolean;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (message: string, isOk: boolean) => void;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, isOk) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, isOk }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));