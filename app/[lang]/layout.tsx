import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { cn } from "@/lib/utils";
import { locales } from "@/lib/locales";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from '@vercel/analytics/next';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spending Tracker",
  description: "Split expenses and track balances with friends",
  appleWebApp: {
    capable: true,
    title: "SplitApp",
    statusBarStyle: "black-translucent",
  },
};

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  const dict = hasLocale(lang) ? await getDictionary(lang) : await getDictionary('en');

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = !!data?.claims;

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        jetbrainsMono.variable,
        "font-mono"
      )}
    >
      <body className={cn(
        "min-h-full flex flex-col",
        isAuthenticated && "pb-[calc(4rem+env(safe-area-inset-bottom))]"
      )}>
        <ThemeProvider>
          {children}
          {isAuthenticated && <BottomNav dict={dict.nav} lang={lang} />}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
