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
        {/* GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-C04W1XKS16"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-C04W1XKS16');`,
          }}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        {/* アンバーバナー */}
        <div
          style={{
            background: "#fbbf24",
            color: "#1e3a5f",
            textAlign: "center",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <i className="fas fa-flask" style={{ marginRight: "0.4rem" }}></i>
          これはデモ版です。データはサーバー再起動時にリセットされる場合があります。
          <a
            href="https://rictaworks.jp/#demos"
            style={{
              marginLeft: "1.5rem",
              color: "#1e3a5f",
              textDecoration: "underline",
              fontWeight: 700,
            }}
          >
            ← デモ一覧へ
          </a>
        </div>
        {children}
        {/* 右下固定ご相談ボタン */}
        <a
          href="https://rictaworks.jp/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            background: "#1e3a5f",
            color: "#fff",
            padding: "0.75rem 1.25rem",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <i className="fas fa-comment-dots"></i>
          ご相談はこちら
        </a>
      </body>
    </html>
  );
}
