import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orientation Médicale — EFREI",
  description: "Système intelligent d'orientation médicale basé sur l'analyse sémantique et l'IA générative.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
