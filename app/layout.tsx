import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AlertProvider } from "@/lib/alert";
import { ToastProvider } from "@/components/ui/toast";

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
            <head>
              {/* Load Google Fonts for PDF font preview in dropdown */}
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
              <link
                href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lora:wght@400;700&family=Playfair+Display:wght@400;700&display=swap"
                rel="stylesheet"
              />
            </head>
            <body
              className={`${plusJakarta.variable} ${playfair.variable} antialiased`}
              suppressHydrationWarning
            >
              <AlertProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </AlertProvider>
            </body>
          </html>
        );
}
