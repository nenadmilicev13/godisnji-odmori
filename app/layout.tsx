import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Godišnji odmori — Upravljanje odsustvima",
  description:
    "Aplikacija za unos i upravljanje godišnjim odmorima i odsustvima zaposlenih.",
  applicationName: "Godišnji odmori",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Odmori",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <PWARegister />
      </body>
    </html>
  );
}
