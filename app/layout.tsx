import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "园林窗韵修复师｜图形变换拼图游戏",
  description: "在九宫格中用平移、旋转与轴对称修复一扇完整的圆形园林花窗。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
