import { createStore } from "zustand/vanilla";

export type WishlistStore = {
  items: string[];
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
};

export type WishlistStoreApi = ReturnType<typeof createWishlistStore>;

export const createWishlistStore = () =>
  createStore<WishlistStore>((set, get) => ({
    items: [],

    toggleItem: (productId) =>
      set((state) => ({
        items: state.items.includes(productId)
          ? state.items.filter((id) => id !== productId)
          : [...state.items, productId],
      })),

    isInWishlist: (productId) => get().items.includes(productId),
  }));
