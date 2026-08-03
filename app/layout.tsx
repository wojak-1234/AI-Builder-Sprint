import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import { ThemeProvider } from "@/components/ThemeProvider";

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif-kr",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "이음 - 세대 간 회상 및 기억 건강 플랫폼",
  description: "OCR과 AI를 활용한 기억 건강 관리 및 세대 간 회상 지원 플랫폼",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1D1C1A", // Dark mode background theme color
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`dark ${notoSerifKr.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-background text-foreground antialiased font-sans">
        <ThemeProvider>
          <PWARegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
