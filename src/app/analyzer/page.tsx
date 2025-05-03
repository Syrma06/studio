import AnalyzerClient from '@/app/analyzer-client'; // Adjust import path if needed

export default function AnalyzerPage() {
  return (
    // Use similar padding/layout as the original page.tsx
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <AnalyzerClient />
    </main>
  );
}
