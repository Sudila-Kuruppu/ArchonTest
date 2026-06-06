"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/store-provider";
import { Button } from "@/components/ui/button";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import {
  MenuIcon,
  XIcon,
  UserIcon,
  PackageIcon,
  RulerIcon,
  HeartIcon,
  ShoppingCartIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          DressCave
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/women"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Women
          </Link>
          <Link
            href="/kids"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Kids
          </Link>
          <Link
            href="/men"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Men
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <MenuPrimitive.Root>
              <MenuPrimitive.Trigger
                render={
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                  >
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </button>
                }
              />
              <MenuPrimitive.Portal>
                <MenuPrimitive.Positioner sideOffset={6} align="end">
                  <MenuPrimitive.Popup className="z-50 min-w-48 rounded-lg bg-popover py-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                    <MenuPrimitive.Item
                      className="flex cursor-default items-center gap-2 px-3 py-1.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      render={<Link href="/account" />}
                    >
                      <UserIcon className="size-4" />
                      My Account
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      className="flex cursor-default items-center gap-2 px-3 py-1.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      render={<Link href="/account/measurements" />}
                    >
                      <RulerIcon className="size-4" />
                      Measurements
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Separator className="my-1 h-px bg-border" />
                    <MenuPrimitive.Item
                      className="flex cursor-default items-center gap-2 px-3 py-1.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      render={<Link href="/wishlist" />}
                    >
                      <HeartIcon className="size-4" />
                      Wishlist
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      className="flex cursor-default items-center gap-2 px-3 py-1.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      render={<Link href="/cart" />}
                    >
                      <ShoppingCartIcon className="size-4" />
                      Cart
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Separator className="my-1 h-px bg-border" />
                    <MenuPrimitive.Item
                      className="flex cursor-default items-center gap-2 px-3 py-1.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      render={<Link href="/account/settings" />}
                    >
                      <SettingsIcon className="size-4" />
                      Settings
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      className="flex cursor-default items-center gap-2 px-3 py-1.5 outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                      render={
                        <form action="/api/logout" method="post">
                          <button type="submit" className="flex items-center gap-2">
                            <LogOutIcon className="size-4" />
                            Logout
                          </button>
                        </form>
                      }
                    />
                  </MenuPrimitive.Popup>
                </MenuPrimitive.Positioner>
              </MenuPrimitive.Portal>
            </MenuPrimitive.Root>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="flex items-center justify-center md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <XIcon className="size-6" />
          ) : (
            <MenuIcon className="size-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4">
            <Link
              href="/women"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Women
            </Link>
            <Link
              href="/kids"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kids
            </Link>
            <Link
              href="/men"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Men
            </Link>
            <hr className="my-2 border-border" />
            {user ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon className="size-4" />
                  My Account
                </Link>
                <Link
                  href="/account/measurements"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <RulerIcon className="size-4" />
                  Measurements
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HeartIcon className="size-4" />
                  Wishlist
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingCartIcon className="size-4" />
                  Cart
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <SettingsIcon className="size-4" />
                  Settings
                </Link>
                <hr className="my-2 border-border" />
                <form action="/api/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOutIcon className="size-4" />
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
