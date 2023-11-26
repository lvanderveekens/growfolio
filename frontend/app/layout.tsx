import { Inter } from 'next/font/google';
import './globals.css';
import GoogleAnalytics from './google-analytics';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Growfolio: Watch your investment portfolio grow",
  description:
    "Growfolio is an investment tracking app that helps you monitor and manage your portfolio's growth and performance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className="scroll-smooth" lang="en">
      {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
        <head>
          <GoogleAnalytics id={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        </head>
      )}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
