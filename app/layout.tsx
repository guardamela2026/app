import type { Metadata } from "next";
import { Playfair_Display, Space_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { GuardadosMigrator } from "@/components/guardados-migrator";

const serif = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono-next",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Guárdamela",
  description:
    "Tarjetas de contacto empresariales vía QR. Escaneá, guardá, listo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${serif.variable} ${mono.variable}`}>
      <body>
        <GuardadosMigrator />
        <SiteHeader />
        <div className="container">{children}</div>
        <footer className="site-footer">
          Guárdamela — prototipo de producto, 2026.
        </footer>
      </body>
    </html>
  );
}
