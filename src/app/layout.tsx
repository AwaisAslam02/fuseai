import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Particles from "@/components/particles";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: "FusedAI - AI-Assisted Quote Generation for Professional Services",
  description: "Cut down quoting time from 6 hours to 18 minutes with AI-powered precision. Trusted by Construction, Electrical, HVAC, Plumbing, Networking, and Security professionals.",
  keywords: "AI quote generation, professional services, construction quotes, HVAC quotes, electrical quotes, plumbing quotes, networking quotes, security quotes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans`}>
        <ThemeProvider>
          <Particles />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
