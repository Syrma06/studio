import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

export const metadata: Metadata = {
  title: 'Alumbra',
  description: 'Identifica señales de manipulación emocional o relaciones tóxicas en tus conversaciones digitales',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Ensure no whitespace between <html> and <body> tags
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning> {/* Add suppressHydrationWarning for next-themes */}
      <body className={`antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed bottom-4 right-4 z-50"> {/* Position ThemeToggle */}
            <ThemeToggle />
          </div>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
