import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["latin", "thai"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FamilyCare — ดูแลสุขภาพครอบครัว",
  description:
    "ระบบติดตามสุขภาพผู้สูงอายุในครอบครัว ด้วย AI วิเคราะห์ข้อมูลจากสมุด NCD และซองยาจากโรงพยาบาล",
  keywords: ["health", "elderly care", "NCD", "Thailand", "LINE bot", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
