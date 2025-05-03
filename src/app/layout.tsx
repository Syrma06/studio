import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans'; // Correct import for Geist Sans
import { GeistMono } from 'geist/font/mono'; // Correct import for Geist Mono
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

export const metadata: Metadata = {
  title: 'Alumbra', // Change title to Alumbra
  description: 'Identifica señales de manipulación emocional o relaciones tóxicas en tus conversaciones digitales', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Ensure no whitespace between <html> and <body> tags
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`antialiased`}> {/* Apply fonts via html tag */}
        {children}
        <Toaster /> {/* Add Toaster */}
      </body>
    </html>
  );
}
