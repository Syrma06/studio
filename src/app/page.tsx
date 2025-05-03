import AnalyzerClient from './analyzer-client';

export default function Home() {
  return (
    // Adjusted padding for better spacing on large screens
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <AnalyzerClient />
    </main>
  );
}
