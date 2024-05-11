import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "マルバツゲーム",
  description: "online tictactoe game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* https://twemoji.datsukan.me/ */}
      <link
        rel="icon"
        href="https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/1f3ae.svg"
      />
      <body
        className={
          inter.className +
          "bg-gradient-to-br from-cyan-200 from-10% via-cyan-300 via-50% to-cyan-500 to-100% "
        }
      >
        {children}
      </body>
    </html>
  );
}
