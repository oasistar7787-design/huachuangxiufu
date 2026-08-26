import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "我是一滴漳河水｜红旗渠 NFC 数字集章",
  description: "沿真实水路，完成分水、观井、穿山、越谷的红旗渠沉浸式数字集章体验。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
