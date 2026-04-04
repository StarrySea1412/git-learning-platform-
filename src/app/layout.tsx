import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import Script from 'next/script';
import "./globals.css";
import Layout from "@/components/Layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: 'swap' });
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], variable: "--font-noto-sans-sc", weight: ["400", "500", "700"], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: "Git 学习平台",
    template: "%s | Git 学习平台",
  },
  description:
    "一个交互式的 Git 学习平台，通过动画演示和实战练习帮助你掌握 Git 版本控制",
  openGraph: {
    title: "Git 学习平台",
    description:
      "一个交互式的 Git 学习平台，通过动画演示和实战练习帮助你掌握 Git 版本控制",
    locale: "zh_CN",
    type: "website",
    siteName: "Git 学习平台",
  },
  twitter: {
    card: "summary",
    title: "Git 学习平台",
    description:
      "一个交互式的 Git 学习平台，通过动画演示和实战练习帮助你掌握 Git 版本控制",
  },
};

const themeInitScript = `
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansSC.variable} font-sans`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
