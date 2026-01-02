import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Word Search Generator",
  description: "AI-powered word search puzzle generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
        return (
          <html lang="en" className="dark">
            <body
              className={`${plusJakarta.variable} ${playfair.variable} antialiased`}
              suppressHydrationWarning
            >
              {children}
            </body>
          </html>
        );
}
