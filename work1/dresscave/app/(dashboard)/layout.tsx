import Link from "next/link";
import {
  UserIcon,
  RulerIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

const sidebarLinks = [
  { href: "/account", label: "Account", icon: UserIcon },
  { href: "/account/measurements", label: "Measurements", icon: RulerIcon },
  { href: "/account/settings", label: "Settings", icon: SettingsIcon },
  { href: "/account/delete", label: "Delete Account", icon: Trash2Icon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Sidebar Navigation */}
        <aside className="lg:border-r lg:pr-8">
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
