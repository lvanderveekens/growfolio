import './globals.css'
import { Inter } from 'next/font/google'
import { Navbar } from "./navbar";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="px-8 py-4">{children}</div>
      </body>
    </html>
  );
}
