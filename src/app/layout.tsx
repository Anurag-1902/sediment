import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Sediment — AI-Powered Standup Automation",
  description:
    "Sediment runs daily syncs in Slack, captures dev updates, and lets business users query team progress. Your standups, layered into living context.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="bg-charcoal text-text font-sans">
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
