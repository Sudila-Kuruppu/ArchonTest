import { describe, it, expect, beforeEach } from "vitest";
import { createAuthStore, type AuthStore } from "@/lib/store/auth";

describe("AuthStore", () => {
  let store: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    store = createAuthStore();
  });

  it("starts with loading state and no user", () => {
    const state = store.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it("sets user and stops loading", () => {
    const mockUser = {
      id: "user-1",
      email: "jane@example.com",
      app_metadata: {},
      user_metadata: { full_name: "Jane Doe" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      role: "authenticated",
    } as any;

    store.getState().setUser(mockUser);
    const state = store.getState();
    expect(state.user).toBe(mockUser);
    expect(state.isLoading).toBe(false);
  });

  it("sets loading state", () => {
    store.getState().setLoading(true);
    expect(store.getState().isLoading).toBe(true);

    store.getState().setLoading(false);
    expect(store.getState().isLoading).toBe(false);
  });

  it("clears auth state", () => {
    const mockUser = {
      id: "user-1",
      email: "jane@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      role: "authenticated",
    } as any;

    store.getState().setUser(mockUser);
    expect(store.getState().user).not.toBeNull();

    store.getState().clearAuth();
    const state = store.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("supports subscribing to changes", () => {
    const mockUser = {
      id: "user-2",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
      role: "authenticated",
    } as any;

    const values: any[] = [];
    const unsubscribe = store.subscribe((state) => {
      values.push(state.user?.email);
    });

    store.getState().setUser(mockUser);
    expect(values[values.length - 1]).toBe("test@example.com");

    store.getState().clearAuth();
    expect(values[values.length - 1]).toBeUndefined();

    unsubscribe();
  });
});
