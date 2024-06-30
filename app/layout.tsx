import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Scoop – Free UTM Builder, QR Code Generator, and Link Preview Tool",
  description: "Create custom UTM links, generate QR codes, and preview social media links with Scoop. Boost your marketing campaigns with our free, all-in-one tool.",
  keywords: "UTM builder, QR code generator, link preview, marketing tools, campaign tracking, social media preview",
  openGraph: {
    title: "Scoop – Free UTM Builder, QR Code Generator, and Link Preview Tool",
    description: "Create custom UTM links, generate QR codes, and preview social media links with Scoop. Boost your marketing campaigns with our free, all-in-one tool.",
    url: "https://scoop.prateekkeshari.com",
    siteName: "Scoop",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Scoop - UTM, QR, and Preview generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scoop – Free UTM Builder, QR Code Generator, and Link Preview Tool",
    description: "Create custom UTM links, generate QR codes, and preview social media links with Scoop. Boost your marketing campaigns with our free, all-in-one tool.",
    images: ["/twitter-image.jpg"],
    creator: "@prateekkeshari",
  },
  robots: {
    index: true,
    follow: true
  },
  metadataBase: new URL("https://scoop.prateekkeshari.com"),
  alternates: {
    canonical: "/"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/scoop.png" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="bg-background text-foreground">
            {children}
            <Analytics />
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}