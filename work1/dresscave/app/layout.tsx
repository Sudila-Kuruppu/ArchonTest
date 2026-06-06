import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { StoreProvider } from "@/lib/store/store-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DressCave — Women & Children's Fashion",
  description: "Discover curated fashion for women and children at DressCave.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NuqsAdapter>
          <StoreProvider>{children}</StoreProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
