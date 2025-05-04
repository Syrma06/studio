import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import { AlertTriangle, Frown, Users, Accessibility, HeartHandshake, Siren } from 'lucide-react'; // Changed Smile to Frown, imported necessary icons

// Define the HeroSection1 component (adapted from the provided image and structure)
function HeroSection1() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-background">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
               💡 Alumbra: Ponle luz a tus palabras, claridad a tus vínculos
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Con una simple acción de copiar y pegar la última conversación, Alumbra podría esbozar un escenario preocupante que indique una señal de advertencia hacia tu salud emocional.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/questionnaire" passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Comenzar Análisis
                </Button>
              </Link>
            </div>
          </div>
          <Card className="bg-card shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-muted/30 p-4 flex flex-row items-center space-x-2">
              <div className="flex space-x-1.5">
                 <span className="w-3 h-3 rounded-full bg-red-500"></span>
                 <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                 <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
               <p className="text-xs text-muted-foreground font-mono truncate">Análisis</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-secondary/50 p-4 rounded-md text-sm text-secondary-foreground">
                <p>"Eres estúpido, ¿Cómo pudiste hacer eso? ¡Eres un idiota!"</p>
                <p>"Cálmate, fue un error..."</p>
                <p>"¡Un error! Siempre arruinas todo. No sirves para nada."</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Estado Emocional</h3>
                <div className="flex items-center space-x-2">
                  <Frown className="w-5 h-5 text-red-600" /> {/* Changed Smile to Frown and color */}
                  <span className="text-foreground font-medium">Negativo</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Alerta</h3>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive font-medium">Abuso / Manipulación</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Define the FeatureCard component
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
}

function FeatureCard({ icon: Icon, title, description, imageUrl, imageHint }: FeatureCardProps) {
  return (
    <Card className="flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6 flex flex-col items-center">
         {/* Placeholder Image */}
         <Image
            src={imageUrl}
            alt={title}
            width={150}
            height={100}
            className="mb-4 rounded-md object-cover h-[100px] w-[150px]"
            data-ai-hint={imageHint}
          />
        {/* <Icon className="w-10 h-10 mb-4 text-primary" /> */}
        <CardTitle className="tracking-tight text-lg font-semibold mb-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}


export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <HeroSection1 />

      {/* Features Section */}
      <section className="w-full py-12 md:py-20 lg:py-24 bg-secondary/30">
        <div className="container px-4 md:px-6">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-10 sm:text-4xl md:text-5xl text-primary">
            ¿Para Quién es Alumbra?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Users}
              title="Relaciones Personales"
              description="Ayudando a identificar el estrés en relaciones."
              imageUrl="https://picsum.photos/150/100?random=1"
              imageHint="student group study"
            />
            <FeatureCard
              icon={Accessibility}
              title="Discapacidades Visuales"
              description="Lectura de emociones detectadas para accesibilidad."
               imageUrl="https://picsum.photos/150/100?random=2"
              imageHint="visually impaired person using technology"
            />
            <FeatureCard
              icon={HeartHandshake} // Using HeartHandshake for Autism/Empathy
              title="Espectro Autista"
              description="Reconociendo matices emocionales en la comunicación."
               imageUrl="https://picsum.photos/150/100?random=3"
               imageHint="support group diverse people"
            />
            <FeatureCard
              icon={Siren} // Using Siren as a warning sign
              title="Relaciones Tóxicas"
              description="Detectando patrones de manipulación y control."
               imageUrl="https://picsum.photos/150/100?random=4"
               imageHint="couple arguing conflict"
            />
          </div>
        </div>
      </section>

      {/* Footer Section - Optional */}
       <footer className="w-full py-6 bg-background border-t">
          <div className="container px-4 md:px-6 text-center text-muted-foreground text-sm">
              © {new Date().getFullYear()} Alumbra. Todos los derechos reservados.
              <p className="text-xs mt-1">Tu información es privada. El análisis se procesa de forma segura.</p>
          </div>
       </footer>
    </main>
  );
}
