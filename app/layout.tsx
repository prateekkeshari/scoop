import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import type { Metadata } from "next"
import "./globals.css"
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Scoop – UTM, QR, and Preview generator",
  description: "Scoop is a simple tool to generate UTM parameters, QR codes, and social media previews for your marketing campaigns.",
  openGraph: {
    title: "Scoop – UTM, QR, and Preview generator",
    description: "Scoop is a simple tool to generate UTM parameters, QR codes, and social media previews for your marketing campaigns.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1920,
        height: 1080,
        alt: "Scoop OG Image",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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