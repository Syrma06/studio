import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Renamed import
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const geistSans = Geist({ // Use the renamed import
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Use the renamed import
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Analizador EmoVision', // Updated title
  description: 'Analiza conversaciones en busca de patrones de abuso emocional', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* Changed lang to es */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster /> {/* Add Toaster */}
      </body>
    </html>
  );
}
