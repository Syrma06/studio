import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-4">EmoVision</h1>
        <p className="text-xl text-muted-foreground">
          Identifica señales de manipulación emocional o relaciones tóxicas en tus conversaciones digitales
        </p>
      </div>

      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Bienvenidos a EmoVision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <p className="text-center text-muted-foreground px-4 sm:px-8">
            Esta herramienta te ayuda a detectar posibles señales de abuso emocional o manipulación en tus conversaciones digitales. Analizaremos mensajes de WhatsApp, Instagram, o cualquier otra plataforma para identificar patrones preocupantes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-8">
            <Card className="bg-secondary/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-secondary-foreground">¿Cómo funciona?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Responde un breve cuestionario</li>
                  <li>Copia y pega una conversación</li>
                  <li>Recibe un análisis personalizado</li>
                  <li>Obtén recomendaciones útiles</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-secondary/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-secondary-foreground">¿Qué detectamos?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Control excesivo</li>
                  <li>Invalidación emocional (gaslighting)</li>
                  <li>Culpabilización constante</li>
                  <li>Aislamiento social</li>
                  <li>Agresión verbal disfrazada</li>
                   {/* Add more items as needed based on AI capabilities */}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-4">
             {/* Use Next.js Link component for client-side navigation - Updated href */}
            <Link href="/questionnaire" passHref>
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                Comenzar análisis
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              Tu información es privada. El análisis se procesa de forma segura.
               {/* Simplified privacy note */}
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
