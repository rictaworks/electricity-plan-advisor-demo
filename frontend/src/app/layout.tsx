import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "電力プラン自動提案システム",
  description:
    "家族構成と電力使用量から最安の電力プランを自動提案します（デモ版）",
  openGraph: {
    title: "電力プラン自動提案システム",
    description: "家族構成と電力使用量から最安の電力プランを自動提案します",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
