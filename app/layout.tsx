import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Godišnji odmori — Upravljanje odsustvima",
  description:
    "Aplikacija za unos i upravljanje godišnjim odmorima i odsustvima zaposlenih.",
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
      </body>
    </html>
  );
}
