import AnalyzerClient from '@/app/analyzer-client'; // Adjust import path if needed
import Link from 'next/link'; // Import Link

export default function AnalyzerPage() {
  return (
    // Use similar padding/layout as the questionnaire page.tsx
     <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
        {/* Wrap the header div with Link */}
        <Link href="/" className="text-center mb-12 block" style={{ textDecoration: 'none' }}>
            <h1 className="text-5xl font-bold text-primary mb-4">💡 Alumbra</h1> {/* Changed title and added emoji */}
            <p className="text-xl text-muted-foreground">
              Análisis de Conversación
            </p>
        </Link>
      <AnalyzerClient />
    </main>
  );
}
