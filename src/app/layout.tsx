import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PwaManager } from "@/components/PwaManager";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0B192C",
};

export const metadata: Metadata = {
  title: "Albedo'o — La valeur en mouvement. | E-Commerce & Marketplace Cameroun",
  description:
    "Albedo'o — Plateforme de commerce électronique hybride au Cameroun : Vente directe, Vendeurs partenaires vérifiés, Paiements Orange Money & MTN MoMo, Livraison Douala, Yaoundé et National.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Albedo'o",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${plusJakarta.className} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <PwaManager />
        </Providers>
      </body>
    </html>
  );
}
