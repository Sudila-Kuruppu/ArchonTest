import { createStore } from "zustand/vanilla";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
};

export type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

export type CartStoreApi = ReturnType<typeof createCartStore>;

export const createCartStore = () =>
  createStore<CartStore>((set) => ({
    items: [],

    addItem: (item) =>
      set((state) => ({
        items: [...state.items, item],
      })),

    removeItem: (id) =>
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      })),

    updateQuantity: (id, quantity) =>
      set((state) => ({
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i,
        ),
      })),

    clearCart: () => set({ items: [] }),
  }));
